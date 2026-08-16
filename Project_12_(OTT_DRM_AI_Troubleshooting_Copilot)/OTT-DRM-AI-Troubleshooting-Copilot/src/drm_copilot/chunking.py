from __future__ import annotations

import os


def chunk_settings() -> tuple[int, float]:
    size = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    overlap_percent = float(os.getenv("RAG_CHUNK_OVERLAP_PERCENT", "15")) / 100
    return size, overlap_percent


def chunk_text(text: str, chunk_size: int = 1000, overlap_percent: float = 0.15) -> list[str]:
    """Split text into character chunks with a percentage overlap.

    The overlap is measured against the configured chunk size. For example,
    1000 characters with 15% overlap advances by 850 characters.
    """

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero")
    if not 0 <= overlap_percent < 1:
        raise ValueError("overlap_percent must be between 0 (inclusive) and 1 (exclusive)")

    content = (text or "").strip()
    if not content:
        return []
    if len(content) <= chunk_size:
        return [content]

    overlap = round(chunk_size * overlap_percent)
    step = chunk_size - overlap
    return [
        content[start : start + chunk_size]
        for start in range(0, len(content), step)
        if content[start : start + chunk_size].strip()
    ]


def chunk_record(row: dict, chunk_size: int, overlap_percent: float) -> list[dict]:
    chunks = chunk_text(row.get("content", ""), chunk_size, overlap_percent)
    total = len(chunks)
    return [
        {
            **row,
            "id": f"{row['id']}-chunk-{index:04d}",
            "parent_id": row["id"],
            "content": content,
            "chunk_index": index,
            "chunk_count": total,
        }
        for index, content in enumerate(chunks)
    ]
