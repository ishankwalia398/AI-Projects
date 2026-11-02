import json

import httpx
import pytest

from app import ai, interviews, workflows
from app.config import settings
from app.db import Record, User, get_record
from conftest import SHORT_ANSWER, DETAILED_ANSWER
from test_workflows import ingest


def test_title_prompts_request_titles_per_region_without_reasoning_metadata():
    for module, scope in [('domestic','India'),('visa','EU')]:
        prompt=workflows.title_suggestion_prompt(module,{'designation':'QA Lead','skills':['Python']})
        assert scope in prompt['task']
        assert set(prompt['schema']['regions'][0])=={'region','countries','titles'}
        assert prompt['candidate']['designation']=='QA Lead'


@pytest.mark.parametrize('kind,expected',[('technical',36),('hr',90)])
def test_complete_banks_have_all_answered_questions_and_cache_successes(account,monkeypatch,kind,expected):
    client,factory=account
    resume_id=ingest(client)
    calls=[]
    def generate(prompt,validator,**kwargs):
        payload=json.loads(prompt)
        schema=payload['schema']['questions'][0]
        assert payload['question_count']==1
        assert not {'priority','jd_relevance','resume_relevance','qualitative_likelihood'} & schema.keys()
        assert not {'variants','answer','short_answer','detailed_answer'} & schema.keys()
        calls.append(payload)
        question={**schema,'question':f'Question about {schema["category"]} number {len(calls)}?',
                  'short_answer':SHORT_ANSWER,'detailed_answer':DETAILED_ANSWER,
                  'follow_ups':[{'question':'Why?','answer':'Because retries can duplicate operations.'}]}
        if schema['category']=='Programming and Coding':
            question['coding']={key:'Concrete details' for key in ['problem_statement','input_output','constraints','examples','explanation','time_complexity','space_complexity','edge_cases','test_cases','alternative_solution','optimizations']}
            question['coding'].update(language='Python',solution='def solve(items):\n    return list(dict.fromkeys(items))')
        if schema['category']=='Database and SQL':
            question['sql']={'solution':'SELECT id FROM users;','schema':'users(id INT)','sample_data':[1],'expected_output':[1]}
        result={'questions':[question]}
        validator(result)
        return {'content':result,'model':'fixture','usage':{}}
    monkeypatch.setattr(interviews,'generate',generate)
    with factory() as db:
        user=db.query(User).one()
        profile=get_record(db,user.id,'profile','active').data
        output=interviews.interview_generate(db,user.id,kind,profile,'Python SQL API testing manager',resume_id)
        guide=db.get(Record,output['content_id'])
        assert len(guide.data['questions'])==expected
        assert guide.data['generation_status']=='completed'
        assert not {'plans','category_plans'} & guide.data.keys()
        assert len(calls)==expected
        assert interviews.interview_generate(db,user.id,kind,profile,'Python SQL API testing manager',resume_id)['cached']
        assert len(calls)==expected


def test_interview_timeout_and_invalid_schema_get_bounded_repair_not_global_skip(monkeypatch):
    monkeypatch.setattr(settings,'llm_key','synthetic-key')
    monkeypatch.setattr(settings,'fallback_key','')
    monkeypatch.setattr(settings,'llm_url','https://fixture.test')
    monkeypatch.setattr(settings,'fallback_url','https://fixture.test')
    calls=[]
    class Client:
        def __init__(self,**kwargs): assert kwargs['timeout'].read>=90
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def post(self,url,headers,json):
            calls.append(json)
            if len(calls)==1: raise httpx.ReadTimeout('fixture timeout')
            content='{}' if len(calls)==2 else '{"variants":{"concise":"Actual answer"}}'
            return httpx.Response(200,request=httpx.Request('POST',url),json={'choices':[{'message':{'content':content}}]})
    monkeypatch.setattr(ai.httpx,'Client',Client)
    def validator(data):
        if not data.get('variants'): raise ValueError('HR questions require answer variants.')
    result,_,_=ai.json_call('{"task":"HR fixture"}',validator,purpose='interview_fast')
    assert result['variants']['concise']=='Actual answer'
    assert len(calls)==3
    assert 'HR questions require answer variants.' in calls[-1]['messages'][1]['content']


def test_retry_after_partial_failure_reuses_saved_question_and_finishes(account,monkeypatch):
    from test_oct25_features import question
    _,factory=account
    category='Core Technical Fundamentals'
    monkeypatch.setattr(interviews,'TECH_CATEGORIES',[category])
    calls=[]
    def generate(prompt,validator,**kwargs):
        calls.append(json.loads(prompt))
        if len(calls)==2:
            raise ValueError('Synthetic temporary provider failure')
        data={'questions':[question(question=f'Unique question {len(calls)}?')]}
        validator(data)
        return {'content':data,'model':'fixture','usage':{}}
    monkeypatch.setattr(interviews,'generate',generate)
    with factory() as db:
        user=db.query(User).one()
        args=(db,user.id,'technical',{'skills':['Python']},'Python testing','resume-fixture')
        with pytest.raises(ValueError,match='temporary provider'):
            interviews.interview_generate(*args)
        result=interviews.interview_generate(*args)
        guide=db.get(Record,result['content_id'])
        assert guide.data['generation_status']=='completed'
        assert len(guide.data['questions'])==3
        assert guide.data['questions'][0]['question']=='Unique question 1?'
        assert len(calls)==4  # first success, failed call, two remaining questions
