from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class EvidenceClass(StrEnum):
    EXPLICIT = "EXPLICIT"
    INFERRED = "INFERRED"
    MISSING = "MISSING"
    ASSUMPTION = "ASSUMPTION_REQUIRING_CONFIRMATION"


class Requirement(StrictModel):
    id: str
    text: str
    classification: EvidenceClass = EvidenceClass.EXPLICIT
    source_excerpt: str = ""
    kind: str = "functional"


class JiraIssue(StrictModel):
    key: str
    summary: str
    description: str = ""
    issue_type: str = ""
    status: str = ""
    priority: str = ""
    labels: list[str] = Field(default_factory=list)
    components: list[str] = Field(default_factory=list)
    parent: str | None = None
    subtasks: list[str] = Field(default_factory=list)
    linked_issues: list[str] = Field(default_factory=list)
    acceptance_criteria_text: str = ""
    comments: list[str] = Field(default_factory=list)
    source: str
    raw: dict = Field(default_factory=dict, exclude=True)


class RequirementAnalysis(StrictModel):
    ticket_key: str
    summary: str
    issue_type: str = ""
    status: str = ""
    priority: str = ""
    labels: list[str] = Field(default_factory=list)
    components: list[str] = Field(default_factory=list)
    parent_and_subtasks: list[str] = Field(default_factory=list)
    linked_issues: list[str] = Field(default_factory=list)
    acceptance_criteria: list[Requirement] = Field(default_factory=list)
    requirements: list[Requirement] = Field(default_factory=list)
    business_rules: list[str] = Field(default_factory=list)
    non_functional_requirements: list[str] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    source_provider: str


class TestScenario(StrictModel):
    id: str
    title: str
    requirement_ids: list[str]
    test_types: list[str] = Field(default_factory=list)


class TestPlanSection(StrictModel):
    number: int = Field(ge=1, le=12)
    title: str
    content: list[str] = Field(min_length=1)


class TestPlan(StrictModel):
    ticket_key: str
    sections: list[TestPlanSection] = Field(min_length=12, max_length=12)
    scenarios: list[TestScenario] = Field(default_factory=list)


class TestStep(StrictModel):
    number: int = Field(ge=1)
    action: str
    expected_result: str


class TestCase(StrictModel):
    id: str
    jira_key: str
    requirement_ids: list[str] = Field(default_factory=list)
    acceptance_criteria_ids: list[str] = Field(default_factory=list)
    title: str
    objective: str
    priority: str
    test_type: str
    preconditions: list[str] = Field(default_factory=list)
    test_data: list[str] = Field(default_factory=list)
    steps: list[TestStep] = Field(min_length=1)
    expected_result: str
    automation_candidate: str
    automation_rationale: str
    tags: list[str] = Field(default_factory=list)
    assumptions_or_blockers: list[str] = Field(default_factory=list)

    @field_validator("automation_candidate")
    @classmethod
    def candidate(cls, value: str) -> str:
        if value not in {"Yes", "No", "Partial"}: raise ValueError("must be Yes, No, or Partial")
        return value


class TestCaseSuite(StrictModel):
    ticket_key: str
    test_cases: list[TestCase]


class PlaywrightFile(StrictModel):
    path: str
    content: str
    test_case_ids: list[str] = Field(default_factory=list)


class PlaywrightBundle(StrictModel):
    ticket_key: str
    readiness: str
    files: list[PlaywrightFile] = Field(default_factory=list)
    setup_notes: list[str] = Field(default_factory=list)
    coverage: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    missing_configuration: list[str] = Field(default_factory=list)


class TicketResult(StrictModel):
    ticket_key: str
    status: str
    llm_model_used: str = ""
    llm_fallback_used: bool = False
    requirement_analysis: RequirementAnalysis | None = None
    test_plan: TestPlan | None = None
    test_cases: TestCaseSuite | None = None
    playwright: PlaywrightBundle | None = None
    traceability: list[dict] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None


class RunResult(StrictModel):
    run_id: str
    tickets: list[TicketResult]
    started_at: datetime
    completed_at: datetime
