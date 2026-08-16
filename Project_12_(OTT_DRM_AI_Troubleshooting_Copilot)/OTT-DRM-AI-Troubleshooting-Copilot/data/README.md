# RAG data

The starter project contains four structured datasets with 50 records each:

- `knowledge_base.jsonl`: technical troubleshooting guidance.
- `historical_incidents.jsonl`: clearly labeled synthetic incident examples.
- `device_capabilities.csv`: clearly labeled synthetic device profiles.
- `evaluation_cases.jsonl`: labeled rule-engine tests, intentionally excluded from RAG.

The supplied `sources/OTT_DRM_Streaming_RAG_Resources.md` file is also part of the RAG corpus. It is treated as knowledge content and split by Markdown section before the standard 1000-character, 15%-overlap chunking policy is applied.

`src/drm_copilot/corpus.py` is the authoritative loader used by Pinecone indexing and local fallback retrieval. The public UI shows static coverage labels; it does not expose a direct knowledge-record browser.

Regenerate the four starter datasets:

```bash
python scripts/build_demo_data.py
```

Validate and reindex after any data change:

```bash
python scripts/validate_data.py
python scripts/index_pinecone.py --rebuild
python -m pytest -q
python scripts/evaluate.py
```

All device and incident starter records are synthetic. Replace them with measured, redacted, reviewed data before making production decisions.
