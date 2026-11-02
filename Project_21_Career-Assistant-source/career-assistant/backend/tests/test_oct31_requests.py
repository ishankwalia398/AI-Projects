import json

import httpx
import pytest

from app import ai, jobs, live_research, workflows
from app.config import settings
from app.prompt_library import section
from test_workflows import DOCUMENT, ingest


def approve(client):
    ingest(client)
    profile=client.get('/api/profile').json()
    client.put('/api/profile',json={**profile,'approved':True})


def fake_ai(monkeypatch, calls):
    def call(prompt, validator=None, **kwargs):
        payload=json.loads(prompt)
        if 'regions' in payload.get('schema',{}) and 'titles' in payload['schema']['regions'][0]:
            module=payload['module']
            data={'regions':[{'region':'India','countries':['India'],'titles':['QA Lead']}]} if module=='domestic' else \
                 {'regions':[{'region':'EU','countries':['Germany'],'titles':['QA Lead']}]}
            calls.append('titles:'+module)
        elif 'regions' in payload.get('schema',{}):
            data={'regions':[{'region':'European Union (EU)','countries':['Germany','Ireland']}]}
            calls.append('countries')
        else:
            data={'matching_ids':[]}
            calls.append('review')
        if validator: validator(data)
        return data,'fixture',{}
    monkeypatch.setattr(ai,'json_call',call)
    monkeypatch.setattr(live_research,'research',lambda *a,**k: {'available':False,'reason':'Live research is temporarily unavailable. gemini search HTTP 429'})


def test_suggestions_are_reused_and_hide_unavailable_research(account, monkeypatch):
    client,_=account
    approve(client)
    monkeypatch.setattr(settings,'llm_key','synthetic')
    calls=[]
    fake_ai(monkeypatch,calls)
    for _ in range(2):
        task=client.post('/api/research',json={'module':'domestic'}).json(); workflows.run_one()
        assert client.get('/api/tasks/'+task['task_id']).json()['status']=='completed'
    assert calls==['titles:domestic']
    saved=client.get('/api/research/domestic').json()
    assert saved['live_evidence']=={'available':False}
    assert 'temporarily unavailable' not in json.dumps(saved)
    for _ in range(2):
        client.post('/api/research/countries',json={}); workflows.run_one()
    assert calls.count('countries')==1
    assert 'cooling down' not in json.dumps(client.get('/api/research/visa-countries').json())


def test_visa_find_jobs_generates_missing_titles_and_countries(account, monkeypatch):
    client,_=account
    approve(client)
    monkeypatch.setattr(settings,'llm_key','synthetic')
    monkeypatch.setattr(settings,'greenhouse_boards','fixture')
    calls=[]
    fake_ai(monkeypatch,calls)
    monkeypatch.setattr(live_research,'verified_jobs',lambda *a,**k: ([],{'available':False}))
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def get(self,url):
            rows=[{'id':1,'title':'QA Lead','location':{'name':'Dublin, Ireland'},'absolute_url':'https://example.com/1','content':'Python test automation. Visa sponsorship is available.'}]
            return httpx.Response(200,request=httpx.Request('GET',url),json={'jobs':rows})
    monkeypatch.setattr(jobs.httpx,'Client',Client)
    task=client.post('/api/jobs/discover',json={'module':'visa'}).json(); workflows.run_one()
    result=client.get('/api/tasks/'+task['task_id']).json()
    assert result['status']=='completed', result['error']
    assert calls[:2]==['titles:visa','countries']
    assert result['result']['saved']==1
    assert client.get('/api/jobs?module=visa').json()['items'][0]['country']=='Ireland'


def test_country_detection_covers_common_listing_formats():
    assert jobs.country_from_location('Bangalore, IND')=='India'
    assert jobs.country_from_location('Gurgaon/ Pune, India')=='India'
    assert jobs.country_from_location('Remote - USA')=='United States'
    assert jobs.country_from_location('Austin, TX')=='United States'
    assert jobs.country_from_location('Kraków')=='Poland'
    assert jobs.country_from_location('Remote')==''


def test_visa_listings_that_refuse_sponsorship_are_dropped():
    assert jobs.sponsorship_blocked('We are unable to offer visa sponsorship for this role.')
    assert jobs.sponsorship_blocked('Candidates must have the right to work in the UK.')
    assert not jobs.sponsorship_blocked('Visa sponsorship and relocation support are available.')


def test_domestic_motivational_letter_prompt_exists_and_is_separate():
    domestic=section('domestic','motivational_letter')
    assert 'India' in domestic and 'visa sponsorship' in domestic.lower()
    assert domestic!=section('visa','motivational_letter')
    assert 'PROMPT FOR MotivationalLetter' not in section('domestic','cover_letter')


def test_generate_documents_tab_uses_country_to_pick_prompt(account, monkeypatch):
    client,_=account
    approve(client)
    prompts=[]
    paragraph=' '.join(['word']*170)
    letter={'name':'Jane Example','contact':[],'title':'Motivational Letter','sections':[{'heading':'Greeting','text':'Dear Hiring Manager,'},{'heading':'Body','text':paragraph},{'heading':'More','text':paragraph}]}
    resume={'name':'Jane Example','contact':['Pune, India'],'title':'Resume','sections':[{'heading':'Professional Summary','text':'QA lead.'},{'heading':'Professional Experience','text':'QA Lead | ExampleCo | 2020 – Present\n- Built Python automation.'}]}
    def generation(prompt, validate, **kwargs):
        payload=json.loads(prompt); prompts.append(payload)
        content=letter if 'motivational letter' in payload['task'] else resume if 'ATS resume' in payload['task'] else letter
        validate(content)
        return {'content':content,'model':'fixture','usage':{}}
    monkeypatch.setattr(ai,'generate',generation)
    jd='Python test automation lead role with API and Playwright experience required.'
    for kind,country in [('resume','India'),('cover_letter','Germany'),('motivational_letter','india'),('motivational_letter','Canada')]:
        task=client.post('/api/documents',json={'kind':kind,'country':country,'jd':jd,'company':'Acme'}).json(); workflows.run_one()
        assert client.get('/api/tasks/'+task['task_id']).json()['status']=='completed'
    assert prompts[0]['user_instructions']==section('domestic','resume')
    assert prompts[1]['user_instructions']==section('visa','cover_letter')
    assert prompts[2]['user_instructions']==section('domestic','motivational_letter')
    assert prompts[3]['user_instructions']==section('visa','motivational_letter')
    items=client.get('/api/content?source=documents_tab').json()
    assert len(items)==4 and all(item['company']=='Acme' for item in items)
    resume_item=next(item for item in items if item['content_type']=='resume')
    assert resume_item['latex'].startswith('\\documentclass') and resume_item['latex'].rstrip().endswith('\\end{document}')
    assert 'Jane Example' in resume_item['latex'] and '\\section*{Professional Experience}' in resume_item['latex']
    for fmt in ('docx','pdf','tex'):
        rendered=client.post('/api/content/'+resume_item['id']+'/render?format='+fmt)
        assert rendered.status_code==200, rendered.text
        blob=client.get(rendered.json()['url']).content
        assert blob
    import io
    from docx import Document
    word='\n'.join(p.text for p in Document(io.BytesIO(client.get(client.post('/api/content/'+resume_item['id']+'/render?format=docx').json()['url']).content)).paragraphs)
    assert 'Jane Example' in word and 'Built Python automation.' in word and 'documentclass' not in word


def test_prompt_reports_are_rejected_so_only_the_document_is_returned():
    report={'name':'Jane','contact':[],'title':'ATS Resume and Application Analysis','sections':[
        {'heading':'OUTPUT 1 — Target Job Analysis','text':'Target company: Acme'},
        {'heading':'Professional Summary','text':'QA lead.'},{'heading':'Professional Experience','text':'QA Lead | Acme | 2020 – Present'}]}
    with pytest.raises(ValueError, match='report'):
        ai.document_validator('resume','domestic')(report)
    latex_in_text={**report,'sections':[{'heading':'Professional Summary','text':'\\documentclass{article}'},{'heading':'Professional Experience','text':'x'}]}
    with pytest.raises(ValueError, match='report'):
        ai.document_validator('resume','domestic')(latex_in_text)


def test_generate_documents_requires_country(account):
    client,_=account
    assert client.post('/api/documents',json={'kind':'resume','country':'','jd':'x'*40}).status_code==422
    assert client.post('/api/documents',json={'kind':'resume','country':'  ','jd':'x'*40}).status_code==422
