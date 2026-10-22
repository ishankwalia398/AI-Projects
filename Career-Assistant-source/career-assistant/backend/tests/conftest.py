import os
from pathlib import Path

os.environ['APP_ENV']='test'
os.environ['DATABASE_URL']='sqlite:///./data/tests-bootstrap.db'

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app import db as database_module
from app import security, storage, workflows
from app.config import settings
from app.main import app


@pytest.fixture
def env(tmp_path,monkeypatch):
    engine=database_module.make_engine('sqlite:///'+(tmp_path/'test.db').as_posix())
    database_module.Base.metadata.create_all(engine)
    factory=sessionmaker(engine,expire_on_commit=False)
    def dependency():
        with factory() as db:
            yield db
    app.dependency_overrides[security.database]=dependency
    monkeypatch.setattr(security,'DB',factory)
    monkeypatch.setattr(workflows,'DB',factory)
    monkeypatch.setattr(settings,'storage_dir',tmp_path/'files')
    monkeypatch.setattr(settings,'s3_bucket','')
    monkeypatch.setattr(settings,'qdrant_url','')
    monkeypatch.setattr(settings,'llm_key','')
    monkeypatch.setattr(settings,'fallback_key','')
    monkeypatch.setattr(settings,'smtp_host','')
    client=TestClient(app)
    yield client,factory
    client.close(); app.dependency_overrides.clear(); engine.dispose()


def register(client,username='alice',email=None,password='correct horse battery staple'):
    return client.post('/api/auth/register',json={'username':username,'email':email or username+'@example.com','password':password})


def login(client,username='alice',password='correct horse battery staple'):
    response=client.post('/api/auth/login',json={'username':username,'password':password})
    if response.status_code==200:
        client.headers['X-CSRF-Token']=response.json()['csrf_token']
    return response


@pytest.fixture
def account(env):
    client,factory=env
    assert register(client).status_code==201
    assert login(client).status_code==200
    return client,factory
