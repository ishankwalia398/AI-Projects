import io
import json
from datetime import timedelta
from unittest.mock import Mock

import httpx
import pytest
from qdrant_client import QdrantClient

from app import ai, jobs, rag, storage, workflows
from app.config import Settings, settings
from app.db import File, Record, User, get_record, now, records
from app.interviews import COMMON_FIELDS, HR_FIELDS, TECH_CATEGORIES, interview_generate, required_count
from app.main import app
from test_workflows import DOCUMENT, JOB, add_job, ingest


def test_primary_failure_uses_fallback(monkeypatch):
    monkeypatch.setattr(settings,'llm_key','synthetic-primary-key')
    monkeypatch.setattr(settings,'fallback_key','synthetic-fallback-key')
    calls=[]
    class Client:
        def __init__(self,**k):pass
        def __enter__(self):return self
        def __exit__(self,*a):pass
        def post(self,url,headers,json):
            calls.append(headers['Authorization'])
            req=httpx.Request('POST',url)
            if len(calls)==1:return httpx.Response(503,request=req)
            return httpx.Response(200,request=req,json={'choices':[{'message':{'content':'{"result":"ok"}'}}],'usage':{'total_tokens':7}})
    monkeypatch.setattr(ai.httpx,'Client',Client)
    data,model,usage=ai.json_call('Untrusted input fixture')
    assert data=={'result':'ok'} and len(calls)==2 and usage['total_tokens']==7


def test_malformed_ai_outputs_never_persist(account,monkeypatch):
    c,factory=account
    ingest(c);p=c.get('/api/profile').json();p['approved']=True;c.put('/api/profile',json=p)
    j=add_job(c)
    def fail(*args):raise ValueError('Provider returned incomplete content.')
    monkeypatch.setattr(ai,'generate',fail)
    result=c.post('/api/jobs/'+j['id']+'/generate').json();workflows.run_one()
    assert c.get('/api/tasks/'+result['task_id']).json()['status']=='failed'
    assert c.get('/api/content').json()==[]


def test_discovery_adapters_use_official_evidence_and_merge(account,monkeypatch):
    c,factory=account
    ingest(c);p=c.get('/api/profile').json();p['approved']=True;c.put('/api/profile',json=p)
    monkeypatch.setattr(settings,'greenhouse_boards','example-board')
    monkeypatch.setattr(settings,'lever_sites','example-site')
    class Client:
        def __init__(self,**k):pass
        def __enter__(self):return self
        def __exit__(self,*a):pass
        def get(self,url):
            if 'greenhouse' in url:
                data={'jobs':[{'id':123,'title':'Python Engineer','location':{'name':'India'},'absolute_url':'https://boards.greenhouse.io/example/jobs/123','content':'Python engineering opportunity. We need SQL and React.'}]}
            else:
                data=[{'id':'abc','text':'International Python Engineer','categories':{'location':'Berlin, Germany'},'hostedUrl':'https://jobs.lever.co/example/abc','descriptionPlain':'Python services. We offer visa sponsorship.','lists':[]}]
            return httpx.Response(200,request=httpx.Request('GET',url),json=data)
    monkeypatch.setattr(jobs.httpx,'Client',Client)
    for module in ['domestic','visa']:
        for _ in range(2):
            result=c.post('/api/jobs/discover',json={'module':module}).json();workflows.run_one()
            assert c.get('/api/tasks/'+result['task_id']).json()['status']=='completed'
        saved=c.get('/api/jobs?module='+module).json()
        assert saved['total']==1
        assert saved['items'][0]['verification']['status']=='Published on official ATS board'
        assert saved['items'][0]['verification']['evidence_url'].startswith('https://')


def test_real_qdrant_client_tenant_filters_and_embedding_dedup(account,monkeypatch):
    _,factory=account
    client=QdrantClient(':memory:')
    monkeypatch.setattr(rag,'client',lambda:client)
    monkeypatch.setattr(settings,'qdrant_url','in-memory-test')
    monkeypatch.setattr(settings,'llm_key','synthetic-key')
    calls=[]
    def embed(texts):calls.extend(texts);return [[1.0,0.0,0.0] for _ in texts]
    monkeypatch.setattr(rag,'embedding',embed)
    with factory() as db:
        user=db.query(User).one()
        rag.index(db,user.id,'candidate','v1','## Skills\nPython and SQL')
        rag.index(db,user.id,'candidate','v2','## Skills\nPython and SQL')
        assert len(calls)==1
        assert len(rag.retrieve(db,user.id,'candidate','v1','Python')['sources'])==1
        assert rag.retrieve(db,'another-user','candidate','v1','Python')['sources']==[]
        assert rag.retrieve(db,user.id,'candidate','missing-version','Python')['sources']==[]
    client.close()


@pytest.mark.parametrize('kind',['technical','hr'])
def test_interview_batch_pipeline_and_cache(account,monkeypatch,kind):
    _,factory=account
    calls=[]
    def generation(prompt,validator):
        p=json.loads(prompt);calls.append(p)
        if 'question_bank' in p:
            data={'plans':{str(n):[{'day':i+1,'task':'Practice'} for i in range(n)] for n in [7,14,30]},'mock_interviews':[{'name':'Screening','question_ids':[q['id'] for q in p['question_bank'][:10]],'model_answers':['Fixture answer'],'scoring_rubric':'0–5 self-score'}],'skills_matrix':[{'skill':'Python','candidate':'User-provided'}],'top_topics':['Topic '+str(i) for i in range(20)]}
        else:
            category=p['schema']['questions'][0]['category']
            fields=COMMON_FIELDS+(HR_FIELDS if kind=='hr' else [])
            qs=[]
            for i in range(required_count(category,kind)):
                q={f:'Detailed fixture answer' for f in fields}
                q.update(id=str(i),question=category+' question '+str(i),category=category,priority=1,source_classification='General Preparation',follow_ups=[{'question':'Why?','answer':'Fixture explanation.'}],variants={'short':'Fixture variation'})
                q['coding']={k:'Fixture coding detail' for k in ['problem_statement','input_output','constraints','examples','solution','explanation','time_complexity','space_complexity','edge_cases','test_cases','alternative_solution','optimizations']}
                q['sql']={'solution':'SELECT 1','schema':'fixture','sample_data':'fixture','expected_output':'1'}
                qs.append(q)
            data={'questions':qs}
        validator(data)
        return {'content':data,'model':'test-fixture','usage':{}}
    monkeypatch.setattr('app.interviews.generate',generation)
    with factory() as db:
        user=db.query(User).one()
        first=interview_generate(db,user.id,kind,{'skills':['Python']},JOB['description'],'resume-v1')
        count=len(calls)
        second=interview_generate(db,user.id,kind,{'skills':['Python']},JOB['description'],'resume-v1')
        assert second['cached'] and first['content_id']==second['content_id'] and len(calls)==count
        row=records(db,user.id,'interview').one()
        assert len(row.data['questions'])==(36 if kind=='technical' else 90)


def test_content_edits_expire_previous_binary_and_preserve_versions(account):
    c,factory=account
    with factory() as db:
        user=db.query(User).one()
        from app.db import put
        row=put(db,user.id,'content','fixture',{'structured_content':DOCUMENT,'content_type':'resume','validation_status':'approved','markdown_content':'Original text'})
        db.commit();rid=row.id
    rendered=c.post('/api/content/'+rid+'/render?format=pdf').json()
    changed={**DOCUMENT,'sections':[{'heading':'Experience','text':'Corrected user-provided contribution.'}]}
    assert c.put('/api/content/'+rid,json={'structured_content':changed}).status_code==200
    assert c.get(rendered['url']).status_code==410
    assert c.post('/api/content/'+rid+'/render').status_code==409
    with factory() as db:
        assert db.query(Record).filter_by(kind='content_version').count()==1


def test_s3_adapter_and_temporary_cleanup(account,monkeypatch):
    _,factory=account
    objects={}
    class FakeS3:
        def put_object(self,**k):objects[k['Key']]=k['Body']
        def get_object(self,**k):return {'Body':io.BytesIO(objects[k['Key']])}
        def delete_object(self,**k):objects.pop(k['Key'],None)
    monkeypatch.setattr(settings,'s3_bucket','private-test-bucket')
    monkeypatch.setattr(storage,'s3',lambda:FakeS3())
    with factory() as db:
        user=db.query(User).one()
        original=storage.store(db,user.id,'original.pdf',b'original','original')
        temp=storage.store(db,user.id,'temp.pdf',b'temporary','temporary',expires_at=now()-timedelta(hours=1))
        db.commit();storage.cleanup(db)
        assert storage.read_bytes(original.key)==b'original' and temp.key not in objects


def test_production_configuration_fails_closed():
    with pytest.raises(RuntimeError):Settings(mode='production',database_url='sqlite:///local.db').validate()
    with pytest.raises(RuntimeError):Settings(mode='production',database_url='postgresql+psycopg://invalid',cookie_secure=False).validate()


def test_domain_and_technology_experience_merge_overlaps():
    from app.resumes import experience_summary
    data=experience_summary([{'start':'2020-01','end':'2022-01','domain':'SaaS','technologies':['Python']},{'start':'2021-01','end':'2023-01','domain':'SaaS','technologies':['Python','SQL']}])
    assert data['months']==36
    assert data['by_domain']['SaaS']['months']==36
    assert data['by_technology']['Python']['months']==36
    assert data['by_technology']['SQL']['months']==24


def test_amber_preferences_migration_preserves_search_settings(account):
    from app.db import migrate,put,SchemaVersion
    c,factory=account
    with factory() as db:
        user=db.query(User).one()
        put(db,user.id,'preferences','active',{'design':'legacy','target_titles':['Engineer'],'countries':['India']})
        db.commit()
    migrate(factory.kw['bind'])
    migrate(factory.kw['bind'])
    saved=c.get('/api/preferences').json()
    assert saved=={'design':'amber','target_titles':['Engineer'],'countries':['India']}
    assert c.put('/api/preferences',json=saved).status_code==200
    assert c.put('/api/preferences',json={'design':'legacy'}).status_code==422


@pytest.mark.parametrize('outcome',['confirmed','ambiguous','timeout'])
def test_supported_submission_requires_receipt_and_prevents_duplicates(account,monkeypatch,outcome):
    from app import applications
    from app.db import digest,put
    c,factory=account
    rid=ingest(c)
    p=c.get('/api/profile').json();p.update(name='Jane Example',approved=True);c.put('/api/profile',json=p)
    job=add_job(c)
    with factory() as db:
        row=records(db,db.query(User).one().id,'job').filter_by(id=job['id']).one()
        row.data={**row.data,'source':'greenhouse:example','requisition_id':'123'}
        put(db,row.user_id,'content','submission-fixture',{'job_id':row.id,'content_type':'resume','resume_version_id':rid,'jd_hash':digest(JOB['description']),'validation_status':'approved','structured_content':DOCUMENT})
        db.commit()
    monkeypatch.setattr(settings,'greenhouse_submission_keys','{"example":"synthetic-employer-key"}')
    sent=[]
    class Client:
        def __init__(self,**k):pass
        def __enter__(self):return self
        def __exit__(self,*a):pass
        def get(self,url):
            return httpx.Response(200,request=httpx.Request('GET',url),json={'id':123,'questions':[{'required':True,'fields':[{'name':'resume'}]}]})
        def post(self,url,**kwargs):
            sent.append(kwargs)
            if outcome=='timeout':raise httpx.ReadTimeout('test timeout')
            return httpx.Response(200,request=httpx.Request('POST',url),json={'success':outcome=='confirmed'})
    monkeypatch.setattr(applications.httpx,'Client',Client)
    assert c.post('/api/applications/submit',json={'job_ids':[job['id']],'confirmed':False}).status_code==422
    task=c.post('/api/applications/submit',json={'job_ids':[job['id']],'confirmed':True}).json();workflows.run_one()
    result=c.get('/api/tasks/'+task['task_id']).json()
    assert result['status']=='completed' and len(sent)==1
    saved=c.get('/api/jobs/'+job['id']).json()
    if outcome=='confirmed':
        assert saved['status']=='APPLIED' and saved['applied_at']
    else:
        assert saved['status']=='NOT APPLIED' and saved['applied_at'] is None
        task=c.post('/api/applications/submit',json={'job_ids':[job['id']],'confirmed':True}).json();workflows.run_one()
        assert c.get('/api/tasks/'+task['task_id']).json()['result']['outcomes'][0]['status']=='blocked'
        assert len(sent)==1
