import io
import json
import os
import re
import secrets
import smtplib
import ssl
from contextlib import asynccontextmanager
from datetime import timedelta
from email.message import EmailMessage
from threading import Event, Thread
from typing import Literal
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, File as Upload, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError

from . import rag, ai
from .applications import channel
from .config import DEFAULT_GREENHOUSE_BOARDS, settings
from .db import DB, File, Record, ResetToken, Session, Task, User, audit, digest, get_record, migrate, now, put, records, uid
from .interviews import INTERVIEW_EXPORT_VERSION, clear_interview_answers, guide_sections
from .jobs import STATUSES, active_results, fetch_jd, match, required_documents, upsert_job
from .latex_documents import document_latex
from .prompt_library import section as prompt_section
from .rendering import render, render_application_document
from .resumes import check_missing_mandatory_fields, experience_summary
from .security import DUMMY_HASH, current, database, hasher, invalidate, password_ok, rate_limit, verify
from .storage import cleanup, read_bytes, remove_bytes, store, validate_upload
from .workflows import enqueue, repair_saved_profile, task_views


@asynccontextmanager
async def lifespan(app):
    settings.validate(); migrate()
    worker_stop = Event()
    worker_thread = None
    if settings.inline_worker:
        from .worker import run
        worker_thread = Thread(target=run, args=(worker_stop,), name='career-worker', daemon=True)
        worker_thread.start()
    try:
        yield
    finally:
        if worker_thread:
            worker_stop.set()
            worker_thread.join(timeout=5)


app=FastAPI(title='Career Assistant',version='0.1.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=[settings.frontend_url],allow_credentials=True,allow_methods=['GET','POST','PUT','PATCH','DELETE'],allow_headers=['Content-Type','X-CSRF-Token'])


@app.middleware('http')
async def security_headers(request,call_next):
    origin=request.headers.get('origin')
    if request.method not in ('GET','HEAD','OPTIONS') and origin and origin!=settings.frontend_url:
        return JSONResponse({'detail':'Origin not permitted. Match FRONTEND_URL to the browser origin.'},status_code=403)
    response=await call_next(request)
    response.headers.update({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"})
    if settings.cookie_secure:
        response.headers['Strict-Transport-Security']='max-age=31536000; includeSubDomains'
    return response


class Register(BaseModel):
    email:str=Field(max_length=254)
    username:str=Field(min_length=3,max_length=30)
    password:str=Field(min_length=8,max_length=1024)


class Login(BaseModel):
    username:str=Field(max_length=254)
    password:str=Field(max_length=1024)


class Email(BaseModel):
    email:str=Field(max_length=254)


class Reset(BaseModel):
    token:str=Field(max_length=200)
    password:str=Field(min_length=8,max_length=1024)


def owned(db,user_id,kind,id):
    row=records(db,user_id,kind).filter_by(id=id).first()
    if not row:
        raise HTTPException(404,'Record not found.')
    return row


def public(row):
    return {'id':row.id,**row.data,'created_at':row.created_at.isoformat(),'updated_at':row.updated_at.isoformat()}


@app.get('/api/health')
def health():
    return {'status':'ok','service':'Career Assistant'}


@app.post('/api/auth/register',status_code=201)
def register(body:Register,request:Request,db=Depends(database)):
    rate_limit(db,request,'register',limit=20)
    email=body.email.strip().lower(); username=body.username.lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email) or not re.fullmatch(r'[A-Za-z0-9_.]{3,30}',username):
        raise HTTPException(422,'Enter a valid email and a username using 3–30 letters, numbers, underscores or periods.')
    password_ok(body.password)
    user=User(email=email,username=username,password_hash=hasher.hash(body.password))
    db.add(user)
    try:
        db.flush(); put(db,user.id,'preferences','active',{'design':'amber','target_titles':[],'countries':[]}); audit(db,user.id,'registered'); db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409,'Email or username is already registered.')
    return {'message':'Registration successful. Log in using your username.'}


@app.post('/api/auth/login')
def login(body:Login,request:Request,response:Response,db=Depends(database)):
    rate_limit(db,request,'login',body.username,limit=10)
    user=db.query(User).filter_by(username=body.username.lower()).first()
    valid=verify(user.password_hash if user else DUMMY_HASH,body.password)
    if not user or not valid:
        raise HTTPException(401,'Invalid username or password.')
    token=secrets.token_urlsafe(48); csrf=secrets.token_urlsafe(32)
    db.add(Session(id=digest(token),user_id=user.id,csrf=csrf,expires_at=now()+timedelta(hours=settings.session_hours)))
    audit(db,user.id,'login'); db.commit()
    response.set_cookie('career_session',token,httponly=True,secure=settings.cookie_secure,samesite='lax',max_age=settings.session_hours*3600,path='/')
    return {'username':user.username,'csrf_token':csrf}


@app.get('/api/auth/me')
def me(request:Request,user=Depends(current)):
    return {'id':user.id,'username':user.username,'email':user.email,'csrf_token':request.state.session.csrf}


@app.post('/api/auth/logout')
def logout(request:Request,response:Response,user=Depends(current),db=Depends(database)):
    from .answer_lifecycle import lock_user
    lock_user(db,user.id)
    guides=records(db,user.id,'interview').populate_existing().all()
    guide_ids=[]
    for guide in guides:
        guide.data=clear_interview_answers(guide.data)
        guide_ids.append(guide.id)
    for batch in records(db,user.id,'interview_batch').all():
        batch.data=clear_interview_answers(batch.data)
    if guide_ids:
        for file in db.query(File).filter(
            File.user_id==user.id,
            File.record_id.in_(guide_ids),
            File.category=='temporary',
            File.deleted==False,
        ).all():
            file.expires_at=now()
    db.query(Task).filter(
        Task.user_id==user.id,
        Task.kind=='interview_answer',
        Task.status.in_(['queued','running']),
    ).update(
        {'status':'failed','error':'Answer generation was cancelled because you logged out.'},
        synchronize_session=False,
    )
    db.execute(delete(Session).where(Session.id==request.state.session.id))
    audit(db,user.id,'logout',{'interview_answers_cleared':True})
    db.commit()
    response.delete_cookie('career_session',path='/')
    return {'message':'Logged out. Saved questions remain; generated interview answers were cleared.'}


@app.post('/api/auth/forgot-password')
def forgot(body:Email,request:Request,db=Depends(database)):
    rate_limit(db,request,'password-reset',body.email,limit=5)
    user=db.query(User).filter_by(email=body.email.lower().strip()).first()
    if user and settings.smtp_host:
        token=secrets.token_urlsafe(48)
        db.add(ResetToken(id=digest(token),user_id=user.id,expires_at=now()+timedelta(minutes=30)))
        db.commit()
        message=EmailMessage(); message['Subject']='Reset your Career Assistant password'; message['From']=settings.mail_from; message['To']=user.email
        message.set_content('This link expires in 30 minutes and can be used once:\n'+settings.frontend_url+'/?reset='+token+'\n\nIf you did not request this, ignore this email.')
        try:
            with smtplib.SMTP(settings.smtp_host,settings.smtp_port,timeout=15) as smtp:
                smtp.starttls(context=ssl.create_default_context())
                if settings.smtp_user:
                    smtp.login(settings.smtp_user,settings.smtp_password)
                smtp.send_message(message)
        except (smtplib.SMTPException,OSError):
            # Identical response for all users; never leak account existence/provider errors.
            db.execute(delete(ResetToken).where(ResetToken.id==digest(token))); db.commit()
    return {'message':'If the address is registered, a password reset email will be sent when email delivery is available.'}


@app.post('/api/auth/reset-password')
def reset_password(body:Reset,request:Request,db=Depends(database)):
    rate_limit(db,request,'reset-token',limit=10)
    token=db.query(ResetToken).filter_by(id=digest(body.token)).with_for_update().first()
    if not token or token.expires_at<=now():
        raise HTTPException(400,'Reset link is invalid or expired.')
    password_ok(body.password)
    user=db.get(User,token.user_id); user.password_hash=hasher.hash(body.password)
    db.execute(delete(ResetToken).where(ResetToken.user_id==user.id)); invalidate(db,user.id); audit(db,user.id,'password_reset'); db.commit()
    return {'message':'Password updated. Log in using your existing username.'}


@app.get('/api/dashboard')
def dashboard(user=Depends(current),db=Depends(database)):
    jobs=[r.data for r in records(db,user.id,'job').all()]
    return {'saved':len(jobs),'applied':sum(j['status']!='NOT APPLIED' for j in jobs),'interviews':sum(j['status']=='INTERVIEW' for j in jobs),'guides':records(db,user.id,'interview').count(),'profile':get_record(db,user.id,'profile','active').data if get_record(db,user.id,'profile','active') else None}


@app.get('/api/integrations')
def integrations(user=Depends(current)):
    return {'ai':bool(settings.llm_key or settings.fallback_key or settings.openrouter_key or settings.anthropic_key),'fallback':bool(settings.fallback_key or settings.llm_key or settings.openrouter_key or settings.anthropic_key),'semantic_search':bool(settings.qdrant_url and settings.llm_key),'job_discovery':bool(settings.greenhouse_boards or settings.lever_sites or DEFAULT_GREENHOUSE_BOARDS),'password_email':bool(settings.smtp_host),'object_storage':bool(settings.s3_bucket),'database':'PostgreSQL' if settings.database_url.startswith('postgresql') else 'SQLite (local development)','submission':'Employer-authorized Greenhouse connector when configured; otherwise external application'}


@app.get('/api/preferences')
def preferences(user=Depends(current),db=Depends(database)):
    row=get_record(db,user.id,'preferences','active')
    return {**(row.data if row else {}),'design':'amber'}


class Preferences(BaseModel):
    design:Literal['amber']='amber'
    target_titles:list[str]=Field(default_factory=list,max_length=20)
    countries:list[str]=Field(default_factory=list,max_length=80)


@app.put('/api/preferences')
def save_preferences(body:Preferences,user=Depends(current),db=Depends(database)):
    put(db,user.id,'preferences','active',body.model_dump()); db.commit()
    return body


@app.post('/api/resumes')
async def upload_resume(file:UploadFile=Upload(...),user=Depends(current),db=Depends(database)):
    blob=await file.read(settings.max_upload+1); validate_upload(file.filename,blob)
    existing=db.query(File).filter_by(user_id=user.id,sha=digest(blob),category='original',deleted=False).first()
    stored=existing or store(db,user.id,file.filename,blob,'original')
    return enqueue(db,user.id,'ingest',{'file_id':stored.id})


@app.get('/api/resumes')
def resumes(user=Depends(current),db=Depends(database)):
    rows = records(db,user.id,'resume').order_by(Record.created_at.desc()).all()
    for row in rows:
        repair_saved_profile(db, user.id, row)
    return [public(r) for r in rows]


@app.delete('/api/resumes/{id}')
def delete_resume(id:str,user=Depends(current),db=Depends(database)):
    resume=owned(db,user.id,'resume',id)
    active=get_record(db,user.id,'profile','active')
    if resume.data.get('active') or (active and active.data.get('resume_version_id') == id):
        raise HTTPException(409,'Choose another active resume before deleting this one.')
    for task in db.query(Task).filter(Task.user_id==user.id,Task.status.in_(['queued','running'])).all():
        if task.payload.get('resume_id') == id or task.payload.get('file_id') == resume.data.get('file_id'):
            raise HTTPException(409,'Wait for tasks using this resume to finish before deleting it.')
    file=db.query(File).filter_by(id=resume.data.get('file_id'),user_id=user.id,deleted=False).first()
    shared=any(row.id != id and row.data.get('file_id') == resume.data.get('file_id') for row in records(db,user.id,'resume').all())
    if file and not shared:
        remove_bytes(file.key)
        file.deleted=True
    # Archive the processed version so RAG references and existing guides remain valid.
    resume.kind='resume_archive'
    resume.data={**resume.data,'active':False,'deleted_at':now().isoformat()}
    audit(db,user.id,'resume_deleted',{'resume_id':id,'knowledge_preserved':True})
    db.commit()
    return {'deleted':True,'knowledge_preserved':True}


@app.post('/api/resumes/{id}/activate')
def activate(id:str,user=Depends(current),db=Depends(database)):
    resume=owned(db,user.id,'resume',id)
    existing=get_record(db,user.id,'profile','active')
    if resume.data.get('active') and existing:
        return {'message':'This resume is already active. Your reviewed profile is preserved.','profile':existing.data}
    for r in records(db,user.id,'resume').all():
        r.data={**r.data,'active':r.id==id}
    profile={**resume.data['profile'],'resume_version_id':id,'approved':False}
    put(db,user.id,'profile','active',profile); audit(db,user.id,'resume_activated',{'resume_id':id}); db.commit()
    return {'message':'Active resume changed. Review and approve the extracted profile.','profile':profile}


@app.post('/api/resumes/{id}/reindex')
def reindex(id:str,user=Depends(current),db=Depends(database)):
    owned(db,user.id,'resume',id)
    return enqueue(db,user.id,'rag_reindex',{'resume_id':id})


@app.post('/api/resumes/{id}/reparse')
def reparse_resume(id:str,user=Depends(current),db=Depends(database)):
    owned(db,user.id,'resume',id)
    return enqueue(db,user.id,'reparse',{'resume_id':id})


@app.get('/api/profile')
def profile(user=Depends(current),db=Depends(database)):
    row=get_record(db,user.id,'profile','active')
    if row:
        resume=records(db,user.id,'resume').filter_by(id=row.data.get('resume_version_id')).first()
        if resume:
            repair_saved_profile(db,user.id,resume)
    return row.data if row else None


class Profile(BaseModel):
    name:str=Field(default='',max_length=200)
    email:str=Field(default='',max_length=254)
    phone:str=Field(default='',max_length=100)
    linkedin:str=Field(default='',max_length=500)
    portfolio:str=Field(default='',max_length=500)
    location:str=Field(default='',max_length=200)
    designation:str=Field(default='',max_length=200)
    skills:list[str]=Field(default_factory=list,max_length=150)
    employments:list[dict]=Field(default_factory=list,max_length=50)
    education:list[str]=Field(default_factory=list,max_length=30)
    certifications:list[str]=Field(default_factory=list,max_length=50)
    projects:list[str]=Field(default_factory=list,max_length=50)
    achievements:list[str]=Field(default_factory=list,max_length=100)
    notice_period:str=Field(default='',max_length=200)
    salary_expectations:str=Field(default='',max_length=200)
    relocation_confirmed:bool=False
    approved:bool=False


@app.put('/api/profile')
def save_profile(body:Profile,user=Depends(current),db=Depends(database)):
    row=get_record(db,user.id,'profile','active')
    if not row:
        raise HTTPException(409,'Upload and activate a resume first.')
    if len(json.dumps(body.model_dump()))>100000:
        raise HTTPException(422,'Profile too large.')
    missing = check_missing_mandatory_fields(body.model_dump())
    row.data={**row.data,**body.model_dump(),'classification':'User-provided','experience':experience_summary(body.employments),'missing_mandatory_fields':missing}
    resume=owned(db,user.id,'resume',row.data['resume_version_id'])
    resume.data={**resume.data,'profile':row.data,'approved':body.approved}
    for job in records(db,user.id,'job').all():
        job.data={**job.data,'match':match(row.data,job.data)}
    audit(db,user.id,'profile_updated'); db.commit()
    return row.data


@app.get('/api/knowledge')
def knowledge(query:str='',namespace:str='candidate',user=Depends(current),db=Depends(database)):
    profile=get_record(db,user.id,'profile','active')
    if not profile:
        return {'mode':'empty','sources':[]}
    return rag.retrieve(db,user.id,namespace,profile.data.get('resume_version_id',''),query)


class Search(BaseModel):
    module:Literal['domestic','visa']


@app.post('/api/jobs/discover')
def find_jobs(body:Search,user=Depends(current),db=Depends(database)):
    return enqueue(db,user.id,'discover',body.model_dump())


@app.post('/api/research')
def research(body:Search,user=Depends(current),db=Depends(database)):
    return enqueue(db,user.id,'research',body.model_dump())


@app.post('/api/research/countries')
def suggest_countries(user=Depends(current),db=Depends(database)):
    return enqueue(db,user.id,'countries',{'module':'visa'})


@app.get('/api/research/{module}')
def saved_research(module:str,user=Depends(current),db=Depends(database)):
    row=get_record(db,user.id,'research',module)
    if not row:
        return None
    data=dict(row.data)
    if not (data.get('live_evidence') or {}).get('available'):
        data['live_evidence']={'available':False}
    return data


class JobInput(BaseModel):
    company:str=Field(min_length=1,max_length=200)
    title:str=Field(min_length=1,max_length=300)
    location:str=Field(min_length=1,max_length=200)
    country:str=Field(min_length=1,max_length=100)
    url:str=Field(max_length=2000)
    description:str=Field(min_length=30,max_length=60000)
    requisition_id:str=Field(default='',max_length=200)
    mandatory_documents:list[str]=Field(default_factory=list,max_length=30)
    mandatory_documents_known:bool=False
    requirements:dict=Field(default_factory=dict)


@app.post('/api/jobs',status_code=201)
def add_job(body:JobInput,user=Depends(current),db=Depends(database)):
    p=urlparse(body.url)
    if p.scheme!='https' or not p.hostname or p.username or p.password:
        raise HTTPException(422,'Use an HTTPS application URL.')
    data=body.model_dump(); data.update({'source':'manual','verification':{'status':'Not found on company website / third-party listing only','classification':'User-provided','checked_at':None}})
    row=upsert_job(db,user.id,data)
    if row is None: raise HTTPException(409,'This job was deleted and is suppressed from rediscovery.')
    audit(db,user.id,'job_saved',{'job_id':row.id}); db.commit()
    return public(row)


@app.get('/api/jobs')
def list_jobs(module:Literal['domestic','visa']='domestic',page:int=1,status:str='',q:str='',sort:str='default',history:bool=False,view:Literal['latest','previous']='latest',user=Depends(current),db=Depends(database)):
    page=max(1,page)
    # Jobs saved before document detection existed get their required documents filled in once.
    changed=False
    for row in records(db,user.id,'job').all():
        if row.data.get('module')==module and not row.data.get('mandatory_documents_known') and not row.data.get('documents_edited'):
            row.data={**row.data,'mandatory_documents':required_documents(row.data,module),'mandatory_documents_known':True,'documents_source':'Job description'}
            changed=True
    if changed:
        db.commit()
    if view=='previous':
        # Every job found to date, with its current status, including older ones.
        rows=[r for r in records(db,user.id,'job').all() if r.data.get('module')==module]
        data=active_results(rows,module,status,q,sort if sort!='default' else 'date',True)
        return {'items':data[(page-1)*30:page*30],'total':len(data),'page':page,'page_size':30}
    run=get_record(db,user.id,'discovery_run',module)
    if run and not history and not q and not status:
        ids=run.data.get('job_ids',[])
        latest=[d for d in active_results(records(db,user.id,'job').all(),module,'','',sort,True) if d['id'] in ids or d.get('source')=='manual']
        if sort=='default':
            latest.sort(key=lambda d:ids.index(d['id']) if d['id'] in ids else len(ids))
        return {'items':latest[(page-1)*30:page*30],'total':len(latest),'page':page,'page_size':30,'found_at':run.data.get('at')}
    data=active_results(records(db,user.id,'job').all(),module,status,q,sort,history)
    if not history and get_record(db,user.id,'research',module):
        from .search_scope import resolve_scope, matches_scope
        profile=get_record(db,user.id,'profile','active')
        try:
            scope=resolve_scope(db,user.id,module,profile.data if profile else {})
            data=[job for job in data if job.get('source')=='manual' or matches_scope(job,scope)]
        except ValueError:
            data=[job for job in data if job.get('source')=='manual']
    return {'items':data[(page-1)*30:page*30],'total':len(data),'page':page,'page_size':30}


@app.get('/api/jobs/{id}')
def job_detail(id:str,user=Depends(current),db=Depends(database)):
    return public(owned(db,user.id,'job',id))


@app.delete('/api/jobs/{id}')
def delete_job(id:str,user=Depends(current),db=Depends(database)):
    row=owned(db,user.id,'job',id)
    if any(t.payload.get('job_id')==id or id in t.payload.get('job_ids',[]) for t in db.query(Task).filter(Task.user_id==user.id,Task.status.in_(['queued','running'])).all()):
        raise HTTPException(409,'Wait for the active job task to finish before deleting this job.')
    for attachment in db.query(File).filter_by(user_id=user.id,record_id=id,category='attachment',deleted=False).all():
        remove_bytes(attachment.key)
        attachment.deleted=True
    row.kind='deleted_job'
    row.data={'url':row.data.get('url',''),'deleted_at':now().isoformat()}
    db.commit()
    return {'deleted':True,'generated_documents_preserved':True}


class JobPatch(BaseModel):
    status:Literal['NOT APPLIED','APPLIED','SCREENING','INTERVIEW','WAITING FOR OFFER','SELECTED','REJECTED']|None=None
    comment:str|None=Field(default=None,max_length=4000)
    mandatory_documents:list[str]|None=Field(default=None,max_length=30)
    mandatory_documents_known:bool|None=None


@app.patch('/api/jobs/{id}')
def patch_job(id:str,body:JobPatch,user=Depends(current),db=Depends(database)):
    row=owned(db,user.id,'job',id); data={**row.data}
    if body.status is not None and body.status!=data['status']:
        data['history']=[*data.get('history',[]),{'from':data['status'],'to':body.status,'at':now().isoformat(),'source':'manual status change; submission not verified'}]
        data['status']=body.status
    if body.comment is not None:
        data['comment']=body.comment
    if body.mandatory_documents is not None:
        data['mandatory_documents']=body.mandatory_documents
        data['documents_edited']=True
    if body.mandatory_documents_known is not None:
        data['mandatory_documents_known']=body.mandatory_documents_known
    row.data=data; db.commit()
    return public(row)


@app.post('/api/jobs/{id}/attachments')
async def attachment(id:str,file:UploadFile=Upload(...),document_type:str='Supporting document',user=Depends(current),db=Depends(database)):
    job=owned(db,user.id,'job',id)
    blob=await file.read(settings.max_upload+1); validate_upload(file.filename,blob)
    file_row=store(db,user.id,file.filename,blob,'attachment',job.id)
    job.data={**job.data,'attachment_ids':[*job.data.get('attachment_ids',[]),{'id':file_row.id,'name':file_row.name,'document_type':document_type[:100]}]}; db.commit()
    return {'id':file_row.id,'name':file_row.name}


class Bulk(BaseModel):
    job_ids:list[str]=Field(min_length=1,max_length=100)


@app.post('/api/applications/prepare')
def prepare(body:Bulk,user=Depends(current),db=Depends(database)):
    outcomes=[]
    for id in dict.fromkeys(body.job_ids):
        row=owned(db,user.id,'job',id); d=row.data
        profile=get_record(db,user.id,'profile','active')
        available={x['document_type'].lower() for x in d.get('attachment_ids',[])}
        generated=[r for r in records(db,user.id,'content').all() if r.data.get('job_id')==id and r.data.get('validation_status')=='approved' and profile and r.data.get('resume_version_id')==profile.data.get('resume_version_id') and r.data.get('jd_hash')==digest(d.get('description',''))]
        available.update(r.data['content_type'].replace('_',' ') for r in generated)
        documents=d.get('mandatory_documents') if d.get('mandatory_documents_known') else required_documents(d,d.get('module'))
        aliases={'resume/cv':{'resume','resume/cv','cv'}}
        missing=[x for x in documents if not (aliases.get(x.lower(),{x.lower()}) & available)]
        errors=[]
        if missing: errors.append('Missing documents: '+', '.join(missing))
        if d['status']!='NOT APPLIED': errors.append('Already in application tracking; review before applying again.')
        outcomes.append({'job_id':id,'valid':not errors,'errors':errors,'url':d['url'],'channel':channel(d),'message':'Review the submission channel. No submission has been made.'})
    audit(db,user.id,'application_prepared',{'job_ids':body.job_ids}); db.commit()
    return {'outcomes':outcomes,'requires_confirmation':True}


class Submit(Bulk):
    confirmed:bool


@app.post('/api/applications/submit')
def submit_applications(body:Submit,user=Depends(current),db=Depends(database)):
    if not body.confirmed:
        raise HTTPException(422,'Explicit confirmation is required before sending candidate documents to employers.')
    validation=prepare(Bulk(job_ids=body.job_ids),user,db)
    valid=[o['job_id'] for o in validation['outcomes'] if o['valid'] and o['channel']=='greenhouse']
    if not valid:
        raise HTTPException(409,'No selected jobs have a valid employer-authorized submission connector. Use the external application channel.')
    return enqueue(db,user.id,'submit',{'job_ids':valid,'user_confirmed_at':now().isoformat()})


class Confirm(BaseModel):
    confirmation_reference:str=Field(min_length=5,max_length=2000)
    confirmed:bool


@app.post('/api/applications/{id}/confirm')
def confirm_application(id:str,body:Confirm,user=Depends(current),db=Depends(database)):
    row=owned(db,user.id,'job',id)
    if not body.confirmed:
        raise HTTPException(422,'Confirm receipt of the employer submission confirmation.')
    stamp=now().isoformat()
    row.data={**row.data,'status':'APPLIED','applied_at':stamp,'history':[*row.data.get('history',[]),{'to':'APPLIED','at':stamp,'source':'User-provided submission confirmation','reference':body.confirmation_reference}]}
    audit(db,user.id,'application_confirmed',{'job_id':id,'classification':'User-provided'}); db.commit()
    return {'message':'Application recorded from your confirmation.','classification':'User-provided'}


@app.post('/api/jobs/{id}/generate')
def generate_documents(id:str,user=Depends(current),db=Depends(database)):
    owned(db,user.id,'job',id)
    return enqueue(db,user.id,'generate',{'job_id':id})


@app.get('/api/content')
def contents(job_id:str='',source:str='',user=Depends(current),db=Depends(database)):
    rows=[r for r in records(db,user.id,'content').all() if (not job_id or r.data.get('job_id')==job_id) and (not source or r.data.get('source')==source)]
    rows.sort(key=lambda r:r.created_at,reverse=True)
    return [public(r) for r in rows]


class DocumentRequest(BaseModel):
    kind:Literal['resume','cover_letter','motivational_letter']
    country:str=Field(min_length=2,max_length=100)
    jd:str=Field(min_length=30,max_length=60000)
    company:str=Field(default='',max_length=200)
    url:str=Field(default='',max_length=2000)
    resume_id:str|None=None


@app.post('/api/documents')
def create_document(body:DocumentRequest,user=Depends(current),db=Depends(database)):
    if len(body.country.strip())<2:
        raise HTTPException(422,'Country is required.')
    if body.resume_id: owned(db,user.id,'resume',body.resume_id)
    return enqueue(db,user.id,'document',{**body.model_dump(),'country':body.country.strip()})


@app.post('/api/content/{id}/approve')
def approve(id:str,user=Depends(current),db=Depends(database)):
    row=owned(db,user.id,'content',id)
    row.data={**row.data,'validation_status':'approved'}; audit(db,user.id,'content_approved',{'content_id':id}); db.commit()
    return public(row)


class ContentEdit(BaseModel):
    structured_content:dict


@app.put('/api/content/{id}')
def edit_content(id:str,body:ContentEdit,user=Depends(current),db=Depends(database)):
    row=owned(db,user.id,'content',id)
    kind=row.data.get('content_type')
    final=row.data.get('document_format')==ai.DOCUMENT_FORMAT_VERSION
    content={**{k:row.data['structured_content'].get(k) for k in ('name','contact','title') if k in row.data.get('structured_content',{})},**body.structured_content} if final else body.structured_content
    try:
        module=row.data.get('prompt_module') or ('visa' if (records(db,user.id,'job').filter_by(id=row.data.get('job_id')).first() or Record(data={})).data.get('module')=='visa' else 'domestic')
        if final:
            ai.document_validator(kind,module)(content)
        elif kind=='motivational_letter':
            ai.validate_document(content)
            low,high=ai.motivational_word_limits(prompt_section(module,kind))
            words=ai.word_count(ai.letter_text(content))
            if not low<=words<=high:
                raise ValueError(f'Motivational letter has {words} words; the prompt allows {low}–{high} (at most {high}).')
        else:
            ai.validate_document(content)
    except ValueError as exc:
        raise HTTPException(422,str(exc))
    body.structured_content=content
    latex={'latex':document_latex(content,kind)} if final else {}
    put(db,user.id,'content_version',uid(),{'content_id':id,**row.data})
    row.data={**row.data,**latex,'structured_content':body.structured_content,'markdown_content':ai.markdown(body.structured_content,row.data.get('content_type')),'content_hash':digest(json.dumps(body.structured_content,sort_keys=True)),'validation_status':'needs_review','last_edit_classification':'User-provided'}
    for file in db.query(File).filter_by(user_id=user.id,record_id=id,category='temporary',deleted=False).all():
        file.expires_at=now()
    audit(db,user.id,'content_edited',{'content_id':id}); db.commit()
    return public(row)


@app.post('/api/content/{id}/render')
def render_content(id:str,format:Literal['docx','pdf','tex','zip']='pdf',user=Depends(current),db=Depends(database)):
    row=records(db,user.id,'content').filter_by(id=id).first() or records(db,user.id,'interview').filter_by(id=id).first()
    if not row:
        raise HTTPException(404,'Content not found.')
    content=row.data['structured_content'] if row.kind=='content' else guide_sections(row.data)
    if row.kind=='content' and row.data.get('content_type')=='motivational_letter':
        content={**content,'letter':True}
    if row.kind=='content' and row.data.get('validation_status')!='approved' and row.data.get('source')!='documents_tab':
        raise HTTPException(409,'Review and approve generated text before rendering application documents.')
    final=row.kind=='content' and row.data.get('document_format')==ai.DOCUMENT_FORMAT_VERSION
    prefix=row.data.get('content_type','interview-guide')
    prefix+='-'+os.getenv('DOCUMENT_RENDERER','native')+('-v3' if final else '-v2')
    if row.kind=='content':
        # Edits change the hash, so a stale cached file is never served.
        prefix+='-'+row.data.get('content_hash',digest(json.dumps(content,sort_keys=True)))[:12]
    if final and format=='zip':
        raise HTTPException(422,'Download the Word, PDF or LaTeX file individually.')
    if row.kind=='interview':
        # A record ID alone cannot identify an export: questions and templates
        # change while the same guide remains in the library.
        fingerprint=digest(json.dumps([INTERVIEW_EXPORT_VERSION,content],sort_keys=True))[:20]
        prefix=f'{prefix}-{fingerprint}'
        invalidated=False
        for file in db.query(File).filter(File.user_id==user.id,File.record_id==id,File.category=='temporary',File.deleted==False,File.expires_at>now()).all():
            if not file.name.startswith(prefix+'.'):
                file.expires_at=now()
                invalidated=True
        if invalidated:
            db.commit()
    cached=db.query(File).filter(File.user_id==user.id,File.record_id==id,File.category=='temporary',File.deleted==False,File.name==f'{prefix}.{format}',File.expires_at>now()).first()
    if cached:
        return {'file_id':cached.id,'url':'/api/files/'+cached.id,'expires_at':cached.expires_at.isoformat(),'cached':True}
    try:
        blob=render_application_document(content,row.data['content_type'],format) if final else render(content,format)
    except ValueError as exc:
        raise HTTPException(422,str(exc)) from exc
    f=store(db,user.id,f'{prefix}.{format}',blob,'temporary',id,now()+timedelta(hours=24)); db.commit()
    return {'file_id':f.id,'url':'/api/files/'+f.id,'expires_at':f.expires_at.isoformat(),'cached':False}


@app.get('/api/files/{id}')
def download(id:str,user=Depends(current),db=Depends(database)):
    f=db.query(File).filter_by(id=id,user_id=user.id,deleted=False).first()
    if not f or f.expires_at and f.expires_at<=now():
        raise HTTPException(410,'File is expired or unavailable. Regenerate it from saved content.')
    mime={'pdf':'application/pdf','docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','zip':'application/zip','tex':'application/x-tex'}
    safe=re.sub(r'[^A-Za-z0-9_.-]','_',f.name)
    return StreamingResponse(io.BytesIO(read_bytes(f.key)),media_type=mime.get(safe.rsplit('.',1)[-1],'application/octet-stream'),headers={'Content-Disposition':f'attachment; filename="{safe}"'})


class JDURL(BaseModel):
    url:str=Field(max_length=2000)


@app.post('/api/jd/extract')
def extract_jd(body:JDURL,user=Depends(current)):
    try:
        return {'text':fetch_jd(body.url),'classification':'User-provided URL; review before use.'}
    except Exception as exc:
        raise HTTPException(422,str(exc) if isinstance(exc,ValueError) else 'Unable to retrieve JD. Paste the job description instead.')


class Interview(BaseModel):
    kind:Literal['technical','hr']
    jd:str=Field(min_length=30,max_length=60000)
    resume_id:str|None=None
    company:str=Field(default='',max_length=200)


@app.post('/api/interviews')
def create_interview(body:Interview,user=Depends(current),db=Depends(database)):
    if body.resume_id: owned(db,user.id,'resume',body.resume_id)
    return enqueue(db,user.id,'interview',body.model_dump())


@app.get('/api/interviews')
def interviews(user=Depends(current),db=Depends(database)):
    return [{k:v for k,v in public(r).items() if k not in {'plans','category_plans'}} for r in records(db,user.id,'interview').order_by(Record.created_at.desc()).all() if r.data.get('generation_mode')!='built_in']


@app.post('/api/interviews/{id}/questions/{question_id}/answer',status_code=202)
def answer_interview_question(id:str,question_id:str,request:Request,user=Depends(current),db=Depends(database)):
    from .answer_lifecycle import lock_user
    lock_user(db,user.id)
    guide=owned(db,user.id,'interview',id)
    if guide.data.get('generation_status') not in (None, 'completed'):
        raise HTTPException(409,'Wait for question generation to finish before requesting answers.')
    question=next((item for item in guide.data.get('questions',[]) if item.get('id')==question_id),None)
    if not question:
        raise HTTPException(404,'Interview question not found.')
    if question.get('answer'):
        raise HTTPException(409,'This question already has a saved answer.')
    active=db.query(Task).filter(
        Task.user_id==user.id,
        Task.kind=='interview_answer',
        Task.status.in_(['queued','running']),
    ).first()
    if active:
        raise HTTPException(409,'An interview answer is already being generated. Wait for it to finish first.')
    return enqueue(db,user.id,'interview_answer',{
        'guide_id':id,
        'question_id':question_id,
        'session_id':request.state.session.id,
    })


@app.post('/api/interviews/{id}/sessions')
def save_mock(id:str,body:dict,user=Depends(current),db=Depends(database)):
    owned(db,user.id,'interview',id)
    if len(json.dumps(body))>100000: raise HTTPException(422,'Session is too large.')
    row=put(db,user.id,'mock_session',uid(),{'guide_id':id,'responses':body,'created_at':now().isoformat()}); db.commit()
    return {'id':row.id}


@app.get('/api/tasks')
def tasks(user=Depends(current),db=Depends(database)):
    return task_views(db,user.id)


@app.get('/api/tasks/{id}')
def task(id:str,user=Depends(current),db=Depends(database)):
    t=db.query(Task).filter_by(id=id,user_id=user.id).first()
    if not t: raise HTTPException(404,'Task not found.')
    return next((item for item in task_views(db,user.id) if item['id']==id), {'id':t.id,'kind':t.kind,'status':t.status,'result':t.result,'error':t.error,'eta_seconds':0})


@app.get('/api/storage')
def storage_usage(user=Depends(current),db=Depends(database)):
    files=db.query(File).filter_by(user_id=user.id,deleted=False).all()
    return {'bytes':sum(f.size for f in files),'permanent_bytes':sum(f.size for f in files if f.category!='temporary'),'temporary_bytes':sum(f.size for f in files if f.category=='temporary'),'temporary_files':sum(f.category=='temporary' for f in files),'expiry_hours':24}


class DeleteAccount(BaseModel):
    password:str=Field(max_length=1024)


@app.delete('/api/account')
def delete_account(body:DeleteAccount,response:Response,user=Depends(current),db=Depends(database)):
    if not verify(user.password_hash,body.password):
        raise HTTPException(403,'Invalid password.')
    if db.query(Task).filter(Task.user_id==user.id,Task.status=='running').count():
        raise HTTPException(409,'Wait for active tasks to finish before deleting your account.')
    rag.delete_tenant(user.id)
    for f in db.query(File).filter_by(user_id=user.id).all(): remove_bytes(f.key)
    db.delete(db.get(User,user.id)); db.commit(); response.delete_cookie('career_session',path='/')
    return {'message':'Account and stored personal data deleted.'}
