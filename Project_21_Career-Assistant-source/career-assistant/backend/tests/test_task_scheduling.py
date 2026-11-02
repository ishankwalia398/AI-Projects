from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from datetime import timedelta
from app import workflows, ai
from app.db import Task, User, now


def test_priority_atomic_claim_and_eta(account, monkeypatch):
    _, factory = account
    with factory() as db:
        user = db.query(User).first()
        for kind, payload in [('interview', {'kind':'hr'}), ('discover', {'module':'visa'}), ('research', {'module':'domestic'}), ('ingest', {})]:
            db.add(Task(user_id=user.id,kind=kind,payload=payload))
        db.commit()
        views = workflows.task_views(db,user.id)
        assert all(v['eta_seconds'] > 0 for v in views)
        assert len({v['total_eta_seconds'] for v in views}) == 1
    calls=[]
    monkeypatch.setattr(workflows,'process',lambda db,t:calls.append(t.kind) or {})
    assert workflows.run_one()
    assert calls == ['ingest']
    with ThreadPoolExecutor(max_workers=3) as pool:
        assert all(pool.map(lambda _: workflows.run_one(),range(3)))
    assert len(calls)==4
    assert calls.count('interview')==1
    assert not workflows.run_one()


def test_progress_eta_uses_completed_questions():
    task=SimpleNamespace(kind='interview',payload={'kind':'technical'},status='running',result={
        '_started_at':(now()-timedelta(seconds=120)).isoformat(),'questions':6,'total_questions':36})
    assert 590 <= workflows.remaining_seconds(task) <= 610


def test_transient_retry_then_valid_response(monkeypatch):
    calls=[]
    def provider(*args,**kwargs):
        calls.append(1)
        if len(calls)<3:
            raise ValueError('AI providers failed validation or were unavailable: HTTP 503')
        return {'questions':[]},'test',{}
    monkeypatch.setattr(ai,'_json_call_once',provider)
    monkeypatch.setattr(ai.time,'sleep',lambda _:None)
    assert ai.json_call('{}',purpose='interview')[1]=='test'
    assert len(calls)==3
