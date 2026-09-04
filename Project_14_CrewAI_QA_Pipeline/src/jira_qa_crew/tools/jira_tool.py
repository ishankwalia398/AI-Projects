import json

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from ..jira.gateway import JiraGateway


class FetchIssueInput(BaseModel):
    ticket_key: str = Field(description="Validated Jira issue key")


class FetchJiraIssueTool(BaseTool):
    name: str = "fetch_jira_issue_read_only"
    description: str = "Fetch exactly one Jira issue using the deterministic read-only gateway."
    args_schema: type[BaseModel] = FetchIssueInput
    gateway: JiraGateway

    def _run(self, ticket_key: str) -> str:
        return json.dumps(self.gateway.fetch_issue(ticket_key).model_dump(exclude={"raw"}), default=str)
