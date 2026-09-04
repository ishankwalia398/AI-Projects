from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError

from ..config import Settings
from ..exceptions import JiraProviderError
from ..models import JiraIssue
from .adf import adf_to_text
from .base import JiraProvider


class JiraMCPProvider(JiraProvider):
    """Contained official CrewAI MCP adapter with configurable read-only tool mapping."""
    def __init__(self, settings: Settings, adapter_factory=None): self.settings, self.adapter_factory = settings, adapter_factory

    def _fetch(self, ticket_key: str) -> JiraIssue:
        if not self.settings.mcp_get_issue_tool: raise JiraProviderError("JIRA_MCP_GET_ISSUE_TOOL is required")
        try:
            from crewai_tools import MCPServerAdapter
            params = ({"url": self.settings.mcp_url, "transport": "streamable-http", "headers": self.settings.mcp_headers} if self.settings.mcp_url else {"command": self.settings.mcp_command, "args": self.settings.mcp_args})
            factory = self.adapter_factory or MCPServerAdapter
            with factory(params) as tools:
                tool = next((t for t in tools if getattr(t, "name", "") == self.settings.mcp_get_issue_tool), None)
                if tool is None: raise JiraProviderError("Configured read-only MCP issue tool was not advertised")
                raw = tool.run(**{self.settings.mcp_issue_arg: ticket_key})
        except JiraProviderError: raise
        except Exception as exc: raise JiraProviderError(f"Jira MCP failed: {exc.__class__.__name__}") from exc
        if isinstance(raw, str):
            try: raw = json.loads(raw)
            except ValueError as exc: raise JiraProviderError("Jira MCP returned non-JSON data") from exc
        if not isinstance(raw, dict): raise JiraProviderError("Jira MCP returned unusable issue data")
        fields = raw.get("fields", raw)
        key = raw.get("key") or fields.get("key") or ticket_key
        summary = fields.get("summary") or ""
        if not summary: raise JiraProviderError("Jira MCP response omitted summary")
        return JiraIssue(key=key, summary=summary, description=adf_to_text(fields.get("description")), issue_type=(fields.get("issuetype") or {}).get("name", "") if isinstance(fields.get("issuetype"), dict) else str(fields.get("issuetype", "")), status=(fields.get("status") or {}).get("name", "") if isinstance(fields.get("status"), dict) else str(fields.get("status", "")), priority=(fields.get("priority") or {}).get("name", "") if isinstance(fields.get("priority"), dict) else str(fields.get("priority", "")), labels=fields.get("labels") or [], components=[c.get("name", str(c)) if isinstance(c, dict) else str(c) for c in fields.get("components") or []], acceptance_criteria_text=adf_to_text(fields.get(self.settings.jira_acceptance_field)) if self.settings.jira_acceptance_field else "", source="MCP", raw=raw)

    def fetch_issue(self, ticket_key: str) -> JiraIssue:
        with ThreadPoolExecutor(max_workers=1) as pool:
            try: return pool.submit(self._fetch, ticket_key).result(timeout=self.settings.mcp_timeout)
            except TimeoutError as exc: raise JiraProviderError("Jira MCP request timed out") from exc

    def health_check(self):
        ok = bool((self.settings.mcp_url or self.settings.mcp_command) and self.settings.mcp_get_issue_tool)
        return ok, "MCP configured" if ok else "MCP endpoint/command or read-only tool missing"
