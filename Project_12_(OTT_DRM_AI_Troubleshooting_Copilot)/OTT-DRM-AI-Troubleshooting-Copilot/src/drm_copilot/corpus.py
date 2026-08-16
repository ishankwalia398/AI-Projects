from __future__ import annotations

import csv
import json
import re
from pathlib import Path


def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "general"


def _markdown_records(path: Path) -> list[dict]:
    """Convert Markdown sections into RAG records without executing their contents."""
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    sections = re.split(r"(?=^##\s+)", text, flags=re.MULTILINE)
    records: list[dict] = []
    for index, section in enumerate(sections):
        heading_match = re.match(r"^##\s+(.+)$", section, flags=re.MULTILINE)
        if not heading_match:
            continue
        heading = heading_match.group(1).strip()
        topic = re.sub(r"^\d+\.\s*", "", heading).strip()
        urls = re.findall(r"https?://[^\s)]+", section)
        records.append(
            {
                "id": f"md-{_slug(path.stem)}-{index:02d}-{_slug(topic)}",
                "title": topic,
                "topic": topic,
                "tags": [_slug(part) for part in re.split(r"[&/,()]", topic) if part.strip()],
                "source_type": "curated Markdown resource index",
                "source_url": urls[0].rstrip(".,") if urls else "",
                "verified_at": "2026-08-16",
                "content": section.strip(),
            }
        )
    return records


def _device_records(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    records: list[dict] = []
    for row in rows:
        platform = row.get("platform", "Unknown platform")
        drm = row.get("drm_system", "Unknown DRM")
        model = row.get("device_model", "Unknown device")
        records.append(
            {
                "id": f"device-{row['profile_id']}",
                "title": f"{platform}: {model}",
                "topic": "Device compatibility",
                "tags": [platform, drm, row.get("security_level", ""), row.get("max_resolution", "")],
                "source_type": "synthetic device capability profile",
                "source_url": "",
                "verified_at": row.get("verified_at", ""),
                "content": (
                    f"Synthetic QA capability profile {row['profile_id']}. Platform: {platform}. "
                    f"Device: {model}. DRM: {drm}. Security level: {row.get('security_level')}. "
                    f"Maximum resolution: {row.get('max_resolution')}. Maximum HDCP: {row.get('max_hdcp')}. "
                    f"Video codecs: {row.get('video_codecs')}. Secure decoder: {row.get('secure_decoder')}. "
                    f"HDR formats: {row.get('hdr_formats')}. Notes: {row.get('notes')}"
                ),
            }
        )
    return records


def load_rag_records(data_dir: Path) -> list[dict]:
    """Load every source that is safe for retrieval; evaluation labels stay excluded."""
    records: list[dict] = []
    for filename in ("knowledge_base.jsonl", "historical_incidents.jsonl"):
        records.extend(_read_jsonl(data_dir / filename))
    records.extend(_device_records(data_dir / "device_capabilities.csv"))
    for path in sorted((data_dir / "sources").glob("*.md")):
        records.extend(_markdown_records(path))
    return records

