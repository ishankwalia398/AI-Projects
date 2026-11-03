from app.db import User, put
from app.search_scope import resolve_scope, matches_scope
from app.jobs import title_matches, country_from_location


def test_suggestions_override_unrelated_preferences_and_keep_regions(account):
    _,factory=account
    with factory() as db:
        user=db.query(User).one()
        put(db,user.id,'preferences','active',{'target_titles':['Marketing Manager'],'countries':['Canada']})
        put(db,user.id,'research','domestic',{'regions':[{'region':'India','countries':['India'],'titles':['QA Manager']}]})
        put(db,user.id,'research','visa',{'regions':[
            {'region':'EU','countries':['Germany'],'titles':['QA Manager']},
            {'region':'North America','countries':['Canada'],'titles':['Automation Lead']}]})
        put(db,user.id,'research','visa-countries',{'regions':[
            {'region':'Europe','countries':['Germany','Netherlands']},
            {'region':'North America','countries':['Canada']}]})
        domestic=resolve_scope(db,user.id,'domestic',{})
        visa=resolve_scope(db,user.id,'visa',{})
        assert domestic['titles']==['QA Manager'] and domestic['countries']==['India']
        assert matches_scope({'title':'Quality Engineering Manager','country':'India'},domestic)
        assert not matches_scope({'title':'Marketing Manager','country':'India'},domestic)
        assert matches_scope({'title':'QA Manager','country':'NL'},visa)
        assert not matches_scope({'title':'QA Manager','country':'Canada'},visa)
        assert not matches_scope({'title':'Automation Lead','country':'Germany'},visa)


def test_titles_do_not_match_on_generic_manager_word():
    assert not title_matches('Marketing Manager',['QA Manager'])
    assert not title_matches('Junior QA Engineer',['Senior QA Engineer'])
    assert title_matches('Senior Quality Assurance Manager',['QA Manager'])
    assert country_from_location('Berlin, Hybrid')=='Germany'
    assert country_from_location('London, Canada')=='Canada'


def test_discovery_ranks_scope_countries_first_and_keeps_results_when_ai_rejects_all(account,monkeypatch):
    import httpx
    from app import ai, jobs, live_research
    from app.config import settings
    client,factory=account
    monkeypatch.setattr(settings,'greenhouse_boards','fixture')
    monkeypatch.setattr(settings,'lever_sites','')
    monkeypatch.setattr(settings,'llm_key','synthetic')
    monkeypatch.setattr(live_research,'verified_jobs',lambda profile,module,scope: ([],{'available':True}))
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def get(self,url):
            rows=[{'id':n,'title':title,'location':{'name':country},'absolute_url':f'https://example.com/{n}',
                   'content':'Python services. We offer visa sponsorship.'} for n,title,country in [
                       (1,'QA Manager','Germany'),(2,'Marketing Manager','Germany'),(3,'QA Manager','Canada')]]
            return httpx.Response(200,request=httpx.Request('GET',url),json={'jobs':rows})
    monkeypatch.setattr(jobs.httpx,'Client',Client)
    reviewed=[]
    def review(prompt,validate,**kwargs):
        import json
        payload=json.loads(prompt); reviewed.extend(payload['listings'])
        result={'matching_ids':[]}; validate(result)
        return result,'fixture',{}
    monkeypatch.setattr(ai,'json_call',review)
    with factory() as db:
        user=db.query(User).one()
        put(db,user.id,'profile','active',{'designation':'QA Manager','skills':['Python']})
        put(db,user.id,'research','visa',{'regions':[{'region':'EU','countries':['Germany'],'titles':['QA Manager']}]})
        db.commit()
        result=jobs.discover(db,user.id,'visa')
        assert result['saved']==2
        assert [(row['title'],row['country']) for row in reviewed]==[('QA Manager','Germany'),('QA Manager','Canada')]
        assert result['search_scope']['countries']==['Germany']
    listed=client.get('/api/jobs?module=visa').json()
    assert [job['country'] for job in listed['items']][0]=='Germany' and listed['total']==2


def test_ai_review_selects_and_orders_jobs(account,monkeypatch):
    import httpx
    from app import ai, jobs, live_research
    from app.config import settings
    client,factory=account
    monkeypatch.setattr(settings,'greenhouse_boards','fixture')
    monkeypatch.setattr(settings,'llm_key','synthetic')
    monkeypatch.setattr(live_research,'verified_jobs',lambda profile,module,scope: ([],{'available':False}))
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def get(self,url):
            rows=[{'id':n,'title':'QA Lead','location':{'name':'Pune, India'},'absolute_url':f'https://example.com/{n}','content':'Python testing.'} for n in range(1,4)]
            return httpx.Response(200,request=httpx.Request('GET',url),json={'jobs':rows})
    monkeypatch.setattr(jobs.httpx,'Client',Client)
    def review(prompt,validate,**kwargs):
        import json
        ids=[row['id'] for row in json.loads(prompt)['listings']]
        result={'matching_ids':[ids[2],ids[0]]}; validate(result)
        return result,'fixture',{}
    monkeypatch.setattr(ai,'json_call',review)
    with factory() as db:
        user=db.query(User).one()
        put(db,user.id,'profile','active',{'designation':'QA Lead','skills':['Python']})
        put(db,user.id,'research','domestic',{'regions':[{'region':'India','countries':['India'],'titles':['QA Lead']}]})
        db.commit()
        result=jobs.discover(db,user.id,'domestic')
        assert result['saved']==2
        assert result['warnings']==['Live web search unavailable; results come from employer career boards.']
        assert 'cooling down' not in json_dump(result) and 'HTTP 4' not in json_dump(result)
    latest=client.get('/api/jobs?module=domestic').json()
    assert latest['total']==2
    assert client.get('/api/jobs?module=domestic&view=previous').json()['total']==2


def json_dump(value):
    import json
    return json.dumps(value)


def test_discovery_returns_at_most_ten_and_previous_view_keeps_history(account,monkeypatch):
    import httpx
    from app import jobs
    from app.config import settings
    client,factory=account
    monkeypatch.setattr(settings,'greenhouse_boards','fixture')
    batch={'start':0}
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def get(self,url):
            start=batch['start']
            rows=[{'id':n,'title':'Senior QA Engineer','location':{'name':'Bengaluru, India'},'absolute_url':f'https://example.com/{n}','content':'Python and Playwright testing.'} for n in range(start,start+15)]
            return httpx.Response(200,request=httpx.Request('GET',url),json={'jobs':rows})
    monkeypatch.setattr(jobs.httpx,'Client',Client)
    with factory() as db:
        user=db.query(User).one()
        put(db,user.id,'profile','active',{'designation':'QA Engineer','skills':['Python']})
        put(db,user.id,'research','domestic',{'regions':[{'region':'India','countries':['India'],'titles':['QA Engineer']}]})
        db.commit()
        assert jobs.discover(db,user.id,'domestic')['saved']==10
        batch['start']=100
        assert jobs.discover(db,user.id,'domestic')['saved']==10
    assert client.get('/api/jobs?module=domestic').json()['total']==10
    previous=client.get('/api/jobs?module=domestic&view=previous').json()
    assert previous['total']==20 and all('status' in job for job in previous['items'])


def test_visa_regions_with_different_names_still_join():
    from app.search_scope import region_key
    assert region_key('European Union (EU)')==region_key('EU')
    assert region_key('APAC (excluding India)')==region_key('Asia-Pacific')
    assert region_key('Wider EMEA')==region_key('United Kingdom')
    assert region_key('United States')==region_key('North America')==region_key('Canada')
    assert region_key('Australia')==region_key('Australia and New Zealand')


def test_missing_search_scope_is_actionable(account):
    import pytest
    _,factory=account
    with factory() as db:
        user=db.query(User).one()
        with pytest.raises(ValueError,match='Generate title suggestions'):
            resolve_scope(db,user.id,'visa',{})


def test_changed_profile_requires_updated_suggestions(account):
    import pytest
    from app.search_scope import profile_signature
    _,factory=account
    profile={'designation':'QA Engineer','skills':['Python']}
    with factory() as db:
        user=db.query(User).one()
        put(db,user.id,'research','domestic',{'profile_signature':profile_signature(profile),
            'regions':[{'region':'India','titles':['QA Engineer'],'countries':['India']}]})
        assert resolve_scope(db,user.id,'domestic',profile)['titles']==['QA Engineer']
        with pytest.raises(ValueError,match='profile has changed'):
            resolve_scope(db,user.id,'domestic',{**profile,'skills':['Java']})
