import json
from pathlib import Path

from drm_copilot.models import IncidentInput
from drm_copilot.parsers import extract_signals
from drm_copilot.rules import diagnose_with_rules


def test_all_labeled_evaluation_cases():
    path = Path(__file__).parents[1] / "data" / "evaluation_cases.jsonl"
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        incident = IncidentInput(summary=row["summary"], **row["inputs"])
        result = diagnose_with_rules(incident, extract_signals(incident))
        assert result.root_causes[0].cause == row["expected_top_cause"], row["case_id"]
