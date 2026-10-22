import html
import ipaddress
import re
import socket
from datetime import timedelta
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import httpx

from .config import settings
from .db import digest, get_record, now, put, uid
from .resumes import SKILLS, experience_months

STATUSES = ['NOT APPLIED','APPLIED','SCREENING','INTERVIEW','WAITING FOR OFFER','SELECTED','REJECTED']
WEIGHTS = {'mandatory_skills':30,'experience':20,'title':15,'responsibilities':15,'domain':10,'preferred_skills':5,'eligibility':5}


def clean_html(value):
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', value, flags=re.S|re.I)
    value = re.sub(r'</(?:p|div|li|h[1-6])>', '\n', value, flags=re.I)
    return html.unescape(re.sub('<[^>]+>', ' ', value)).strip()


def canonical(url):
    p = urlparse(url)
    return urlunparse((p.scheme.lower(),p.netloc.lower(),p.path.rstrip('/'),'',urlencode(sorted((k,v) for k,v in parse_qsl(p.query) if not k.lower().startswith(('utm_','ref','tracking')))),''))


def validate_public_url(url):
    p = urlparse(url)
    if p.scheme != 'https' or not p.hostname or p.username or p.password or p.port not in (None,443):
        raise ValueError('Use a public HTTPS URL without credentials or custom ports.')
    try:
        ips = {r[4][0] for r in socket.getaddrinfo(p.hostname,443,type=socket.SOCK_STREAM)}
    except socket.gaierror:
        raise ValueError('Hostname could not be resolved.')
    if not ips or any(not ipaddress.ip_address(ip).is_global for ip in ips):
        raise ValueError('Private and local network addresses are not allowed.')
    return url


def fetch_jd(url):
    # Limited to supported public ATS hosts. Arbitrary URL fetch is disabled to avoid
    # redirect/DNS rebinding attacks against internal services.
    p = urlparse(validate_public_url(url))
    allowed = ('boards.greenhouse.io','job-boards.greenhouse.io','jobs.lever.co')
    if p.hostname not in allowed:
        raise ValueError('URL extraction supports Greenhouse and Lever job pages. Paste the JD for other sources.')
    with httpx.Client(timeout=20,follow_redirects=False) as c:
        with c.stream('GET',url,headers={'User-Agent':'CareerAssistant/1.0'}) as r:
            r.raise_for_status()
            if 'text/html' not in r.headers.get('content-type',''):
                raise ValueError('Expected an HTML job page.')
            data = b''
            for block in r.iter_bytes():
                data += block
                if len(data)>2_000_000:
                    raise ValueError('Job page is too large.')
    return clean_html(data.decode('utf-8',errors='replace'))[:60000]


def sponsorship(text):
    evidence = []
    for sentence in re.split(r'(?<=[.!?])\s+|\n',text):
        if re.search(r'(visa|work permit) sponsor|relocation (assistance|support|package)|sponsor.{0,15}(visa|work permit)',sentence,re.I):
            if not re.search(r'\b(no|not|cannot|unable|without|unavailable|do not|does not|will not|may|might|potential|possible|eligible)\b|not available|not offer',sentence,re.I):
                evidence.append(sentence.strip())
    visa = any(re.search(r'visa|work permit',e,re.I) for e in evidence)
    relocation = any('relocation' in e.lower() for e in evidence)
    return {'category':'Both' if visa and relocation else 'Explicit visa sponsorship' if visa else 'Explicit relocation assistance' if relocation else 'No sponsorship identified', 'evidence':evidence, 'verified_at':now().isoformat(), 'classification':'Verified' if evidence else 'Unknown'}


def country_from_location(location):
    lower = location.lower()
    if re.search(r'\bindia\b|bengaluru|bangalore|hyderabad|pune|mumbai|chennai|gurugram|noida|new delhi', lower):
        return 'India'
    countries = ['United States','Canada','Australia','New Zealand','Germany','Netherlands','United Kingdom','France','Ireland','Switzerland','Singapore','Japan','United Arab Emirates','Saudi Arabia','Sweden','Denmark','Poland','Spain','Finland','Norway']
    return next((c for c in countries if c.lower() in lower), '')


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
    if data.get('country','').casefold()=='india':data['country']='India'
    identity = data.get('source','manual')+':'+str(data.get('requisition_id') or digest('|'.join(data.get(x,'').strip().lower() for x in ['company','title','location'])))
    old = get_record(db,user_id,'job',identity)
    if not old and data.get('url'):
        from .db import records
        old = next((r for r in records(db,user_id,'job').all() if canonical(r.data.get('url',''))==canonical(data['url'])),None)
        if old:
            identity=old.key
    profile = get_record(db,user_id,'profile','active')
    if old:
        # User-maintained fields, history and discovery time survive refresh.
        data = {**old.data,**{k:v for k,v in data.items() if k not in ('status','comment','attachment_ids','applied_at','discovered_at','history')}}
    else:
        data = {**data,'id':uid(),'status':'NOT APPLIED','comment':'','attachment_ids':[],'history':[], 'applied_at':None,'discovered_at':now().isoformat()}
    data['sponsorship'] = sponsorship(data.get('description',''))
    data['sponsorship']['source_url']=data.get('source_url') or data.get('url')
    if data.get('source')=='manual':
        data['sponsorship']['classification']='User-provided'
        data['sponsorship']['verified_at']=None
    data['match'] = match(profile.data if profile else {},data)
    data['module'] = 'domestic' if data.get('country')=='India' else 'visa' if data.get('country') and data['sponsorship']['evidence'] else 'unqualified'
    row = put(db,user_id,'job',identity,data)
    row.data = {**row.data,'id':row.id}
    return row


def discover(db,user_id,module):
    found, errors = [], []
    if not settings.greenhouse_boards and not settings.lever_sites:
        raise ValueError('No job sources configured. Set GREENHOUSE_BOARDS or LEVER_SITES to employer board identifiers, or save a job manually.')
    with httpx.Client(timeout=25,follow_redirects=False) as c:
        for board in filter(None,settings.greenhouse_boards.split(',')):
            board = board.strip()
            if not re.fullmatch(r'[\w-]+',board):
                continue
            try:
                response = c.get(f'https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true')
                response.raise_for_status()
                for j in response.json()['jobs']:
                    location = j['location']['name']
                    found.append({'source':'greenhouse:'+board,'company':board,'title':j['title'],'location':location,'country':country_from_location(location),'url':j['absolute_url'],'description':clean_html(j.get('content','')),'requisition_id':str(j['id']), 'source_url':str(response.url),'verification':{'status':'Published on official ATS board','checked_at':now().isoformat(),'evidence_url':str(response.url)},'mandatory_documents':[], 'mandatory_documents_known':False})
            except (httpx.HTTPError,KeyError,ValueError):
                errors.append('Greenhouse board '+board+' could not be fetched.')
        for site in filter(None,settings.lever_sites.split(',')):
            site=site.strip()
            if not re.fullmatch(r'[\w-]+',site):
                continue
            try:
                response=c.get(f'https://api.lever.co/v0/postings/{site}?mode=json')
                response.raise_for_status()
                for j in response.json():
                    location=j.get('categories',{}).get('location','')
                    found.append({'source':'lever:'+site,'company':site,'title':j['text'],'location':location,'country':country_from_location(location),'url':j['hostedUrl'],'description':j.get('descriptionPlain','')+'\n'+'\n'.join(clean_html(x.get('content','')) for x in j.get('lists',[])),'requisition_id':j['id'],'source_url':str(response.url),'verification':{'status':'Published on official ATS board','checked_at':now().isoformat(),'evidence_url':str(response.url)},'mandatory_documents':[], 'mandatory_documents_known':False})
            except (httpx.HTTPError,KeyError,ValueError):
                errors.append('Lever site '+site+' could not be fetched.')
    profile=get_record(db,user_id,'profile','active')
    if not profile or not profile.data.get('approved'):
        raise ValueError('Review and approve your candidate profile first.')
    preferences=get_record(db,user_id,'preferences','active')
    prefs=preferences.data if preferences else {}
    kept=[]
    for data in found:
        candidate = match(profile.data,data)
        if not candidate['strong_matches']:
            continue
        if prefs.get('target_titles') and not any(t.lower() in data['title'].lower() for t in prefs['target_titles']):
            continue
        if module=='visa' and prefs.get('countries') and data['country'].casefold() not in {c.casefold() for c in prefs['countries']}:
            continue
        if module=='domestic' and data['country']!='India':
            continue
        if module=='visa' and (not data['country'] or data['country']=='India' or not sponsorship(data['description'])['evidence']):
            continue
        kept.append(upsert_job(db,user_id,data).id)
    db.commit()
    return {'saved':len(kept),'source_errors':errors,'scanned':len(found),'note':'Country must be explicit or map to a supported Indian city; ambiguous locations are excluded.'}


def active_results(rows, module, status='', query='', sort='default', history=False):
    cutoff=(now()-timedelta(days=60)).isoformat()
    data=[{**r.data,'id':r.id} for r in rows if r.data.get('module')==module]
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
