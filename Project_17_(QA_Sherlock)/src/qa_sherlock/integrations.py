import asyncio
import base64
import json
import os
import re
import urllib.request


class Jira:
    def __init__(self, config, mcp_fetch=None, rest_fetch=None):
        self.config = config
        self.mcp_fetch = mcp_fetch or self._mcp
        self.rest_fetch = rest_fetch or self._rest
        self.events = []

    async def get_issue(self, issue_key):
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*-\d+", issue_key):
            raise ValueError("Invalid Jira issue key")
        try:
            result = await asyncio.wait_for(self.mcp_fetch(issue_key), self.config.get("timeout_seconds", 20))
            if not isinstance(result, dict) or not result.get("fields"):
                raise ValueError("Malformed MCP issue payload")
            self.events.append({"transport": "mcp", "status": "success"})
            return result
        except Exception as exc:
            self.events.append({"transport": "mcp", "status": "failed", "error_type": type(exc).__name__})
            result = await asyncio.to_thread(self.rest_fetch, issue_key)
            if not isinstance(result, dict) or not result.get("fields"):
                raise ValueError("Malformed REST issue payload")
            self.events.append({"transport": "rest", "status": "success"})
            return result

    async def _mcp(self, key):
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client
        url = os.environ["JIRA_MCP_URL"]
        headers = {"Authorization": "Bearer " + os.environ["JIRA_MCP_TOKEN"]} if os.getenv("JIRA_MCP_TOKEN") else {}
        args = {k: v.replace("{issue_key}", key) if isinstance(v, str) else v
                for k, v in self.config["mcp_arguments"].items()}
        async with streamablehttp_client(url, headers=headers) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(self.config["mcp_tool"], args)
                if result.isError:
                    raise RuntimeError("MCP tool returned an error")
                structured = getattr(result, "structuredContent", None)
                if structured:
                    return structured
                return json.loads("".join(c.text for c in result.content if hasattr(c, "text")))

    def _rest(self, key):
        base = os.environ["JIRA_BASE_URL"].rstrip("/")
        if not base.startswith("https://"):
            raise ValueError("Jira REST requires HTTPS")
        credentials = os.environ["JIRA_EMAIL"] + ":" + os.environ["JIRA_API_TOKEN"]
        auth = base64.b64encode(credentials.encode()).decode()
        request = urllib.request.Request(base + "/rest/api/3/issue/" + key,
                                         headers={"Authorization": "Basic " + auth, "Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=self.config.get("timeout_seconds", 20)) as response:
            return json.load(response)


class PineconeStore:
    def __init__(self, config, namespace=None):
        from pinecone import Pinecone
        self.index = Pinecone(api_key=os.environ["PINECONE_API_KEY"]).Index(host=os.environ[config["host_env"]])
        self.config = config
        self.namespace = namespace or config["namespace"]

    def upsert(self, docs):
        records = [{"_id": d["id"], "chunk_text": d["text"], "title": d["title"],
                    "kind": d["kind"], "source": d["source"]} for d in docs]
        for start in range(0, len(records), 50):
            self.index.upsert_records(namespace=self.namespace, records=records[start:start + 50])

    def search(self, query):
        result = self.index.search(namespace=self.namespace,
                                  query={"inputs": {"text": query}, "top_k": self.config["top_k"]},
                                  fields=["chunk_text", "title", "kind", "source"])
        payload = result.to_dict() if hasattr(result, "to_dict") else result
        return [{"id": hit["_id"], "score": hit["_score"], "text": hit["fields"]["chunk_text"],
                 **{k: hit["fields"][k] for k in ("title", "kind", "source")}}
                for hit in payload["result"]["hits"]]
