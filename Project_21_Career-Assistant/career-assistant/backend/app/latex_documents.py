"""Standalone, ATS-friendly LaTeX for resumes and letters.

The generated source compiles in any standard LaTeX editor (Overleaf, TeXstudio, MiKTeX)
with only core packages, and is the single source for the PDF and Word downloads.
"""
import re
from datetime import date

from .rendering import latex_escape

PREAMBLE = r'''\documentclass[10.5pt,a4paper]{article}
\usepackage[a4paper,margin=0.75in]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage[hidelinks]{hyperref}
\usepackage{xcolor}
\usepackage{iftex}
\ifPDFTeX
  \input{glyphtounicode}
  \pdfgentounicode=1
\fi
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\vspace{-4pt}\titlerule]
\titlespacing*{\section}{0pt}{10pt}{6pt}
\setlist[itemize]{leftmargin=1.4em,itemsep=2pt,topsep=2pt,parsep=0pt}
'''

BULLET = re.compile(r'^\s*(?:[-*•–]\s+|\d+[.)]\s+)')
ROLE = re.compile(r'^([^|]+?)\s*\|\s*(.+)$')
DATES = re.compile(r'((?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4}|\d{1,2}/\d{4})\s*[–—-]\s*'
                   r'((?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?\d{4}|\d{1,2}/\d{4}|present|current|now)', re.I)


def _esc(text):
    return latex_escape(str(text or '').strip())


def _link(item):
    value = str(item).strip()
    if re.fullmatch(r'[\w.+-]+@[\w-]+\.[\w.-]+', value):
        return r'\href{mailto:' + value + '}{' + _esc(value) + '}'
    if re.match(r'(https?://|www\.|linkedin\.com|github\.com)', value, re.I):
        url = value if value.lower().startswith('http') else 'https://' + value
        return r'\href{' + url.replace('%', r'\%').replace('#', r'\#') + '}{' + _esc(value) + '}'
    return _esc(value)


def _header(data):
    name = _esc(data.get('name')) or 'Candidate'
    contact = [c for c in (data.get('contact') or []) if str(c).strip()]
    lines = [r'\begin{center}', r'{\LARGE\bfseries ' + name + r'}\\[3pt]']
    if contact:
        lines.append(r'\small ' + r' \textbar{} '.join(_link(c) for c in contact))
    lines.append(r'\end{center}')
    return lines


def _body_lines(text):
    """Turn section text into LaTeX: bullet runs become itemize lists, role lines get dates right-aligned."""
    out, items = [], []
    def flush():
        if items:
            out.append(r'\begin{itemize}')
            out.extend(r'\item ' + item for item in items)
            out.append(r'\end{itemize}')
            items.clear()
    for raw in str(text).splitlines():
        line = raw.strip()
        if not line:
            flush()
            continue
        if BULLET.match(line):
            items.append(_esc(BULLET.sub('', line)))
            continue
        flush()
        role = ROLE.match(line)
        if role and '|' in line:
            parts = [p.strip() for p in line.split('|') if p.strip()]
            dated = next((p for p in parts if DATES.search(p)), '')
            rest = [p for p in parts if p != dated]
            head = r'\textbf{' + _esc(rest[0]) + '}' + (r' \textbar{} ' + r' \textbar{} '.join(_esc(p) for p in rest[1:]) if rest[1:] else '')
            out.append(head + (r' \hfill ' + _esc(dated) if dated else '') + r'\\')
            continue
        if ':' in line and line.index(':') < 40:
            label, value = line.split(':', 1)
            out.append(r'\textbf{' + _esc(label) + ':} ' + _esc(value) + r'\\')
            continue
        out.append(_esc(line) + r'\par\smallskip')
    flush()
    return out


def resume_latex(data):
    lines = [PREAMBLE, r'\begin{document}', *_header(data)]
    for section in data.get('sections', []):
        lines.append(r'\section*{' + _esc(section['heading']) + '}')
        lines.extend(_body_lines(section['text']))
    lines.append(r'\end{document}')
    return '\n'.join(lines) + '\n'


def letter_latex(data):
    lines = [PREAMBLE.replace(r'\setlength{\parskip}{0pt}', r'\setlength{\parskip}{9pt}'), r'\begin{document}', *_header(data),
             r'\vspace{6pt}', date.today().strftime('%d %B %Y').lstrip('0') + r'\par']
    for section in data.get('sections', []):
        lines.extend(_body_lines(section['text']))
    lines.append(r'\end{document}')
    return '\n'.join(lines) + '\n'


def document_latex(data, kind):
    return resume_latex(data) if kind == 'resume' else letter_latex(data)
