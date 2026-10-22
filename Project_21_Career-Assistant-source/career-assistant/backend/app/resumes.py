import io
import re
from datetime import date

from docx import Document
from pypdf import PdfReader


def extract(name, blob):
    if name.lower().endswith('.pdf'):
        reader = PdfReader(io.BytesIO(blob), strict=False)
        if reader.is_encrypted or len(reader.pages) > 40:
            raise ValueError('Encrypted PDFs and resumes over 40 pages are unsupported.')
        text = '\n\n'.join(p.extract_text(extraction_mode='layout') or '' for p in reader.pages)
    else:
        doc = Document(io.BytesIO(blob))
        lines = []
        # Preserve document order, including table cells.
        from docx.table import Table
        from docx.text.paragraph import Paragraph
        for element in doc.element.body:
            if element.tag.endswith('}p'):
                p = Paragraph(element, doc)
                lines.append(('# ' if p.style.name.startswith('Heading') else '') + p.text)
            elif element.tag.endswith('}tbl'):
                for row in Table(element, doc).rows:
                    lines.append(' | '.join(cell.text for cell in row.cells))
        text = '\n'.join(lines)
    text = text.replace('\x00', '').strip()
    if len(text) < 30:
        raise ValueError('Not enough readable text. Scanned PDFs require OCR; upload a text-based PDF or DOCX.')
    if len(text) > 150000:
        raise ValueError('Resume text is too long.')
    headings = {'experience', 'work experience', 'professional experience', 'education', 'skills', 'technical skills', 'projects', 'certifications', 'summary', 'professional summary', 'training'}
    markdown = '\n'.join('## '+line.strip() if line.strip().lower() in headings else line for line in text.splitlines())
    return markdown


def chunk(markdown, target=650):
    # Section boundaries preserve roles, dates and achievements together. An oversized
    # section is kept intact rather than splitting an employer from its history.
    sections = re.split(r'(?m)(?=^#{1,3} )', markdown)
    chunks, current = [], ''
    for section in sections:
        if not section.strip():
            continue
        if current.strip() and len((current + section).split()) > target:
            chunks.append(current.strip())
            current = ''
        current += section + '\n'
    if current.strip():
        chunks.append(current.strip())
    return chunks


SKILLS = ['Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'FastAPI', 'SQL', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Playwright', 'Selenium', 'Cypress', 'REST', 'GraphQL', 'Jenkins', 'Git', 'Linux', 'RAG', 'LangChain', 'LangGraph', 'CrewAI', 'Qdrant', 'Agile', 'Scrum', 'Leadership', 'Testing', 'Node.js', 'C++', 'C#', '.NET', 'Go', 'Rust', 'Redis', 'Kafka', 'MongoDB']


def bootstrap_profile(markdown):
    # No guessed name, employer, title or dates. User reviews fields; AI extraction is optional.
    email = re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', markdown)
    skills = [s for s in SKILLS if re.search(r'(?<!\w)'+re.escape(s)+r'(?!\w)', markdown, re.I)]
    return {'name':'', 'email':email.group() if email else '', 'phone':'', 'linkedin':'', 'portfolio':'', 'location':'', 'designation':'', 'skills':skills,
            'employments':[], 'education':[], 'certifications':[], 'projects':[], 'achievements':[],
            'notice_period':'', 'salary_expectations':'', 'relocation_confirmed':False,
            'approved':False, 'classification':'User-provided', 'unknowns':['Name, employment dates and profile fields need review.'],
            'source_markdown':markdown}


def extract_profile(markdown):
    """Optional evidence-constrained AI extraction; unsupported values are rejected."""
    from .ai import json_call
    import json
    base=bootstrap_profile(markdown)
    prompt={'task':'Extract candidate facts. Every value and its supporting quote MUST be exact substrings of the supplied resume, without rewriting. Do not infer names, dates or titles. Empty arrays for missing facts. Employment dates must be ISO YYYY-MM only if literally present, otherwise omit them for user review.','schema':{'facts':[{'field':'name|email|location|designation|skills|education|certifications|projects|achievements','value':'exact source text','quote':'supporting exact source text'}],'employments':[{'employer':'exact text','title':'exact text','start':'ISO date present in source or empty','end':'ISO date present in source or empty','quote':'exact source text'}]},'resume_data':markdown}
    def validation(data):
        if not isinstance(data.get('facts'),list) or not isinstance(data.get('employments'),list):
            raise ValueError('Profile extraction format was invalid.')
        for fact in data['facts']:
            if fact.get('quote','') not in markdown or not fact.get('value') or fact['value'] not in fact['quote']:
                raise ValueError('Profile extraction contains unsupported facts.')
        for employment in data['employments']:
            quote=employment.get('quote','')
            if not quote or quote not in markdown:
                raise ValueError('Employment is missing source evidence.')
            if any(employment.get(k) and employment[k] not in quote for k in ['employer','title','start','end']):
                raise ValueError('Employment field is not supported by its quote.')
    data,model,usage=json_call(json.dumps(prompt),validation)
    single={'name','email','location','designation'}
    multi={'skills','education','certifications','projects','achievements'}
    for fact in data['facts']:
        field=fact.get('field')
        if field in single and not base[field]:base[field]=fact['value']
        if field in multi and fact['value'] not in base[field]:base[field].append(fact['value'])
    base['employments']=data['employments']
    base['evidence']=data['facts']
    base['extraction_model']=model
    base['extraction_usage']=usage
    base['unknowns']=['Review all extracted facts. Incomplete employment dates need user confirmation.']
    return base


def experience_months(employments, today=None):
    today = today or date.today()
    intervals, incomplete = [], []
    for e in employments:
        try:
            start = date.fromisoformat(e['start']+'-01') if len(e['start']) == 7 else date.fromisoformat(e['start'])
            end_text = e.get('end', '')
            end = today if not end_text or end_text.lower() in ('present', 'current') else date.fromisoformat(end_text+'-01' if len(end_text)==7 else end_text)
            if start > end or start > today:
                raise ValueError()
            end = min(end, today)
            intervals.append((start.year*12+start.month, end.year*12+end.month))
        except (ValueError, KeyError, TypeError):
            incomplete.append(e)
    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return {'months':sum(end-start for start,end in merged), 'incomplete_roles':len(incomplete), 'precision':'month', 'as_of':today.isoformat()}


def experience_summary(employments,today=None):
    total=experience_months(employments,today)
    domains,technologies={},{}
    for employment in employments:
        domain=employment.get('domain')
        if isinstance(domain,str) and domain.strip():domains.setdefault(domain.strip(),[]).append(employment)
        tech=employment.get('technologies',[])
        if isinstance(tech,list):
            for name in tech:
                if isinstance(name,str) and name.strip():technologies.setdefault(name.strip(),[]).append(employment)
    return {**total,'by_domain':{k:experience_months(v,today) for k,v in domains.items()},'by_technology':{k:experience_months(v,today) for k,v in technologies.items()},'attribution':'User-provided role domains/technologies; no inferred duration for untagged roles.'}
