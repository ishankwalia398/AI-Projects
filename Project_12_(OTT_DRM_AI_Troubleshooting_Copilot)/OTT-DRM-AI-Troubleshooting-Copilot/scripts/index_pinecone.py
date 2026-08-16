from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from pinecone import Pinecone

ROOT = Path(__file__).parents[1]
DATA = ROOT / "data"
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "src"))

from drm_copilot.chunking import chunk_record, chunk_settings  # noqa: E402
from drm_copilot.corpus import load_rag_records  # noqa: E402


def load_records() -> list[dict]:
    source_rows = load_rag_records(DATA)
    chunk_size, overlap_percent = chunk_settings()
    records: list[dict] = []
    for row in source_rows:
        for chunk in chunk_record(row, chunk_size, overlap_percent):
            records.append(
                {
                    "_id": chunk["id"],
                    "parent_id": chunk["parent_id"],
                    "content": chunk["content"],
                    "title": chunk["title"],
                    "topic": chunk.get("topic", "general"),
                    "tags": chunk.get("tags", []),
                    "source_type": chunk.get("source_type", "knowledge"),
                    "source_url": chunk.get("source_url", ""),
                    "verified_at": chunk.get("verified_at", ""),
                    "chunk_index": chunk["chunk_index"],
                    "chunk_count": chunk["chunk_count"],
                }
            )
    return records


def wait_until_ready(pc: Pinecone, index_name: str, timeout_seconds: int = 90) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        description = pc.describe_index(index_name)
        status = getattr(description, "status", None)
        ready = status.get("ready") if isinstance(status, dict) else getattr(status, "ready", False)
        if ready:
            return
        time.sleep(2)
    raise TimeoutError(f"Pinecone index '{index_name}' was not ready within {timeout_seconds} seconds")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create/update the Pinecone DRM knowledge index")
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Delete all records in the configured namespace before uploading fresh chunks",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("Missing PINECONE_API_KEY. Copy .env.example to .env and add your key.", file=sys.stderr)
        return 1

    index_name = os.getenv("PINECONE_INDEX", "ott-drm-ai-copilot")
    namespace = os.getenv("PINECONE_NAMESPACE", "knowledge")
    embed_model = os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2")
    cloud = os.getenv("PINECONE_CLOUD", "aws")
    region = os.getenv("PINECONE_REGION", "us-east-1")

    pc = Pinecone(api_key=api_key)
    if not pc.has_index(index_name):
        print(f"Creating Pinecone index '{index_name}' in {cloud}/{region}...")
        pc.create_index_for_model(
            name=index_name,
            cloud=cloud,
            region=region,
            embed={"model": embed_model, "field_map": {"text": "content"}},
        )
        wait_until_ready(pc, index_name)
    else:
        description = pc.describe_index(index_name)
        embed = description.get("embed") if isinstance(description, dict) else getattr(description, "embed", None)
        if not embed:
            print(
                f"Index '{index_name}' exists but has no integrated embedding configuration. "
                "Set PINECONE_INDEX to a new name (recommended) or use a compatible integrated-embedding index.",
                file=sys.stderr,
            )
            return 1
        print(f"Using existing Pinecone index '{index_name}'.")

    records = load_records()
    chunk_size, overlap_percent = chunk_settings()
    print(
        f"Chunking policy: {chunk_size} characters with "
        f"{overlap_percent:.0%} overlap ({round(chunk_size * overlap_percent)} characters)."
    )
    index = pc.Index(index_name)
    if args.rebuild:
        print(f"Rebuilding namespace '{namespace}': deleting its existing records...")
        index.delete(delete_all=True, namespace=namespace)
    batch_size = 50
    for start in range(0, len(records), batch_size):
        batch = records[start : start + batch_size]
        index.upsert_records(namespace=namespace, records=batch)
        print(f"Upserted {min(start + len(batch), len(records))}/{len(records)} records")

    print(
        f"Indexed {len(records)} records into {index_name}/{namespace}. "
        "Pinecone is eventually consistent, so search may take a few seconds."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
