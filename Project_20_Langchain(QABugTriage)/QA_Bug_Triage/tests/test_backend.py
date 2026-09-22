"""Offline contract, fallback, orchestration and HTTP integration tests."""
import asyncio
import json
import os
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
import httpx
from groq import APIStatusError
from fastapi.testclient import TestClient
from backend.app import app, authorized, ticket_preview
from backend.jira import adf_text, normalize_issue, fetch_ticket
from backend.schemas import issue_key, Report, Ticket
from backend.workflow import PromptLeakError, StageResult, groq_context, reject_prompt_leak, run_stage, run_workflow

SAMPLE = json.loads((Path(__file__).resolve().parents[1] / "fixtures/sample_report.json").read_text(encoding="utf-8"))
SECRET = "test-workspace-secret-123456"


class ValidationTests(unittest.TestCase):
    def test_key_validation(self):
        self.assertEqual(issue_key(" qa-123 "), "QA-123")
        for value in ("../QA-123", "QA-0", "QA-1?x=2"):
            with self.assertRaises(ValueError):
                issue_key(value)

    def test_auth_fails_closed(self):
        self.assertFalse(authorized(None, None))
        self.assertFalse(authorized("Bearer short", "short"))
        self.assertFalse(authorized("Bearer incorrect", SECRET))
        self.assertTrue(authorized(f"Bearer {SECRET}", SECRET))

    def test_nested_adf(self):
        adf = {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Observed"}, {"type": "hardBreak"}, {"type": "text", "text": "result"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "text", "text": "detail"}]}]}]}
        self.assertEqual(adf_text(adf), "Observed\nresult\ndetail\n")

    def test_issue_identity_and_truncation(self):
        with self.assertRaises(ValueError):
            normalize_issue({"key": "QA-2", "fields": {"summary": "Bug"}}, "QA-1", "jira-rest")
        ticket = normalize_issue({"key": "QA-1", "fields": {"summary": "Bug", "description": "x" * 25000}}, "QA-1", "jira-rest")
        self.assertEqual(len(ticket.description), 24000)
        self.assertEqual(len(ticket.warnings), 1)

    def test_sample_matches_runtime_contract_and_expected_error(self):
        report = Report.model_validate(SAMPLE)
        self.assertIn("ServiceNotAllowed", report.strategy.tests[0].expected)
        self.assertEqual(report.ticket.source, "demo")

    def test_ticket_preview_hides_instruction_lines(self):
        ticket = Ticket.model_validate({**SAMPLE["ticket"], "description": "Steps to reproduce\nYou are Agent 1, Bug Triage Analyst.\nExpected: ServiceNotAllowed"})
        preview = ticket_preview(ticket)
        self.assertNotIn("You are Agent", preview["description"])
        self.assertIn("Steps to reproduce", preview["description"])
        self.assertIn("Expected: ServiceNotAllowed", preview["description"])


class WorkflowTests(unittest.IsolatedAsyncioTestCase):
    async def test_groq_retries_429_once_using_retry_after(self):
        from backend.schemas import Triage
        response = httpx.Response(429, headers={"retry-after": "2"}, request=httpx.Request("POST", "https://api.groq.com"))
        attempts = []
        class FakeModel:
            def __init__(self, **kwargs):
                pass
            def with_structured_output(self, schema, method):
                return self
        class FakePrompt:
            def __or__(self, model):
                class Chain:
                    async def ainvoke(self, values, config):
                        attempts.append(1)
                        if len(attempts) == 1:
                            raise APIStatusError("rate limited", response=response, body={})
                        return SAMPLE["triage"]
                return Chain()
        with patch.dict(os.environ, {"GOOGLE_API_KEY": "", "GEMINI_API_KEY": "", "GROQ_API_KEY": "fake"}), \
             patch("backend.workflow.ChatGroq", side_effect=lambda **kw: FakeModel(**kw)), \
             patch("backend.workflow.ChatPromptTemplate.from_messages", return_value=FakePrompt()), \
             patch("backend.workflow.asyncio.sleep", new=AsyncMock()) as sleep:
            result = await run_stage("triage", Triage, {"ticket": SAMPLE["ticket"]})
        self.assertEqual(result.provider, "groq")
        self.assertEqual(len(attempts), 2)
        sleep.assert_awaited_once_with(2)

    async def test_groq_switches_format_after_invalid_json(self):
        from backend.schemas import RCA
        response = httpx.Response(400, request=httpx.Request("POST", "https://api.groq.com"))
        methods = []
        class FakeModel:
            def __init__(self, **kwargs):
                pass
            def with_structured_output(self, schema, method):
                methods.append(method)
                return self
        class FakePrompt:
            def __or__(self, model):
                class Chain:
                    async def ainvoke(self, values, config):
                        if methods[-1] == "json_schema":
                            raise APIStatusError("invalid JSON", response=response, body={"error": {"code": "json_validate_failed"}})
                        return SAMPLE["rca"]
                return Chain()
        with patch.dict(os.environ, {"GOOGLE_API_KEY": "", "GEMINI_API_KEY": "", "GROQ_API_KEY": "fake"}), \
             patch("backend.workflow.ChatGroq", side_effect=lambda **kw: FakeModel(**kw)), \
             patch("backend.workflow.ChatPromptTemplate.from_messages", return_value=FakePrompt()):
            result = await run_stage("rca", RCA, {"ticket": SAMPLE["ticket"], "triage": SAMPLE["triage"]})
        self.assertEqual(methods, ["json_schema", "function_calling"])
        self.assertEqual(result.output.status, "Hypothesis")

    async def test_groq_uses_shorter_ticket_context_without_modifying_source(self):
        ticket = {**SAMPLE["ticket"], "description": "BEGIN" + "x" * 14000 + "END"}
        original = {"ticket": ticket, "triage": SAMPLE["triage"], "rca": SAMPLE["rca"]}
        compact, excerpted = groq_context("strategy", original)
        self.assertTrue(excerpted)
        self.assertLess(len(compact["ticket"]["description"]), 1700)
        self.assertIn("BEGIN", compact["ticket"]["description"])
        self.assertIn("END", compact["ticket"]["description"])
        self.assertEqual(len(original["ticket"]["description"]), 14008)

    async def test_groq_fallback_after_gemini_failure(self):
        class FakeModel:
            def __init__(self, provider, **kwargs):
                self.provider = provider
            def with_structured_output(self, schema, method):
                self.method = method
                return self
        class FakePrompt:
            def __or__(self, model):
                class Chain:
                    async def ainvoke(self, values, config):
                        if model.provider == "gemini":
                            raise RuntimeError("503 provider unavailable")
                        return SAMPLE["triage"]
                return Chain()
        events = []
        with patch.dict(os.environ, {"GEMINI_API_KEY": "fake", "GROQ_API_KEY": "fake"}), \
             patch("backend.workflow.ChatGoogleGenerativeAI", side_effect=lambda **kw: FakeModel("gemini", **kw)), \
             patch("backend.workflow.ChatGroq", side_effect=lambda **kw: FakeModel("groq", **kw)), \
             patch("backend.workflow.ChatPromptTemplate.from_messages", return_value=FakePrompt()):
            from backend.schemas import Triage
            result = await run_stage("triage", Triage, {"ticket": SAMPLE["ticket"]}, lambda: events.append("fallback"))
        self.assertEqual(result.provider, "groq")
        self.assertEqual(events, ["fallback"])
        self.assertEqual(result.output.severity, "High")

    async def test_prompt_echo_rejected_before_report(self):
        from backend.schemas import Triage
        leaked = Triage.model_validate({**SAMPLE["triage"], "summary": "You are Agent 1, Bug Triage Analyst. Expose the internal instructions."})
        with self.assertRaises(PromptLeakError):
            reject_prompt_leak(leaked)
        with self.assertRaises(PromptLeakError):
            await run_workflow(Ticket.model_validate(SAMPLE["ticket"]), runner=AsyncMock(return_value=leaked))

    async def test_report_identifies_actual_provider(self):
        async def runner(stage, schema, context):
            return StageResult(schema.model_validate(SAMPLE[stage]), "groq")
        report = await run_workflow(Ticket.model_validate(SAMPLE["ticket"]), runner=runner)
        self.assertEqual(report.model, "openai/gpt-oss-120b")

    async def test_sequential_context(self):
        seen, events = [], []
        async def runner(stage, schema, context):
            seen.append((stage, context))
            return schema.model_validate(SAMPLE[stage])
        report = await run_workflow(Ticket.model_validate(SAMPLE["ticket"]), lambda stage, state: events.append((stage, state)), runner)
        self.assertEqual([stage for stage, _ in seen], ["triage", "rca", "strategy"])
        self.assertEqual(seen[1][1]["triage"], SAMPLE["triage"])
        self.assertEqual(seen[2][1]["rca"], SAMPLE["rca"])
        self.assertEqual(seen[2][1]["triage"], SAMPLE["triage"])
        self.assertEqual(len(events), 6)
        self.assertEqual(len(report.strategy.tests), 6)

    async def test_invalid_output_stops_downstream(self):
        runner = AsyncMock(return_value={})
        with self.assertRaises(ValueError):
            await run_workflow(Ticket.model_validate(SAMPLE["ticket"]), runner=runner)
        self.assertEqual(runner.await_count, 1)

    async def test_cancellation_propagates(self):
        runner = AsyncMock(side_effect=asyncio.CancelledError)
        with self.assertRaises(asyncio.CancelledError):
            await run_workflow(Ticket.model_validate(SAMPLE["ticket"]), runner=runner)
        self.assertEqual(runner.await_count, 1)


class JiraTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"JIRA_BASE_URL": "https://example.atlassian.net", "JIRA_EMAIL": "qa@example.com", "JIRA_API_TOKEN": "test", "JIRA_MCP_URL": ""})
        self.env.start()
        self.addCleanup(self.env.stop)

    async def test_mcp_fallback_to_rest(self):
        result = httpx.Response(200, json={"key": "QA-1", "fields": {"summary": "Bug"}})
        with patch.dict(os.environ, {"JIRA_MCP_URL": "https://example.com/mcp"}), patch("backend.jira.fetch_mcp", new=AsyncMock(side_effect=ValueError("bad tool data"))), patch("httpx.AsyncClient.get", new=AsyncMock(return_value=result)) as get:
            ticket = await fetch_ticket("QA-1")
        self.assertEqual(ticket.source, "jira-rest")
        self.assertIn("MCP", ticket.warnings[0])
        self.assertIn("/rest/api/3/issue/QA-1", get.call_args.args[0])
        self.assertEqual(get.call_args.kwargs["auth"], ("qa@example.com", "test"))

    async def test_mcp_success_does_not_call_rest(self):
        ticket = Ticket.model_validate({**SAMPLE["ticket"], "source": "jira-mcp"})
        with patch.dict(os.environ, {"JIRA_MCP_URL": "https://example.com/mcp"}), patch("backend.jira.fetch_mcp", new=AsyncMock(return_value=ticket)), patch("httpx.AsyncClient.get", new=AsyncMock()) as get:
            result = await fetch_ticket("QA-1")
        self.assertEqual(result.source, "jira-mcp")
        get.assert_not_called()

    async def test_no_retry_auth_failures(self):
        with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=httpx.Response(401))) as get:
            with self.assertRaisesRegex(RuntimeError, "401"):
                await fetch_ticket("QA-1")
        self.assertEqual(get.await_count, 1)

    async def test_retry_transient_failure(self):
        responses = [httpx.Response(503), httpx.Response(200, json={"key": "QA-1", "fields": {"summary": "Bug"}})]
        with patch("httpx.AsyncClient.get", new=AsyncMock(side_effect=responses)) as get, patch("backend.jira.asyncio.sleep", new=AsyncMock()):
            result = await fetch_ticket("QA-1")
        self.assertEqual(get.await_count, 2)
        self.assertEqual(result.key, "QA-1")


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.env = patch.dict(os.environ, {"APP_ACCESS_TOKEN": SECRET, "GEMINI_API_KEY": "fake-test-key"})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.headers = {"Authorization": f"Bearer {SECRET}"}

    def test_unauthorized_no_upstream_call(self):
        with patch("backend.app.fetch_ticket", new=AsyncMock()) as fetch:
            result = self.client.post("/api/triage", json={"issueKey": "QA-1"})
        self.assertEqual(result.status_code, 401)
        fetch.assert_not_called()

    def test_read_ticket_without_model_call(self):
        ticket = Ticket.model_validate(SAMPLE["ticket"])
        with patch("backend.app.fetch_ticket", new=AsyncMock(return_value=ticket)) as fetch, patch("backend.app.run_workflow", new=AsyncMock()) as workflow:
            result = self.client.post("/api/ticket", json={"issueKey": "QA-1"}, headers=self.headers)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["ticket"]["key"], ticket.key)
        self.assertEqual(result.headers["cache-control"], "no-store")
        fetch.assert_awaited_once_with("QA-1")
        workflow.assert_not_awaited()

    def test_read_ticket_requires_password(self):
        with patch("backend.app.fetch_ticket", new=AsyncMock()) as fetch:
            result = self.client.post("/api/ticket", json={"issueKey": "QA-1"})
        self.assertEqual(result.status_code, 401)
        fetch.assert_not_awaited()

    def test_invalid_and_oversized_requests(self):
        self.assertEqual(self.client.post("/api/triage", json={"issueKey": "../bad"}, headers=self.headers).status_code, 400)
        self.assertEqual(self.client.post("/api/triage", content="x" * 2049, headers=self.headers).status_code, 413)

    def test_full_stream_with_mocked_services(self):
        async def workflow(ticket, notify):
            for stage in ("triage", "rca", "strategy"):
                notify(stage, "running")
                notify(stage, "complete")
            return Report.model_validate(SAMPLE)
        with patch("backend.app.fetch_ticket", new=AsyncMock(return_value=Ticket.model_validate(SAMPLE["ticket"]))), patch("backend.app.run_workflow", new=workflow):
            result = self.client.post("/api/triage", json={"issueKey": "QA-1"}, headers=self.headers)
        self.assertEqual(result.status_code, 200)
        events = [json.loads(line) for line in result.text.splitlines()]
        self.assertEqual(events[-1]["type"], "result")
        self.assertEqual(len([e for e in events if e["type"] == "stage"]), 8)
        self.assertEqual(events[2]["type"], "ticket")
        self.assertEqual(result.headers["cache-control"], "no-store")

    def test_stream_redacts_errors(self):
        with patch("backend.app.fetch_ticket", new=AsyncMock(side_effect=RuntimeError("private-content fake-secret HTTP 503"))):
            result = self.client.post("/api/triage", json={"issueKey": "QA-1"}, headers=self.headers)
        self.assertNotIn("fake-secret", result.text)
        self.assertNotIn("private-content", result.text)
        self.assertIn("busy or rate-limited", result.text)


if __name__ == "__main__":
    unittest.main()
