"""Read-only MCP integration, with Jira REST v3 fallback."""
import asyncio
import json
import os
from datetime import timedelta
from urllib.parse import urlsplit
import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from .schemas import Ticket, issue_key


def adf_text(node) -> str:
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "".join(adf_text(item) for item in node)
    if not isinstance(node, dict):
        return ""
    if node.get("type") == "text":
        return str(node.get("text", ""))
    if node.get("type") == "hardBreak":
        return "\n"
    suffix = "\n" if node.get("type") in {"paragraph", "heading", "listItem", "codeBlock"} else ""
    return adf_text(node.get("content")) + suffix


def https_origin(value: str) -> str:
    url = urlsplit(value)
    if url.scheme != "https" or not url.hostname or url.username or url.password:
        raise ValueError("Use an HTTPS service URL without embedded credentials.")
    return f"https://{url.netloc}"


def normalize_issue(raw, key: str, source: str) -> Ticket:
    if not isinstance(raw, dict) or raw.get("key") != key:
        raise ValueError("Jira returned a different or missing issue identity.")
    fields = raw.get("fields")
    if not isinstance(fields, dict) or not isinstance(fields.get("summary"), str) or not fields["summary"].strip():
        raise ValueError("Jira returned invalid issue fields.")
    description = adf_text(fields.get("description"))
    return Ticket(
        key=key, title=fields["summary"][:500], description=description[:24000],
        status=str((fields.get("status") or {}).get("name", "Unknown"))[:100],
        priority=str((fields.get("priority") or {}).get("name", "Not set"))[:100],
        components=[str(c.get("name", ""))[:100] for c in (fields.get("components") or [])[:20]],
        source=source, warnings=["Description truncated to 24,000 characters."] if len(description) > 24000 else [],
    )


async def fetch_mcp(key: str) -> Ticket:
    url = os.environ["JIRA_MCP_URL"]
    https_origin(url)
    headers = {"Authorization": f"Bearer {os.environ['JIRA_MCP_TOKEN']}"} if os.getenv("JIRA_MCP_TOKEN") else {}
    args = json.loads(os.getenv("JIRA_MCP_EXTRA_ARGS", "{}"))
    if not isinstance(args, dict):
        raise ValueError("MCP extra arguments must be a JSON object.")
    args[os.getenv("JIRA_MCP_ISSUE_ARG") or "issue_key"] = key
    async with asyncio.timeout(15):
        async with streamablehttp_client(url, headers=headers, timeout=timedelta(seconds=12), sse_read_timeout=timedelta(seconds=12)) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(os.getenv("JIRA_MCP_TOOL") or "jira_get_issue", args)
                if result.isError:
                    raise ValueError("MCP issue tool failed.")
                data = result.structuredContent
                if data is None:
                    text = next((item.text for item in result.content if item.type == "text"), None)
                    data = json.loads(text) if text else None
                return normalize_issue(data, key, "jira-mcp")


async def fetch_ticket(value: str) -> Ticket:
    key = issue_key(value)
    warning = None
    if os.getenv("JIRA_MCP_URL"):
        try:
            ticket = await fetch_mcp(key)
            if os.getenv("JIRA_BASE_URL"):
                ticket.url = f"{https_origin(os.environ['JIRA_BASE_URL'])}/browse/{key}"
            return ticket
        except Exception:
            warning = "Jira MCP was unavailable or returned an incompatible issue. Used live Jira REST API v3."
    base, email, token = (os.getenv(name) for name in ("JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN"))
    if not all((base, email, token)):
        raise ValueError("Jira REST credentials are not configured.")
    origin = https_origin(base)
    async with httpx.AsyncClient(timeout=12, follow_redirects=False) as client:
        for attempt in range(3):
            response = await client.get(
                f"{origin}/rest/api/3/issue/{key}", params={"fields": "summary,description,status,priority,components"},
                auth=(email, token), headers={"Accept": "application/json"},
            )
            if (response.status_code == 429 or response.status_code >= 500) and attempt < 2:
                try:
                    delay = min(5, max(0.5, float(response.headers.get("retry-after", 0.5 * 2 ** attempt))))
                except ValueError:
                    delay = 0.5 * 2 ** attempt
                await asyncio.sleep(delay)
                continue
            if not response.is_success:
                raise RuntimeError(f"Jira returned HTTP {response.status_code}.")
            ticket = normalize_issue(response.json(), key, "jira-rest")
            ticket.url = f"{origin}/browse/{key}"
            if warning:
                ticket.warnings.append(warning)
            return ticket
    raise RuntimeError("Jira unavailable.")
