import json
import httpx
from app import live_research
from app.config import settings


def test_grounding_quota_uses_cited_openrouter_search_and_cools_down(monkeypatch):
    monkeypatch.setattr(settings,'llm_key','synthetic-google')
    monkeypatch.setattr(settings,'openrouter_key','synthetic-router')
    calls=[]
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def post(self,url,headers,json):
            calls.append((url,json))
            data={'choices':[{'message':{'content':'Cited result','annotations':[{'type':'url_citation','url_citation':{'url':'https://example.com/jobs/qa','title':'QA role'}}]}}]}
            return httpx.Response(200 if 'openrouter.ai' in url else 429,request=httpx.Request('POST',url),json=data)
    monkeypatch.setattr(live_research.httpx,'Client',Client)
    profile={'name':'DO NOT SEND','source_markdown':'PRIVATE CV','email':'private@example.com','designation':'QA Manager','skills':['Python']}
    scope={'regions':[{'countries':['Germany'],'titles':['QA Manager']}]}
    result=live_research.research(profile,'visa','jobs',scope)
    assert result['available'] and result['provider']=='openrouter'
    assert result['sources'][0]['uri']=='https://example.com/jobs/qa'
    assert '429' not in result.get('reason','')
    body=calls[-1][1]
    assert body['tools'][0]['parameters']['max_uses']==1
    query=json.loads(body['messages'][0]['content'])
    assert query['search_scope']==scope and query['skills']==['Python']
    assert all(secret not in json.dumps(body) for secret in ['DO NOT SEND','PRIVATE CV','private@example.com'])
    live_research.research(profile,'visa','jobs',scope)
    assert len(calls)==3 and 'openrouter.ai' in calls[-1][0]


def test_uncited_output_is_not_reported_as_live_evidence(monkeypatch):
    monkeypatch.setattr(settings,'llm_key','')
    monkeypatch.setattr(settings,'openrouter_key','synthetic-router')
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def post(self,url,**kwargs):
            return httpx.Response(200,request=httpx.Request('POST',url),json={'choices':[{'message':{'content':'Unsupported claims'}}]})
    monkeypatch.setattr(live_research.httpx,'Client',Client)
    result=live_research.research({},'visa')
    assert not result['available'] and 'no cited sources' in result['reason']


def test_cited_ats_job_is_verified_without_scraping_html(monkeypatch):
    from app import jobs
    monkeypatch.setattr(live_research,'research',lambda *args,**kwargs: {
        'available':True,'checked_at':'2026-10-27','sources':[{'uri':'https://job-boards.greenhouse.io/example/jobs/123'}]})
    def fetch(url):
        assert url=='https://boards-api.greenhouse.io/v1/boards/example/jobs/123'
        return 200,{},json.dumps({'title':'QA Manager','location':{'name':'Berlin, Germany'},'content':'Python. Visa sponsorship is offered.'}).encode()
    monkeypatch.setattr(jobs,'_request_public_https',fetch)
    rows,evidence=live_research.verified_jobs({},'visa',scope={'titles':['QA Manager'],'countries':['Germany']})
    assert len(rows)==1 and rows[0]['country']=='Germany'
    assert rows[0]['verification']['status']=='Fetched official ATS job detail'
