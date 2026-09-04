from datetime import UTC, datetime
from unittest.mock import Mock
from zipfile import ZipFile

import pytest

from jira_qa_crew.config import Settings
from jira_qa_crew.crew.factory import LLMProfile, ProviderCompatibleLLM, QACrewFactory, _rejects_temperature
from jira_qa_crew.exceptions import JiraGatewayError, JiraProviderError
from jira_qa_crew.jira.adf import adf_to_text
from jira_qa_crew.jira.gateway import JiraGateway
from jira_qa_crew.models import JiraIssue, PlaywrightBundle, RequirementAnalysis, RunResult, TicketResult
from jira_qa_crew.models import TestCaseSuite as QATestCaseSuite
from jira_qa_crew.models import TestPlan as QATestPlan
from jira_qa_crew.models import TestPlanSection as QATestPlanSection
from jira_qa_crew.services.artifacts import safe_segment, write_run, zip_run
from jira_qa_crew.services.pipeline import PipelineService
from jira_qa_crew.services.redaction import redact
from jira_qa_crew.services.validation import canonicalize_output_ids, parse_ticket_keys


def test_ticket_parse_normalizes_deduplicates_and_reports_invalid():
    assert parse_ticket_keys("abc-1, ABC-1\nXY_2-9 bad", 20) == (["ABC-1", "XY_2-9"], ["ABC-1"], ["BAD"])


def test_ticket_limits():
    with pytest.raises(ValueError): parse_ticket_keys("A-1 B-2", 1)


def test_adf_to_text():
    adf = {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "world"}]}]}
    assert adf_to_text(adf) == "Hello\nworld\n"


def test_gateway_mcp_success():
    issue = JiraIssue(key="A-1", summary="x", source="MCP")
    mcp = Mock(); mcp.fetch_issue.return_value = issue
    rest = Mock(); assert JiraGateway(mcp, rest).fetch_issue("A-1") == issue; rest.fetch_issue.assert_not_called()


def test_gateway_falls_back_to_rest():
    mcp = Mock(); mcp.fetch_issue.side_effect = JiraProviderError("down")
    rest = Mock(); rest.fetch_issue.return_value = JiraIssue(key="A-1", summary="x", source="REST")
    assert JiraGateway(mcp, rest).fetch_issue("A-1").source == "REST"


def test_gateway_both_fail():
    providers = [Mock(), Mock()]
    for p in providers: p.fetch_issue.side_effect = JiraProviderError("down")
    with pytest.raises(JiraGatewayError): JiraGateway(*providers).fetch_issue("A-1")


def test_rest_only():
    rest = Mock(); rest.fetch_issue.return_value = JiraIssue(key="A-1", summary="x", source="REST")
    assert JiraGateway(None, rest, "rest").fetch_issue("A-1").source == "REST"


def test_security_helpers():
    assert safe_segment("../A-1") == "A-1"
    assert "secret-value" not in redact("token=secret-value")


def test_run_artifacts_and_zip(tmp_path):
    now = datetime.now(UTC)
    run = RunResult(run_id="RUN-TEST", tickets=[TicketResult(ticket_key="A-1", status="FAILED", errors=["fixture failure"])], started_at=now, completed_at=now)
    output = write_run(run, tmp_path)
    archive = zip_run(output)
    zip_path = tmp_path / "result.zip"
    zip_path.write_bytes(archive)
    with ZipFile(zip_path) as bundle:
        assert {"manifest.json", "run_summary.md"} <= set(bundle.namelist())


def test_litellm_adapter_strips_crewai_cache_marker():
    llm = ProviderCompatibleLLM(model="groq/qwen/qwen3.8-27b", api_key="test-key")
    source = [{"role": "system", "content": "instructions", "cache_breakpoint": True}]
    assert llm._format_messages_for_provider(source) == [{"role": "system", "content": "instructions"}]
    assert source[0]["cache_breakpoint"] is True


def test_default_llm_route_is_commandcode_then_gemini(monkeypatch):
    for name in (
        "LLM_PRIMARY_MODEL",
        "LLM_MODEL",
        "COMMANDCODE_API_KEY",
        "LLM_PRIMARY_API_KEY",
        "LLM_PRIMARY_BASE_URL",
        "LLM_FALLBACK_MODEL",
    ):
        monkeypatch.delenv(name, raising=False)
    settings = Settings(llm_fallback_api_key="test-key")
    profiles = QACrewFactory(settings, JiraGateway(None, None)).llm_profiles()
    assert [(p.name, p.model) for p in profiles] == [
        ("primary", "openai/deepseek/deepseek-v4-flash"),
        ("fallback", "gemini/gemini-3.6-flash"),
    ]
    assert profiles[0].base_url == "https://api.commandcode.ai/provider/v1"


def test_commandcode_uses_native_custom_openai_client():
    settings = Settings(
        llm_primary_model="openai/deepseek/deepseek-v4-flash",
        llm_primary_api_key="test-only",
        llm_primary_base_url="https://api.commandcode.ai/provider/v1",
        llm_fallback_enabled=False,
    )
    crew = QACrewFactory(settings, JiraGateway(None, None)).create("A-1")
    assert crew.agents[0].llm.model == "deepseek/deepseek-v4-flash"
    assert crew.agents[0].llm.base_url == "https://api.commandcode.ai/provider/v1"
    assert crew.agents[0].llm.additional_params["reasoning_effort"] == "low"


def test_native_ollama_does_not_receive_litellm_retry_parameter():
    settings = Settings(
        llm_primary_model="ollama/gemma3:12b",
        llm_primary_base_url="http://localhost:11434",
        llm_primary_max_output_tokens=2048,
        llm_primary_timeout=120,
        llm_fallback_enabled=False,
    )
    crew = QACrewFactory(settings, JiraGateway(None, None)).create("A-1")
    assert "num_retries" not in crew.agents[0].llm.additional_params
    assert crew.agents[0].llm.max_tokens == 2048
    assert crew.agents[0].llm.timeout == 120


def test_primary_timeout_is_bounded_by_ticket_timeout():
    settings = Settings(
        llm_primary_timeout=601,
        ticket_timeout=600,
        llm_fallback_enabled=False,
    )
    assert "LLM_PRIMARY_TIMEOUT_SECONDS" in "; ".join(settings.validate("rest"))


def test_generated_traceability_ids_are_canonicalized_consistently():
    analysis = RequirementAnalysis(
        ticket_key="A-1",
        summary="Summary",
        source_provider="REST",
        requirements=[{"id": "REQ-1", "text": "Requirement"}],
        acceptance_criteria=[{"id": "AC-02", "text": "Criterion"}],
    )
    plan = QATestPlan(
        ticket_key="A-1",
        sections=[
            QATestPlanSection(number=i, title=f"Section {i}", content=["content"])
            for i in range(1, 13)
        ],
        scenarios=[{"id": "SCN-1", "title": "Scenario", "requirement_ids": ["REQ-1", "AC-2"]}],
    )
    suite = QATestCaseSuite(
        ticket_key="A-1",
        test_cases=[{
            "id": "A-1-TC-1", "jira_key": "A-1", "requirement_ids": ["REQ-01"],
            "acceptance_criteria_ids": ["AC-2"], "title": "Test", "objective": "Verify",
            "priority": "High", "test_type": "Functional", "steps": [{"number": 1, "action": "Act", "expected_result": "Pass"}],
            "expected_result": "Pass", "automation_candidate": "Yes", "automation_rationale": "Stable",
        }],
    )
    bundle = PlaywrightBundle(
        ticket_key="A-1", readiness="READY",
        files=[{"path": "tests/a-1.spec.ts", "content": "// A-1-TC-1 REQ-1 AC-02", "test_case_ids": ["A-1-TC-1"]}],
    )

    canonicalize_output_ids(analysis, plan, suite, bundle)

    assert [r.id for r in analysis.requirements + analysis.acceptance_criteria] == ["REQ-001", "AC-002"]
    assert plan.scenarios[0].requirement_ids == ["REQ-001", "AC-002"]
    assert plan.sections[0].title == "Executive Summary"
    assert plan.sections[-1].title == "Execution, Defect Management, Reporting, and Deliverables"
    assert suite.test_cases[0].id == "A-1-TC-001"
    assert bundle.files[0].test_case_ids == ["A-1-TC-001"]
    assert "A-1-TC-001 REQ-001 AC-002" in bundle.files[0].content


def test_prefetched_jira_issue_removes_llm_tool_requirement():
    issue = JiraIssue(key="A-1", summary="Prefetched summary", source="REST")
    settings = Settings(
        llm_primary_model="ollama/gemma3:12b",
        llm_primary_base_url="http://localhost:11434",
        llm_fallback_enabled=False,
    )
    crew = QACrewFactory(settings, JiraGateway(None, None)).create("A-1", jira_issue=issue)
    assert crew.agents[0].tools == []
    assert "Prefetched summary" in crew.tasks[0].description
    assert all(agent.tools == [] for agent in crew.agents[1:])


def test_gemini_36_omits_unsupported_temperature():
    assert _rejects_temperature("gemini/gemini-3.6-flash")
    assert not _rejects_temperature("ollama/gemma3:12b")


def test_gemini_fallback_base_url_reaches_native_client():
    endpoint = "https://generativelanguage.googleapis.com"
    settings = Settings(
        llm_primary_model="ollama/gemma3:12b",
        llm_fallback_enabled=True,
        llm_fallback_model="gemini/gemini-3.6-flash",
        llm_fallback_api_key="test-only",
        llm_fallback_base_url=endpoint,
    )
    factory = QACrewFactory(settings, JiraGateway(None, None))
    crew = factory.create("A-1", factory.llm_profiles()[1])
    assert crew.agents[0].llm.client_params["http_options"]["base_url"] == endpoint


def test_pipeline_restarts_ticket_with_fallback(tmp_path, monkeypatch):
    profiles = [
        LLMProfile("primary", "ollama/gemma3:12b"),
        LLMProfile("fallback", "gemini/gemini-3.6-flash", "test-key"),
    ]
    factory = Mock()
    factory.llm_profiles.return_value = profiles
    factory.fetch_issue.return_value = JiraIssue(key="A-1", summary="Summary", source="REST")
    settings = Settings(output_dir=tmp_path, llm_fallback_api_key="test-key")
    service = PipelineService(settings, factory)
    sections = [QATestPlanSection(number=i, title=f"Section {i}", content=["content"]) for i in range(1, 13)]
    generated = (
        RequirementAnalysis(ticket_key="A-1", summary="Summary", source_provider="REST"),
        QATestPlan(ticket_key="A-1", sections=sections),
        QATestCaseSuite(ticket_key="A-1", test_cases=[]),
        PlaywrightBundle(ticket_key="A-1", readiness="NEEDS_CONFIGURATION"),
    )
    execute = Mock(side_effect=[RuntimeError("Ollama unavailable"), generated])
    monkeypatch.setattr(service, "_execute_with_repair", execute)

    run, _ = service.run(["A-1"])

    assert run.tickets[0].status == "COMPLETED"
    assert run.tickets[0].llm_model_used == "gemini/gemini-3.6-flash"
    assert run.tickets[0].llm_fallback_used is True
    assert [call.args[2].name for call in execute.call_args_list] == ["primary", "fallback"]
