import unittest
import time
from unittest.mock import patch

from backend.api.crew_pipeline import (
    Analysis, Finding, Fix, Fixes, ParsedEntry, ParsedLogs,
    PipelineUnavailable, analyze_logs, _batches, _build_crew, PROVIDERS, AGENT_ROLES,
)


from crewai import Agent, Process


class CrewPipelineTests(unittest.TestCase):
    def setUp(self):
        self.records = [{"source": "CSV 1", "raw": {"message": "upstream unavailable", "code": 503}}]
        self.parsed = ParsedLogs(entries=[ParsedEntry(source_id="source-1", message="upstream unavailable",
            status=503, timestamp="2026-09-21T10:00:00Z", session_id="session-a",
            request={"method": "GET", "url": "/orders"}, response_headers={"Retry-After": "30"})])
        self.analysis = Analysis(reviewed_source_ids=["source-1"], findings=[Finding(
            source_id="source-1", kind="error", title="Upstream unavailable",
            evidence="upstream unavailable", explanation="The request received HTTP 503.")])
        self.fixes = Fixes(fixes=[Fix(finding_id="finding-source-1-1", suggestions=["Check upstream readiness and retry after recovery."])])

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    def test_one_sequential_crew_with_three_agents_and_explicit_context(self):
        crew, _ = _build_crew(_batches(self.records)[0], "log.csv", PROVIDERS[0], time.monotonic() + 60)
        self.assertEqual([agent.role for agent in crew.agents], AGENT_ROLES)
        self.assertEqual(len(crew.tasks), 3)
        self.assertEqual(crew.process, Process.sequential)
        self.assertEqual(crew.tasks[0].context, [])
        self.assertEqual(crew.tasks[1].context, [crew.tasks[0]])
        self.assertEqual(crew.tasks[2].context, [crew.tasks[1]])
        self.assertEqual([task.agent.role for task in crew.tasks], AGENT_ROLES)

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    def test_all_three_agents_receive_preceding_stage_evidence(self):
        with patch.object(Agent, "execute_task", side_effect=[x.model_dump_json() for x in [self.parsed, self.analysis, self.fixes]]) as stage:
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(stage.call_count, 3)
        self.assertIn("# Parsed log file", stage.call_args_list[1].kwargs["context"])
        self.assertIn("Source ID: source-1", stage.call_args_list[1].kwargs["context"])
        self.assertIn("finding-source-1-1", stage.call_args_list[2].kwargs["context"])
        self.assertEqual(result["findings"][0]["session_id"], "session-a")
        self.assertEqual(result["findings"][0]["response_headers"], {"Retry-After": "30"})
        self.assertEqual(result["pipeline"]["stages"], ["parsing", "analysis", "suggestions"])

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test", "GROQ_API_KEY": "test"}, clear=True)
    def test_invalid_primary_output_restarts_entire_batch_on_groq(self):
        with patch.object(Agent, "execute_task", side_effect=[x.model_dump_json() for x in [ParsedLogs(entries=[]), ParsedLogs(entries=[]), self.parsed, self.analysis, self.fixes]]):
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(result["provider"], "groq")

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    def test_unsubstantiated_evidence_is_rejected(self):
        bad = self.analysis.model_copy(deep=True)
        bad.findings[0].evidence = "invented stack trace"
        with patch.object(Agent, "execute_task", side_effect=[x.model_dump_json() for x in [self.parsed, bad, bad]]):
            with self.assertRaises(PipelineUnavailable):
                analyze_logs(self.records, "log.csv")

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    def test_validation_retry_preserves_original_markdown(self):
        bad = self.analysis.model_copy(deep=True)
        bad.findings[0].evidence = "invented stack trace"
        with patch.object(Agent, "execute_task", side_effect=[x.model_dump_json() for x in [self.parsed, bad, self.analysis, self.fixes]]) as stage:
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(result["provider"], "commandcode")
        self.assertEqual(stage.call_count, 4)
        self.assertIn("# Parsed log file", stage.call_args_list[2].kwargs["context"])
        self.assertIn("Unsupported evidence", stage.call_args_list[2].kwargs["context"])

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    def test_empty_response_reports_stage_without_provider_secrets(self):
        with patch.object(Agent, "execute_task", side_effect=ValueError("Invalid response from LLM call - None or empty.")):
            with self.assertRaisesRegex(PipelineUnavailable, "Parse uploaded log file: provider returned an empty response"):
                analyze_logs(self.records, "log.csv")

    @patch.dict("os.environ", {}, clear=True)
    def test_missing_keys_never_returns_rules_as_ai(self):
        with self.assertRaises(PipelineUnavailable):
            analyze_logs(self.records, "log.csv")

    def test_batches_cover_every_record_and_reject_oversize(self):
        records = self.records * 41
        batches = _batches(records)
        self.assertEqual(sum(len(batch) for batch in batches), 41)
        self.assertEqual(len({row["source_id"] for batch in batches for row in batch}), 41)
        with self.assertRaises(ValueError):
            _batches(self.records * 161)

    @patch.dict("os.environ", {"COMMANDCODE_API_KEY": "test"}, clear=True)
    def test_clean_log_still_runs_three_stages(self):
        clean = ParsedLogs(entries=[ParsedEntry(source_id="source-1", message="Request completed", status=200)])
        with patch.object(Agent, "execute_task", side_effect=[x.model_dump_json() for x in [clean, Analysis(reviewed_source_ids=["source-1"], findings=[]), Fixes(fixes=[])]]) as stage:
            result = analyze_logs(self.records, "log.csv")
        self.assertEqual(stage.call_count, 3)
        self.assertEqual(result["findings"], [])


if __name__ == "__main__":
    unittest.main()
