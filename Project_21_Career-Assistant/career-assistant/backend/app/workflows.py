import json
import heapq
from threading import Lock
from datetime import datetime, timedelta

from . import ai, rag, live_research
from .db import DB, File, Session, Task, audit, digest, get_record, now, put, records
from .interviews import generate_question_answer, interview_generate
from .jobs import discover
from .search_scope import profile_signature
from .resumes import PARSER_VERSION, bootstrap_profile, check_missing_mandatory_fields, experience_summary, extract, extract_profile
from .config import settings
from .storage import read_bytes
from .prompt_library import section as prompt_section, version as prompt_version


def title_suggestion_prompt(module, profile):
    scope = ('Return one region named India, with countries [India].' if module=='domestic' else
             'Group titles under EU, United Kingdom, North America, Middle East, Asia-Pacific, and Australia and New Zealand. Exclude India. Use at most 12 relevant countries total. Omit regions unsupported by candidate skills.')
    return {'task':'Suggest concise job-search titles grounded in the candidate skills, current designation, experience and seniority. '+scope+' Return up to 20 distinct realistic titles per region, using regional role naming conventions. Do not inflate seniority or invent skills. These are search suggestions, not live vacancies or evidence of visa eligibility/sponsorship. Return only region, countries and titles; no rationale, classification, relevance, candidate evidence or metadata.',
            'schema':{'regions':[{'region':'string','countries':['string'],'titles':['string']}]},
            'module':module,'candidate':ai.candidate_context(profile),'user_instructions':prompt_section(module,'titles'),'execution_constraints':'Use the requested JSON schema. No live browsing tool is available in this call: do not claim current market research or invent citations. Apply the supplied instructions to candidate-based recommendations; retain the region/title display.'}


def validate_title_suggestions(data, module):
    groups=data.get('regions')
    if not isinstance(groups,list) or not groups:
        raise ValueError('Title suggestions require region groups.')
    countries=set()
    for group in groups:
        if not isinstance(group,dict) or not isinstance(group.get('region'),str) or not group['region'].strip():
            raise ValueError('Title suggestions require a region name.')
        titles=group.get('titles')
        if not isinstance(titles,list) or not titles or any(not isinstance(title,str) or not title.strip() for title in titles):
            raise ValueError('Title suggestions require job title strings.')
        values=group.get('countries')
        if not isinstance(values,list) or not values or any(not isinstance(country,str) or not country.strip() for country in values):
            raise ValueError('Title suggestions require countries for each region.')
        countries.update(country.casefold() for country in values)
    if module=='domestic' and (countries!={'india'} or len(groups)!=1 or groups[0]['region'].casefold()!='india'):
        raise ValueError('Domestic title suggestions must use only India.')
    if module=='visa' and ('india' in countries or len(countries)>12):
        raise ValueError('Visa title suggestions must exclude India and use at most 12 countries.')


def cached_research(db, user_id, key, profile):
    """Saved suggestions are reused while they were generated for the same candidate profile."""
    row=get_record(db,user_id,'research',key)
    if row and row.data.get('profile_signature')==profile_signature(profile):
        return row
    return None


def _evidence(value):
    # Unavailable search is an internal condition; only keep cited evidence for display.
    return value if value.get('available') else {'available':False}


def generate_titles(db, user_id, module, profile, report=lambda value: None):
    cached=cached_research(db,user_id,module,profile)
    if cached:
        report({'stage':'Using saved title suggestions for your profile','research_id':cached.id})
        return cached, True
    report({'stage':'Generating relevant job titles from your approved profile'})
    evidence=_evidence(live_research.research(profile,module,purpose='titles'))
    prompt=title_suggestion_prompt(module, profile)
    if evidence['available']:
        prompt['live_evidence']=evidence
        prompt['execution_constraints']='Use the supplied dated live evidence when available. Do not claim current market or visa facts unless supported by its sources. Retain the required JSON schema.'
    data,model,usage=ai.json_call(json.dumps(prompt),lambda value:validate_title_suggestions(value,module),purpose='extraction')
    row=put(db,user_id,'research',module,{**data,'model':model,'usage':usage,'live_evidence':evidence,'profile_signature':profile_signature(profile),'created_at':now().isoformat()})
    db.commit()
    rag.index(db,user_id,module,row.id,json.dumps(data))
    db.commit()
    return row, False


def validate_country_suggestions(value):
    groups=value.get('regions')
    if not isinstance(groups,list) or not groups: raise ValueError('Country suggestions need regions.')
    for group in groups:
        countries=group.get('countries',[])
        if not group.get('region') or not isinstance(countries,list) or not 1<=len(countries)<=10 or any(not isinstance(c,str) or not c.strip() or c.casefold()=='india' for c in countries) or len(set(c.casefold() for c in countries))!=len(countries):
            raise ValueError('Invalid regional country suggestions.')


def generate_countries(db, user_id, profile, report=lambda value: None):
    cached=cached_research(db,user_id,'visa-countries',profile)
    if cached:
        report({'stage':'Using saved country suggestions for your profile','research_id':cached.id})
        return cached, True
    report({'stage':'Evaluating countries by region'})
    prompt={'task':'Suggest the top 10 distinct countries per region where possible, ranked for this candidate. Never invent countries to reach ten; regions with fewer eligible countries must return fewer. Exclude India. Follow the supplied country research instructions.',
            'user_instructions':prompt_section('visa','countries'),
            'candidate':ai.candidate_context(profile),
            'execution_constraints':'No live browsing tool is available. Do not claim current visa rules, eligibility, salaries, sponsorship or live hiring evidence is verified. Return candidate-based suggestions only.',
            'schema':{'regions':[{'region':'string','countries':['country name']} ]}}
    evidence=_evidence(live_research.research(profile,'visa',purpose='countries'))
    if evidence['available']:
        prompt['live_evidence']=evidence
        prompt['execution_constraints']='Use dated supplied evidence for current visa and hiring claims. Do not claim eligibility or current rules are verified without it. Retain the requested JSON schema.'
    data,model,usage=ai.json_call(json.dumps(prompt),validate_country_suggestions,purpose='extraction')
    row=put(db,user_id,'research','visa-countries',{**data,'model':model,'usage':usage,'live_evidence':evidence,'profile_signature':profile_signature(profile),'created_at':now().isoformat()})
    db.commit()
    rag.index(db,user_id,'visa-countries',row.id,json.dumps(data))
    db.commit()
    return row, False


def enqueue(db,user_id,kind,payload):
    if kind in {'ingest','interview','discover','reparse','research','countries','document'}:
        existing=next((task for task in db.query(Task).filter(Task.user_id==user_id,Task.kind==kind,Task.status.in_(['queued','running'])).all() if task.payload==payload),None)
        if existing:
            return {'task_id':existing.id,'status':existing.status}
    task=Task(user_id=user_id,kind=kind,payload=payload)
    db.add(task); db.commit()
    return {'task_id':task.id,'status':'queued'}


def parsed_profile(markdown):
    profile = bootstrap_profile(markdown)
    if (settings.llm_key or settings.fallback_key or settings.openrouter_key or settings.anthropic_key) and (check_missing_mandatory_fields(profile) or not profile.get('employments')):
        try:
            profile = extract_profile(markdown)
        except ValueError:
            profile['unknowns'].append('AI extraction was rejected or unavailable; review the extracted fields.')
    profile['missing_mandatory_fields'] = check_missing_mandatory_fields(profile)
    return profile


def repair_saved_profile(db, user_id, resume):
    """Upgrade old extraction once, without AI calls or replacing reviewed values."""
    active = get_record(db, user_id, 'profile', 'active')
    target = active if active and active.data.get('resume_version_id') == resume.id else None
    existing = target.data if target else resume.data.get('profile', {})
    if existing.get('extraction_version', 0) >= PARSER_VERSION:
        return existing
    parsed = bootstrap_profile(resume.data['markdown'])
    merged = {**parsed, **existing}
    for field, value in parsed.items():
        if field != 'approved' and not existing.get(field):
            merged[field] = value
    merged['extraction_version'] = PARSER_VERSION
    merged['missing_mandatory_fields'] = check_missing_mandatory_fields(merged)
    merged['experience'] = experience_summary(merged.get('employments', []))
    merged['unknowns'] = [line for line in merged.get('unknowns', []) if not line.startswith('Mandatory fields missing:')]
    resume.data = {**resume.data, 'profile': merged}
    if target:
        target.data = merged
    db.commit()
    return merged


def process(db,task):
    user_id=task.user_id
    p=task.payload
    def report(value):
        task.result={**value, '_started_at':(task.result or {}).get('_started_at',now().isoformat())}
        db.commit()
    if task.kind == 'reparse':
        resume = records(db, user_id, 'resume').filter_by(id=p['resume_id']).one()
        file = db.query(File).filter_by(id=resume.data['file_id'], user_id=user_id).one()
        markdown = extract(file.name, read_bytes(file.key))
        profile = parsed_profile(markdown)
        active = get_record(db, user_id, 'profile', 'active')
        # Fill blanks only: existing edits and approval must survive a retry.
        if active and active.data.get('resume_version_id') == resume.id:
            merged = dict(active.data)
            for field, value in profile.items():
                if not merged.get(field):
                    merged[field] = value
            merged['source_markdown'] = markdown
            merged['missing_mandatory_fields'] = check_missing_mandatory_fields(merged)
            active.data = merged
            profile = merged
        resume.data = {**resume.data, 'profile': profile}
        audit(db, user_id, 'resume_reparsed', {'resume_id': resume.id})
        db.commit()
        return {'resume_id': resume.id, 'missing_mandatory_fields': profile['missing_mandatory_fields']}
    if task.kind=='submit':
        from .applications import submit_one
        return {'outcomes':[submit_one(db,user_id,id) for id in p['job_ids']]}
    if task.kind=='ingest':
        file=db.query(File).filter_by(id=p['file_id'],user_id=user_id).one()
        existing=get_record(db,user_id,'resume',file.sha)
        if existing:
            return {'resume_id':existing.id,'cached':True}
        md=extract(file.name,read_bytes(file.key))
        text_hash=digest(md)
        same_text=get_record(db,user_id,'resume',text_hash)
        if same_text:
            repair_saved_profile(db, user_id, same_text)
            return {'resume_id':same_text.id,'cached':True,'note':'Identical extracted content; original upload preserved.'}
        archived=get_record(db,user_id,'resume_archive',text_hash)
        if archived:
            archived.kind='resume'
            archived.data={**archived.data,'file_id':file.id,'name':file.name,'active':False,'deleted_at':None}
            db.commit()
            repair_saved_profile(db,user_id,archived)
            return {'resume_id':archived.id,'cached':True,'restored':True}
        active=next((r for r in records(db,user_id,'resume').all() if r.data.get('active')),None)
        old_lines=set(active.data['markdown'].splitlines()) if active else set()
        new_lines=set(md.splitlines())
        data={'name':file.name,'file_id':file.id,'hash':file.sha,'text_hash':text_hash,'markdown':md,'active':False,'approved':False,'created_at':now().isoformat(),'changes':{'previous_version_id':active.id if active else None,'added':sorted(new_lines-old_lines),'removed':sorted(old_lines-new_lines),'unchanged_lines':len(old_lines & new_lines)}}
        row=put(db,user_id,'resume',text_hash,data)
        data['rag']=rag.index(db,user_id,'candidate',row.id,md)
        profile=parsed_profile(md)

        # Check missing mandatory fields
        missing_fields = check_missing_mandatory_fields(profile)
        profile['missing_mandatory_fields'] = missing_fields
        if missing_fields:
            profile['unknowns'].append(f'Mandatory fields missing: {", ".join(missing_fields)}. Please complete them in Candidate Profile.')

        row.data={**data,'profile':profile}

        # Auto-populate and activate profile:
        # If no active profile exists, automatically populate active profile with extracted data from this resume.
        # If an active profile already exists, keep the existing active profile intact (preserving user edits/approval).
        existing_profile = get_record(db, user_id, 'profile', 'active')
        if not existing_profile:
            for r in records(db, user_id, 'resume').all():
                r.data = {**r.data, 'active': r.id == row.id}
            active_profile = {**profile, 'resume_version_id': row.id, 'approved': False}
            put(db, user_id, 'profile', 'active', active_profile)
            audit(db, user_id, 'resume_activated', {'resume_id': row.id, 'auto_activated': True})

        audit(db,user_id,'resume_ingested',{'resume_id':row.id})
        db.commit()
        return {'resume_id':row.id,'rag':data['rag'],'needs_review':True,'missing_mandatory_fields':missing_fields}
    if task.kind=='discover':
        profile=get_record(db,user_id,'profile','active')
        if profile and profile.data.get('approved') and (settings.llm_key or settings.fallback_key or settings.openrouter_key or settings.anthropic_key):
            # Find Jobs works directly: missing or outdated suggestions are produced first.
            generate_titles(db,user_id,p['module'],profile.data,report)
            if p['module']=='visa':
                generate_countries(db,user_id,profile.data,report)
        return discover(db,user_id,p['module'],progress=report)
    if task.kind=='research':
        profile=get_record(db,user_id,'profile','active')
        if not profile or not profile.data.get('approved'):
            raise ValueError('Approve a candidate profile first.')
        row,cached=generate_titles(db,user_id,p['module'],profile.data,report)
        return {'research_id':row.id,'cached':cached,'titles':sum(len(r.get('titles',[])) for r in row.data.get('regions',[])) or len(row.data.get('titles',[]))}
    if task.kind=='countries':
        profile=get_record(db,user_id,'profile','active')
        if not profile or not profile.data.get('approved'):
            raise ValueError('Approve a candidate profile first.')
        row,cached=generate_countries(db,user_id,profile.data,report)
        return {'research_id':row.id,'cached':cached}
    if task.kind=='generate':
        job=records(db,user_id,'job').filter_by(id=p['job_id']).first()
        profile=get_record(db,user_id,'profile','active')
        if not job or not profile or not profile.data.get('approved'):
            raise ValueError('Save the job and approve an active profile first.')
        ids=[]
        for kind in (['resume','cover_letter','motivational_letter'] if job.data.get('module')=='visa' else ['resume','cover_letter']):
            key=digest(json.dumps([kind,profile.data,{k:job.data.get(k) for k in ['id','company','title','country','description']},ai.PROMPT_VERSION,prompt_version('visa' if job.data.get('module')=='visa' else 'domestic',kind)],sort_keys=True))
            cached=get_record(db,user_id,'content',key)
            if cached:
                ids.append(cached.id); continue
            generated=ai.generate(ai.document_prompt(kind,profile.data,job.data),ai.document_validator(kind,'visa' if job.data.get('module')=='visa' else 'domestic'))
            data={'content_type':kind,'job_id':job.id,'structured_content':generated['content'],'markdown_content':ai.markdown(generated['content'],kind), 'resume_version_id':profile.data.get('resume_version_id'),'jd_hash':digest(job.data.get('description','')),'prompt_version':ai.PROMPT_VERSION,'model_id':generated['model'],'usage':generated['usage'],'content_hash':digest(json.dumps(generated['content'],sort_keys=True)), 'validation_status':'needs_review','created_at':now().isoformat()}
            row=put(db,user_id,'content',key,data)
            db.commit(); ids.append(row.id)
        return {'content_ids':ids,'needs_review':True}
    if task.kind=='document':
        kind=p['kind']
        module='domestic' if p['country'].strip().casefold()=='india' else 'visa'
        profile=get_record(db,user_id,'profile','active')
        version=p.get('resume_id') or (profile.data.get('resume_version_id') if profile else None)
        resume=records(db,user_id,'resume').filter_by(id=version).first() if version else None
        if not resume:
            raise ValueError('Choose a processed resume.')
        candidate=profile.data if profile and profile.data.get('resume_version_id')==version else resume.data.get('profile',{})
        job={'company':p.get('company',''),'country':p['country'],'description':p['jd'],'url':p.get('url',''),'prompt_module':module,'module':module}
        report({'stage':'Writing your '+kind.replace('_',' ')})
        key=digest(json.dumps([kind,candidate,job,ai.PROMPT_VERSION,ai.DOCUMENT_FORMAT_VERSION,prompt_version(module,kind)],sort_keys=True))
        cached=get_record(db,user_id,'content',key)
        if cached:
            return {'content_id':cached.id,'cached':True}
        generated=ai.generate(ai.document_prompt(kind,candidate,job),ai.document_validator(kind,module))
        from .latex_documents import document_latex
        data={'content_type':kind,'source':'documents_tab','document_format':ai.DOCUMENT_FORMAT_VERSION,'latex':document_latex(generated['content'],kind),'company':job['company'],'country':job['country'],'prompt_module':module,'jd_url':job['url'],
              'structured_content':generated['content'],'markdown_content':ai.markdown(generated['content'],kind),'resume_version_id':version,
              'jd_hash':digest(job['description']),'prompt_version':ai.PROMPT_VERSION,'model_id':generated['model'],'usage':generated['usage'],
              'content_hash':digest(json.dumps(generated['content'],sort_keys=True)),'validation_status':'needs_review','created_at':now().isoformat()}
        row=put(db,user_id,'content',key,data)
        db.commit()
        return {'content_id':row.id,'cached':False}
    if task.kind=='interview':
        profile=get_record(db,user_id,'profile','active')
        version=p.get('resume_id') or (profile.data.get('resume_version_id') if profile else None)
        resume=records(db,user_id,'resume').filter_by(id=version).first() if version else None
        if not resume:
            raise ValueError('Choose a processed resume.')
        candidate=profile.data if profile and profile.data.get('resume_version_id')==version else resume.data['profile']
        def progress(value):
            task.result={**value, '_started_at':(task.result or {}).get('_started_at',now().isoformat())}
            db.commit()
        result=interview_generate(db,user_id,p['kind'],candidate,p['jd'],version,p.get('company',''),progress=progress)
        rag.index(db,user_id,'interview',result['content_id'],p['jd'])
        return result
    if task.kind=='interview_answer':
        guide=records(db,user_id,'interview').filter_by(id=p['guide_id']).first()
        if not guide:
            raise ValueError('Interview guide not found.')
        questions=guide.data.get('questions',[])
        question=next((item for item in questions if item.get('id')==p['question_id']),None)
        if not question:
            raise ValueError('Interview question not found.')
        if question.get('answer'):
            raise ValueError('This interview question already has a saved answer.')
        resume=records(db,user_id,'resume').filter_by(id=guide.data.get('resume_version_id')).first()
        active=get_record(db,user_id,'profile','active')
        profile=active.data if active and active.data.get('resume_version_id')==guide.data.get('resume_version_id') else (resume.data.get('profile',{}) if resume else guide.data.get('candidate_context',{}))
        generated=generate_question_answer(
            guide.data.get('kind','technical'),
            question,
            profile,
            guide.data.get('jd',''),
            guide.data.get('company',''),
        )
        # End the read snapshot, then serialize against logout and refresh stale ORM objects.
        db.commit()
        from .answer_lifecycle import lock_user
        lock_user(db,user_id)
        db.expire_all()
        locked_task=db.query(Task).filter_by(id=task.id).populate_existing().first()
        session=db.get(Session,p.get('session_id',''))
        if not locked_task or locked_task.status!='running' or not session or session.user_id!=user_id:
            raise ValueError('Answer generation was cancelled because you logged out.')
        guide=records(db,user_id,'interview').filter_by(id=p['guide_id']).first()
        if not guide:
            raise ValueError('Interview guide not found.')
        questions=guide.data.get('questions',[])
        question=next((item for item in questions if item.get('id')==p['question_id']),None)
        if not question or question.get('answer'):
            raise ValueError('This interview answer could not be saved because the guide changed.')
        question={**question,'answer':generated['content']['answer'],'answer_model':generated['model'],'answer_usage':generated['usage']}
        guide.data={**guide.data,'questions':[
            question if item.get('id')==p['question_id'] else item
            for item in questions
        ]}
        db.commit()
        return {'guide_id':guide.id,'question_id':p['question_id'],'answered':True}
    if task.kind=='rag_reindex':
        resume=records(db,user_id,'resume').filter_by(id=p['resume_id']).one()
        result=rag.index(db,user_id,'candidate',resume.id,resume.data['markdown'])
        resume.data={**resume.data,'rag':result}; db.commit()
        return result
    raise ValueError('Unsupported task.')


WORKER_COUNT = 3
_claim_lock = Lock()


def task_priority(task):
    if task.kind in {'ingest', 'reparse', 'rag_reindex'}:
        return 1
    module = task.payload.get('module', 'domestic')
    if task.kind == 'research':
        return 31 if module == 'domestic' else 41
    if task.kind == 'countries':
        return 42
    if task.kind == 'discover':
        return 32 if module == 'domestic' else 43
    if task.kind == 'interview':
        return 51 if task.payload.get('kind') == 'technical' else 52
    if task.kind == 'interview_answer':
        return 50
    if task.kind == 'document':
        return 45
    return 60


def remaining_seconds(task):
    if task.status not in {'queued', 'running'}:
        return 0
    result = task.result or {}
    expected = {'ingest':45, 'reparse':45, 'research':60, 'countries':90, 'discover':180, 'interview_answer':180, 'document':120,
                'interview':1800 if task.payload.get('kind') == 'technical' else 4500}.get(task.kind, 60)
    started = result.get('_started_at')
    elapsed = max(0, (now() - datetime.fromisoformat(started)).total_seconds()) if started else 0
    done, total = result.get('questions', 0), result.get('total_questions', 0)
    if done and total:
        return max(5, round(max(10, elapsed / done) * (total-done)))
    return max(10, round(expected-elapsed))


def task_views(db, user_id):
    tasks = db.query(Task).filter_by(user_id=user_id).order_by(Task.created_at.desc()).all()
    active = sorted((t for t in tasks if t.status in {'queued','running'}), key=lambda t:(task_priority(t),t.created_at))
    lanes = [remaining_seconds(t) for t in active if t.status == 'running']
    lanes += [0] * max(0, WORKER_COUNT-len(lanes))
    heapq.heapify(lanes)
    estimates = {t.id:remaining_seconds(t) for t in active if t.status == 'running'}
    for t in active:
        if t.status == 'queued':
            finish = heapq.heappop(lanes) + remaining_seconds(t)
            estimates[t.id] = finish
            heapq.heappush(lanes,finish)
    total = max(lanes,default=0)
    visible = [t for t in tasks if t.status in {'queued','running'}] + [t for t in tasks if t.status not in {'queued','running'}][:30]
    return [{'id':t.id,'kind':t.kind,'module':t.payload.get('module'), 'interview_kind':t.payload.get('kind'),'question_id':t.payload.get('question_id'),'guide_id':t.payload.get('guide_id'),
             'status':t.status,'result':{k:v for k,v in (t.result or {}).items() if not k.startswith('_')},
             'error':t.error,'created_at':t.created_at.isoformat(),'priority':task_priority(t),
             'eta_seconds':estimates.get(t.id,0),'total_eta_seconds':total,'eta_is_estimate':True} for t in visible]


def run_one():
    with DB() as db:
        # A crashed AI task is marked failed, never silently reexecuted/charged.
        for task in db.query(Task).filter(Task.status=='running',Task.updated_at<now()-timedelta(hours=2)).all():
            task.status='failed'; task.error='Worker lease expired. Review saved work before retrying.'
        db.commit()
        with _claim_lock:
            candidates=db.query(Task).filter_by(status='queued').all()
            candidates.sort(key=lambda t:(task_priority(t),t.created_at))
            task=None
            for candidate in candidates:
                claimed=db.query(Task).filter_by(id=candidate.id,status='queued').update(
                    {'status':'running','result':{'_started_at':now().isoformat()}},synchronize_session=False)
                db.commit()
                if claimed:
                    task=db.get(Task,candidate.id)
                    db.refresh(task)
                    break
            if task is None:
                return False
        try:
            task.result=process(db,task)
            task.status='completed'; task.error=None
        except Exception as exc:
            db.rollback()
            task=db.get(Task,task.id)
            task.status='failed'
            # Never include provider bodies, tokens, resume text or file paths in UI errors.
            task.error=str(exc)[:500] if isinstance(exc,ValueError) else 'Processing failed ('+type(exc).__name__+'). Check backend service configuration and retry.'
            if task.kind=='interview' and task.result.get('content_id'):
                guide=records(db,task.user_id,'interview').filter_by(id=task.result['content_id']).first()
                if guide:
                    guide.data={**guide.data,'generation_status':'failed','generation_error':task.error}
        db.commit()
        return True
