"""Build a Test Plan (.docx + .pdf) that follows the user's template exactly.

Usage:
    python build_test_plan.py --content plan.json --out-dir ./test-plans
    python build_test_plan.py --content plan.json --validate-only

The content JSON (see references/content-schema.md) supplies blocks for every
template section. Section headings, levels and order are fixed here, not in the
JSON, so every plan has the template's structure. Both files are generated
from the same content in one run and share one timestamp:
    STP_<FeatureName>_<YYYYMMDD_HHMMSS>.docx / .pdf

PDF engine order: Microsoft Word (exact copy of the .docx, table of contents
filled in) -> built-in ReportLab renderer (same content, same section order).

Exit codes: 0 success, 2 validation failed, 3 generation failed.
"""

import argparse
import copy
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

SKILL_DIR = Path(__file__).resolve().parent.parent
BASE_DOCX = SKILL_DIR / "assets" / "template_base.docx"

INSUFFICIENT = "Insufficient information to determine."
WORKING_HEADINGS = ("Verified Facts", "Missing / Unknown Information", "Generated Output", "Self-Validation Check")

# (id, heading text exactly as in the template, heading level, has Entry/Exit sub-sections)
SECTIONS = [
    ("objective", "Objective", 2, False),
    ("scope", "Scope", 2, False),
    ("inclusions", "Inclusions", 3, False),
    ("test_environments", "Test Environments", 3, False),
    ("defect_reporting_procedure", "Defect Reporting Procedure", 3, False),
    ("test_strategy", "Test Strategy", 3, False),
    ("test_schedule", "Test Schedule", 3, False),
    ("test_deliverables", "Test Deliverables.", 3, False),
    ("entry_and_exit_criteria", "Entry and Exit Criteria", 3, True),
    ("test_execution", "Test Execution", 3, True),
    ("test_closure", "Test Closure", 3, True),
    ("tools", "Tools", 4, False),
    ("risks_and_mitigations", "Risks and Mitigations", 4, False),
    ("approvals", "Approvals", 4, False),
]
SUBSECTIONS = [("entry_criteria", "Entry Criteria:"), ("exit_criteria", "Exit Criteria:")]
BLOCK_TYPES = {"paragraph", "label", "bullets", "numbered", "table", "image", "insufficient"}


# --------------------------------------------------------------------------- validation

def _text_of(block):
    """All visible text of a block, for content checks."""
    parts = [block.get("text", ""), block.get("title", ""), block.get("question", "")]
    for item in block.get("items", []):
        parts.append(json.dumps(item))
    parts += block.get("headers", [])
    for row in block.get("rows", []):
        parts += [str(c) for c in row]
    return " ".join(parts)


def _check_blocks(blocks, where, errors, base_dir):
    if not isinstance(blocks, list) or not blocks:
        errors.append(f"{where}: needs at least one block (use an 'insufficient' block if the input is silent)")
        return
    for i, block in enumerate(blocks):
        loc = f"{where}[{i}]"
        kind = block.get("type")
        if kind not in BLOCK_TYPES:
            errors.append(f"{loc}: unknown block type {kind!r}")
            continue
        if kind == "insufficient":
            if not str(block.get("question", "")).strip():
                errors.append(f"{loc}: 'insufficient' blocks must state the open question")
        elif not str(block.get("source", "")).strip():
            errors.append(f"{loc}: missing 'source' (every statement must be traceable to the input)")
        if kind in ("paragraph", "label") and not str(block.get("text", "")).strip():
            errors.append(f"{loc}: empty text")
        if kind in ("bullets", "numbered") and not block.get("items"):
            errors.append(f"{loc}: empty items")
        if kind == "table":
            headers = block.get("headers") or []
            if not headers:
                errors.append(f"{loc}: table needs headers")
            for r, row in enumerate(block.get("rows", [])):
                if len(row) != len(headers):
                    errors.append(f"{loc}: row {r} has {len(row)} cells, expected {len(headers)}")
        if kind == "image":
            path = Path(block.get("path", ""))
            if not path.is_absolute():
                path = base_dir / path
            if not path.is_file():
                errors.append(f"{loc}: image not found: {path}")
            else:
                block["_resolved_path"] = str(path)
        text = _text_of(block)
        for heading in WORKING_HEADINGS:
            if heading in text:
                errors.append(f"{loc}: working heading {heading!r} must stay in chat, not in the file")


def validate(content, base_dir):
    errors = []
    feature = content.get("feature_name", "")
    if not re.fullmatch(r"[A-Za-z0-9]+", feature or ""):
        errors.append("feature_name must be letters/digits only, e.g. 'UserLogin' (ask the user if unknown)")
    sections = content.get("sections")
    if not isinstance(sections, dict):
        return errors + ["'sections' must be an object keyed by section id"]
    known = {s[0] for s in SECTIONS}
    for extra in sorted(set(sections) - known):
        errors.append(f"unknown section id {extra!r}; the template has no such section")
    for sid, heading, _level, has_sub in SECTIONS:
        sec = sections.get(sid)
        if sec is None:
            errors.append(f"missing template section {heading!r} ({sid})")
            continue
        if has_sub:
            if sec.get("blocks"):
                _check_blocks(sec["blocks"], sid, errors, base_dir)
            for key, _label in SUBSECTIONS:
                _check_blocks(sec.get(key), f"{sid}.{key}", errors, base_dir)
        else:
            _check_blocks(sec.get("blocks"), sid, errors, base_dir)
    return errors


def iter_blocks(content):
    for sid, _h, _l, has_sub in SECTIONS:
        sec = content["sections"][sid]
        yield from sec.get("blocks", []) or []
        if has_sub:
            for key, _ in SUBSECTIONS:
                yield from sec.get(key, [])


# --------------------------------------------------------------------------- inline markup

BOLD_RE = re.compile(r"\*\*(.+?)\*\*")


def split_bold(text):
    """'a **b** c' -> [('a ', False), ('b', True), (' c', False)]"""
    out, pos = [], 0
    for m in BOLD_RE.finditer(text):
        if m.start() > pos:
            out.append((text[pos:m.start()], False))
        out.append((m.group(1), True))
        pos = m.end()
    if pos < len(text):
        out.append((text[pos:], False))
    return out or [("", False)]


def item_parts(item):
    """Normalise a list item: str or {text, children}."""
    if isinstance(item, str):
        return item, []
    return item.get("text", ""), item.get("children", [])


# --------------------------------------------------------------------------- DOCX

def build_docx(content, path):
    from docx import Document
    from docx.enum.text import WD_BREAK
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Inches, Pt

    doc = Document(str(BASE_DOCX))

    def runs(paragraph, text, bold=False):
        for chunk, is_bold in split_bold(text):
            run = paragraph.add_run(chunk)
            run.bold = bold or is_bold

    def para(text, bold=False, indent=0.0):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(indent) if indent else None
        runs(p, text, bold)
        return p

    def bullets(items, depth=0, numbered=False):
        marks = ["•", "o", "▪"]
        for n, item in enumerate(items, 1):
            text, children = item_parts(item)
            mark = f"{n}." if numbered and depth == 0 else marks[min(depth, 2)]
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25 + 0.3 * depth)
            p.paragraph_format.first_line_indent = Inches(-0.2)
            p.add_run(f"{mark} ")
            runs(p, text)
            if children:
                bullets(children, depth + 1)

    def borders(table):
        tbl_pr = table._tbl.tblPr
        b = OxmlElement("w:tblBorders")
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
            e = OxmlElement(f"w:{edge}")
            e.set(qn("w:val"), "single")
            e.set(qn("w:sz"), "4")
            e.set(qn("w:color"), "000000")
            b.append(e)
        tbl_pr.append(b)

    def table(block):
        headers, rows = block["headers"], block.get("rows", [])
        t = doc.add_table(rows=1 + len(rows), cols=len(headers))
        borders(t)
        for c, h in enumerate(headers):
            cell = t.rows[0].cells[c]
            cell.text = ""
            runs(cell.paragraphs[0], str(h), bold=True)
        for r, row in enumerate(rows, 1):
            for c, value in enumerate(row):
                cell = t.rows[r].cells[c]
                cell.text = ""
                runs(cell.paragraphs[0], str(value))
        doc.add_paragraph()

    def render(blocks):
        for block in blocks:
            kind = block["type"]
            if kind == "paragraph":
                para(block["text"], indent=block.get("indent", 0))
            elif kind == "label":
                para(block["text"], bold=True)
            elif kind == "bullets":
                bullets(block["items"])
            elif kind == "numbered":
                bullets(block["items"], numbered=True)
            elif kind == "table":
                table(block)
            elif kind == "image":
                doc.add_picture(block["_resolved_path"], width=Inches(6.0))
                if block.get("caption"):
                    para(block["caption"])
            elif kind == "insufficient":
                para(INSUFFICIENT, bold=True)
                para(f"Open question: {block['question']}")

    # Title + table of contents, as in the template.
    doc.add_heading("Test Plan", level=1)
    toc = doc.add_paragraph()
    for kind, text in (("begin", None), (None, 'TOC \\o "1-4" \\h \\z \\u'), ("separate", None),
                       (None, None), ("end", None)):
        run = toc.add_run()
        if kind:
            fld = OxmlElement("w:fldChar")
            fld.set(qn("w:fldCharType"), kind)
            run._r.append(fld)
        elif text:
            instr = OxmlElement("w:instrText")
            instr.set(qn("xml:space"), "preserve")
            instr.text = text
            run._r.append(instr)
        else:
            run.text = "Table of contents: open in Word and press F9 to refresh if this line is visible."
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    for sid, heading, level, has_sub in SECTIONS:
        sec = content["sections"][sid]
        doc.add_heading(heading, level=level)
        render(sec.get("blocks", []) or [])
        if has_sub:
            for key, label in SUBSECTIONS:
                doc.add_heading(label, level=4)
                render(sec[key])

    props = doc.core_properties
    props.title = f"Test Plan - {content['feature_name']}"
    props.author = content.get("author", "")
    doc.save(str(path))


def request_toc_refresh(path):
    """Ask Word to refresh fields (the TOC) when the file is opened."""
    import zipfile
    tmp = path.with_suffix(".tmp")
    with zipfile.ZipFile(path) as src, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename == "word/settings.xml" and b"w:updateFields" not in data:
                data = data.replace(b"</w:settings>", b'<w:updateFields w:val="true"/></w:settings>')
            dst.writestr(item, data)
    os.replace(tmp, path)


# --------------------------------------------------------------------------- PDF

def pdf_via_word(docx_path, pdf_path):
    import pythoncom
    import win32com.client

    pythoncom.CoInitialize()
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    doc = None
    try:
        doc = word.Documents.Open(str(docx_path), ReadOnly=False, AddToRecentFiles=False)
        for toc in doc.TablesOfContents:
            toc.Update()
        doc.Save()
        doc.ExportAsFixedFormat(OutputFileName=str(pdf_path), ExportFormat=17, CreateBookmarks=1)
    finally:
        if doc is not None:
            doc.Close(False)
        word.Quit()
        pythoncom.CoUninitialize()


def pdf_via_reportlab(content, pdf_path):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                    TableStyle)

    font, bold_font = "Helvetica", "Helvetica-Bold"
    for regular, bold in (("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
                          ("/Library/Fonts/Arial.ttf", "/Library/Fonts/Arial Bold.ttf"),
                          ("/usr/share/fonts/truetype/msttcorefonts/Arial.ttf",
                           "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf")):
        if os.path.exists(regular) and os.path.exists(bold):
            pdfmetrics.registerFont(TTFont("TPArial", regular))
            pdfmetrics.registerFont(TTFont("TPArial-Bold", bold))
            pdfmetrics.registerFontFamily("TPArial", normal="TPArial", bold="TPArial-Bold")
            font, bold_font = "TPArial", "TPArial-Bold"
            break

    body = ParagraphStyle("body", fontName=font, fontSize=11, leading=15, spaceAfter=4)
    heads = {
        1: ParagraphStyle("h1", fontName=bold_font, fontSize=20, leading=26, spaceAfter=10),
        2: ParagraphStyle("h2", fontName=font, fontSize=16, leading=22, spaceBefore=12, spaceAfter=6),
        3: ParagraphStyle("h3", fontName=font, fontSize=14, leading=19, spaceBefore=10, spaceAfter=4,
                          textColor=colors.HexColor("#434343")),
        4: ParagraphStyle("h4", fontName=font, fontSize=12, leading=16, spaceBefore=8, spaceAfter=4,
                          textColor=colors.HexColor("#666666")),
    }

    def markup(text, bold=False):
        out = "".join(f"<b>{escape(c)}</b>" if b else escape(c) for c, b in split_bold(text))
        return f"<b>{out}</b>" if bold else out

    story = [Paragraph("Test Plan", heads[1])]
    for _sid, heading, level, has_sub in SECTIONS:
        indent = {2: 0, 3: 12, 4: 24}[level]
        story.append(Paragraph(escape(heading), ParagraphStyle(f"toc{level}", parent=body, leftIndent=indent)))
        if has_sub:
            for _key, label in SUBSECTIONS:
                story.append(Paragraph(escape(label), ParagraphStyle("toc5", parent=body, leftIndent=36)))
    story.append(PageBreak())

    def bullets(items, depth=0, numbered=False):
        marks = ["•", "o", "▪"]
        for n, item in enumerate(items, 1):
            text, children = item_parts(item)
            mark = f"{n}." if numbered and depth == 0 else marks[min(depth, 2)]
            style = ParagraphStyle("b", parent=body, leftIndent=18 + 20 * depth, firstLineIndent=-12)
            story.append(Paragraph(f"{escape(mark)} {markup(text)}", style))
            if children:
                bullets(children, depth + 1)

    def render(blocks):
        for block in blocks:
            kind = block["type"]
            if kind == "paragraph":
                story.append(Paragraph(markup(block["text"]), body))
            elif kind == "label":
                story.append(Paragraph(markup(block["text"], bold=True), body))
            elif kind == "bullets":
                bullets(block["items"])
            elif kind == "numbered":
                bullets(block["items"], numbered=True)
            elif kind == "table":
                data = [[Paragraph(markup(str(h), bold=True), body) for h in block["headers"]]]
                data += [[Paragraph(markup(str(c)), body) for c in row] for row in block.get("rows", [])]
                width = 6.3 * inch / len(block["headers"])
                t = Table(data, colWidths=[width] * len(block["headers"]), repeatRows=1)
                t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                                       ("VALIGN", (0, 0), (-1, -1), "TOP")]))
                story.extend([t, Spacer(1, 8)])
            elif kind == "image":
                img = Image(block["_resolved_path"])
                scale = min(1.0, 6.0 * inch / img.drawWidth)
                img.drawWidth *= scale
                img.drawHeight *= scale
                story.append(img)
                if block.get("caption"):
                    story.append(Paragraph(markup(block["caption"]), body))
            elif kind == "insufficient":
                story.append(Paragraph(markup(INSUFFICIENT, bold=True), body))
                story.append(Paragraph(markup(f"Open question: {block['question']}"), body))

    for sid, heading, level, has_sub in SECTIONS:
        sec = content["sections"][sid]
        story.append(Paragraph(escape(heading), heads[level]))
        render(sec.get("blocks", []) or [])
        if has_sub:
            for key, label in SUBSECTIONS:
                story.append(Paragraph(escape(label), heads[4]))
                render(sec[key])

    SimpleDocTemplate(str(pdf_path), pagesize=A4, leftMargin=inch, rightMargin=inch,
                      topMargin=inch, bottomMargin=inch,
                      title=f"Test Plan - {content['feature_name']}").build(story)


# --------------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--content", required=True, help="plan content JSON")
    ap.add_argument("--out-dir", default=".", help="folder for the .docx and .pdf")
    ap.add_argument("--validate-only", action="store_true")
    ap.add_argument("--timestamp", help="override YYYYMMDD_HHMMSS (tests only)")
    args = ap.parse_args()

    content_path = Path(args.content).resolve()
    content = json.loads(content_path.read_text(encoding="utf-8"))
    errors = validate(content, content_path.parent)
    if errors:
        print(json.dumps({"status": "invalid", "errors": errors}, indent=2))
        return 2
    insufficient = sum(1 for b in iter_blocks(content) if b["type"] == "insufficient")
    if args.validate_only:
        print(json.dumps({"status": "valid", "sections": len(SECTIONS), "insufficient_blocks": insufficient}))
        return 0

    stamp = args.timestamp or dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"STP_{content['feature_name']}_{stamp}"
    docx_path, pdf_path = out_dir / f"{stem}.docx", out_dir / f"{stem}.pdf"

    try:
        build_docx(copy.deepcopy(content), docx_path)
        engine = None
        try:
            pdf_via_word(docx_path, pdf_path)
            engine = "Microsoft Word (exact copy of the .docx)"
        except Exception as word_error:  # Word missing, not Windows, or COM failure
            request_toc_refresh(docx_path)
            pdf_via_reportlab(content, pdf_path)
            engine = f"ReportLab fallback (Word unavailable: {type(word_error).__name__})"
    except Exception as error:
        print(json.dumps({"status": "error", "error": f"{type(error).__name__}: {error}"}))
        return 3

    print(json.dumps({"status": "ok", "docx": str(docx_path), "pdf": str(pdf_path), "pdf_engine": engine,
                      "sections": len(SECTIONS), "insufficient_blocks": insufficient}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
