import json
from app.prompt_library import section, version
from app.ai import document_prompt

def test_all_user_prompt_sections_load_without_cross_contamination():
    for module,purposes in [('domestic',['titles','search','resume','cover_letter']),('visa',['titles','countries','search','resume','cover_letter','motivational_letter']),('interview',['technical','hr'])]:
        for purpose in purposes:
            assert len(section(module,purpose))>1000
            assert len(version(module,purpose))==16
    assert 'PROMPT FOR CoverLetter' not in section('visa','resume')
    assert section('interview','technical').startswith('1. Technical')
    assert section('interview','hr').startswith('2. Non-Technical')

def test_motivational_letter_uses_its_own_instructions():
    prompt=json.loads(document_prompt('motivational_letter',{'name':'Test'},{'module':'visa','title':'Engineer'}))
    assert 'motivational letter' in prompt['task']
    assert prompt['user_instructions']==section('visa','motivational_letter')

def test_country_suggestions_are_saved_separately(account,monkeypatch):
    from app import ai, workflows
    from test_workflows import ingest
    client,_=account
    ingest(client)
    profile=client.get('/api/profile').json()
    client.put('/api/profile',json={**profile,'approved':True})
    def suggest(prompt,validator,**kwargs):
        data={'regions':[{'region':'EU','countries':['Germany','France']}]}
        validator(data)
        return data,'fixture',{}
    monkeypatch.setattr(ai,'json_call',suggest)
    task=client.post('/api/research/countries',json={}).json()
    workflows.run_one()
    assert client.get('/api/tasks/'+task['task_id']).json()['status']=='completed'
    assert client.get('/api/research/visa-countries').json()['regions'][0]['countries']==['Germany','France']
    assert client.get('/api/research/visa').json() is None
