import json
import pytest

from app import interviews, workflows
from app.db import User, Record, Task, put, get_record
from conftest import login
from test_workflows import ingest
from test_interview_exports import exported_text


@pytest.fixture
def guide(account):
    client, factory = account
    resume_id = ingest(client)
    with factory() as db:
        user = db.query(User).one()
        row = put(db, user.id, 'interview', 'on-demand', {
            'kind':'technical', 'generation_status':'completed', 'resume_version_id':resume_id,
            'jd':'Python API quality engineering and automation',
            'questions':[{'id':'TECH-001','question':'How do you test retries?','category':'API and Backend Engineering'},
                         {'id':'TECH-002','question':'How do you prevent duplicate writes?','category':'API and Backend Engineering'}]})
        db.commit()
        return client, factory, row.id


@pytest.mark.parametrize('format', ['pdf', 'docx'])
def test_answer_is_persisted_exported_and_cleared_only_on_logout(guide, monkeypatch, format):
    client, factory, guide_id = guide
    calls=[]
    def generate(kind, question, profile, jd, company):
        calls.append(question['id'])
        return {'content':{'answer':'I use an idempotency key to ensure that retrying a write cannot create duplicate records.'},'model':'fixture','usage':{'tokens':10}}
    monkeypatch.setattr(workflows,'generate_question_answer',generate)
    base=f'/api/interviews/{guide_id}/questions/'
    queued=client.post(base+'TECH-001/answer')
    assert queued.status_code==202
    assert client.post(base+'TECH-002/answer').status_code==409
    assert workflows.run_one()
    assert calls==['TECH-001']
    saved=client.get('/api/interviews').json()[0]
    assert saved['questions'][0]['answer'].startswith('I use an idempotency key')
    assert 'answer' not in saved['questions'][1]
    # New reads/re-authentication preserve answers; neither simulates explicit logout.
    assert login(client).status_code==200
    assert client.get('/api/interviews').json()[0]['questions'][0]['answer']==saved['questions'][0]['answer']
    exported=client.post(f'/api/content/{guide_id}/render?format={format}').json()
    text=exported_text(client.get(exported['url']).content,format)
    assert 'Q1.' in text and 'Answer: I use an idempotency key' in text and 'Q2.' in text
    assert 'Answer Model' not in text and 'Answer Usage' not in text
    assert client.post('/api/auth/logout').status_code==200
    assert login(client).status_code==200
    assert all('answer' not in q for q in client.get('/api/interviews').json()[0]['questions'])
    assert client.get(exported['url']).status_code==410


def test_logout_during_provider_call_cannot_restore_answer(guide,monkeypatch):
    client,factory,guide_id=guide
    def generate(*args):
        assert client.post('/api/auth/logout').status_code==200
        return {'content':{'answer':'This late answer must never be saved.'},'model':'fixture','usage':{}}
    monkeypatch.setattr(workflows,'generate_question_answer',generate)
    queued=client.post(f'/api/interviews/{guide_id}/questions/TECH-001/answer').json()
    workflows.run_one()
    with factory() as db:
        assert 'answer' not in db.get(Record,guide_id).data['questions'][0]
        assert db.get(Task,queued['task_id']).status=='failed'


def test_failed_answer_releases_lock_for_another_question(guide,monkeypatch):
    client,_,guide_id=guide
    def fail(*args): raise ValueError('Synthetic provider outage')
    monkeypatch.setattr(workflows,'generate_question_answer',fail)
    client.post(f'/api/interviews/{guide_id}/questions/TECH-001/answer')
    workflows.run_one()
    assert client.post(f'/api/interviews/{guide_id}/questions/TECH-002/answer').status_code==202


def test_question_generation_strips_unsolicited_answers(account,monkeypatch):
    client,factory=account
    version=ingest(client)
    monkeypatch.setattr(interviews,'TECH_CATEGORIES',['Core Technical Fundamentals'])
    def generate(prompt,validate,**kwargs):
        payload=json.loads(prompt)
        assert kwargs['purpose']=='interview_questions'
        assert 'short_answer' not in payload['schema']['questions'][0]
        q={**payload['schema']['questions'][0], 'question':f"Question {payload['question_index_in_category']}?",'answer':'Unsolicited answer'}
        result={'questions':[q]}
        validate(result)
        return {'content':result,'model':'fixture','usage':{}}
    monkeypatch.setattr(interviews,'generate',generate)
    with factory() as db:
        user=db.query(User).one()
        result=interviews.interview_generate(db,user.id,'technical',get_record(db,user.id,'profile','active').data,'Python API quality engineering',version)
        questions=db.get(Record,result['content_id']).data['questions']
        assert len(questions)==3 and all('answer' not in q for q in questions)
        assert [q['id'] for q in questions]==['TECH-001','TECH-002','TECH-003']
