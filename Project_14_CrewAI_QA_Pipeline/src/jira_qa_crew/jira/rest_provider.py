from __future__ import annotations

import time

import httpx

from ..config import Settings
from ..exceptions import JiraAuthenticationError, JiraNotFoundError, JiraProviderError, JiraRateLimitError
from ..models import JiraIssue
from .adf import adf_to_text
from .base import JiraProvider


class JiraRestProvider(JiraProvider):
    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        self.settings = settings
        self.client = client or httpx.Client(timeout=httpx.Timeout(30, connect=10))

    def _headers_auth(self):
        headers = {"Accept": "application/json"}
        auth = None
        if self.settings.jira_auth_mode == "bearer": headers["Authorization"] = f"Bearer {self.settings.jira_bearer_token}"
        else: auth = (self.settings.jira_email, self.settings.jira_api_token)
        return headers, auth

    def fetch_issue(self, ticket_key: str) -> JiraIssue:
        headers, auth = self._headers_auth()
        url = f"{self.settings.jira_url}/rest/api/3/issue/{ticket_key}"
        params = {"fields": "*all"}
        response = None
        for attempt in range(self.settings.max_retries + 1):
            try: response = self.client.get(url, headers=headers, auth=auth, params=params)
            except httpx.RequestError as exc:
                if attempt >= self.settings.max_retries: raise JiraProviderError(f"Jira REST connection failed: {exc.__class__.__name__}") from exc
                time.sleep(0.25 * 2**attempt); continue
            if response.status_code not in {429, 500, 502, 503, 504}: break
            if attempt < self.settings.max_retries: time.sleep(0.25 * 2**attempt)
        assert response is not None
        if response.status_code in {401, 403}: raise JiraAuthenticationError("Jira authentication or permission check failed")
        if response.status_code == 404: raise JiraNotFoundError(f"Jira issue {ticket_key} was not found")
        if response.status_code == 429: raise JiraRateLimitError("Jira REST rate limit exceeded")
        if response.is_error: raise JiraProviderError(f"Jira REST returned HTTP {response.status_code}")
        try: payload = response.json(); fields = payload["fields"]
        except (ValueError, KeyError, TypeError) as exc: raise JiraProviderError("Jira REST returned malformed issue data") from exc
        links = []
        for link in fields.get("issuelinks") or []:
            issue = link.get("outwardIssue") or link.get("inwardIssue") or {}
            if issue.get("key"): links.append(issue["key"])
        comments = [adf_to_text(c.get("body")) for c in (fields.get("comment", {}).get("comments", [])[: self.settings.jira_max_comments])] if self.settings.jira_include_comments else []
        return JiraIssue(key=payload.get("key", ticket_key), summary=fields.get("summary") or "", description=adf_to_text(fields.get("description")), issue_type=(fields.get("issuetype") or {}).get("name", ""), status=(fields.get("status") or {}).get("name", ""), priority=(fields.get("priority") or {}).get("name", ""), labels=fields.get("labels") or [], components=[c.get("name", "") for c in fields.get("components") or []], parent=(fields.get("parent") or {}).get("key"), subtasks=[s.get("key", "") for s in fields.get("subtasks") or []], linked_issues=links, acceptance_criteria_text=adf_to_text(fields.get(self.settings.jira_acceptance_field)) if self.settings.jira_acceptance_field else "", comments=comments, source="REST", raw=payload)

    def health_check(self):
        return (bool(self.settings.jira_url), "REST configured" if self.settings.jira_url else "JIRA_URL missing")
