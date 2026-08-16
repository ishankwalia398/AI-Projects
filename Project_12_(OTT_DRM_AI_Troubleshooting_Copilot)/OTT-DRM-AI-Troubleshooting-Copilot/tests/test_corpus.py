from pathlib import Path

from drm_copilot.corpus import load_rag_records


DATA = Path(__file__).parents[1] / "data"


def test_combined_rag_corpus_contains_all_supported_sources():
    records = load_rag_records(DATA)
    assert len(records) == 165
    assert len({record["id"] for record in records}) == len(records)
    assert any(record["source_type"] == "curated Markdown resource index" for record in records)
    assert sum(record["source_type"] == "synthetic device capability profile" for record in records) == 50
