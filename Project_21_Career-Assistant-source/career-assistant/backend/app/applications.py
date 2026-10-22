"""Opt-in employer-authorized Greenhouse integration; external fallback otherwise."""
import json
from urllib.parse import urlparse

import httpx

from .config import settings
from .db import File, Record, audit, get_record, now, put, records, uid
from .rendering import render
from .storage import read_bytes


def submission_boards():
    try:
        value=json.loads(settings.greenhouse_submission_keys)
        return value if isinstance(value,dict) else {}
    except ValueError:
        return {}


def channel(job):
    source=job.get('source','')
    board=source.split(':',1)[1] if source.startswith('greenhouse:') else ''
    return 'greenhouse' if board and submission_boards().get(board) else 'external'


def submit_one(db,user_id,job_id):
    # Claim once before the external side effect. Unknown outcomes are never replayed.
    job=records(db,user_id,'job').filter_by(id=job_id).with_for_update().first()
    if not job:
        return {'job_id':job_id,'status':'failed','reason':'Job not found.'}
    if job.data.get('status')!='NOT APPLIED':
        return {'job_id':job_id,'status':'skipped','reason':'Application is already being tracked.'}
    if channel(job.data)!='greenhouse':
        return {'job_id':job_id,'status':'external_required','reason':'No authorized submission connector is configured for this employer.'}
    previous=get_record(db,user_id,'application_attempt',job_id)
    if previous and previous.data.get('status')!='failed_validation':
        return {'job_id':job_id,'status':'blocked','reason':'An earlier connector attempt exists. Review its outcome; automatic retries are disabled to prevent duplicate applications.'}
    if previous:
        put(db,user_id,'application_attempt_history',uid(),previous.data)
    profile=get_record(db,user_id,'profile','active')
    if not profile or not profile.data.get('approved'):
        return {'job_id':job_id,'status':'failed','reason':'An approved profile is required.'}
    name=profile.data.get('name','').strip().split(maxsplit=1)
    if len(name)<2 or not profile.data.get('email'):
        return {'job_id':job_id,'status':'failed','reason':'Confirm your full name and email in your profile.'}
    board=job.data['source'].split(':',1)[1]
    requisition=job.data.get('requisition_id','')
    if not requisition.isdigit():
        return {'job_id':job_id,'status':'failed','reason':'Invalid ATS job identifier.'}
    endpoint=f'https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{requisition}'
    attempt=put(db,user_id,'application_attempt',job_id,{'job_id':job_id,'status':'validating','created_at':now().isoformat()})
    db.commit()
    submitted=False
    try:
        with httpx.Client(timeout=30,follow_redirects=False) as client:
            response=client.get(endpoint+'?questions=true')
            response.raise_for_status()
            listing=response.json()
            if str(listing.get('id'))!=requisition:
                raise ValueError('The published requisition could not be confirmed.')
            # Sending name fields follows the user's explicitly reviewed full name.
            fields={'first_name':name[0],'last_name':name[1],'email':profile.data['email']}
            if profile.data.get('phone'):fields['phone']=profile.data['phone']
            files={}
            from .db import digest
            content=[r for r in records(db,user_id,'content').order_by(Record.created_at.desc()).all() if r.data.get('job_id')==job_id and r.data.get('validation_status')=='approved' and r.data.get('resume_version_id')==profile.data.get('resume_version_id') and r.data.get('jd_hash')==digest(job.data.get('description',''))]
            for kind,key in [('resume','resume'),('cover_letter','cover_letter')]:
                generated=next((r for r in content if r.data['content_type']==kind),None)
                attachment=next((f for f in job.data.get('attachment_ids',[]) if f.get('document_type','').replace('_',' ').casefold()==kind.replace('_',' ')),None)
                if attachment:
                    row=db.query(File).filter_by(id=attachment['id'],user_id=user_id,record_id=job_id,category='attachment',deleted=False).first()
                    if row:
                        files[key]=(row.name,read_bytes(row.key),'application/pdf' if row.name.lower().endswith('.pdf') else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                elif generated:
                    files[key]=(kind+'.pdf',render(generated.data['structured_content'],'pdf'),'application/pdf')
            if 'resume' not in files:
                raise ValueError('An approved resume or typed resume attachment is required.')
            required=[]
            for question in listing.get('questions',[]):
                if question.get('required'):
                    required.extend(field.get('name','') for field in question.get('fields',[]))
            unknown=[f for f in required if f not in fields and f not in files]
            if unknown or listing.get('data_compliance'):
                raise ValueError('Employer form requires additional answers or consent. Complete the application on the employer site.')
            attempt.data={**attempt.data,'status':'submitting'};db.commit()
            submitted=True
            response=client.post(endpoint,auth=(submission_boards()[board],''),data=fields,files=files)
            response.raise_for_status()
            receipt=response.json()
            if receipt.get('success') is not True:
                raise ValueError('The ATS did not return an explicit success confirmation. Verify on the employer site before retrying.')
        stamp=now().isoformat()
        job.data={**job.data,'status':'APPLIED','applied_at':stamp,'history':[*job.data.get('history',[]),{'from':'NOT APPLIED','to':'APPLIED','at':stamp,'source':'Greenhouse confirmed submission','endpoint':endpoint,'success':True}]}
        attempt.data={**attempt.data,'status':'confirmed','confirmed_at':stamp,'success':True}
        audit(db,user_id,'connector_submission_confirmed',{'job_id':job_id})
        db.commit()
        return {'job_id':job_id,'status':'confirmed','applied_at':stamp}
    except Exception as exc:
        db.rollback()
        attempt=get_record(db,user_id,'application_attempt',job_id)
        reason=str(exc) if isinstance(exc,ValueError) else 'Submission connector failed ('+type(exc).__name__+').'
        attempt.data={**attempt.data,'status':'outcome_unknown' if submitted else 'failed_validation','reason':reason}
        db.commit()
        return {'job_id':job_id,'status':attempt.data['status'],'reason':reason}
