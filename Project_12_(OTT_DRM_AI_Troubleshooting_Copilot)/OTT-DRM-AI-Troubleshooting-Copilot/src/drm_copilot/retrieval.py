from __future__ import annotations

import json
import math
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any

from .chunking import chunk_record, chunk_settings
from .corpus import load_rag_records
from .models import RetrievedDocument


class KnowledgeRetriever:
    """Dependency-free TF-IDF fallback for offline development."""

    def __init__(self, paths: list[Path] | None = None, rows: list[dict] | None = None):
        source_rows: list[dict] = list(rows or [])
        for path in paths or []:
            if path.exists():
                with path.open(encoding="utf-8") as handle:
                    source_rows.extend(json.loads(line) for line in handle if line.strip())
        chunk_size, overlap_percent = chunk_settings()
        self.rows = [
            chunk
            for row in source_rows
            for chunk in chunk_record(row, chunk_size, overlap_percent)
        ]
        tokenized = [self._tokenize(self._search_text(row)) for row in self.rows]
        document_frequency: Counter[str] = Counter()
        for tokens in tokenized:
            document_frequency.update(set(tokens))
        size = max(len(self.rows), 1)
        self.idf = {
            token: math.log((1 + size) / (1 + frequency)) + 1
            for token, frequency in document_frequency.items()
        }
        self.vectors = [self._vector(tokens) for tokens in tokenized]

    @staticmethod
    def _search_text(row: dict) -> str:
        return " ".join(
            [row.get("title", ""), row.get("topic", ""), " ".join(row.get("tags", [])), row.get("content", "")]
        )

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(r"[a-z0-9]+(?:[._-][a-z0-9]+)*", text.lower())

    def _vector(self, tokens: list[str]) -> dict[str, float]:
        counts = Counter(tokens)
        return {token: count * self.idf.get(token, 1.0) for token, count in counts.items()}

    @staticmethod
    def _cosine(left: dict[str, float], right: dict[str, float]) -> float:
        if not left or not right:
            return 0.0
        dot = sum(value * right.get(token, 0.0) for token, value in left.items())
        left_norm = math.sqrt(sum(value * value for value in left.values()))
        right_norm = math.sqrt(sum(value * value for value in right.values()))
        return dot / (left_norm * right_norm) if left_norm and right_norm else 0.0

    def search(self, query: str, top_k: int = 5) -> list[RetrievedDocument]:
        if not self.rows:
            return []
        query_vector = self._vector(self._tokenize(query))
        scores = [self._cosine(query_vector, vector) for vector in self.vectors]
        indexes = sorted(range(len(scores)), key=lambda index: scores[index], reverse=True)[:top_k]
        results = []
        for index in indexes:
            row = self.rows[index]
            results.append(
                RetrievedDocument(
                    id=row["id"],
                    parent_id=row.get("parent_id", row["id"]),
                    title=row["title"],
                    topic=row.get("topic", "general"),
                    content=row["content"],
                    source_type=row.get("source_type", "knowledge"),
                    source_url=row.get("source_url", ""),
                    score=round(scores[index], 4),
                    chunk_index=int(row.get("chunk_index", 0)),
                    chunk_count=int(row.get("chunk_count", 1)),
                )
            )
        return results


class PineconeKnowledgeRetriever:
    """Pinecone retriever using the index's integrated embedding model."""

    def __init__(self) -> None:
        from pinecone import Pinecone

        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY is not configured")
        self.index_name = os.getenv("PINECONE_INDEX", "ott-drm-ai-copilot")
        self.namespace = os.getenv("PINECONE_NAMESPACE", "knowledge")
        self.client = Pinecone(api_key=api_key)
        if not self.client.has_index(self.index_name):
            raise ValueError(
                f"Pinecone index '{self.index_name}' does not exist. "
                "Run: python scripts/index_pinecone.py"
            )
        self.index = self.client.Index(self.index_name)

    @staticmethod
    def _value(record: Any, key: str, default: Any = None) -> Any:
        if isinstance(record, dict):
            return record.get(key, default)
        return getattr(record, key, default)

    @classmethod
    def _convert_hits(cls, hits: list[Any]) -> list[RetrievedDocument]:
        documents: list[RetrievedDocument] = []
        for hit in hits:
            fields = cls._value(hit, "fields", {}) or {}
            identifier = cls._value(hit, "_id") or cls._value(hit, "id") or cls._value(fields, "id", "unknown")
            score = cls._value(hit, "_score")
            if score is None:
                score = cls._value(hit, "score", 0.0)
            documents.append(
                RetrievedDocument(
                    id=str(identifier),
                    parent_id=str(cls._value(fields, "parent_id", identifier)),
                    title=str(cls._value(fields, "title", "Untitled knowledge record")),
                    topic=str(cls._value(fields, "topic", "general")),
                    content=str(cls._value(fields, "content", "")),
                    source_type=str(cls._value(fields, "source_type", "knowledge")),
                    source_url=str(cls._value(fields, "source_url", "")),
                    score=round(float(score or 0.0), 4),
                    chunk_index=int(cls._value(fields, "chunk_index", 0)),
                    chunk_count=int(cls._value(fields, "chunk_count", 1)),
                )
            )
        return documents

    def search(self, query: str, top_k: int = 5) -> list[RetrievedDocument]:
        response = self.index.search(
            namespace=self.namespace,
            query={"top_k": top_k, "inputs": {"text": query}},
        )
        result = self._value(response, "result", {}) or {}
        hits = self._value(result, "hits", []) or []
        return self._convert_hits(list(hits))


def configured_rag_provider() -> str:
    """Return the configured provider, inferring Pinecone when its key is present."""

    explicit_provider = os.getenv("RAG_PROVIDER", "").strip().lower()
    if explicit_provider:
        return explicit_provider
    return "pinecone" if os.getenv("PINECONE_API_KEY") else "local"


def retrieve_knowledge(query: str, data_dir: Path, top_k: int = 5) -> tuple[list[RetrievedDocument], str, str | None]:
    """Return documents, active backend, and an optional fallback warning."""

    provider = configured_rag_provider()
    if provider == "pinecone":
        try:
            documents = PineconeKnowledgeRetriever().search(query, top_k=top_k)
            return documents, "pinecone", None
        except Exception as exc:
            warning = f"Pinecone retrieval was unavailable; local retrieval was used instead: {exc}"
            local = KnowledgeRetriever(rows=load_rag_records(data_dir))
            return local.search(query, top_k=top_k), "local-fallback", warning

    local = KnowledgeRetriever(rows=load_rag_records(data_dir))
    return local.search(query, top_k=top_k), "local", None
