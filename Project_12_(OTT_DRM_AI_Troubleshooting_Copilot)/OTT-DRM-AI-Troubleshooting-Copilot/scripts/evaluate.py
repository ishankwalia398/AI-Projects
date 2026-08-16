from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "src"))

from drm_copilot.models import IncidentInput
from drm_copilot.parsers import extract_signals
from drm_copilot.rules import diagnose_with_rules


def main() -> None:
    rows = [json.loads(line) for line in (ROOT / "data" / "evaluation_cases.jsonl").read_text().splitlines() if line]
    passed = 0
    for row in rows:
        incident = IncidentInput(summary=row["summary"], **row["inputs"])
        diagnosis = diagnose_with_rules(incident, extract_signals(incident))
        predicted = diagnosis.root_causes[0].cause
        ok = predicted == row["expected_top_cause"]
        passed += int(ok)
        print(f"{'PASS' if ok else 'FAIL'} {row['case_id']}: {predicted}")
    print(f"\nTop-1 accuracy: {passed}/{len(rows)} = {passed / len(rows):.1%}")


if __name__ == "__main__":
    main()

