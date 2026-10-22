import asyncio
from threading import Event

import pytest

from app import main, storage, worker
from app.config import Settings, settings


def test_production_requires_persistent_object_storage():
    base = {
        'mode': 'production',
        'database_url': 'postgresql+psycopg://career:secret@db.example/career',
        'frontend_url': 'https://jobsearchandtracker.vercel.app',
        'cookie_secure': True,
    }
    with pytest.raises(RuntimeError, match='object store'):
        Settings(**base).validate()

    configured = Settings(
        **base,
        s3_bucket='private-career-files',
        s3_endpoint='https://account.r2.cloudflarestorage.com',
        s3_access_key_id='test-access-key',
        s3_secret_access_key='test-secret-key',
    )
    configured.validate()


def test_r2_upload_does_not_send_unsupported_sse_header(monkeypatch):
    calls = []

    class FakeS3:
        def put_object(self, **kwargs):
            calls.append(kwargs)

    monkeypatch.setattr(storage, 's3', lambda: FakeS3())
    monkeypatch.setattr(settings, 's3_bucket', 'private-career-files')
    monkeypatch.setattr(settings, 's3_endpoint', 'https://account.r2.cloudflarestorage.com')

    storage.write_bytes('user/original/file-id', b'private document')

    assert calls == [{
        'Bucket': 'private-career-files',
        'Key': 'user/original/file-id',
        'Body': b'private document',
    }]


def test_inline_worker_starts_and_stops_with_api_lifespan(monkeypatch):
    started = Event()
    stopped = Event()

    def fake_worker(stop_event):
        started.set()
        stop_event.wait(timeout=2)
        if stop_event.is_set():
            stopped.set()

    monkeypatch.setattr(main, 'migrate', lambda: None)
    monkeypatch.setattr(worker, 'run', fake_worker)
    monkeypatch.setattr(settings, 'inline_worker', True)

    async def exercise_lifespan():
        async with main.lifespan(main.app):
            assert started.wait(timeout=1)
            assert not stopped.is_set()
        assert stopped.wait(timeout=1)

    asyncio.run(exercise_lifespan())
