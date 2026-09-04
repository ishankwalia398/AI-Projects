from ..exceptions import JiraGatewayError, JiraProviderError
from ..models import JiraIssue
from .base import JiraProvider


class JiraGateway:
    def __init__(self, mcp: JiraProvider | None, rest: JiraProvider | None, mode: str = "auto"):
        self.mcp, self.rest, self.mode = mcp, rest, mode.lower()

    def fetch_issue(self, key: str) -> JiraIssue:
        providers = {"mcp": [self.mcp], "rest": [self.rest], "auto": [self.mcp, self.rest]}.get(self.mode)
        if providers is None: raise JiraGatewayError(f"Unsupported Jira mode: {self.mode}")
        errors = []
        for provider in providers:
            if provider is None: errors.append("provider not configured"); continue
            try: return provider.fetch_issue(key)
            except JiraProviderError as exc: errors.append(str(exc))
        raise JiraGatewayError(f"Unable to fetch {key}: " + " | ".join(errors))
