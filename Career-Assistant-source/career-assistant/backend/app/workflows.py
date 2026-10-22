import json
from datetime import timedelta

from . import ai, rag
from .db import DB, File, Task, audit, digest, get_record, now, put, records
from .interviews import interview_generate
from .jobs import discover
from .resumes import bootstrap_profile, extract, extract_profile
from .config import settings
from .storage import read_bytes


def enqueue(db,user_id,kind,payload):
    task=Task(user_id=user_id,kind=kind,payload=payload)
    db.add(task); db.commit()
    return {'task_id':task.id,'status':'queued'}


def process(db,task):
    user_id=task.user_id
    p=task.payload
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
            return {'resume_id':same_text.id,'cached':True,'note':'Identical extracted content; original upload preserved.'}
        active=next((r for r in records(db,user_id,'resume').all() if r.data.get('active')),None)
        old_lines=set(active.data['markdown'].splitlines()) if active else set()
        new_lines=set(md.splitlines())
        data={'name':file.name,'file_id':file.id,'hash':file.sha,'text_hash':text_hash,'markdown':md,'active':False,'approved':False,'created_at':now().isoformat(),'changes':{'previous_version_id':active.id if active else None,'added':sorted(new_lines-old_lines),'removed':sorted(old_lines-new_lines),'unchanged_lines':len(old_lines & new_lines)}}
        row=put(db,user_id,'resume',text_hash,data)
        data['rag']=rag.index(db,user_id,'candidate',row.id,md)
        profile=bootstrap_profile(md)
        if settings.llm_key:
            try:
                profile=extract_profile(md)
            except ValueError as exc:
                profile['unknowns'].append('AI extraction was rejected or unavailable; complete the fields manually.')
        row.data={**data,'profile':profile}
        audit(db,user_id,'resume_ingested',{'resume_id':row.id})
        db.commit()
        return {'resume_id':row.id,'rag':data['rag'],'needs_review':True}
    if task.kind=='discover':
        return discover(db,user_id,p['module'])
    if task.kind=='research':
        profile=get_record(db,user_id,'profile','active')
        if not profile or not profile.data.get('approved'):
            raise ValueError('Approve a candidate profile first.')
        prompt={'task':'Suggest up to 20 relevant advertised job title search terms using candidate evidence. These are inferred recommendations, never live market research or hiring statistics. For visa searches suggest up to 10 candidate countries per region EU, Middle East, APAC excluding India, EMEA, New Zealand, Australia, United States, Canada. Deduplicate overlapping regions. No employer may be called a sponsor without supplied evidence.','schema':{'titles':[{'title':'string','relevance':'string','candidate_evidence':['string'],'classification':'Inferred'}],'countries':[{'country':'string','regions':['string'],'rationale':'string','classification':'Inferred'}]},'candidate':profile.data,'module':p['module']}
        data,model,usage=ai.json_call(json.dumps(prompt))
        if not isinstance(data.get('titles'),list) or not data['titles']:
            raise ValueError('Invalid title research.')
        row=put(db,user_id,'research',p['module'],{**data,'model':model,'usage':usage,'disclaimer':'Search suggestions, not verified current market research.'})
        rag.index(db,user_id,p['module'],row.id,json.dumps(data))
        db.commit()
        return {'research_id':row.id}
    if task.kind=='generate':
        job=records(db,user_id,'job').filter_by(id=p['job_id']).first()
        profile=get_record(db,user_id,'profile','active')
        if not job or not profile or not profile.data.get('approved'):
            raise ValueError('Save the job and approve an active profile first.')
        ids=[]
        for kind in ['resume','cover_letter']:
            key=digest(json.dumps([kind,profile.data,{k:job.data.get(k) for k in ['id','company','title','country','description']},ai.PROMPT_VERSION],sort_keys=True))
            cached=get_record(db,user_id,'content',key)
            if cached:
                ids.append(cached.id); continue
            generated=ai.generate(ai.document_prompt(kind,profile.data,job.data),ai.validate_document)
            data={'content_type':kind,'job_id':job.id,'structured_content':generated['content'],'markdown_content':ai.markdown(generated['content']), 'resume_version_id':profile.data.get('resume_version_id'),'jd_hash':digest(job.data.get('description','')),'prompt_version':ai.PROMPT_VERSION,'model_id':generated['model'],'usage':generated['usage'],'content_hash':digest(json.dumps(generated['content'],sort_keys=True)), 'validation_status':'needs_review','created_at':now().isoformat()}
            row=put(db,user_id,'content',key,data)
            db.commit(); ids.append(row.id)
        return {'content_ids':ids,'needs_review':True}
    if task.kind=='interview':
        profile=get_record(db,user_id,'profile','active')
        version=p.get('resume_id') or (profile.data.get('resume_version_id') if profile else None)
        resume=records(db,user_id,'resume').filter_by(id=version).first() if version else None
        if not resume:
            raise ValueError('Choose a processed resume.')
        candidate=profile.data if profile and profile.data.get('resume_version_id')==version else resume.data['profile']
        result=interview_generate(db,user_id,p['kind'],candidate,p['jd'],version,p.get('company',''))
        rag.index(db,user_id,'interview',result['content_id'],p['jd'])
        return result
    if task.kind=='rag_reindex':
        resume=records(db,user_id,'resume').filter_by(id=p['resume_id']).one()
        result=rag.index(db,user_id,'candidate',resume.id,resume.data['markdown'])
        resume.data={**resume.data,'rag':result}; db.commit()
        return result
    raise ValueError('Unsupported task.')


def run_one():
    with DB() as db:
        # A crashed AI task is marked failed, never silently reexecuted/charged.
        for task in db.query(Task).filter(Task.status=='running',Task.updated_at<now()-timedelta(hours=2)).all():
            task.status='failed'; task.error='Worker lease expired. Review saved work before retrying.'
        db.commit()
        task=db.query(Task).filter_by(status='queued').order_by(Task.created_at).with_for_update(skip_locked=True).first()
        if not task:
            return False
        task.status='running'; db.commit()
        try:
            task.result=process(db,task)
            task.status='completed'; task.error=None
        except Exception as exc:
            db.rollback()
            task=db.get(Task,task.id)
            task.status='failed'
            # Never include provider bodies, tokens, resume text or file paths in UI errors.
            task.error=str(exc)[:500] if isinstance(exc,ValueError) else 'Processing failed ('+type(exc).__name__+'). Check backend service configuration and retry.'
        db.commit()
        return True
