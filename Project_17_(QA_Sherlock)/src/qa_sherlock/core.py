from __future__ import annotations

import json
import re
from pathlib import Path

ROLES = ["Failure Investigator", "Requirement Analyst", "Historical Bug Investigator",
         "Root Cause Analyst", "Test Engineer", "QA Judge"]


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def ingest_playwright_data(report):
    """Keep every failed attempt, including recovered flakes; never open attachment paths."""
    if not isinstance(report, dict):
        raise ValueError("Playwright report must be a JSON object")
    failures = []

    def walk(suites, parents):
        for suite in suites:
            trail = parents + [suite.get("title", "")]
            for spec in suite.get("specs", []):
                for test in spec.get("tests", []):
                    for result in test.get("results", []):
                        if result.get("status") not in ("failed", "timedOut", "interrupted"):
                            continue
                        errors = result.get("errors", []) or [result.get("error", {})]
                        failures.append({
                            "title": " / ".join(trail + [spec.get("title", "")]),
                            "file": spec.get("file", suite.get("file", "unknown")),
                            "project": test.get("projectName", ""),
                            "status": result["status"], "retry": result.get("retry", 0),
                            "outcome": test.get("status", "unexpected"),
                            "error": "\n".join(e.get("message", "") for e in errors),
                            "attachments": result.get("attachments", []),
                        })
            walk(suite.get("suites", []), trail)
    walk(report.get("suites", []), [])
    return failures


def ingest_playwright(path):
    return ingest_playwright_data(load_json(path))


def corpus(directory):
    docs = []
    for path in sorted(Path(directory).glob("*.json")):
        docs.extend(load_json(path))
    ids = [d["id"] for d in docs]
    if len(ids) != len(set(ids)):
        raise ValueError("Evidence IDs must be unique")
    return docs


def retrieve_local(query, docs, top_k=12):
    """Deterministic lexical retrieval for offline demonstration only."""
    tokens = set(re.findall(r"[a-z0-9_]+", query.lower()))
    scored = []
    for doc in docs:
        words = set(re.findall(r"[a-z0-9_]+", (doc["title"] + " " + doc["text"]).lower()))
        score = len(tokens & words) / max(1, len(tokens))
        if score:
            scored.append(dict(doc, score=round(score, 4)))
    return sorted(scored, key=lambda d: (-d["score"], d["id"]))[:top_k]


def validate_report(report, evidence):
    known = {d["id"]: d for d in evidence}
    for field in ("summary", "root_cause", "confidence", "claims", "alternatives", "next_steps", "regression_test"):
        if field not in report:
            raise ValueError(f"Missing report field: {field}")
    if not 0 <= float(report["confidence"]) <= 1:
        raise ValueError("Confidence must be between 0 and 1")
    if not report["claims"]:
        raise ValueError("At least one evidenced claim is required")
    for claim in report["claims"]:
        if not claim.get("evidence_ids") or not set(claim["evidence_ids"]) <= known.keys():
            raise ValueError("Claim contains missing or unknown evidence citations")
    return report


def demo_report(evidence):
    available = {d["id"] for d in evidence}
    required = {"REQ-001", "LOG-001", "SRC-001", "REL-001", "BUG-001"}
    if not required <= available:
        raise ValueError("Demo fixture evidence incomplete; use bundled checkout failure")
    return {
        "summary": "Checkout rejects a valid 20% promotion at the inclusive expiry boundary.",
        "root_cause": "Probable off-by-one comparison in PromotionValidator: now >= expiresAt rejects equality, contrary to the inclusive requirement.",
        "confidence": 0.88,
        "claims": [
            {"text": "The contract accepts a promotion when now equals expiresAt.", "evidence_ids": ["REQ-001"]},
            {"text": "The failed checkout recorded equal timestamps and PROMO_EXPIRED.", "evidence_ids": ["LOG-001"]},
            {"text": "Release 2.14 introduced the >= comparison; a previous coupon bug used the same boundary pattern.", "evidence_ids": ["SRC-001", "REL-001", "BUG-001"]}
        ],
        "alternatives": ["Clock skew: compare application and database clocks before concluding.", "Stale promotion cache: invalidate cache and repeat with a fresh promotion."],
        "next_steps": ["Confirm the deployed commit matches source evidence.", "Replace >= with > if product confirms the inclusive contract.", "Run before, equal, and after expiry regression checks in isolated staging."],
        "regression_test": "import { test, expect } from '@playwright/test';\n\n// Requires the documented local fixture API; generated test is not executed automatically.\nfor (const offsetMs of [-1, 0, 1]) {\n  test(`promotion expiry boundary ${offsetMs}ms`, async ({ request }) => {\n    const seed = await request.post('/test-support/promotions', { data: { expiresAt: '2026-09-01T12:00:00.000Z' } });\n    expect(seed.ok()).toBeTruthy();\n    const { code } = await seed.json();\n    const now = new Date(Date.parse('2026-09-01T12:00:00.000Z') + offsetMs).toISOString();\n    const response = await request.post('/checkout/quote', { data: { code, subtotal: 10000, now } });\n    expect(response.status()).toBe(offsetMs <= 0 ? 200 : 422);\n    const body = await response.json();\n    if (offsetMs <= 0) expect(body.total).toBe(8000);\n    else expect(body.error).toBe('PROMO_EXPIRED');\n  });\n}\n"
    }
