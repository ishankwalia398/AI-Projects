import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from qa_sherlock.service import configuration_status, run_upload
from qa_sherlock.uploads import evidence_from_uploads, safe_name, validate_uploads


class UploadParsingTests(unittest.TestCase):
    def test_parses_json_csv_and_source(self):
        files = [
            {"name": "requirements.json", "content": json.dumps([{"id":"REQ 1", "kind":"requirement", "title":"Expiry", "text":"Valid at equality"}]).encode()},
            {"name": "incidents.csv", "content": b"id,detail\nINC-1,Failed at equality\n"},
            {"name": "validator.ts", "content": b"if (now >= expiresAt) throw expired;"},
        ]
        records = evidence_from_uploads(files)
        self.assertEqual(len(records), 3)
        self.assertEqual(records[0]["id"], "REQ-1")
        self.assertEqual(records[2]["kind"], "source_code")

    def test_rejects_traversal_binary_and_large_file(self):
        self.assertEqual(safe_name("../../logs.txt"), "logs.txt")
        with self.assertRaises(ValueError): evidence_from_uploads([{"name":"bad.exe", "content":b"x"}])
        with self.assertRaises(ValueError): validate_uploads([{"name":"big.txt", "content":b"x" * (5 * 1024 * 1024 + 1)}])

    def test_invalid_json_rejected(self):
        with self.assertRaisesRegex(ValueError, "invalid JSON"):
            evidence_from_uploads([{"name":"bad.json", "content":b"{"}])


class UploadRunTests(unittest.TestCase):
    def test_real_upload_uses_separate_run_and_preserves_inputs(self):
        report = {"suites":[{"title":"real","specs":[{"title":"failure","file":"real.spec.ts","tests":[{"status":"unexpected","results":[{"status":"failed","error":{"message":"expiry boundary"}}]}]}]}]}
        payload = {"failure":{"name":"playwright.json","content":json.dumps(report).encode()}, "evidence":[{"name":"requirement.txt","content":b"expiry boundary should be inclusive"}], "use_pinecone":False, "run_evaluation":False}
        config = {"primary":{"model":"fixture"}, "fallback":{"model":"fixture"}, "pinecone":{"top_k":12}, "jira":{}}
        def fake_investigate(failures, evidence, router):
            return {"summary":"Real upload analyzed", "root_cause":"Boundary comparison", "confidence":.8, "claims":[{"text":"Evidence supports the boundary issue", "evidence_ids":[evidence[0]["id"]]}], "alternatives":[], "next_steps":["Review comparison"], "regression_test":"test('boundary', async () => {});"}
        with tempfile.TemporaryDirectory() as folder, patch("qa_sherlock.service.investigate", fake_investigate):
            run_id, result = run_upload(payload, config, folder)
            run_dir = Path(folder) / run_id
            self.assertTrue((run_dir / "input" / "playwright.json").is_file())
            self.assertTrue((run_dir / "input" / "requirement.txt").is_file())
            self.assertTrue((run_dir / "index.html").is_file())
            self.assertEqual(result["evaluation"]["status"], "not_run")

    def test_configuration_status_returns_booleans_only(self):
        self.assertTrue(all(type(value) is bool for value in configuration_status().values()))


if __name__ == "__main__": unittest.main()
