from conftest import SHORT_ANSWER, DETAILED_ANSWER
import json

import httpx
import pytest

from app import ai, workflows
from app.config import settings
from app.db import File, Record, Task, User, get_record, records
from app.interviews import COMMON_FIELDS
from app.resumes import PARSER_VERSION, bootstrap_profile
from app.storage import read_bytes
from conftest import login, register
from test_workflows import ingest, resume_bytes


LAYOUT_RESUME = '''ALEX EXAMPLE
                    Noida, India | +91-9000012345 | alex@example.com
## PROFESSIONAL SUMMARY
Quality engineering leader with Python and SQL experience.
## PROFESSIONAL EXPERIENCE
ExampleCo                                  04/2024 \ufffd Present
Quality Engineering Lead | Functional QA                     Noida, India
Owned API automation, regression testing and release quality.
PreviousCo                                 01/2018 \u2013 04/2024
Senior QA Engineer                                           Pune, India
Built Python and SQL automation.
CORE SKILLS
Python, SQL, Playwright
## EDUCATION
Master of Computer Applications
Example University 2008 - 2011
CERTIFICATIONS & TRAINING
ISTQB | Cloud Certificate
AWARDS & RECOGNITION
Release Award
'''


def upload(client, text):
    queued = client.post('/api/resumes', files={'file': ('resume.docx', resume_bytes(text))}).json()
    workflows.run_one()
    task = client.get('/api/tasks/' + queued['task_id']).json()
    assert task['status'] == 'completed', task
    return task['result']['resume_id']


def test_layout_resume_extracts_history_contacts_and_sections():
    profile = bootstrap_profile(LAYOUT_RESUME)
    assert profile['name'] == 'ALEX EXAMPLE'
    assert profile['location'] == 'Noida, India'
    assert profile['designation'] == 'Quality Engineering Lead'
    assert profile['phone'] == '+91-9000012345'
    assert len(profile['employments']) == 2
    assert profile['employments'][0]['employer'] == 'ExampleCo'
    assert profile['employments'][0]['start'] == '2024-04'
    assert profile['employments'][0]['end'] == 'present'
    assert profile['employments'][1]['title'] == 'Senior QA Engineer'
    assert len(profile['education']) == 2
    assert profile['certifications'] == ['ISTQB | Cloud Certificate']
    assert profile['achievements'] == ['Release Award']


def test_legacy_profile_is_repaired_once_without_provider_or_losing_edits(account, monkeypatch):
    client, factory = account
    rid = upload(client, LAYOUT_RESUME)
    with factory() as db:
        active = get_record(db, db.query(User).one().id, 'profile', 'active')
        active.data = {**active.data, 'extraction_version': 0, 'name': '', 'location': '', 'designation': '', 'employments': [], 'email': 'reviewed@example.com', 'approved': True}
        db.commit()
    def no_ai(*args): raise AssertionError('An automatic upgrade must not make a provider call.')
    monkeypatch.setattr(ai, 'json_call', no_ai)
    profile = client.get('/api/profile').json()
    assert profile['name'] == 'ALEX EXAMPLE'
    assert profile['location'] == 'Noida, India'
    assert profile['designation'] == 'Quality Engineering Lead'
    assert profile['email'] == 'reviewed@example.com' and profile['approved']
    assert len(profile['employments']) == 2
    assert profile['missing_mandatory_fields'] == []
    assert profile['extraction_version'] == PARSER_VERSION
    assert client.get('/api/profile').json() == profile


def test_delete_inactive_resume_removes_original_but_preserves_knowledge_and_guides(account):
    client, factory = account
    active = ingest(client)
    old = upload(client, LAYOUT_RESUME)
    before = client.get('/api/knowledge?query=Python').json()
    with factory() as db:
        user = db.query(User).one()
        knowledge = {row.id: row.data for row in records(db,user.id,'knowledge').all()}
        file_id = db.get(Record, old).data['file_id']
        file_key = db.get(File,file_id).key
    assert client.delete('/api/resumes/' + active).status_code == 409
    response = client.delete('/api/resumes/' + old)
    assert response.status_code == 200 and response.json()['knowledge_preserved'] is True
    assert old not in [row['id'] for row in client.get('/api/resumes').json()]
    assert client.get('/api/files/' + file_id).status_code == 410
    assert client.get('/api/knowledge?query=Python').json() == before
    with factory() as db:
        user = db.query(User).one()
        assert {row.id: row.data for row in records(db,user.id,'knowledge').all()} == knowledge
        assert db.get(Record,old).kind == 'resume_archive'
    with pytest.raises(FileNotFoundError): read_bytes(file_key)
    restored = upload(client, LAYOUT_RESUME)
    assert restored == old
    assert client.get('/api/profile').json()['resume_version_id'] == active


def test_resume_delete_rejects_in_use_and_other_tenant(account):
    client, factory = account
    ingest(client)
    rid = upload(client, LAYOUT_RESUME)
    client.post('/api/resumes/' + rid + '/reparse')
    assert client.delete('/api/resumes/' + rid).status_code == 409
    register(client, 'bob')
    login(client, 'bob')
    assert client.delete('/api/resumes/' + rid).status_code == 404


@pytest.mark.parametrize('kind', ['technical', 'hr'])
def test_provider_failure_is_terminal_without_substituting_coaching_questions(account, monkeypatch, kind):
    client, factory = account
    rid = ingest(client)
    def unavailable(*args, **kwargs): raise ValueError('Claude: HTTP 401; API key rejected.')
    monkeypatch.setattr('app.interviews.generate', unavailable)
    payload = {'kind':kind,'jd':'Python and SQL automation engineer with API testing experience.','resume_id':rid}
    queued = client.post('/api/interviews', json=payload).json()
    assert client.post('/api/interviews', json=payload).json()['task_id'] == queued['task_id']
    workflows.run_one()
    task = client.get('/api/tasks/' + queued['task_id']).json()
    assert task['status'] == 'failed' and 'HTTP 401' in task['error']
    assert not task['result'].get('built_in')
    assert client.get('/api/interviews').json()==[]


def test_completed_interview_batches_are_visible_before_failure(account, monkeypatch):
    client, factory = account
    rid = ingest(client)
    calls = []
    def generation(prompt, validator, **kwargs):
        data = json.loads(prompt)
        calls.append(data)
        if len(calls) == 2:
            guides = client.get('/api/interviews').json()
            assert len(guides[0]['questions']) == 1
            assert guides[0]['generation_status'] == 'generating'
            tasks = client.get('/api/tasks').json()
            assert next(t for t in tasks if t['kind']=='interview')['result']['questions'] == 1
            raise ValueError('Provider temporarily unavailable.')
        category = data['schema']['questions'][0]['category']
        questions = []
        for index in range(data['question_count']):
            question = {field:'Fixture answer' for field in COMMON_FIELDS}
            question.update(short_answer=SHORT_ANSWER,detailed_answer=DETAILED_ANSWER,id=str(index),category=category,question='Unique question '+str(index),priority=1,source_classification='General Preparation',follow_ups=[{'question':'Why?','answer':'Evidence.'}])
            questions.append(question)
        result = {'questions':questions}
        validator(result)
        return {'content':result,'model':'test-model','usage':{}}
    monkeypatch.setattr('app.interviews.generate', generation)
    queued = client.post('/api/interviews', json={'kind':'technical','jd':'Python automation and SQL API testing role.','resume_id':rid}).json()
    workflows.run_one()
    task = client.get('/api/tasks/' + queued['task_id']).json()
    assert task['status'] == 'failed' and task['result']['questions'] == 1
    guide = client.get('/api/interviews').json()[0]
    assert len(guide['questions']) == 1 and guide['generation_status'] == 'failed'
    assert not guide.get('generation_mode')


def test_provider_auth_failure_explains_status_without_leaking_response(monkeypatch):
    monkeypatch.setattr(settings,'llm_key','synthetic-key')
    monkeypatch.setattr(settings,'fallback_key','synthetic-fallback')
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def post(self,url,**kwargs):
            return httpx.Response(401,request=httpx.Request('POST',url),json={'error':{'message':'PRIVATE PROVIDER BODY'}})
    monkeypatch.setattr(ai.httpx,'Client',Client)
    with pytest.raises(ValueError) as error:
        ai.json_call('Fixture')
    assert 'HTTP 401' in str(error.value) and 'same provider' in str(error.value)
    assert 'PRIVATE PROVIDER BODY' not in str(error.value) and 'synthetic-key' not in str(error.value)
