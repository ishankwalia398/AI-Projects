import json

import httpx
import pytest

from app import ai, workflows
from app.config import GEMINI_BASE_URL, settings
from test_followup_fixes import LAYOUT_RESUME


@pytest.fixture
def gemini_requests(monkeypatch):
    calls=[]
    monkeypatch.setattr(settings,'llm_key','synthetic-google-key')
    monkeypatch.setattr(settings,'fallback_key','')
    monkeypatch.setattr(settings,'llm_url',GEMINI_BASE_URL)
    monkeypatch.setattr(settings,'fallback_url',GEMINI_BASE_URL)
    monkeypatch.setattr(settings,'llm_model','gemini-3.8-flash')
    monkeypatch.setattr(settings,'fallback_model','gemini-3.5-flash-lite')
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def post(self,url,headers,json):
            calls.append((url,headers,json))
            return httpx.Response(200,request=httpx.Request('POST',url),json={'choices':[{'message':{'content':'{"ok":true}'},'finish_reason':'stop'}],'usage':{'total_tokens':10}})
    monkeypatch.setattr(ai.httpx,'Client',Client)
    return calls


@pytest.mark.parametrize('purpose,expected,limit',[
    ('generation','gemini-3.8-flash',12000),
    ('extraction','gemini-3.5-flash-lite',4096),
    ('fast_generation','gemini-3.5-flash-lite',12000),
])
def test_gemini_task_routing_and_bounded_low_reasoning_requests(gemini_requests,purpose,expected,limit):
    result,model,usage=ai.json_call('{ "fixture": true }',purpose=purpose)
    assert result=={'ok':True} and model==expected
    url,headers,body=gemini_requests[0]
    assert url==GEMINI_BASE_URL+'/chat/completions'
    assert headers=={'Authorization':'Bearer synthetic-google-key'}
    assert body['reasoning_effort']=='low' and body['max_tokens']==limit
    assert body['messages'][1]['content']=='{"fixture":true}'
    assert body['response_format']=={'type':'json_object'}


def test_extraction_escalates_to_flash_after_lite_validation_failure(gemini_requests):
    attempts=[]
    def validate(data):
        attempts.append(data)
        if len(attempts)==1: raise ValueError('Fixture validation failure.')
    _,model,_=ai.json_call('Fixture',validate,purpose='extraction')
    assert [call[2]['model'] for call in gemini_requests]==['gemini-3.5-flash-lite','gemini-3.8-flash']
    assert model=='gemini-3.8-flash'


def test_shared_gemini_key_enables_fallback_in_integration_status(account,gemini_requests):
    client,_=account
    assert client.get('/api/integrations').json()['fallback'] is True


def test_complete_local_resume_skips_paid_extraction(monkeypatch):
    monkeypatch.setattr(settings,'llm_key','synthetic-google-key')
    def unexpected(*args,**kwargs): raise AssertionError('Complete local parsing needs no API request.')
    monkeypatch.setattr(workflows,'extract_profile',unexpected)
    profile=workflows.parsed_profile(LAYOUT_RESUME)
    assert profile['missing_mandatory_fields']==[]
    assert len(profile['employments'])==2


def test_candidate_context_retains_facts_and_source_without_duplicate_metadata():
    source='Candidate resume facts and all career history.'
    profile={'name':'Alex Example','source_markdown':source,'employments':[{'employer':'ExampleCo'}],
             'evidence':[{'quote':source}],'extraction_usage':{'tokens':100},'extraction_version':3,'approved':True}
    compact=ai.candidate_context(profile)
    assert compact=={'name':'Alex Example','source_markdown':source,'employments':[{'employer':'ExampleCo'}]}


def test_unavailable_flash_falls_back_and_is_not_retried_for_every_batch(monkeypatch,gemini_requests):
    calls=[]
    class Client:
        def __init__(self,**kwargs):
            assert kwargs['timeout'].read == settings.llm_timeout
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def post(self,url,headers,json):
            calls.append(json['model'])
            if json['model']=='gemini-3.8-flash':
                raise httpx.ReadTimeout('Synthetic provider timeout')
            return httpx.Response(200,request=httpx.Request('POST',url),json={'choices':[{'message':{'content':'{"ok":true}'}}]})
    monkeypatch.setattr(ai.httpx,'Client',Client)
    assert ai.json_call('Fixture')[1]=='gemini-3.5-flash-lite'
    assert ai.json_call('Another batch')[1]=='gemini-3.5-flash-lite'
    assert calls==['gemini-3.8-flash','gemini-3.5-flash-lite','gemini-3.5-flash-lite']
