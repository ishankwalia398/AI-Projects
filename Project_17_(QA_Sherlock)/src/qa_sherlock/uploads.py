from __future__ import annotations

import csv
import hashlib
import io
import json
import re
from pathlib import Path

ALLOWED_EXTENSIONS = {
    ".json", ".csv", ".md", ".txt", ".log", ".yaml", ".yml", ".xml",
    ".feature", ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".kt",
    ".go", ".cs", ".html", ".css", ".sql",
}
MAX_FILES = 30
MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_TOTAL_BYTES = 15 * 1024 * 1024
CHUNK_CHARS = 6000


def safe_name(name):
    name = Path(str(name)).name
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", name).strip("._")
    if not cleaned:
        raise ValueError("Uploaded file has no usable name")
    return cleaned[:180]


def validate_uploads(files):
    if not files:
        raise ValueError("Upload at least one supporting evidence file")
    if len(files) > MAX_FILES:
        raise ValueError(f"Upload at most {MAX_FILES} evidence files")
    total = 0
    checked = []
    for item in files:
        name = safe_name(item["name"])
        content = item["content"]
        if not isinstance(content, bytes):
            raise ValueError(f"{name} content is invalid")
        if Path(name).suffix.lower() not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported evidence type: {Path(name).suffix or '(none)'}")
        if len(content) > MAX_FILE_BYTES:
            raise ValueError(f"{name} exceeds the 5 MB per-file limit")
        total += len(content)
        checked.append({"name": name, "content": content})
    if total > MAX_TOTAL_BYTES:
        raise ValueError("Evidence exceeds the 15 MB total limit")
    return checked


def _decode(name, content):
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError(f"{name} must be UTF-8 text") from exc


def _chunks(text):
    text = text.strip()
    return [text[i:i + CHUNK_CHARS] for i in range(0, len(text), CHUNK_CHARS)] or [""]


def _record(name, kind, title, text, position):
    digest = hashlib.sha256(f"{name}:{position}:{text}".encode()).hexdigest()[:12].upper()
    return {
        "id": f"UPL-{digest}", "kind": kind, "title": title[:240],
        "text": text, "source": f"uploaded://{name}#part-{position + 1}",
    }


def _safe_record_id(value, fallback):
    cleaned = re.sub(r"[^A-Za-z0-9._:-]", "-", str(value)).strip(".:-")[:120]
    return cleaned or fallback


def evidence_from_uploads(files):
    records = []
    for item in validate_uploads(files):
        name, content = item["name"], item["content"]
        suffix = Path(name).suffix.lower()
        text = _decode(name, content)
        if suffix == ".json":
            try:
                value = json.loads(text)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{name} contains invalid JSON") from exc
            items = value if isinstance(value, list) else value.get("records", []) if isinstance(value, dict) and isinstance(value.get("records"), list) else [value]
            for pos, value_item in enumerate(items):
                if isinstance(value_item, dict) and isinstance(value_item.get("text"), str):
                    record = _record(name, str(value_item.get("kind", "uploaded_json")), str(value_item.get("title", name)), value_item["text"], pos)
                    record["id"] = _safe_record_id(value_item.get("id", record["id"]), record["id"])
                    records.append(record)
                else:
                    records.append(_record(name, "uploaded_json", f"{name} item {pos + 1}", json.dumps(value_item, ensure_ascii=False), pos))
        elif suffix == ".csv":
            try:
                rows = list(csv.DictReader(io.StringIO(text)))
            except csv.Error as exc:
                raise ValueError(f"{name} contains invalid CSV") from exc
            if not rows:
                raise ValueError(f"{name} contains no CSV data rows")
            records.extend(_record(name, "uploaded_csv", f"{name} row {pos + 1}", json.dumps(row, ensure_ascii=False), pos) for pos, row in enumerate(rows))
        else:
            kind = "source_code" if suffix in {".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".kt", ".go", ".cs", ".sql"} else "uploaded_document"
            records.extend(_record(name, kind, f"{name} part {pos + 1}", chunk, pos) for pos, chunk in enumerate(_chunks(text)) if chunk)
    if not records:
        raise ValueError("Uploaded evidence contains no usable text")
    ids = [record["id"] for record in records]
    if len(ids) != len(set(ids)):
        raise ValueError("Uploaded evidence IDs must be unique")
    return records
