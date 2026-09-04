import re
from collections.abc import Iterable

from ..exceptions import PipelineValidationError
from ..models import PlaywrightBundle, RequirementAnalysis, TestCaseSuite, TestPlan

DEFAULT_KEY_PATTERN = r"^[A-Z][A-Z0-9_]{0,49}-[1-9][0-9]*$"
TEST_PLAN_TITLES = [
    "Executive Summary",
    "Test Objectives",
    "In Scope",
    "Out of Scope",
    "Requirements and Acceptance-Criteria Coverage",
    "Test Strategy, Levels, and Test Types",
    "Test Environment, Tools, and Browser Coverage",
    "Test Data Requirements",
    "High-Level Test Scenarios",
    "Entry and Exit Criteria",
    "Risks, Dependencies, Assumptions, and Mitigations",
    "Execution, Defect Management, Reporting, and Deliverables",
]


def _canonical_trace_id(value: str) -> str:
    match = re.fullmatch(r"(REQ|AC)-0*(\d+)", value.upper())
    return f"{match.group(1)}-{int(match.group(2)):03d}" if match else value


def _canonical_test_id(value: str, ticket_key: str) -> str:
    match = re.fullmatch(rf"{re.escape(ticket_key)}-TC-0*(\d+)", value.upper())
    return f"{ticket_key}-TC-{int(match.group(1)):03d}" if match else value


def canonicalize_output_ids(
    analysis: RequirementAnalysis,
    plan: TestPlan,
    suite: TestCaseSuite,
    bundle: PlaywrightBundle,
) -> None:
    """Normalize equivalent numeric IDs without changing generated content."""
    replacements: dict[str, str] = {}
    for requirement in analysis.requirements + analysis.acceptance_criteria:
        canonical = _canonical_trace_id(requirement.id)
        replacements[requirement.id] = canonical
        requirement.id = canonical
    for scenario in plan.scenarios:
        scenario.requirement_ids = [_canonical_trace_id(value) for value in scenario.requirement_ids]
    if len(plan.sections) == 12 and {section.number for section in plan.sections} == set(range(1, 13)):
        plan.sections.sort(key=lambda section: section.number)
        for section in plan.sections:
            section.title = TEST_PLAN_TITLES[section.number - 1]
    for case in suite.test_cases:
        canonical = _canonical_test_id(case.id, suite.ticket_key)
        replacements[case.id] = canonical
        case.id = canonical
        case.requirement_ids = [_canonical_trace_id(value) for value in case.requirement_ids]
        case.acceptance_criteria_ids = [
            _canonical_trace_id(value) for value in case.acceptance_criteria_ids
        ]
    for file in bundle.files:
        file.test_case_ids = [
            _canonical_test_id(value, suite.ticket_key) for value in file.test_case_ids
        ]
        for original, canonical in sorted(replacements.items(), key=lambda item: -len(item[0])):
            if original != canonical:
                file.content = file.content.replace(original, canonical)


def parse_ticket_keys(value: str, maximum: int = 20, pattern: str = DEFAULT_KEY_PATTERN):
    if len(value) > 10_000: raise ValueError("Ticket input exceeds 10,000 characters")
    tokens = [v.upper() for v in re.split(r"[\s,;]+", value.strip()) if v]
    keys, duplicates, invalid = [], [], []
    for token in tokens:
        if not re.fullmatch(pattern, token): invalid.append(token)
        elif token in keys: duplicates.append(token)
        else: keys.append(token)
    if len(keys) > maximum: raise ValueError(f"Maximum {maximum} tickets allowed")
    return keys, duplicates, invalid


def _unique(values: Iterable[str], label: str):
    values = list(values)
    if len(values) != len(set(values)): raise PipelineValidationError(f"Duplicate {label} IDs detected")


def validate_analysis(value: RequirementAnalysis):
    _unique([r.id for r in value.requirements + value.acceptance_criteria], "requirement")
    for req in value.requirements:
        if not re.fullmatch(r"REQ-\d{3,}", req.id): raise PipelineValidationError(f"Invalid requirement ID {req.id}")
    for ac in value.acceptance_criteria:
        if not re.fullmatch(r"AC-\d{3,}", ac.id): raise PipelineValidationError(f"Invalid acceptance criterion ID {ac.id}")


def validate_plan(value: TestPlan, analysis: RequirementAnalysis):
    if [s.number for s in value.sections] != list(range(1, 13)) or [s.title for s in value.sections] != TEST_PLAN_TITLES: raise PipelineValidationError("Test plan must contain the exact ordered 12 sections")
    known = {r.id for r in analysis.requirements + analysis.acceptance_criteria}
    if any(not set(s.requirement_ids) <= known or not s.requirement_ids for s in value.scenarios): raise PipelineValidationError("Scenario has missing or unknown traceability")


def validate_suite(value: TestCaseSuite, analysis: RequirementAnalysis):
    _unique([t.id for t in value.test_cases], "test case")
    known = {r.id for r in analysis.requirements + analysis.acceptance_criteria}
    for case in value.test_cases:
        refs = set(case.requirement_ids + case.acceptance_criteria_ids)
        if not refs or not refs <= known: raise PipelineValidationError(f"{case.id} has invalid traceability")
    uncovered = {a.id for a in analysis.acceptance_criteria} - {x for t in value.test_cases for x in t.acceptance_criteria_ids}
    if uncovered: raise PipelineValidationError(f"Acceptance criteria without tests: {', '.join(sorted(uncovered))}")


def validate_playwright(value: PlaywrightBundle, suite: TestCaseSuite):
    eligible = {t.id for t in suite.test_cases if t.automation_candidate in {"Yes", "Partial"}}
    automated = {x for f in value.files for x in f.test_case_ids}
    if not automated <= eligible: raise PipelineValidationError("Playwright bundle automates ineligible cases")
    forbidden = ["waitForTimeout(", "process.env.JIRA_API_TOKEN", "xpath="]
    if any(term in f.content for f in value.files for term in forbidden): raise PipelineValidationError("Unsafe or fragile Playwright content")
