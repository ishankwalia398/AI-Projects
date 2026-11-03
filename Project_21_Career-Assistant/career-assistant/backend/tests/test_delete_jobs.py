from app.db import Record, User
from app.jobs import upsert_job

def test_delete_job_is_tenant_scoped_and_hidden_from_listing(account):
    client,factory=account
    data={'company':'Example','title':'Engineer','location':'India','country':'India','url':'https://example.org/jobs/1','description':'Python engineering','source':'manual'}
    with factory() as db:
        user=db.query(User).one()
        job=upsert_job(db,user.id,data)
        db.commit()
        job_id=job.id
    assert client.delete('/api/jobs/'+job_id).status_code==200
    assert client.get('/api/jobs/'+job_id).status_code==404
    assert client.get('/api/jobs?module=domestic').json()['total']==0
    assert client.delete('/api/jobs/'+job_id).status_code==404
    with factory() as db:
        assert db.get(Record,job_id).kind=='deleted_job'
