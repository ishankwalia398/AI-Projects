from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
DATA = ROOT / "data"
sys.path.insert(0, str(ROOT / "src"))

from drm_copilot.corpus import load_rag_records  # noqa: E402


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_number}: {exc}") from exc
    return rows


def main() -> int:
    knowledge_fields = {"id", "title", "topic", "tags", "source_type", "content", "verified_at"}
    eval_fields = {"case_id", "summary", "inputs", "expected_top_cause"}
    all_ids: set[str] = set()

    for filename in ["knowledge_base.jsonl", "historical_incidents.jsonl"]:
        path = DATA / filename
        rows = read_jsonl(path)
        for number, row in enumerate(rows, 1):
            missing = knowledge_fields - row.keys()
            if missing:
                raise ValueError(f"{filename}:{number}: missing {sorted(missing)}")
            if row["id"] in all_ids:
                raise ValueError(f"Duplicate knowledge id: {row['id']}")
            all_ids.add(row["id"])
            if row["source_type"] != "synthetic incident" and "SYNTHETIC" in row["content"].upper():
                print(f"Warning: check synthetic label for {row['id']}")
        if len(rows) < 50:
            raise ValueError(f"{filename} must contain at least 50 records; found {len(rows)}")

    evaluation_rows = read_jsonl(DATA / "evaluation_cases.jsonl")
    for number, row in enumerate(evaluation_rows, 1):
        missing = eval_fields - row.keys()
        if missing:
            raise ValueError(f"evaluation_cases.jsonl:{number}: missing {sorted(missing)}")
    if len(evaluation_rows) < 50:
        raise ValueError(f"evaluation_cases.jsonl must contain at least 50 records; found {len(evaluation_rows)}")

    with (DATA / "device_capabilities.csv").open(encoding="utf-8", newline="") as handle:
        device_rows = list(csv.DictReader(handle))
        if not device_rows or "profile_id" not in device_rows[0]:
            raise ValueError("device_capabilities.csv must contain profile_id")
    if len(device_rows) < 50:
        raise ValueError(f"device_capabilities.csv must contain at least 50 profiles; found {len(device_rows)}")

    source_path = DATA / "sources" / "OTT_DRM_Streaming_RAG_Resources.md"
    if not source_path.exists() or "Widevine official developer docs" not in source_path.read_text(encoding="utf-8"):
        raise ValueError("The curated OTT/DRM Markdown resource index is missing or incomplete")
    rag_rows = load_rag_records(DATA)
    rag_ids = [row["id"] for row in rag_rows]
    if len(rag_ids) != len(set(rag_ids)):
        raise ValueError("Duplicate IDs found in the combined RAG corpus")

    print(
        f"Valid: {len(all_ids)} knowledge/incident records, "
        f"{len(device_rows)} device profiles, {len(evaluation_rows)} evaluation cases, "
        f"{len(rag_rows)} total RAG source records"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as exc:
        print(f"Data validation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
