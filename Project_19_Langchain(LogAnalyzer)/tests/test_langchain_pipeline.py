import time
import unittest
from unittest.mock import MagicMock, patch

from backend.api.langchain_pipeline import (
    AGENT_ROLES, PROVIDERS, Analysis, Finding, Fix, Fixes, LangChainAgent,
    ParsedEntry, ParsedLogs, PipelineUnavailable, _batches, _build_agents,
    _validated_json, analyze_logs,
)


class LangChainPipelineTests(unittest.TestCase):
    def setUp(self):
        self.records = [{"source": "CSV 1", "raw": {"message": "upstream unavailable", "code": 503}}]
        self.parsed = ParsedLogs(entries=[ParsedEntry(
            source_id="source-1", message="upstream unavailable", status=503,
            timestamp="2026-09-21T10:00:00Z", session_id="session-a",
            request={"method": "GET", "url": "/orders"}, response_headers={"Retry-After": "30"},
        )])
        self.analysis = Analysis(reviewed_source_ids=["source-1"], findings=[Finding(
            source_id="source-1", kind="error", title="Upstream unavailable",
            evidence="upstream unavailable", explanation="The request received HTTP 503.",
        )])
        self.fixes = Fixes(fixes=[Fix(
            finding_id="finding-source-1-1",
            suggestions=["Check upstream readiness and retry after recovery."],
        )])

    def fake_agents(self):
        return [LangChainAgent(role, "test", None) for role in AGENT_ROLES]

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    @patch("backend.api.langchain_pipeline._build_model")
    def test_builds_exactly_three_named_langchain_agents(self, model):
        model.return_value = MagicMock()
        agents = _build_agents(PROVIDERS[0], time.monotonic() + 60)
        self.assertEqual(len(agents), 3)
        self.assertTrue(all(isinstance(agent, LangChainAgent) for agent in agents))
        self.assertEqual([agent.role for agent in agents], AGENT_ROLES)

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    @patch("backend.api.langchain_pipeline._build_agents")
    def test_three_agents_receive_validated_handoffs(self, build_agents):
        build_agents.return_value = self.fake_agents()
        outputs = [self.parsed.model_dump_json(), self.analysis.model_dump_json(), self.fixes.model_dump_json()]
        with patch.object(LangChainAgent, "invoke", side_effect=outputs) as invoke:
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(invoke.call_count, 3)
        self.assertIn("# Parsed log file", invoke.call_args_list[1].args[0])
        self.assertIn("Source ID: source-1", invoke.call_args_list[1].args[0])
        self.assertIn("finding-source-1-1", invoke.call_args_list[2].args[0])
        self.assertEqual(result["pipeline"]["engine"], "LangChain")
        self.assertEqual(result["pipeline"]["process"], "sequential")
        self.assertEqual(result["findings"][0]["session_id"], "session-a")

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test", "GROQ_API_KEY": "test"}, clear=True)
    @patch("backend.api.langchain_pipeline._build_agents")
    def test_invalid_primary_restarts_batch_on_fallback(self, build_agents):
        build_agents.return_value = self.fake_agents()
        outputs = [ParsedLogs(entries=[]).model_dump_json()] * 2
        outputs += [self.parsed.model_dump_json(), self.analysis.model_dump_json(), self.fixes.model_dump_json()]
        with patch.object(LangChainAgent, "invoke", side_effect=outputs):
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(result["provider"], "groq")

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    @patch("backend.api.langchain_pipeline._build_agents")
    def test_validation_retry_keeps_original_markdown(self, build_agents):
        build_agents.return_value = self.fake_agents()
        bad = self.analysis.model_copy(deep=True)
        bad.findings[0].evidence = "invented stack trace"
        outputs = [self.parsed.model_dump_json(), bad.model_dump_json(),
                   self.analysis.model_dump_json(), self.fixes.model_dump_json()]
        with patch.object(LangChainAgent, "invoke", side_effect=outputs) as invoke:
            analyze_logs(self.records, "log.csv")
        retry = invoke.call_args_list[2].args[0]
        self.assertIn("# Parsed log file", retry)
        self.assertIn("Unsupported evidence", retry)

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    @patch("backend.api.langchain_pipeline.time.sleep")
    @patch("backend.api.langchain_pipeline._build_agents")
    def test_transient_rate_limit_is_retried(self, build_agents, sleep):
        build_agents.return_value = self.fake_agents()
        outputs = [RuntimeError("rate limit exceeded"), self.parsed.model_dump_json(),
                   self.analysis.model_dump_json(), self.fixes.model_dump_json()]
        with patch.object(LangChainAgent, "invoke", side_effect=outputs) as invoke:
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(invoke.call_count, 4)
        sleep.assert_called_once_with(30)
        self.assertEqual(result["findings"][0]["kind"], "error")

    @patch.dict("os.environ", {}, clear=True)
    def test_missing_keys_returns_explicit_error(self):
        with self.assertRaisesRegex(PipelineUnavailable, "LangChain requires"):
            analyze_logs(self.records, "log.csv")

    def test_batches_cover_all_records_and_reject_oversize(self):
        batches = _batches(self.records * 41)
        self.assertEqual(sum(len(batch) for batch in batches), 41)
        self.assertEqual(len({row["source_id"] for batch in batches for row in batch}), 41)
        with self.assertRaises(ValueError):
            _batches(self.records * 161)

    def test_embedded_provider_json_is_extracted_then_validated(self):
        wrapped = "Here is the requested JSON:\n```json\n" + self.parsed.model_dump_json() + "\n```"
        result = _validated_json(wrapped, ParsedLogs)
        self.assertEqual(result.entries[0].source_id, "source-1")

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    @patch("backend.api.langchain_pipeline._build_agents")
    def test_clean_log_still_runs_all_three_agents(self, build_agents):
        build_agents.return_value = self.fake_agents()
        clean = ParsedLogs(entries=[ParsedEntry(source_id="source-1", message="Request completed", status=200)])
        outputs = [clean.model_dump_json(), Analysis(reviewed_source_ids=["source-1"], findings=[]).model_dump_json(), Fixes(fixes=[]).model_dump_json()]
        with patch.object(LangChainAgent, "invoke", side_effect=outputs) as invoke:
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(invoke.call_count, 3)
        self.assertEqual(result["findings"], [])


if __name__ == "__main__":
    unittest.main()
