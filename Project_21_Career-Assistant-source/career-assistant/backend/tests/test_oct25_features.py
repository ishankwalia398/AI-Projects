import pytest
import json

from app import ai, jobs, workflows
from app.db import User, get_record, put
from app.interviews import COMMON_FIELDS, guide_sections, validate_questions
from conftest import SHORT_ANSWER, DETAILED_ANSWER
from test_workflows import ingest


def question(**overrides):
    result={field:'Supported explanation' for field in COMMON_FIELDS}
    result.update(id='Q1',question='How do you prioritize API tests?',category='Core Technical Fundamentals',
                  priority=1,source_classification='General Preparation',short_answer=SHORT_ANSWER,
                  detailed_answer=DETAILED_ANSWER,follow_ups=[{'question':'Why test retries?','answer':'Retries can duplicate side effects unless the operation is idempotent.'}])
    return {**result,**overrides}


@pytest.mark.parametrize('overrides',[
    {'detailed_answer':SHORT_ANSWER},
    {'short_answer':'You should describe your testing experience.'},
    {'detailed_answer':'Prepare an answer that describes your skills. '+DETAILED_ANSWER},
    {'detailed_answer':'This is a short generic statement.'},
])
def test_answer_validator_rejects_duplicates_coaching_and_insufficient_detail(overrides):
    with pytest.raises(ValueError):
        validate_questions({'questions':[question(**overrides)]},'Core Technical Fundamentals','technical',1)


@pytest.mark.parametrize('solution',['def solve(:\n    return 1','def solve(items):\n    ...'])
def test_coding_validator_rejects_invalid_or_placeholder_python(solution):
    coding={field:'Concrete implementation details' for field in ['language','problem_statement','input_output','constraints','examples','solution','explanation','time_complexity','space_complexity','edge_cases','test_cases','alternative_solution','optimizations']}
    coding.update(language='Python',solution=solution)
    with pytest.raises(ValueError):
        validate_questions({'questions':[question(category='Programming and Coding',coding=coding)]},'Programming and Coding','technical',1)


def test_export_omits_removed_question_metadata_and_unused_sections():
    data={'kind':'technical','questions':[question(preparation_note='Hidden coaching metadata')],
          'mock_interviews':[{'name':'Removed mock'}],'company_research':'Removed research'}
    document=guide_sections(data)
    text=str(document)
    assert 'Hidden coaching metadata' not in text and 'Source Classification' not in text
    assert 'Interview Round' not in text and 'Difficulty:' not in text
    assert 'Removed mock' not in text and 'Removed research' not in text
    assert document['sections'][0]['heading'].startswith('Q1. ')
    assert 'preparation plan' not in text.lower()


def test_legacy_practice_guides_are_not_shown_as_generated_answers(account):
    client,factory=account
    with factory() as db:
        user=db.query(User).one()
        put(db,user.id,'interview','legacy-practice',{'generation_mode':'built_in','questions':[question()]})
        db.commit()
    assert client.get('/api/interviews').json()==[]


def test_title_research_reports_progress_and_returns_saved_results(account,monkeypatch):
    client,factory=account
    ingest(client)
    profile=client.get('/api/profile').json()
    client.put('/api/profile',json={**profile,'approved':True})
    def suggest(prompt,validator=None,**kwargs):
        tasks=client.get('/api/tasks').json()
        assert next(task for task in tasks if task['kind']=='research')['result']['stage'].startswith('Generating')
        assert kwargs['purpose']=='extraction'
        return {'titles':[{'title':'QA Automation Engineer','relevance':'Python and API testing','candidate_evidence':['Python'],'classification':'Inferred'}], 'countries':[]},'test-model',{}
    monkeypatch.setattr(ai,'json_call',suggest)
    queued=client.post('/api/research',json={'module':'domestic'}).json()
    assert client.post('/api/research',json={'module':'domestic'}).json()['task_id']==queued['task_id']
    workflows.run_one()
    task=client.get('/api/tasks/'+queued['task_id']).json()
    assert task['status']=='completed'
    assert client.get('/api/research/domestic').json()['titles'][0]['title']=='QA Automation Engineer'


@pytest.mark.parametrize('title,target',[
    ('Senior QA Engineer','QE'),('Quality Engineer','QA Engineer'),('SDET II','QA Engineer')])
def test_job_title_matching_handles_common_quality_role_names(title,target):
    assert jobs.title_matches(title,[target])


def test_jd_connection_failure_identifies_backend_network_restriction(monkeypatch):
    monkeypatch.setattr(jobs,'_public_url_details',lambda url:(__import__('urllib.parse',fromlist=['urlparse']).urlparse(url),['93.184.216.34']))
    def blocked(*args,**kwargs): raise OSError('[WinError 10013] Access to socket forbidden')
    monkeypatch.setattr(jobs.socket,'create_connection',blocked)
    with pytest.raises(ValueError,match='backend cannot access the internet'):
        jobs._request_public_https('https://example.com/job')


def test_apple_hydration_extracts_full_job_requirements_without_running_scripts():
    details={'postingTitle':'Senior Quality Engineering Manager','description':'Lead global quality engineering operations and product reliability across multiple engineering teams.',
             'responsibilities':'Define automation strategy and mentor engineering teams.',
             'minimumQualifications':'10+ years of software quality engineering experience.',
             'preferredQualifications':'Experience with AI-driven testing tools.'}
    state={'loaderData':{'jobDetails':{'jobsData':details}}}
    source='<html><head><title>Job title alone</title></head><script>window.__staticRouterHydrationData = JSON.parse('+json.dumps(json.dumps(state))+');</script></html>'
    text=jobs.job_page_text(source)
    assert 'Senior Quality Engineering Manager' in text and '10+ years' in text
    assert 'Preferred qualifications' in text and 'AI-driven' in text
    assert 'Job title alone' not in text


def test_title_only_html_is_not_accepted_as_a_job_description(monkeypatch):
    monkeypatch.setattr(jobs,'validate_public_url',lambda url:url)
    monkeypatch.setattr(jobs,'_request_public_https',lambda url:(200,{'Content-Type':'text/html'},b'<html><head><title>Senior Quality Engineering Manager - Jobs - Careers at Apple</title></head><body></body></html>'))
    with pytest.raises(ValueError,match='no readable job description'):
        jobs.fetch_jd('https://example.test/job')
