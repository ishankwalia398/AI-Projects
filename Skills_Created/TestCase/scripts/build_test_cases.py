"""Build Test Cases as an Excel workbook (.xlsx) in the user's Test Case template layout.

Usage:
    python build_test_cases.py --content cases.json --out-dir ./test-cases
    python build_test_cases.py --content cases.json --validate-only

The content JSON (see references/content-schema.md) holds the header fields,
the coverage items taken from the Test Plan, and the scenarios with their test
cases. Sheet names, cell positions, column headings, widths, fonts and colours
come from assets/template_layout.json, so every output has the template's
structure:

    Sheet "Main":         title band, header block, scenario summary table
    Sheet "General CRUD": detailed test case table (all 14 template columns)

Scenario TIDs and the "No. of Test cases" counts are computed here, never typed
by hand. Output file: TestCases_<FeatureName>_<YYYYMMDD_HHMMSS>.xlsx

Exit codes: 0 success, 2 validation failed, 3 generation failed.
"""

import argparse
import datetime as dt
import json
import math
import re
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
LAYOUT = json.loads((SKILL_DIR / "assets" / "template_layout.json").read_text(encoding="utf-8"))

INSUFFICIENT = "Insufficient information to determine."
WORKING_HEADINGS = ("Verified Facts", "Missing / Unknown Information", "Generated Output", "Self-Validation Check")


# --------------------------------------------------------------------------- helpers

def numbered(items):
    """['a', 'b'] -> '1.a\\n2.b' (the template's numbering style)."""
    if isinstance(items, str):
        return items
    return "\n".join(f"{i}.{text}" for i, text in enumerate(items, 1))


def all_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from all_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from all_strings(v)


# --------------------------------------------------------------------------- validation

def validate(content):
    errors = []
    err = errors.append
    if not re.fullmatch(r"[A-Za-z0-9]+", content.get("feature_name") or ""):
        err("feature_name must be letters/digits only, e.g. 'UserLogin' (ask the user if unknown)")

    header = content.get("header") or {}
    for field in LAYOUT["main_sheet"]["header_fields"]:
        key = field["key"]
        if key in ("peer_review_by", "peer_reviewed_date", "created_date"):
            continue  # filled after review / defaulted to today
        entry = header.get(key)
        if not isinstance(entry, dict) or not str(entry.get("value", "")).strip():
            err(f"header.{key}: needs {{value, source}} (use '{INSUFFICIENT} Open question: ...' if unknown)")
        elif INSUFFICIENT not in entry["value"] and not str(entry.get("source", "")).strip():
            err(f"header.{key}: missing source")

    items = content.get("coverage_items") or []
    ids = [i.get("id") for i in items]
    if not items:
        err("coverage_items: list every in-scope Test Plan item (Scope / Inclusions) so coverage can be checked")
    if len(ids) != len(set(ids)):
        err("coverage_items: duplicate ids")
    for i in items:
        if not str(i.get("source", "")).strip() or not str(i.get("text", "")).strip():
            err(f"coverage item {i.get('id')}: needs text and source")

    covered = set()
    scenarios = content.get("scenarios") or []
    if not scenarios:
        err("scenarios: at least one scenario is required")
    execution = set(LAYOUT["execution_fields"])
    for s_no, sc in enumerate(scenarios, 1):
        where = f"scenario {s_no}"
        for key in ("description", "priority", "linked_document", "source"):
            if not str(sc.get(key, "")).strip():
                err(f"{where}: missing {key}")
        for key in execution & set(sc):
            if str(sc[key]).strip():
                err(f"{where}: '{key}' is filled during execution; leave it empty")
        cases = sc.get("test_cases") or []
        if not cases:
            err(f"{where}: no test cases")
        for c_no, tc in enumerate(cases, 1):
            loc = f"{where} case {c_no}"
            for key in ("description", "priority", "source"):
                if not str(tc.get(key, "")).strip():
                    err(f"{loc}: missing {key}")
            for key in ("steps", "expected"):
                val = tc.get(key)
                if not val or (isinstance(val, list) and not all(str(v).strip() for v in val)):
                    err(f"{loc}: '{key}' must be a non-empty list")
            if isinstance(tc.get("steps"), list) and isinstance(tc.get("expected"), list) \
                    and len(tc["expected"]) > len(tc["steps"]):
                err(f"{loc}: more expected results than steps")
            for key in execution & set(tc):
                if str(tc[key]).strip():
                    err(f"{loc}: '{key}' is filled during execution; never generate it")
            cov = tc.get("covers") or []
            if not cov:
                err(f"{loc}: 'covers' must name at least one coverage item id")
            unknown = [c for c in cov if c not in ids]
            if unknown:
                err(f"{loc}: covers unknown item(s) {unknown}")
            covered.update(cov)

    missing = [i for i in ids if i not in covered]
    if missing:
        err(f"coverage gap: no test case covers {missing}")

    for text in all_strings(content):
        if INSUFFICIENT in text and "Open question:" not in text:
            err(f"'{INSUFFICIENT}' must be followed by 'Open question: ...' -> {text[:80]!r}")
        for heading in WORKING_HEADINGS:
            if heading in text:
                err(f"working heading {heading!r} must stay in chat, not in the file")
    return errors


# --------------------------------------------------------------------------- rows

def header_values(content):
    """[(label, value)] for the header block; Created Date is today's date."""
    header = content.get("header") or {}
    rows = []
    for field in LAYOUT["main_sheet"]["header_fields"]:
        entry = header.get(field["key"]) or {}
        value = entry.get("value", "") if isinstance(entry, dict) else str(entry)
        if field["key"] == "created_date" and not value:
            value = dt.date.today()
        rows.append((field["label"], value))
    return rows


def summary_rows(content, cols):
    rows = []
    for tid, sc in enumerate(content["scenarios"], 1):
        values = dict(sc, tid=tid, test_case_count=len(sc["test_cases"]))
        rows.append([values.get(c["key"], "") if c["key"] else "" for c in cols])
    return rows


def detail_rows(content, cols):
    rows = []
    for tid, sc in enumerate(content["scenarios"], 1):
        for n, tc in enumerate(sc["test_cases"]):
            values = dict(tc)
            values["tid"] = tid if n == 0 else ""
            values["steps"] = numbered(tc["steps"])
            values["expected"] = numbered(tc["expected"])
            comments = str(tc.get("comments", "") or "").strip()
            ref = f"Ref: {tc['source']}"
            values["comments"] = f"{comments}\n{ref}" if comments else ref
            rows.append([values.get(c["key"], "") if c["key"] else "" for c in cols])
    return rows


# --------------------------------------------------------------------------- XLSX

def row_height(values, cols, font_pt):
    """Estimate a row height (points) that shows all wrapped lines of the tallest cell."""
    # Excel width units are ~1 char at 11 pt; 0.8 leaves room for word-wrap waste.
    chars_per_unit = 0.8 * 11.0 / font_pt
    lines = 1
    for value, col in zip(values, cols):
        per_line = max(1, int(col["width"] * chars_per_unit))
        n = sum(max(1, math.ceil(len(part) / per_line)) for part in str(value).split("\n"))
        lines = max(lines, n)
    return max(15.75, round(lines * font_pt * 1.65 + 6, 2))  # Lato's Excel line height is ~1.6x size


def build_xlsx(content, path):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    f, c = LAYOUT["font"], LAYOUT["colors"]
    fill = lambda hex_: PatternFill("solid", start_color="FF" + hex_, end_color="FF" + hex_)
    thin = Side(style="thin", color="FF" + c["border"])
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    head_font = lambda pt, bold=False: Font(name=f["name"], size=pt, bold=bold, color="FF" + c["header_text"])
    body_font = lambda pt, bold=False: Font(name=f["name"], size=pt, bold=bold)
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    top_wrap = Alignment(vertical="top", wrap_text=True)

    def header_cells(ws, row, cols, pt):
        for j, col in enumerate(cols, 1):
            cell = ws.cell(row=row, column=j, value=col["label"] or None)
            cell.fill, cell.font, cell.alignment = fill(c["header_fill"]), head_font(pt), center
            ws.column_dimensions[get_column_letter(j)].width = col["width"]
        ws.row_dimensions[row].height = max(15.75, pt * 1.35 * 2 + 4) if pt > 12 else 15.75

    def body_cells(ws, row, values, cols, pt):
        for j, value in enumerate(values, 1):
            cell = ws.cell(row=row, column=j, value=value if value != "" else None)
            cell.fill, cell.font, cell.alignment, cell.border = fill(c["row_fill"]), body_font(pt), top_wrap, box
        ws.row_dimensions[row].height = row_height(values, cols, pt)

    wb = Workbook()

    # Sheet "Main": title band, header block, scenario summary (template rows 1-7 and 10+).
    main = LAYOUT["main_sheet"]
    ws = wb.active
    ws.title = main["name"]
    s_cols = main["summary_columns"]
    first, last = main["title_cells"].split(":")
    ws.merge_cells(main["title_cells"])
    title = ws[first]
    title.value = main["title"]
    title.fill, title.font, title.alignment = fill(c["header_fill"]), head_font(f["title_pt"], bold=True), center
    ws[last].fill = fill(c["header_fill"])
    for i, (label, value) in enumerate(header_values(content)):
        r = main["header_first_row"] + i
        shade = fill(c["info_fill_odd"] if i % 2 == 0 else c["info_fill_even"])
        lc, vc = ws[f"{main['header_label_col']}{r}"], ws[f"{main['header_value_col']}{r}"]
        lc.value, vc.value = label, (value if value != "" else None)
        lc.font, vc.font = body_font(f["main_pt"], bold=True), body_font(f["main_pt"])
        for cell in (lc, vc):
            cell.fill, cell.border, cell.alignment = shade, box, top_wrap
        if isinstance(value, (dt.date, dt.datetime)):
            vc.number_format = main["date_format"]
        else:  # header label/value sit in summary columns C/D, so size the row by their widths
            widths = [s_cols[lc.column - 1], s_cols[vc.column - 1]]
            ws.row_dimensions[r].height = row_height([label, value], widths, f["main_pt"])
    hdr = main["summary_header_row"]
    header_cells(ws, hdr, s_cols, f["main_pt"])
    for i, values in enumerate(summary_rows(content, s_cols), 1):
        body_cells(ws, hdr + i, values, s_cols, f["main_pt"])

    # Sheet "General CRUD": the detailed test case table.
    detail = LAYOUT["detail_sheet"]
    ws = wb.create_sheet(detail["name"])
    d_cols = detail["columns"]
    hdr = detail["header_row"]
    header_cells(ws, hdr, d_cols, f["detail_header_pt"])
    for i, values in enumerate(detail_rows(content, d_cols), 1):
        body_cells(ws, hdr + i, values, d_cols, f["detail_body_pt"])
    if detail.get("freeze_header"):
        ws.freeze_panes = ws.cell(row=hdr + 1, column=1)

    wb.properties.title = f"Test Cases - {content['feature_name']}"
    wb.save(str(path))


# --------------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--content", required=True, help="test case content JSON")
    ap.add_argument("--out-dir", default=".", help="folder for the .xlsx")
    ap.add_argument("--validate-only", action="store_true")
    ap.add_argument("--layout", help="alternative layout JSON (same shape as assets/template_layout.json) "
                                     "when the user supplies a different template for this run")
    ap.add_argument("--timestamp", help="override YYYYMMDD_HHMMSS (tests only)")
    args = ap.parse_args()
    if args.layout:
        global LAYOUT
        LAYOUT = json.loads(Path(args.layout).read_text(encoding="utf-8"))

    content = json.loads(Path(args.content).read_text(encoding="utf-8"))
    errors = validate(content)
    if errors:
        print(json.dumps({"status": "invalid", "errors": errors}, indent=2, ensure_ascii=False))
        return 2
    n_cases = sum(len(s["test_cases"]) for s in content["scenarios"])
    n_insufficient = sum(INSUFFICIENT in t for t in all_strings(content["scenarios"]))
    stats = {"scenarios": len(content["scenarios"]), "test_cases": n_cases,
             "coverage_items": len(content["coverage_items"]), "insufficient_cells": n_insufficient}
    if args.validate_only:
        print(json.dumps({"status": "valid", **stats}))
        return 0

    stamp = args.timestamp or dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    xlsx_path = out_dir / f"TestCases_{content['feature_name']}_{stamp}.xlsx"
    try:
        build_xlsx(content, xlsx_path)
    except ImportError:
        print(json.dumps({"status": "error", "error": "openpyxl is not installed. Run: pip install openpyxl"}))
        return 3
    except Exception as error:
        print(json.dumps({"status": "error", "error": f"{type(error).__name__}: {error}"}))
        return 3

    print(json.dumps({"status": "ok", "xlsx": str(xlsx_path),
                      "sheets": [LAYOUT["main_sheet"]["name"], LAYOUT["detail_sheet"]["name"]], **stats}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
