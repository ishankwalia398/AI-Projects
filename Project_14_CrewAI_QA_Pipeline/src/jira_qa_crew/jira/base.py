from abc import ABC, abstractmethod

from ..models import JiraIssue


class JiraProvider(ABC):
    @abstractmethod
    def fetch_issue(self, ticket_key: str) -> JiraIssue: ...

    def health_check(self) -> tuple[bool, str]:
        return True, "Configured"
