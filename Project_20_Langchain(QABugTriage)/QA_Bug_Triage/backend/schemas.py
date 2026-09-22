"""Validated contracts shared by the three specialists and the API."""
import re
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field

Text = Annotated[str, Field(min_length=1, max_length=5000)]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid")


def issue_key(value: str) -> str:
    key = value.strip().upper()
    if not re.fullmatch(r"[A-Z][A-Z0-9_]{1,19}-[1-9][0-9]{0,9}", key):
        raise ValueError("Enter a Jira key such as QA-123.")
    return key


class Ticket(Contract):
    key: str
    title: str
    description: str
    status: str
    priority: str
    components: list[str]
    url: str | None = None
    source: Literal["jira-rest", "jira-mcp", "demo"]
    warnings: list[str] = Field(default_factory=list)


class Triage(Contract):
    severity: Literal["Critical", "High", "Medium", "Low"]
    priority: Literal["P0", "P1", "P2", "P3"]
    category: Literal["Functional", "Performance", "Security", "Data integrity", "Usability", "Compatibility", "Other"]
    summary: Text
    severityReason: Text
    priorityReason: Text
    categoryReason: Text
    evidence: list[Text] = Field(min_length=1, max_length=8)
    missingInformation: list[Text] = Field(max_length=8)


class Hypothesis(Contract):
    cause: Text
    confidence: float = Field(ge=0, le=100)
    evidence: Text
    killTest: Text


class RCA(Contract):
    conclusion: Text
    status: Literal["Hypothesis", "Supported by supplied evidence"]
    hypotheses: list[Hypothesis] = Field(min_length=1, max_length=3)
    investigationSteps: list[Text] = Field(min_length=1, max_length=8)
    blastRadius: list[Text] = Field(max_length=6)
    limitations: list[Text] = Field(min_length=1, max_length=8)


class TestCase(Contract):
    id: Text
    title: Text
    layer: Literal["Unit", "API", "E2E", "Manual"]
    type: Literal["Verification", "Regression", "Boundary", "Negative"]
    steps: list[Text] = Field(min_length=1, max_length=8)
    expected: Text
    rationale: Text


class Strategy(Contract):
    missingTest: Text
    verification: Text
    tests: list[TestCase] = Field(min_length=3, max_length=12)
    manualChecks: list[Text] = Field(max_length=6)
    exitCriteria: list[Text] = Field(min_length=1, max_length=8)


class Report(Contract):
    id: str
    model: str
    createdAt: str
    durationMs: int
    ticket: Ticket
    triage: Triage
    rca: RCA
    strategy: Strategy
