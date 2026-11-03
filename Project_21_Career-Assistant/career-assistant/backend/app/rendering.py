import io
import re
import zipfile
import os
import shutil
import subprocess
import tempfile
from html import escape
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate, Spacer


def latex_escape(text):
    mapping={'\\':r'\textbackslash{}','&':r'\&','%':r'\%','$':r'\$','#':r'\#','_':r'\_','{':r'\{','}':r'\}','~':r'\textasciitilde{}','^':r'\textasciicircum{}'}
    return ''.join(mapping.get(c,c) for c in text)


def render(data,format):
    if data.get('letter'):
        # Letters are continuous prose: drop the internal paragraph labels.
        data={**data,'sections':[{**s,'heading':''} for s in data['sections']]}
    if format in {'pdf','docx'} and os.getenv('DOCUMENT_RENDERER','native') == 'latex':
        return render_latex(data,format)
    if format=='zip':
        buf=io.BytesIO()
        with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as z:
            for f in ['docx','pdf','tex']:
                z.writestr('document.'+f,render(data,f))
        return buf.getvalue()
    if format=='tex':
        lines=[r'\documentclass[11pt]{article}',r'\usepackage[margin=0.8in]{geometry}',r'\usepackage[T1]{fontenc}',r'\usepackage[utf8]{inputenc}',r'\begin{document}',r'\section*{'+latex_escape(data.get('title','Career Assistant'))+'}']
        for s in data['sections']:
            if s['heading']:
                lines.append(r'\subsection*{'+latex_escape(s['heading'])+'}')
            lines.extend([latex_escape(s['text']).replace('\n',r'\par '+'\n'),r'\par'])
        return ('\n'.join(lines)+r'\end{document}').encode('utf-8')
    buf=io.BytesIO()
    if format=='docx':
        doc=Document()
        sec=doc.sections[0]
        sec.top_margin=sec.bottom_margin=Inches(.75)
        doc.styles['Normal'].font.name='Calibri'
        doc.styles['Normal'].font.size=Pt(10.5)
        doc.add_heading(data.get('title','Career Assistant'),0)
        for s in data['sections']:
            if s['heading']:
                doc.add_heading(s['heading'],1)
            for line in s['text'].splitlines():
                doc.add_paragraph(line)
        doc.save(buf)
    elif format=='pdf':
        styles=getSampleStyleSheet()
        styles['Normal'].leading=15
        styles['Normal'].spaceAfter=7
        styles['Heading1'].fontSize=15
        styles['Heading1'].textColor=colors.HexColor('#27364c')
        # Prefer Unicode TrueType fonts on Windows/Linux when installed.
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        fonts=[Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),Path('C:/Windows/Fonts/arial.ttf')]
        font=next((p for p in fonts if p.exists()),None)
        if font:
            if 'CareerUnicode' not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont('CareerUnicode',str(font)))
            for name in ['Normal','Title','Heading1']:
                styles[name].fontName='CareerUnicode'
        story=[Paragraph(escape(data.get('title','Career Assistant')),styles['Title']),Spacer(1,16)]
        for s in data['sections']:
            if s['heading']:
                story.append(Paragraph(escape(s['heading']),styles['Heading1']))
            for line in s['text'].splitlines():
                story.append(Paragraph(escape(line) or ' ',styles['Normal']))
        def footer(canvas,doc):
            canvas.setFont('Helvetica',8)
            canvas.setFillColor(colors.grey)
            canvas.drawRightString(550,25,str(doc.page))
        SimpleDocTemplate(buf,rightMargin=48,leftMargin=48,topMargin=42,bottomMargin=42).build(story,onFirstPage=footer,onLaterPages=footer)
    else:
        raise ValueError('Supported formats: docx, pdf, tex, zip.')
    return buf.getvalue()


def render_application_document(data, kind, format):
    """Final resume/letter files: LaTeX source, PDF compiled from it, and Word converted from it."""
    from .latex_documents import document_latex
    source = document_latex(data, kind)
    if format == 'tex':
        return source.encode('utf-8')
    if latex_tools_available(format):
        try:
            return render_latex(data, format, source)
        except ValueError:
            # A missing or failing TeX toolchain must never block the download.
            import logging
            logging.getLogger(__name__).warning('LaTeX %s conversion failed; using the built-in renderer.', format)
    return render_native_document(data, kind, format)


def render_native_document(data, kind, format):
    """Same content and layout as the LaTeX, for machines without a LaTeX toolchain."""
    bullet = re.compile(r'^\s*(?:[-*•–]\s+|\d+[.)]\s+)')
    name = data.get('name') or 'Candidate'
    contact = ' | '.join(str(c) for c in (data.get('contact') or []) if str(c).strip())
    letter = kind != 'resume'
    buf = io.BytesIO()
    if format == 'docx':
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        doc = Document()
        sec = doc.sections[0]
        sec.top_margin = sec.bottom_margin = sec.left_margin = sec.right_margin = Inches(.75)
        doc.styles['Normal'].font.name = 'Calibri'
        doc.styles['Normal'].font.size = Pt(10.5)
        title = doc.add_paragraph(); title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = title.add_run(name); run.bold = True; run.font.size = Pt(18)
        if contact:
            line = doc.add_paragraph(contact); line.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for s in data['sections']:
            if not letter:
                doc.add_heading(s['heading'], 2)
            for raw in s['text'].splitlines():
                if not raw.strip():
                    continue
                if bullet.match(raw):
                    doc.add_paragraph(bullet.sub('', raw).strip(), style='List Bullet')
                else:
                    paragraph = doc.add_paragraph(raw.strip().replace(' | ', '  |  '))
                    if not letter and ' | ' in raw:
                        paragraph.runs[0].bold = True
        doc.save(buf)
        return buf.getvalue()
    if format != 'pdf':
        raise ValueError('Supported formats: docx, pdf, tex.')
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import HRFlowable, ListFlowable, ListItem
    styles = getSampleStyleSheet()
    body = ParagraphStyle('body', parent=styles['Normal'], fontSize=10.5, leading=14, spaceAfter=8 if letter else 3)
    heading = ParagraphStyle('heading', parent=styles['Heading2'], fontSize=12.5, spaceBefore=10, spaceAfter=2, textColor=colors.black)
    title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=19, spaceAfter=4)
    centred = ParagraphStyle('centred', parent=body, alignment=TA_CENTER, spaceAfter=10)
    story = [Paragraph(escape(name), title_style)]
    if contact:
        story.append(Paragraph(escape(contact), centred))
    for s in data['sections']:
        if not letter:
            story += [Paragraph(escape(s['heading']), heading), HRFlowable(width='100%', thickness=0.6, color=colors.black, spaceAfter=4)]
        items = []
        for raw in s['text'].splitlines() + ['']:
            if bullet.match(raw):
                items.append(ListItem(Paragraph(escape(bullet.sub('', raw).strip()), body), leftIndent=12))
                continue
            if items:
                story.append(ListFlowable(items, bulletType='bullet', start='•', leftIndent=12)); items = []
            if raw.strip():
                text = escape(raw.strip())
                story.append(Paragraph('<b>' + text + '</b>' if not letter and ' | ' in raw else text, body))
    SimpleDocTemplate(buf, rightMargin=54, leftMargin=54, topMargin=48, bottomMargin=48).build(story)
    return buf.getvalue()


def converter(name):
    installed=shutil.which(name)
    if installed:
        return installed
    root=Path(__file__).resolve().parents[1]/'.tools'
    matches=list(root.rglob(name+('.exe' if os.name=='nt' else '')))
    return str(matches[0]) if matches else None


def latex_tools_available(format):
    if format=='pdf':
        return bool(converter('xelatex') or converter('pdflatex') or converter('tectonic'))
    return bool(converter('pandoc'))


def render_latex(data, format, source=None):
    """Derive both binary formats from the identical escaped authoritative source."""
    compiler=converter('xelatex') or converter('pdflatex') or converter('tectonic')
    pandoc=converter('pandoc')
    if (format=='pdf' and not compiler) or (format=='docx' and not pandoc):
        raise ValueError('LaTeX export requires MiKTeX/TeX Live and Pandoc on PATH. Install them and restart the app, or set DOCUMENT_RENDERER=native.')
    if source is None:
        source=render(data,'tex')
    elif isinstance(source,str):
        source=source.encode('utf-8')
    with tempfile.TemporaryDirectory(prefix='career-export-') as directory:
        root=Path(directory)
        (root/'document.tex').write_bytes(source)
        args=([compiler,'-no-shell-escape','-interaction=nonstopmode','-halt-on-error','document.tex'] if format=='pdf'
              else [pandoc,'document.tex','--from=latex','--to=docx','--output=document.docx'])
        if format=='pdf' and Path(compiler).stem=='tectonic':
            args=[compiler,'-X','compile','--untrusted','document.tex']
        if format=='docx':
            # Pandoc cannot read the layout-only preamble; the document body carries all the content.
            body=source.decode('utf-8')
            body=re.sub(r'\\ifPDFTeX.*?\\fi|\\titleformat\{[^\n]*|\\titlespacing\*?\{[^\n]*|\\setlist\[[^\n]*','',body,flags=re.S)
            body=body.replace(r'\hfill',' — ').replace(r'\textbar{}','|')
            (root/'document.tex').write_bytes(body.encode('utf-8'))
        try:
            subprocess.run(args,cwd=root,check=True,timeout=180,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        except (subprocess.SubprocessError,OSError) as exc:
            raise ValueError('Document conversion failed. Check the installed LaTeX/Pandoc dependencies; the original text remains saved.') from exc
        result=root/('document.'+format)
        if not result.is_file():
            raise ValueError('Document converter produced no output.')
        return result.read_bytes()
