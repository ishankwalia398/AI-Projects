import httpx

from app import jobs
from app.config import settings
from app.db import User, put
from test_workflows import add_job


def test_domestic_jobs_always_require_resume_and_cover_letter():
    assert jobs.required_documents({'description': 'Build Python services.'}, 'domestic') == ['Resume/CV', 'Cover Letter']


def test_visa_jobs_always_require_resume_cover_and_motivational_letter():
    assert jobs.required_documents({'description': 'Visa sponsorship available.'}, 'visa') == ['Resume/CV', 'Cover Letter', 'Motivational Letter']


def test_motivational_letter_requested_in_a_domestic_jd_is_included():
    docs = jobs.required_documents({'description': 'Please attach your CV and a letter of motivation.'}, 'domestic')
    assert docs == ['Resume/CV', 'Motivational Letter', 'Cover Letter']


def test_optional_cover_letter_upload_on_the_form_counts_as_mandatory(monkeypatch):
    class Client:
        def get(self, url):
            assert url.endswith('/jobs/42?questions=true')
            return httpx.Response(200, request=httpx.Request('GET', url), json={'questions': [
                {'label': 'Resume/CV', 'required': True, 'fields': [{'name': 'resume', 'type': 'input_file'}]},
                {'label': 'Cover Letter', 'required': False, 'fields': [{'name': 'cover_letter', 'type': 'input_file'}]}]})
    fields = jobs._form_fields(Client(), {'source': 'greenhouse:acme', 'requisition_id': '42'})
    assert any('Cover Letter' in f for f in fields)
    assert 'Cover Letter' in jobs.required_documents({'description': ''}, 'domestic', fields)


def test_form_lookup_failure_never_breaks_discovery():
    class Broken:
        def get(self, url): raise httpx.ConnectError('offline')
    assert jobs._form_fields(Broken(), {'source': 'greenhouse:acme', 'requisition_id': '1'}) is None
    assert jobs._form_fields(Broken(), {'source': 'lever:acme', 'requisition_id': '1'}) is None


def test_old_jobs_get_documents_and_apply_no_longer_reports_unconfirmed_requirements(account):
    client, factory = account
    with factory() as db:
        user = db.query(User).one()
        put(db, user.id, 'job', 'legacy', {'id': 'legacy', 'module': 'visa', 'status': 'NOT APPLIED', 'company': 'Co', 'title': 'QA Lead',
                                          'location': 'Berlin', 'country': 'Germany', 'url': 'https://example.com/1', 'description': 'Visa sponsorship.',
                                          'discovered_at': '2026-11-01T00:00:00', 'match': {'score': 50}, 'mandatory_documents': [], 'mandatory_documents_known': False})
        db.commit()
    listed = client.get('/api/jobs?module=visa&view=previous').json()['items'][0]
    assert listed['mandatory_documents'] == ['Resume/CV', 'Cover Letter', 'Motivational Letter']
    outcome = client.post('/api/applications/prepare', json={'job_ids': [listed['id']]}).json()['outcomes'][0]
    assert not any('not been confirmed' in e for e in outcome['errors'])
    assert 'Missing documents: Resume/CV, Cover Letter, Motivational Letter' in outcome['errors']


def test_user_edited_documents_survive_rediscovery(account):
    client, _ = account
    job = add_job(client)
    client.patch('/api/jobs/' + job['id'], json={'mandatory_documents': ['Resume/CV', 'Portfolio'], 'mandatory_documents_known': True})
    assert client.get('/api/jobs/' + job['id']).json()['mandatory_documents'] == ['Resume/CV', 'Portfolio']
