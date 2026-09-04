from __future__ import annotations

import csv
import io
import json
import re
import zipfile
from pathlib import Path

from ..models import RunResult, TicketResult


def safe_segment(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", value).strip("._")
    if not cleaned or cleaned in {".", ".."}: raise ValueError("Unsafe path segment")
    return cleaned[:100]


def _md_analysis(r):
    lines = [f"# Requirements Analysis — {r.ticket_key}", "", f"**Source:** {r.source_provider}", "", f"## Summary\n\n{r.summary}"]
    for title, values in [("Requirements", r.requirements), ("Acceptance Criteria", r.acceptance_criteria)]:
        lines += ["", f"## {title}", ""] + [f"- **{x.id}** [{x.classification}] {x.text}" for x in values]
    for title, values in [("Missing Information", r.missing_information), ("Assumptions", r.assumptions), ("Open Questions", r.open_questions)]: lines += ["", f"## {title}", ""] + [f"- {x}" for x in values]
    return "\n".join(lines) + "\n"


def _md_plan(p):
    lines = [f"# Test Plan — {p.ticket_key}"]
    for s in p.sections: lines += ["", f"## {s.number}. {s.title}", ""] + [f"- {x}" for x in s.content]
    return "\n".join(lines) + "\n"


def _md_cases(s):
    lines = [f"# Test Cases — {s.ticket_key}"]
    for c in s.test_cases:
        lines += ["", f"## {c.id}: {c.title}", "", f"**Priority:** {c.priority}  ", f"**Type:** {c.test_type}  ", f"**Traceability:** {', '.join(c.requirement_ids + c.acceptance_criteria_ids)}  ", f"**Automation:** {c.automation_candidate} — {c.automation_rationale}", "", "### Steps", ""]
        lines += [f"{x.number}. {x.action} — **Expected:** {x.expected_result}" for x in c.steps]
    return "\n".join(lines) + "\n"


def _csv(rows):
    if not rows: return ""
    out = io.StringIO(newline=""); writer = csv.DictWriter(out, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows); return out.getvalue()


def ticket_files(result: TicketResult) -> dict[str, bytes]:
    if not all([result.requirement_analysis, result.test_plan, result.test_cases, result.playwright]): return {}
    a, p, s, b = result.requirement_analysis, result.test_plan, result.test_cases, result.playwright
    case_rows = [{"id": c.id, "title": c.title, "priority": c.priority, "type": c.test_type, "automation": c.automation_candidate, "requirements": ",".join(c.requirement_ids), "acceptance_criteria": ",".join(c.acceptance_criteria_ids), "tags": ",".join(c.tags)} for c in s.test_cases]
    pw_md = [f"# Playwright — {b.ticket_key}", "", f"**Readiness:** {b.readiness}", "", "## Setup notes"] + [f"- {x}" for x in b.setup_notes]
    files = {"requirements_analysis.md": _md_analysis(a), "requirements_analysis.json": a.model_dump_json(indent=2), "test_plan.md": _md_plan(p), "test_cases.md": _md_cases(s), "test_cases.csv": _csv(case_rows), "traceability_matrix.csv": _csv(result.traceability)}
    for f in b.files:
        path = "/".join(safe_segment(x) for x in Path(f.path).parts)
        files[f"playwright/{path}"] = f.content
        pw_md += ["", f"## `{path}`", "", "```typescript", f.content, "```"]
    files["playwright_tests.md"] = "\n".join(pw_md) + "\n"
    manifest = {"ticket_key": result.ticket_key, "status": result.status, "llm_model": result.llm_model_used, "llm_fallback_used": result.llm_fallback_used, "files": sorted(files), "warnings": result.warnings}
    files["manifest.json"] = json.dumps(manifest, indent=2)
    return {k: v.encode() for k, v in files.items()}


def write_run(run: RunResult, root: Path) -> Path:
    run_dir = root.resolve() / safe_segment(run.run_id); run_dir.mkdir(parents=True, exist_ok=False)
    manifest = {"run_id": run.run_id, "started_at": run.started_at.isoformat(), "completed_at": run.completed_at.isoformat(), "tickets": [{"key": t.ticket_key, "status": t.status, "llm_model": t.llm_model_used, "llm_fallback_used": t.llm_fallback_used} for t in run.tickets]}
    (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (run_dir / "run_summary.md").write_text("# Run Summary\n\n" + "\n".join(f"- {t.ticket_key}: {t.status}" for t in run.tickets), encoding="utf-8")
    for result in run.tickets:
        target = run_dir / safe_segment(result.ticket_key); target.mkdir()
        for relative, data in ticket_files(result).items():
            path = target.joinpath(*relative.split("/")); path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
    return run_dir


def zip_run(run_dir: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in run_dir.rglob("*"):
            if path.is_file(): archive.write(path, path.relative_to(run_dir))
    return buffer.getvalue()
