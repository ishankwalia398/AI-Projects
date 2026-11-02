import html
import http.client
import ipaddress
import json
import re
import socket
import ssl
from datetime import timedelta
from html.parser import HTMLParser
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

import httpx

from .config import DEFAULT_GREENHOUSE_BOARDS, DOMESTIC_JOB_LIMIT, EXTRA_GREENHOUSE_BOARDS, EXTRA_LEVER_SITES, SMARTRECRUITERS_COMPANIES, VISA_JOB_LIMIT, settings
from .db import digest, get_record, now, put, uid
from .resumes import SKILLS, experience_months

STATUSES = ['NOT APPLIED','APPLIED','SCREENING','INTERVIEW','WAITING FOR OFFER','SELECTED','REJECTED']
WEIGHTS = {'mandatory_skills':30,'experience':20,'title':15,'responsibilities':15,'domain':10,'preferred_skills':5,'eligibility':5}


def clean_html(value):
    # Greenhouse returns entity-encoded HTML; decode it so tags can be stripped.
    if '&lt;' in value and '<' not in value:
        value = html.unescape(value)
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', value, flags=re.S|re.I)
    value = re.sub(r'</(?:p|div|li|h[1-6])>', '\n', value, flags=re.I)
    return html.unescape(re.sub('<[^>]+>', ' ', value)).strip()


class _JobPageParser(HTMLParser):
    """Read structured job data and visible page text without navigation/scripts."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hidden = []
        self.structured = []
        self.text = []
        self.json_text = None
        self.main_depth = 0
        self.main_text = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == 'script' and attributes.get('type', '').lower() == 'application/ld+json':
            self.json_text = []
        if tag in {'head', 'script', 'style', 'nav', 'footer', 'noscript', 'svg'}:
            self.hidden.append(tag)
        if tag in {'main', 'article'}:
            self.main_depth += 1
        if tag in {'p', 'div', 'li', 'h1', 'h2', 'h3', 'br', 'section'} and not self.hidden:
            self.handle_data('\n')

    def handle_endtag(self, tag):
        if tag == 'script' and self.json_text is not None:
            try:
                self.structured.append(json.loads(''.join(self.json_text)))
            except (ValueError, TypeError):
                pass
            self.json_text = None
        if tag in self.hidden:
            self.hidden = self.hidden[:self.hidden.index(tag)]
        if tag in {'main', 'article'}:
            self.main_depth = max(0, self.main_depth-1)
        if tag in {'p', 'div', 'li', 'h1', 'h2', 'h3', 'section'} and not self.hidden:
            self.handle_data('\n')

    def handle_data(self, data):
        if self.json_text is not None:
            self.json_text.append(data)
        if not self.hidden:
            self.text.append(data)
            if self.main_depth:
                self.main_text.append(data)


def _job_postings(value):
    if isinstance(value, list):
        for item in value:
            yield from _job_postings(item)
    elif isinstance(value, dict):
        kinds = value.get('@type') or []
        if not isinstance(kinds, (str, list)):
            kinds = []
        if 'JobPosting' in ([kinds] if isinstance(kinds, str) else kinds):
            yield value
        for item in value.values():
            if isinstance(item, (dict, list)):
                yield from _job_postings(item)


def job_page_text(page):
    # Apple/React Router pages may render only a title while shipping the full JD
    # as a JSON string. Decode data only; never evaluate page JavaScript.
    hydration=re.search(r'window\.__staticRouterHydrationData\s*=\s*JSON\.parse\(("(?:\\.|[^"\\])*")\)',page)
    if hydration:
        try:
            state=json.loads(json.loads(hydration.group(1)))
            job=state.get('loaderData',{}).get('jobDetails',{}).get('jobsData',{})
            sections=[]
            for field,label in [('postingTitle','Job title'),('title','Job title'),('jobSummary','Summary'),('description','Description'),('responsibilities','Responsibilities'),('minimumQualifications','Minimum qualifications'),('preferredQualifications','Preferred qualifications')]:
                value=job.get(field)
                if isinstance(value,str) and value.strip():
                    sections.append(label+'\n'+clean_html(value))
            if isinstance(job.get('description'),str) and len(job['description'])>=100:
                return '\n\n'.join(dict.fromkeys(sections))[:60000]
        except (ValueError,TypeError,AttributeError):
            pass
    parser = _JobPageParser()
    parser.feed(page)
    for job in _job_postings(parser.structured):
        description = job.get('description')
        if isinstance(description, str) and len(clean_html(description)) >= 50:
            organization = job.get('hiringOrganization', {})
            company = organization.get('name', '') if isinstance(organization, dict) else ''
            return '\n'.join(str(value) for value in [job.get('title', ''), company, clean_html(description)] if value)[:60000]
    text = ''.join(parser.main_text if len(''.join(parser.main_text).strip()) >= 50 else parser.text)
    return '\n'.join(' '.join(line.split()) for line in text.splitlines() if line.strip())[:60000]


def canonical(url):
    p = urlparse(url)
    return urlunparse((p.scheme.lower(),p.netloc.lower(),p.path.rstrip('/'),'',urlencode(sorted((k,v) for k,v in parse_qsl(p.query) if not k.lower().startswith(('utm_','ref','tracking')))),''))


def _public_url_details(url):
    p = urlparse(url)
    if p.scheme != 'https' or not p.hostname or p.username or p.password or p.port not in (None,443):
        raise ValueError('Use a public HTTPS URL without credentials or custom ports.')
    try:
        ips = {r[4][0] for r in socket.getaddrinfo(p.hostname,443,type=socket.SOCK_STREAM)}
    except socket.gaierror:
        raise ValueError('Hostname could not be resolved.')
    if not ips or any(not ipaddress.ip_address(ip).is_global for ip in ips):
        raise ValueError('Private and local network addresses are not allowed.')
    return p, sorted(ips)


def validate_public_url(url):
    _public_url_details(url)
    return url


def _request_public_https(url):
    parsed, addresses = _public_url_details(url)
    target = parsed.path or '/'
    if parsed.query:
        target += '?' + parsed.query
    last_error = None
    for address in addresses[:2]:
        raw_socket = None
        connection = None
        try:
            raw_socket = socket.create_connection((address, 443), timeout=25)
            tls_socket = ssl.create_default_context().wrap_socket(raw_socket, server_hostname=parsed.hostname)
            connection = http.client.HTTPSConnection(parsed.hostname, 443, timeout=25)
            connection.sock = tls_socket
            connection.request(
                'GET',
                target,
                headers={
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CareerAssistant/1.0',
                    'Accept-Encoding':'identity',
                },
            )
            response = connection.getresponse()
            body = response.read(2_000_001)
            return response.status, dict(response.getheaders()), body
        except (OSError, ssl.SSLError, http.client.HTTPException) as exc:
            last_error = exc
        finally:
            if connection:
                connection.close()
            elif raw_socket:
                raw_socket.close()
    hint = 'The backend cannot access the internet. Restart the app from start.ps1 and check network permissions.' if '10013' in str(last_error) else 'Could not connect to the job website. Check the URL and network connection, then retry.'
    raise ValueError(hint) from last_error


def fetch_jd(url):
    current_url = validate_public_url(url.strip())
    for redirect_count in range(6):
        status, response_headers, data = _request_public_https(current_url)
        if status in (301, 302, 303, 307, 308):
            location = response_headers.get('Location') or response_headers.get('location')
            if not location:
                raise ValueError('The job page redirected without a destination.')
            if redirect_count == 5:
                raise ValueError('The job page redirected too many times.')
            current_url = urljoin(current_url, location)
            continue
        if status >= 400:
            raise ValueError(f'Job page request failed with HTTP status {status}.')
        if len(data) > 2_000_000:
            raise ValueError('Job page is too large.')
        if 'text/html' not in response_headers.get('Content-Type', response_headers.get('content-type', '')):
            raise ValueError('Expected an HTML job page. Please paste the job description text directly.')
        break
    extracted = job_page_text(data.decode('utf-8',errors='replace'))
    if len(extracted.strip()) < 50:
        raise ValueError('This page has no readable job description. It may require sign-in or JavaScript. Paste the job description directly.')
    return extracted


def sponsorship(text):
    evidence = []
    for sentence in re.split(r'(?<=[.!?])\s+|\n',text):
        if re.search(r'(visa|work permit) sponsor|relocation (assistance|support|package)|sponsor.{0,15}(visa|work permit)',sentence,re.I):
            if not re.search(r'\b(no|not|cannot|unable|without|unavailable|do not|does not|will not|may|might|potential|possible|eligible)\b|not available|not offer',sentence,re.I):
                evidence.append(sentence.strip())
    visa = any(re.search(r'visa|work permit',e,re.I) for e in evidence)
    relocation = any('relocation' in e.lower() for e in evidence)
    return {'category':'Both' if visa and relocation else 'Explicit visa sponsorship' if visa else 'Explicit relocation assistance' if relocation else 'No sponsorship identified', 'evidence':evidence, 'verified_at':now().isoformat(), 'classification':'Verified' if evidence else 'Unknown'}


def sponsorship_blocked(text):
    """True when the listing explicitly rules out overseas applicants needing a visa."""
    return bool(re.search(
        r"(?:no|not|unable to|cannot|can't|will not|won't|do not|does not|don't|doesn't)\s+(?:\w+\s+){0,3}(?:offer|provide|support|sponsor)\w*\s+(?:\w+\s+){0,3}(?:visa|sponsorship|work permit)"
        r"|(?:visa|work permit)\s+sponsorship\s+(?:is\s+)?(?:not|unavailable)"
        r"|without\s+(?:the\s+need\s+for\s+)?(?:current\s+or\s+future\s+)?(?:visa\s+)?sponsorship"
        r"|must\s+(?:already\s+)?(?:have|hold|possess)\s+(?:the\s+)?(?:legal\s+)?(?:right|authori[sz]ation|permission)\s+to\s+work",
        text, re.I))


INDIAN_PLACES = r'\bindia\b|\bind\b|bengaluru|bangalore|hyderabad|pune|mumbai|chennai|gurugram|gurgaon|noida|new delhi|\bdelhi\b|kolkata|ahmedabad|kochi|jaipur|indore|coimbatore|chandigarh|trivandrum|thiruvananthapuram|mysuru|mysore|vadodara|nagpur|bhubaneswar|visakhapatnam'
COUNTRIES = ['United States','Canada','Australia','New Zealand','Germany','Netherlands','United Kingdom','France','Ireland','Switzerland','Singapore','Japan','United Arab Emirates','Saudi Arabia','Qatar','Bahrain','Oman','Kuwait','Sweden','Denmark','Poland','Spain','Portugal','Italy','Belgium','Austria','Czech Republic','Czechia','Romania','Hungary','Estonia','Lithuania','Latvia','Luxembourg','Finland','Norway','Malaysia','Hong Kong','South Korea','Thailand','Philippines','Vietnam','Indonesia','Taiwan','Israel','South Africa','Brazil','Mexico','Argentina','Costa Rica','Colombia','Chile','Serbia','Ukraine','Greece','Turkey','Egypt']
CITY_COUNTRIES = {'berlin':'Germany','munich':'Germany','münchen':'Germany','hamburg':'Germany','frankfurt':'Germany','cologne':'Germany','köln':'Germany','stuttgart':'Germany','düsseldorf':'Germany','dusseldorf':'Germany','leipzig':'Germany','amsterdam':'Netherlands','rotterdam':'Netherlands','eindhoven':'Netherlands','utrecht':'Netherlands','the hague':'Netherlands','dublin':'Ireland','cork':'Ireland','london':'United Kingdom','manchester':'United Kingdom','edinburgh':'United Kingdom','cambridge, uk':'United Kingdom','toronto':'Canada','vancouver':'Canada','montreal':'Canada','ottawa':'Canada','calgary':'Canada','sydney':'Australia','melbourne':'Australia','brisbane':'Australia','perth':'Australia','auckland':'New Zealand','wellington':'New Zealand','dubai':'United Arab Emirates','abu dhabi':'United Arab Emirates','riyadh':'Saudi Arabia','jeddah':'Saudi Arabia','doha':'Qatar','warsaw':'Poland','krakow':'Poland','kraków':'Poland','wroclaw':'Poland','stockholm':'Sweden','gothenburg':'Sweden','copenhagen':'Denmark','helsinki':'Finland','oslo':'Norway','paris':'France','lyon':'France','zurich':'Switzerland','zürich':'Switzerland','geneva':'Switzerland','barcelona':'Spain','madrid':'Spain','lisbon':'Portugal','porto':'Portugal','milan':'Italy','rome':'Italy','brussels':'Belgium','vienna':'Austria','prague':'Czech Republic','bucharest':'Romania','budapest':'Hungary','tallinn':'Estonia','vilnius':'Lithuania','kuala lumpur':'Malaysia','tokyo':'Japan','osaka':'Japan','seoul':'South Korea','bangkok':'Thailand','manila':'Philippines','jakarta':'Indonesia','taipei':'Taiwan','tel aviv':'Israel','cape town':'South Africa','johannesburg':'South Africa','são paulo':'Brazil','sao paulo':'Brazil','mexico city':'Mexico'}
COUNTRY_CODES = {'usa':'United States','us':'United States','u.s.':'United States','uk':'United Kingdom','gbr':'United Kingdom','uae':'United Arab Emirates','deu':'Germany','nld':'Netherlands','irl':'Ireland','can':'Canada','aus':'Australia','sgp':'Singapore','jpn':'Japan','fra':'France','esp':'Spain','pol':'Poland','swe':'Sweden','che':'Switzerland'}


def country_from_location(location):
    lower = (location or '').lower()
    if re.search(INDIAN_PLACES, lower):
        return 'India'
    explicit=next((c for c in COUNTRIES if re.search(r'\b'+re.escape(c.lower())+r'\b', lower)), '')
    if explicit:
        return 'Czech Republic' if explicit=='Czechia' else explicit
    for city,country in CITY_COUNTRIES.items():
        if re.search(r'(?<!\w)'+re.escape(city)+r'(?!\w)',lower):
            return country
    for code,country in COUNTRY_CODES.items():
        if re.search(r'(?<![\w.])'+re.escape(code)+r'(?![\w])',lower):
            return country
    # US state suffixes such as "Austin, TX" or "Remote - US".
    if re.search(r',\s*(?:al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)\b', lower):
        return 'United States'
    return ''


GENERIC_TITLE_WORDS={'engineer','engineering','manager','management','lead','director','head','developer','specialist','analyst','senior','junior','staff','principal','technical','technology','software'}
SENIOR_TITLE_WORDS={'senior','lead','manager','head','director','principal','staff'}
ENTRY_TITLE_WORDS={'intern','internship','trainee','apprentice','graduate'}


def _title_tokens(value):
    value=value.lower()
    value=re.sub(r'quality assurance', 'qa', value)
    value=re.sub(r'quality engineer', 'qa engineer', value)
    value=re.sub(r'\b(?:qe|sdet)\b', 'qa engineer', value)
    value=re.sub(r'\b(?:testing|test)\b', 'qa', value)
    value=re.sub(r'\bsr\b', 'senior', value)
    return set(re.findall(r'\w+',value)) - {'the','and','of'}


def title_relevance(title, targets):
    """1.0 for a full title match, 0.5-1.0 when the role's domain words match, else 0."""
    actual=_title_tokens(title)
    best=0.0
    for target in targets:
        expected=_title_tokens(target)
        if not expected:
            continue
        domain=expected-GENERIC_TITLE_WORDS
        if domain and len(actual & domain)/len(domain)<0.67:
            continue
        if 'junior' in actual and expected & SENIOR_TITLE_WORDS:
            continue
        if actual & ENTRY_TITLE_WORDS and not expected & ENTRY_TITLE_WORDS:
            continue
        overlap=len(actual & expected)/len(expected)
        if expected <= actual or overlap>=0.75:
            return 1.0
        if domain:
            best=max(best, 0.5+0.5*overlap)
    return best


def title_matches(title, targets):
    return title_relevance(title, targets)==1.0


def search_keywords(titles, limit=4):
    """Distinctive words shared by the target titles, for keyword-search ATS APIs."""
    counts={}
    for title in titles:
        for word in set(re.findall(r'[a-z]+', title.lower())):
            if len(word)>=2 and word not in GENERIC_TITLE_WORDS|{'the','and','of','in','for','ai'}:
                counts[word]=counts.get(word,0)+1
    return [word for word,_ in sorted(counts.items(), key=lambda item:(-item[1], item[0]))[:limit]]


DOCUMENT_PATTERNS = {
    'Cover Letter': r'cover[\s_-]*letter|covering letter|letter of (?:application|interest)',
    'Motivational Letter': r'motivation(?:al)?[\s_-]*letter|letter of motivation|motivationsschreiben|anschreiben|statement of (?:motivation|purpose)',
}


def required_documents(job, module, form_fields=None):
    """Documents the application asks for. Optional uploads count as mandatory, so nothing is missed."""
    documents = ['Resume/CV']
    text = ' '.join(form_fields or []) + ' ' + job.get('description', '')
    for name, pattern in DOCUMENT_PATTERNS.items():
        if re.search(pattern, text, re.I):
            documents.append(name)
    # Domestic applications always include a cover letter; visa applications add a motivational letter.
    if 'Cover Letter' not in documents:
        documents.append('Cover Letter')
    if module == 'visa' and 'Motivational Letter' not in documents:
        documents.append('Motivational Letter')
    return documents


def _form_fields(client, job):
    """Labels of the upload fields on the employer's application form, where the ATS publishes it."""
    match_board = re.fullmatch(r'greenhouse:([\w-]+)', job.get('source', ''))
    if not match_board or not job.get('requisition_id'):
        return None
    try:
        response = client.get(f'https://boards-api.greenhouse.io/v1/boards/{match_board.group(1)}/jobs/{job["requisition_id"]}?questions=true')
        response.raise_for_status()
        questions = response.json().get('questions', [])
        if not isinstance(questions, list):
            return None
    except Exception:
        # Form details are a bonus: any failure falls back to reading the job description.
        return None
    return [str(q.get('label', '')) + ' ' + ' '.join(str(f.get('name', '')) for f in q.get('fields', []) if isinstance(f, dict))
            for q in questions if isinstance(q, dict) and any(isinstance(f, dict) and f.get('type') == 'input_file' for f in q.get('fields', []))]


def match(profile,job):
    skills = set(s.lower() for s in profile.get('skills',[]))
    jd = job.get('description','').lower()
    mentioned = [s for s in SKILLS if re.search(r'(?<!\w)'+re.escape(s.lower())+r'(?!\w)',jd)]
    matched = [s for s in mentioned if s.lower() in skills]
    missing = [s for s in mentioned if s.lower() not in skills]
    requirements = job.get('requirements',{})
    mandatory = requirements.get('mandatory_skills', mentioned)
    preferred = requirements.get('preferred_skills', [])
    def fraction(values):
        return sum(v.lower() in skills for v in values)/len(values) if values else 0
    title_tokens = set(re.findall(r'\w+',job.get('title','').lower()))
    profile_tokens = set(re.findall(r'\w+',profile.get('designation','').lower()))
    exp = experience_months(profile.get('employments',[]))
    years = requirements.get('experience_years')
    components = {
        'mandatory_skills': fraction(mandatory),
        'experience': min(1,exp['months']/12/years) if years and not exp['incomplete_roles'] else 0,
        'title': len(title_tokens & profile_tokens)/max(1,len(title_tokens)),
        'responsibilities':fraction(requirements.get('responsibility_skills', [])),
        'domain':fraction(requirements.get('domain_skills', [])),
        'preferred_skills':fraction(preferred),
        'eligibility':1 if requirements.get('eligibility_confirmed') is True else 0}
    score = round(sum(WEIGHTS[k]*v for k,v in components.items()))
    return {'score':score,'components':{k:{'weight':WEIGHTS[k],'score':round(v*WEIGHTS[k],1)} for k,v in components.items()},'strong_matches':matched,'missing_requirements':missing,
            'partial_matches':[], 'transferable_skills':[], 'seniority':'Compare the role requirements with your verified career history.',
            'eligibility':'User confirmation required' if not requirements.get('eligibility_confirmed') else 'User-provided confirmation',
            'unknowns':['Unspecified scoring components receive zero; skills inferred from JD mentions may not be mandatory.'],
            'label':'Estimated candidate-to-JD fit score, not an actual hiring probability.'}


def upsert_job(db,user_id,data):
    data={**data,**{k:str(data.get(k,'')).strip() for k in ['company','title','location','country','url']}}
    module_hint=data.pop('module_hint',None)
    data.pop('detail_url',None)
    if data.get('country','').casefold()=='india':data['country']='India'
    identity = data.get('source','manual')+':'+str(data.get('requisition_id') or digest('|'.join(data.get(x,'').strip().lower() for x in ['company','title','location'])))
    from .db import records
    if get_record(db,user_id,'deleted_job',identity) or (data.get('url') and any(canonical(r.data.get('url',''))==canonical(data['url']) for r in records(db,user_id,'deleted_job').all())):
        return None
    old = get_record(db,user_id,'job',identity)
    if not old and data.get('url'):
        from .db import records
        old = next((r for r in records(db,user_id,'job').all() if canonical(r.data.get('url',''))==canonical(data['url'])),None)
        if old:
            identity=old.key
    profile = get_record(db,user_id,'profile','active')
    if old:
        # User-maintained fields, history and discovery time survive refresh.
        keep = ('status','comment','attachment_ids','applied_at','discovered_at','history')
        if old.data.get('documents_edited'):
            keep += ('mandatory_documents','mandatory_documents_known')
        data = {**old.data,**{k:v for k,v in data.items() if k not in keep}}
    else:
        data = {**data,'id':uid(),'status':'NOT APPLIED','comment':'','attachment_ids':[],'history':[], 'applied_at':None,'discovered_at':now().isoformat()}
    data['sponsorship'] = sponsorship(data.get('description',''))
    data['sponsorship']['source_url']=data.get('source_url') or data.get('url')
    if data.get('is_sample'):
        data['sponsorship'] = {
            'category':'Not verified',
            'evidence':[],
            'verified_at':None,
            'classification':'Sample opportunity; not a live vacancy',
            'source_url':data.get('source_url') or data.get('url'),
        }
    elif data.get('source')=='manual':
        data['sponsorship']['classification']='User-provided'
        data['sponsorship']['verified_at']=None
    data['match'] = match(profile.data if profile else {},data)
    data['module'] = data.get('fallback_module') if data.get('is_sample') else 'domestic' if data.get('country')=='India' else 'visa' if data.get('country') and (data['sponsorship']['evidence'] or module_hint=='visa' or data.get('module')=='visa') else 'unqualified'
    row = put(db,user_id,'job',identity,data)
    row.data = {**row.data,'id':row.id}
    return row


def discover(db,user_id,module,progress=None):
    profile=get_record(db,user_id,'profile','active')
    if not profile:
        raise ValueError('Upload a resume to create your candidate profile first.')
    from .search_scope import resolve_scope, matches_scope
    scope=resolve_scope(db,user_id,module,profile.data)
    found, errors, warnings = [], [], []
    boards = [b.strip() for b in settings.greenhouse_boards.split(',') if b.strip()]
    sites = [s.strip() for s in settings.lever_sites.split(',') if s.strip()]
    defaults_used = not boards and not sites
    if defaults_used:
        boards = DEFAULT_GREENHOUSE_BOARDS.split(',')
    configured = set(boards) | set(sites)
    extra_boards, extra_sites, recruiters = [], [], []
    if settings.extra_job_sources:
        extra_boards = [b for b in EXTRA_GREENHOUSE_BOARDS.split(',') if b not in configured]
        extra_sites = [s for s in EXTRA_LEVER_SITES.split(',') if s not in configured]
        recruiters = SMARTRECRUITERS_COMPANIES.split(',')
    source_count=len(boards)+len(sites)+len(extra_boards)+len(extra_sites)+len(recruiters)
    completed=0
    def update(stage):
        if progress:
            progress({'stage':stage,'sources_complete':completed,'source_count':source_count,'scanned':len(found)})

    with httpx.Client(timeout=25,follow_redirects=False) as c:
        for board in boards:
            update('Reading '+board+' jobs')
            if not re.fullmatch(r'[\w-]+',board):
                errors.append('Invalid Greenhouse board identifier: '+board)
                continue
            try:
                found.extend(_greenhouse(c, board, with_content=True))
            except (httpx.HTTPError,KeyError,ValueError,TypeError):
                errors.append('Greenhouse board '+board+' could not be fetched.')
            completed+=1
        for site in sites:
            update('Reading '+site+' jobs')
            if not re.fullmatch(r'[\w-]+',site):
                errors.append('Invalid Lever site identifier: '+site)
                continue
            try:
                found.extend(_lever(c, site))
            except (httpx.HTTPError,KeyError,ValueError,TypeError):
                errors.append('Lever site '+site+' could not be fetched.')
            completed+=1

    # Additional public employer boards. Failures here are not user configuration errors.
    if extra_boards or extra_sites or recruiters:
        from concurrent.futures import ThreadPoolExecutor
        update('Reading additional employer career boards')
        keywords = search_keywords(scope['titles']) or ['engineer']
        def fetch(task):
            kind, name = task
            try:
                with httpx.Client(timeout=25,follow_redirects=False) as client:
                    if kind=='gh':
                        return _greenhouse(client, name, with_content=False)
                    if kind=='lever':
                        return _lever(client, name)
                    return _smartrecruiters(client, name, keywords)
            except (httpx.HTTPError,KeyError,ValueError,TypeError):
                return []
        tasks=[('gh',b) for b in extra_boards]+[('lever',s) for s in extra_sites]+[('sr',r) for r in recruiters]
        with ThreadPoolExecutor(max_workers=8) as pool:
            for batch in pool.map(fetch, tasks):
                found.extend(batch)
                completed+=1

    if (settings.llm_key or settings.fallback_key or settings.openrouter_key or settings.anthropic_key):
        from .live_research import verified_jobs
        update('Searching public employer pages beyond configured boards')
        web_jobs, web_evidence = verified_jobs(profile.data,module,scope=scope)
        found.extend(web_jobs)
        if not web_evidence.get('available'):
            warnings.append('Live web search unavailable; results come from employer career boards.')

    update('Matching published jobs to your profile')
    if not found and errors:
        raise ValueError('Job sources could not be reached; this is a connection failure, not an empty search. Restart the app from start.ps1 with internet access, then retry. '+' '.join(errors))

    limit = DOMESTIC_JOB_LIMIT if module=='domestic' else VISA_JOB_LIMIT
    candidates = _rank_candidates(found, module, scope, profile.data)
    # Fetch full descriptions only for the shortlisted listings that came without one.
    with httpx.Client(timeout=25,follow_redirects=False) as c:
        for item in candidates[:limit*3]:
            if not item['job'].get('description'):
                _load_description(c, item['job'])
    candidates = _rank_candidates([item['job'] for item in candidates[:limit*3]], module, scope, profile.data) + candidates[limit*3:]

    ai_review = bool(settings.llm_key or settings.fallback_key or settings.openrouter_key or settings.anthropic_key)
    # Extra candidates are only saved when the AI review can choose between them.
    shortlist = limit*2 if ai_review else limit
    kept, seen = [], set()
    for item in candidates:
        if len(kept) >= shortlist:
            break
        data = item['job']
        # Separate requisitions with the same title are different openings; only the same posting is a duplicate.
        identity = canonical(data.get('url','')) or data.get('source','')+':'+str(data.get('requisition_id',''))
        if identity in seen:
            continue
        seen.add(identity)
        with httpx.Client(timeout=25,follow_redirects=False) as c:
            fields = _form_fields(c, data)
        data = {**data, 'mandatory_documents': required_documents(data, module, fields), 'mandatory_documents_known': True,
                'documents_source': 'Employer application form' if fields is not None else 'Job description'}
        saved = upsert_job(db,user_id,{**data,'module_hint':module,'relevance':round(item['score'],2)})
        if saved is not None:
            kept.append(saved.id)

    # Apply user search instructions only to real listings already fetched from ATS sources.
    if kept and ai_review:
        from .ai import candidate_context, json_call
        from .prompt_library import section
        from .db import Record
        update('Reviewing verified listings against your search instructions')
        listings=[{'id':row.id,**{key:row.data.get(key) for key in ('title','company','country','url')},'description':row.data.get('description','')[:3000]} for row in [db.get(Record,key) for key in kept]]
        def validate(value):
            ids=value.get('matching_ids')
            if not isinstance(ids,list) or any(not isinstance(key,str) or key not in kept for key in ids) or len(set(ids))!=len(ids):
                raise ValueError('Search review must reference only supplied listing IDs.')
        try:
            result,_,_=json_call(json.dumps({'user_instructions':section(module,'search'),
                'task':f'Review these fetched job listings against the candidate and search instructions. Return the IDs of the listings that suit the candidate, best first, at most {limit}. Never invent jobs or URLs. No browsing tools are available; treat supplied ATS pages as the only live evidence. Do not claim additional verification, application submission, or files were generated.',
                'candidate':candidate_context(profile.data),'search_scope':scope,'listings':listings,'schema':{'matching_ids':['supplied listing id']}}),validate,purpose='extraction')
            ordered=result['matching_ids']
            if not ordered:
                ordered=kept
        except ValueError:
            ordered=kept
        accepted=set(ordered[:limit])
        for key in kept:
            row=db.get(Record,key)
            if key not in accepted and row.data.get('discovery_runs'):
                continue
            row.data={**row.data,'search_prompt_review':'matched' if key in accepted else 'excluded'}
        kept=[key for key in ordered if key in accepted]
    kept=kept[:limit]
    from .db import Record
    stamp=now().isoformat()
    for key in kept:
        row=db.get(Record,key)
        row.data={**row.data,'search_prompt_review':'matched','last_found_at':stamp,'discovery_runs':[*row.data.get('discovery_runs',[]),stamp][-20:]}
    put(db,user_id,'discovery_run',module,{'job_ids':kept,'at':stamp})
    db.commit()
    return {
        'saved':len(kept),
        'job_ids':kept,
        'search_scope':scope,
        'source_errors':errors,
        'warnings':warnings,
        'scanned':len(found),
        'fallback_used':False,
        'default_sources_used':defaults_used,
        'note':'' if kept else 'No matching live listings were found for your suggested titles right now. Retry later or add employer boards.',
    }


def _verification(url):
    return {'status':'Published on official ATS board','checked_at':now().isoformat(),'evidence_url':url}


def _greenhouse(client, board, with_content):
    response = client.get(f'https://boards-api.greenhouse.io/v1/boards/{board}/jobs'+('?content=true' if with_content else ''))
    response.raise_for_status()
    rows=[]
    for j in response.json()['jobs']:
        location = j['location']['name']
        rows.append({'source':'greenhouse:'+board,'company':j.get('company_name') or board.title(),'title':j['title'],'location':location,'country':country_from_location(location),
                     'url':j['absolute_url'],'description':clean_html(j.get('content','')),'requisition_id':str(j['id']),'source_url':str(response.url),
                     'detail_url':f'https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{j["id"]}',
                     'verification':_verification(str(response.url)),'mandatory_documents':[], 'mandatory_documents_known':False})
    return rows


def _lever(client, site):
    response=client.get(f'https://api.lever.co/v0/postings/{site}?mode=json')
    response.raise_for_status()
    rows=[]
    for j in response.json():
        location=j.get('categories',{}).get('location','')
        rows.append({'source':'lever:'+site,'company':site.title(),'title':j['text'],'location':location,'country':country_from_location(location),'url':j['hostedUrl'],
                     'description':j.get('descriptionPlain','')+'\n'+'\n'.join(clean_html(x.get('content','')) for x in j.get('lists',[])),'requisition_id':j['id'],
                     'source_url':str(response.url),'verification':_verification(str(response.url)),'mandatory_documents':[], 'mandatory_documents_known':False})
    return rows


def _smartrecruiters(client, company, keywords):
    rows={}
    for keyword in keywords:
        response=client.get(f'https://api.smartrecruiters.com/v1/companies/{company}/postings',params={'q':keyword,'limit':100})
        response.raise_for_status()
        for j in response.json().get('content',[]):
            loc=j.get('location',{})
            code=str(loc.get('country','')).lower()
            location=', '.join(v for v in [loc.get('city',''),loc.get('region','')] if v)
            country='India' if code=='in' else country_from_location(loc.get('fullLocation','') or location) or {'us':'United States','gb':'United Kingdom','de':'Germany','nl':'Netherlands','ie':'Ireland','ca':'Canada','au':'Australia','sg':'Singapore','pl':'Poland','es':'Spain','pt':'Portugal','fr':'France','ro':'Romania','ae':'United Arab Emirates','hu':'Hungary','cz':'Czech Republic'}.get(code,'')
            slug=re.sub(r'[^a-z0-9]+','-',j.get('name','').lower()).strip('-')
            rows[j['id']]={'source':'smartrecruiters:'+company,'company':(j.get('company') or {}).get('name') or company,'title':j.get('name',''),
                           'location':(location+', '+country).strip(', '),'country':country,'url':f'https://jobs.smartrecruiters.com/{company}/{j["id"]}-{slug}',
                           'description':'','requisition_id':str(j['id']),'source_url':j.get('ref',''),'detail_url':j.get('ref',''),
                           'verification':_verification(j.get('ref','')),'mandatory_documents':[], 'mandatory_documents_known':False}
    return list(rows.values())


def _load_description(client, job):
    url=job.get('detail_url','')
    if not url.startswith('https://'):
        return
    try:
        response=client.get(url)
        response.raise_for_status()
        data=response.json()
    except (httpx.HTTPError,ValueError):
        return
    if 'jobAd' in data:
        sections=data.get('jobAd',{}).get('sections',{})
        job['description']='\n\n'.join(clean_html(sections[key].get('text','')) for key in ('jobDescription','qualifications','additionalInformation') if isinstance(sections.get(key),dict))
        job['url']=data.get('postingUrl') or job['url']
    else:
        job['description']=clean_html(data.get('content',''))


def _rank_candidates(found, module, scope, profile):
    """Score fetched listings by title fit, skills and visa evidence; drop ineligible ones."""
    cand_skills=[skill.lower() for skill in profile.get('skills',[]) if skill]
    allowed={c.casefold() for c in scope['countries']}
    ranked=[]
    for data in found:
        country=data.get('country') or ''
        if module=='domestic' and country!='India':
            continue
        if module=='visa' and (not country or country=='India'):
            continue
        relevance=title_relevance(data.get('title',''), scope['titles'])
        if relevance < 0.5:
            continue
        description=data.get('description','')
        if module=='visa' and description and sponsorship_blocked(description):
            continue
        text=(description+' '+data.get('title','')).lower()
        skills=sum(1 for skill in cand_skills if re.search(r'(?<!\w)'+re.escape(skill)+r'(?!\w)',text))
        score=relevance*10+min(skills,8)*0.5
        if module=='visa':
            if description and sponsorship(description)['evidence']:
                score+=4
            if country.casefold() in allowed:
                score+=2
        if not description:
            score-=0.5
        ranked.append({'job':data,'score':score})
    ranked.sort(key=lambda item:item['score'],reverse=True)
    return ranked


def active_results(rows, module, status='', query='', sort='default', history=False):
    cutoff=(now()-timedelta(days=60)).isoformat()
    data=[{**r.data,'id':r.id} for r in rows if r.data.get('module')==module and r.data.get('search_prompt_review')!='excluded']
    if not history:
        data=[d for d in data if d.get('discovered_at','')>=cutoff]
    if status:
        data=[d for d in data if d.get('status')==status]
    if query:
        data=[d for d in data if query.lower() in ' '.join(str(d.get(k,'')) for k in ['company','title','location']).lower()]
    data.sort(key=lambda d:d['id'])
    if sort=='status':
        data.sort(key=lambda d:STATUSES.index(d['status']))
    elif sort=='date':
        data.sort(key=lambda d:d.get('applied_at') or d['discovered_at'],reverse=True)
    else:
        data.sort(key=lambda d:(d.get('match',{}).get('score',0),d.get('status')=='NOT APPLIED',d.get('applied_at') or d['discovered_at']),reverse=True)
    return data
