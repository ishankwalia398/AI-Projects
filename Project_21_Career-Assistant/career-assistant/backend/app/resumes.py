import io
import re
from datetime import date

from docx import Document
from pypdf import PdfReader

PARSER_VERSION = 3
SECTION_ALIASES = {
    'professional experience': 'experience', 'work experience': 'experience', 'employment': 'experience',
    'core skills': 'skills', 'technical skills': 'skills', 'certifications & training': 'certifications',
    'certifications and training': 'certifications', 'awards & recognition': 'achievements',
    'awards and recognition': 'achievements', 'professional summary': 'summary',
}


def resume_sections(markdown):
    sections, current = {}, 'header'
    for raw in markdown.splitlines():
        heading = raw.strip().lstrip('#').strip().rstrip(':').casefold()
        heading = SECTION_ALIASES.get(heading, heading)
        if heading in {'experience', 'education', 'skills', 'certifications', 'achievements', 'projects', 'summary', 'training'}:
            current = heading
        elif raw.strip():
            sections.setdefault(current, []).append(raw.strip())
    return sections


def _employment_facts(lines):
    # Only normalize explicit numeric month/year ranges; do not guess dates.
    dates = re.compile(r'(?P<start>(?:0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}|(?:19|20)\d{2}-(?:0[1-9]|1[0-2]))\s*[^\w/]*\s*(?P<end>Present|Current|Now|(?:0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}|(?:19|20)\d{2}-(?:0[1-9]|1[0-2]))\b', re.I)
    def iso(value):
        if value.casefold() in {'present', 'current', 'now'}:
            return 'present'
        pieces = re.split(r'[/.-]', value)
        return value if len(pieces[0]) == 4 else pieces[1]+'-'+pieces[0].zfill(2)
    roles = []
    for index, line in enumerate(lines):
        found = dates.search(line)
        if not found:
            continue
        before = line[:found.start()].strip(' |,;-\u2013\u2014')
        nearby = lines[max(0, index-1):index+2]
        title = _designation_from_header([before] + lines[index+1:index+2] + lines[max(0, index-1):index])
        employer = before if before and not _ROLE_WORDS.search(before) else ''
        if not employer and index > 0 and not _ROLE_WORDS.search(lines[index-1]) and not dates.search(lines[index-1]):
            employer = lines[index-1]
        if not title:
            continue
        # Keep exactly sourced text alongside normalized dates for review.
        roles.append({'employer': employer, 'title': title, 'start': iso(found['start']), 'end': iso(found['end']), 'quote': '\n'.join(nearby)})
    return roles


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
        # Contact details are often placed in Word headers or footers.
        headers, footers = [], []
        for section in doc.sections:
            for part, destination in ((section.header, headers), (section.first_page_header, headers),
                                      (section.footer, footers), (section.first_page_footer, footers)):
                destination.extend(p.text for p in part.paragraphs if p.text.strip())
                for table in part.tables:
                    destination.extend(' | '.join(cell.text for cell in row.cells) for row in table.rows)
        text = '\n'.join(dict.fromkeys(headers)) + '\n' + '\n'.join(lines) + '\n' + '\n'.join(dict.fromkeys(footers))
    text = text.replace('\x00', '').strip()
    if len(text) < 30:
        raise ValueError('Not enough readable text. Scanned PDFs require OCR; upload a text-based PDF or DOCX.')
    if len(text) > 150000:
        raise ValueError('Resume text is too long.')
    headings = {'experience', 'work experience', 'professional experience', 'education', 'skills', 'technical skills', 'projects', 'certifications', 'summary', 'professional summary', 'training', *SECTION_ALIASES}
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


MANDATORY_FIELDS = ['name', 'email', 'location', 'designation', 'skills']


_SECTION_NAMES = {
    'experience', 'work experience', 'professional experience', 'education', 'skills',
    'technical skills', 'projects', 'certifications', 'summary', 'professional summary',
    'training', 'employment', 'publications', 'languages', 'references',
}
_HEADER_SEPARATOR = re.compile(r'\s*[|\u2022\u00b7\t]\s*| {3,}')


def _header_parts(lines):
    return [part.strip(' ,;:-') for line in lines for part in _HEADER_SEPARATOR.split(line) if part.strip(' ,;:-')]
_ROLE_WORDS = re.compile(
    r'\b(engineer|developer|programmer|architect|analyst|manager|designer|'
    r'scientist|consultant|specialist|administrator|lead|director|intern|'
    r'tester|recruiter|researcher|student|product owner|qa|quality assurance|devops|data|security)\b',
    re.I,
)
_LOCATION_WORDS = re.compile(
    r'\b(India|United States|USA|Canada|Australia|New Zealand|Germany|Netherlands|'
    r'United Kingdom|UK|France|Ireland|Switzerland|Singapore|Japan|Austria|Spain|'
    r'Bengaluru|Bangalore|Hyderabad|Pune|Mumbai|Chennai|Gurugram|Gurgaon|Noida|'
    r'New Delhi|Kolkata|Delhi|London|Berlin|Amsterdam|Toronto|Vancouver|'
    r'New York|San Francisco|Seattle|Austin|Boston|Chicago|Melbourne|Sydney)\b',
    re.I,
)
_LOCATION_SUFFIXES = {
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
    'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
    'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
    'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina',
    'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island',
    'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont',
    'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming',
    'karnataka', 'maharashtra', 'telangana', 'tamil nadu', 'uttar pradesh',
    'west bengal', 'kerala', 'gujarat', 'rajasthan', 'haryana', 'punjab',
    'goa', 'andhra pradesh', 'odisha', 'assam', 'ontario', 'quebec',
    'british columbia', 'alberta', 'manitoba', 'nova scotia',
}


def _header_lines(markdown):
    lines = []
    for raw_line in markdown.splitlines():
        line = re.sub(r'^\s{0,3}#{1,6}\s*', '', raw_line).strip()
        if not line:
            continue
        if line.casefold().rstrip(':') in _SECTION_NAMES:
            break
        if len(lines) >= 18:
            break
        lines.append(line)
    return lines


def _name_from_header(lines):
    ignored = {'resume', 'curriculum vitae', 'cv', 'profile', 'contact', 'contact details', 'personal details', 'candidate profile'}
    for part in _header_parts(lines):
        candidate = re.sub(r'(?i)^(?:candidate\s+|full\s+)?name\s*[:\-]\s*', '', part)
        words = candidate.split()
        if (
            candidate.casefold() in ignored
            or len(words) < 2
            or len(words) > 5
            or re.search(r'[\d@:/\\]', candidate)
            or _ROLE_WORDS.search(candidate)
            or _LOCATION_WORDS.search(candidate)
            or candidate.casefold().rstrip(':') in _SECTION_NAMES
            or not all(word[0].isalpha() and all(c.isalpha() or c in "'.-" for c in word) for word in words)
        ):
            continue
        return candidate
    return ''


def _designation_from_header(lines):
    for line in _header_parts(lines):
        labeled = re.match(r'(?i)(?:current\s+)?(?:designation|job\s+title|title|role|position)\s*[:\-]\s*(.+)', line)
        if labeled and _ROLE_WORDS.search(labeled.group(1)):
            return labeled.group(1).strip()
    for line in _header_parts(lines):
        if _ROLE_WORDS.search(line) and not re.search(r'@|https?://|\b\d{3,}\b', line):
            return line.strip(' ,;:-')
    return ''


def _location_from_header(lines):
    for line in _header_parts(lines):
        labeled = re.match(r'(?i)(?:current\s+)?(?:location|based\s+in|address)\s*[:\-]\s*(.+)', line)
        if labeled:
            return labeled.group(1).strip()
    for line in lines:
        for part in _header_parts([line]):
            candidate = part.strip(' ,;:-')
            if _LOCATION_WORDS.search(candidate) and not (_ROLE_WORDS.search(candidate) or re.search(r'@|https?://', candidate)):
                return candidate
            components = [value.strip() for value in candidate.split(',')]
            if len(components) >= 2 and (
                components[-1].casefold() in _LOCATION_SUFFIXES
                or re.fullmatch(r'[A-Z]{2}', components[-1])
            ):
                return candidate
    return ''


def check_missing_mandatory_fields(profile):
    """Return a list of mandatory field names that are missing or empty."""
    missing = []
    for f in MANDATORY_FIELDS:
        val = profile.get(f)
        if val is None:
            missing.append(f)
        elif isinstance(val, (list, tuple, set)) and len(val) == 0:
            missing.append(f)
        elif isinstance(val, str) and not val.strip():
            missing.append(f)
    return missing


def bootstrap_profile(markdown):
    sections = resume_sections(markdown)
    header = _header_lines(markdown)
    email = re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', markdown)
    skills = [s for s in SKILLS if re.search(r'(?<!\w)'+re.escape(s)+r'(?!\w)', markdown, re.I)]
    designation = _designation_from_header(header)
    if not designation:
        # A title may live in the work-history section rather than the contact header.
        for section in re.split(r'(?m)(?=^#{1,3} )', markdown):
            heading = section.splitlines()[0].lstrip('# ').strip(':').casefold() if section.splitlines() else ''
            if heading in {'experience', 'work experience', 'professional experience', 'employment'}:
                role_lines = [line.strip() for line in section.splitlines()[1:] if line.strip()]
                current = next((i for i, line in enumerate(role_lines) if re.search(r'\b(present|current|now)\b', line, re.I)), None)
                if current is not None:
                    candidates = role_lines[max(0, current-2):current+2]
                    candidates = [re.sub(r'\s*[(|,\u2013\u2014-]*\s*\b(?:19|20)\d{2}.*$', '', line) for line in candidates]
                    designation = _designation_from_header(candidates)
                break
    employments = _employment_facts(sections.get('experience', []))
    if not designation:
        designation = next((role['title'] for role in employments if role['end'] == 'present'), '')
    phone = re.search(r'(?<!\w)(?:\+\d{1,3}[- .]?)?(?:\(?\d{3,5}\)?[- .]?)\d{3}[- .]?\d{4}(?!\w)', '\n'.join(header))
    linkedin = re.search(r'https?://(?:www\.)?linkedin\.com/[^\s|]+', markdown, re.I)
    return {'name':_name_from_header(header), 'email':email.group() if email else '', 'phone':phone.group() if phone else '', 'linkedin':linkedin.group() if linkedin else '', 'portfolio':'',
            'location':_location_from_header(header), 'designation':designation, 'skills':skills,
            'employments':employments, 'education':sections.get('education', []),
            'certifications':sections.get('certifications', []) + sections.get('training', []),
            'projects':sections.get('projects', []), 'achievements':sections.get('achievements', []),
            'notice_period':'', 'salary_expectations':'', 'relocation_confirmed':False,
            'approved':False, 'classification':'User-provided', 'unknowns':['Review extracted fields; missing or ambiguous details need manual completion.'],
            'source_markdown':markdown, 'extraction_version':PARSER_VERSION}


def extract_profile(markdown):
    """Optional evidence-constrained AI extraction; unsupported values are rejected."""
    from .ai import json_call
    import json
    base=bootstrap_profile(markdown)
    prompt={'task':'Extract candidate facts from the resume. Prioritize the contact/header section: candidate name from the name line, current designation from the role/title near the name, and location from the contact details. Every value and its supporting quote MUST be exact substrings of the supplied resume, without rewriting. Do not infer or guess missing names, dates, locations, or titles. Use an empty value when not explicitly supported. Employment dates must be ISO YYYY-MM only if literally present, otherwise leave them empty for user review.','schema':{'facts':[{'field':'name|email|location|designation|skills|education|certifications|projects|achievements','value':'exact source text','quote':'supporting exact source text'}],'employments':[{'employer':'exact text','title':'exact text','start':'ISO date present in source or empty','end':'ISO date present in source or empty','quote':'exact source text'}]},'resume_data':markdown}
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
    data,model,usage=json_call(json.dumps(prompt),validation,purpose='extraction')
    single={'name','email','location','designation'}
    multi={'skills','education','certifications','projects','achievements'}
    for fact in data['facts']:
        field=fact.get('field')
        if field in single and not base[field]:base[field]=fact['value']
        if field in multi and fact['value'] not in base[field]:base[field].append(fact['value'])
    if data['employments']:
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
