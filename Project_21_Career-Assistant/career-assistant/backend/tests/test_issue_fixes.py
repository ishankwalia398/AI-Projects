import io
import json

import httpx
import pytest
from docx import Document

from app import jobs, workflows
from app.config import DEFAULT_GREENHOUSE_BOARDS, settings
from app.db import User, get_record
from app.resumes import bootstrap_profile, extract
from test_workflows import ingest


@pytest.mark.parametrize('separator', [' | ', '|', ' \u2022 ', '\t', '    '])
def test_resume_contact_columns(separator):
    text = separator.join(['Full name: Jos\u00e9 Example', 'Role: Senior QA Engineer', 'Location: Pune, Maharashtra'])
    profile = bootstrap_profile(text + '\njose@example.com\n## Skills\nPython SQL')
    assert profile['name'] == 'Jos\u00e9 Example'
    assert profile['designation'] == 'Senior QA Engineer'
    assert profile['location'] == 'Pune, Maharashtra'


def test_docx_header_tables_and_current_employment():
    document = Document()
    cells = document.sections[0].header.add_table(rows=1, cols=2, width=100).rows[0].cells
    cells[0].text = 'Jane Example'
    cells[1].text = 'Location: Bengaluru, India\njane@example.com'
    for line in ['Skills', 'Python SQL', 'Experience', 'Senior QA Engineer', 'ExampleCo', '2022 - Present']:
        document.add_paragraph(line)
    output = io.BytesIO()
    document.save(output)
    profile = bootstrap_profile(extract('resume.docx', output.getvalue()))
    assert profile['name'] == 'Jane Example'
    assert profile['location'] == 'Bengaluru, India'
    assert profile['designation'] == 'Senior QA Engineer'


def test_resume_does_not_use_summary_prose_as_title_or_location():
    profile = bootstrap_profile('Jane Example\n## Summary\nEngineer with experience building platforms in India.\n## Skills\nPython')
    assert profile['designation'] == ''
    assert profile['location'] == ''


def test_reparse_existing_resume_fills_missing_fields_and_preserves_edits(account):
    client, factory = account
    document = Document()
    for line in ['Jane Example', 'Senior QA Engineer', 'Pune, Maharashtra', 'jane@example.com', 'Skills', 'Python SQL']:
        document.add_paragraph(line)
    output = io.BytesIO()
    document.save(output)
    task = client.post('/api/resumes', files={'file': ('resume.docx', output.getvalue())}).json()
    workflows.run_one()
    resume_id = client.get('/api/tasks/' + task['task_id']).json()['result']['resume_id']
    with factory() as db:
        active = get_record(db, db.query(User).one().id, 'profile', 'active')
        active.data = {**active.data, 'name': 'Reviewed Name', 'location': '', 'designation': '', 'approved': True}
        db.commit()
    queued = client.post('/api/resumes/' + resume_id + '/reparse').json()
    workflows.run_one()
    assert client.get('/api/tasks/' + queued['task_id']).json()['status'] == 'completed'
    profile = client.get('/api/profile').json()
    assert profile['name'] == 'Reviewed Name'
    assert profile['location'] == 'Pune, Maharashtra'
    assert profile['designation'] == 'Senior QA Engineer'
    assert profile['approved'] is True
    assert profile['missing_mandatory_fields'] == []
    assert client.post('/api/resumes/not-owned/reparse').status_code == 404


def test_default_boards_return_live_jobs_and_tasks_keep_their_module(account, monkeypatch):
    client, _ = account
    ingest(client)
    assert client.put('/api/preferences',json={'design':'amber','target_titles':['QA Engineer'],'countries':['Germany']}).status_code==200
    monkeypatch.setattr(settings, 'greenhouse_boards', '')
    monkeypatch.setattr(settings, 'lever_sites', '')
    requested = []

    class Client:
        def __init__(self, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def get(self, url):
            requested.append(url)
            data = {'jobs': [
                {'id': 1, 'title': 'QA Engineer', 'location': {'name': 'Pune, India'}, 'absolute_url': 'https://example.com/jobs/1', 'content': 'Python testing and automation.'},
                {'id': 2, 'title': 'QA Engineer', 'location': {'name': 'Berlin, Germany'}, 'absolute_url': 'https://example.com/jobs/2', 'content': 'We provide visa sponsorship. Python testing and automation.'},
            ]}
            return httpx.Response(200, request=httpx.Request('GET', url), json=data)

    monkeypatch.setattr(jobs.httpx, 'Client', Client)
    for module in ['domestic', 'visa']:
        queued = client.post('/api/jobs/discover', json={'module': module}).json()
        workflows.run_one()
        task = client.get('/api/tasks/' + queued['task_id']).json()
        assert task['status'] == 'completed'
        assert task['result']['saved'] > 0
        assert not task['result']['fallback_used']
        saved = client.get('/api/jobs?module=' + module).json()['items']
        assert all(not row.get('is_sample') for row in saved)
    assert all(any('/' + board + '/' in url for url in requested) for board in DEFAULT_GREENHOUSE_BOARDS.split(','))
    assert {task['module'] for task in client.get('/api/tasks').json() if task['kind'] == 'discover'} == {'domestic', 'visa'}


def test_discovery_reports_outages_without_fabricating_jobs(account, monkeypatch):
    client, _ = account
    ingest(client)
    assert client.put('/api/preferences',json={'design':'amber','target_titles':['QA Engineer'],'countries':['Germany']}).status_code==200
    monkeypatch.setattr(settings, 'greenhouse_boards', 'offline-board')
    monkeypatch.setattr(settings, 'lever_sites', '')

    class Client:
        def __init__(self, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def get(self, url): raise httpx.ConnectError('offline')

    monkeypatch.setattr(jobs.httpx, 'Client', Client)
    queued = client.post('/api/jobs/discover', json={'module': 'domestic'}).json()
    workflows.run_one()
    result = client.get('/api/tasks/' + queued['task_id']).json()['result']
    task=client.get('/api/tasks/' + queued['task_id']).json()
    assert task['status']=='failed' and 'connection failure' in task['error']
    assert client.get('/api/jobs').json()['total'] == 0


def test_default_discovery_is_available_and_missing_profile_fails_before_network(account, monkeypatch):
    client, _ = account
    monkeypatch.setattr(settings, 'greenhouse_boards', '')
    monkeypatch.setattr(settings, 'lever_sites', '')
    assert client.get('/api/integrations').json()['job_discovery'] is True
    def unexpected_network(*args, **kwargs):
        raise AssertionError('No network request should run without a profile.')
    monkeypatch.setattr(jobs.httpx, 'Client', unexpected_network)
    queued = client.post('/api/jobs/discover', json={'module': 'domestic'}).json()
    workflows.run_one()
    task = client.get('/api/tasks/' + queued['task_id']).json()
    assert task['status'] == 'failed'
    assert task['error'] == 'Upload a resume to create your candidate profile first.'


def test_general_jd_extraction_uses_nested_jobposting_data(account, monkeypatch):
    client, _ = account
    data = {'@graph': [{'@type': 'JobPosting', 'title': 'QA Engineer', 'hiringOrganization': {'name': 'ExampleCo'}, 'description': '<p>Build Python automation and reliable API tests.</p><p>Experience with SQL and Linux required.</p>'}]}
    page = '<html><nav>Navigation and cookies</nav><script type="application/ld+json">' + json.dumps(data) + '</script><div>Loading...</div></html>'
    monkeypatch.setattr(jobs, 'validate_public_url', lambda url: url)
    monkeypatch.setattr(jobs, '_request_public_https', lambda url: (200, {'Content-Type': 'text/html'}, page.encode()))
    response = client.post('/api/jd/extract', json={'url': 'https://careers.example.test/opening'})
    assert response.status_code == 200
    text = response.json()['text']
    assert 'QA Engineer' in text and 'ExampleCo' in text and 'Python automation' in text
    assert 'Navigation' not in text and 'Loading' not in text


def test_general_jd_extraction_prefers_main_and_rejects_empty_shell(monkeypatch):
    monkeypatch.setattr(jobs, 'validate_public_url', lambda url: url)
    page = b'<nav>Menu</nav><main><h1>QA Engineer</h1><p>Build Python automation and reliable API tests with SQL and Linux.</p></main><footer>Cookies</footer>'
    monkeypatch.setattr(jobs, '_request_public_https', lambda url: (200, {'Content-Type': 'text/html'}, page))
    assert 'Cookies' not in jobs.fetch_jd('https://example.test/job')
    monkeypatch.setattr(jobs, '_request_public_https', lambda url: (200, {'Content-Type': 'text/html'}, b'<div id="app"></div><script>render()</script>'))
    with pytest.raises(ValueError, match='sign-in or JavaScript'):
        jobs.fetch_jd('https://example.test/job')
