import importlib.util
from pathlib import Path
import sys

import pytest


SCRIPTS = Path(__file__).resolve().parents[2] / 'scripts'
sys.path.insert(0, str(SCRIPTS))
try:
    spec = importlib.util.spec_from_file_location('career_reset', SCRIPTS / 'reset_data.py')
    reset = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reset)
finally:
    sys.path.pop(0)


@pytest.fixture
def project(tmp_path, monkeypatch):
    root = tmp_path / 'app'
    for directory in ('backend/data/files/user', 'frontend'):
        (root / directory).mkdir(parents=True)
    (root / 'backend/data/career.db').write_text('accounts profiles RAG embeddings')
    (root / 'backend/data/files/user/resume.pdf').write_bytes(b'private resume')
    (root / '.env').write_text('LLM_API_KEY=private-test-value\n')
    (root / '.env.example').write_text('LLM_API_KEY=\n')
    (root / 'backend/.env.local').write_text('SECRET=test\n')
    (root / 'frontend/package.json').write_text('{}')
    monkeypatch.setattr(reset, 'ROOT', root)
    monkeypatch.delenv('CAREER_ASSISTANT_DATA_DIR', raising=False)
    monkeypatch.setattr(reset, 'app_running', lambda: False)
    return root


def test_dry_run_and_cancel_preserve_private_data(project, monkeypatch):
    assert reset.main(['--for-sharing', '--dry-run']) == 0
    monkeypatch.setattr('builtins.input', lambda _: 'no')
    assert reset.main(['--for-sharing']) == 1
    assert (project / 'backend/data/career.db').exists()
    assert (project / '.env').exists()


@pytest.mark.parametrize('sharing', [False, True])
def test_confirmed_reset_removes_all_local_data_only(project, monkeypatch, sharing):
    monkeypatch.setattr('builtins.input', lambda _: 'DELETE ALL DATA')
    assert reset.main(['--for-sharing'] if sharing else []) == 0
    assert not (project / 'backend/data').exists()
    assert (project / '.env').exists() is not sharing
    assert (project / 'backend/.env.local').exists() is not sharing
    assert (project / '.env.example').exists()
    assert (project / 'frontend/package.json').exists()


def test_running_app_is_refused(project, monkeypatch):
    monkeypatch.setattr(reset, 'app_running', lambda: True)
    assert reset.main([]) == 1
    assert (project / 'backend/data/career.db').exists()


def test_source_paths_and_ancestors_cannot_be_deleted(project):
    for target in (project, project.parent, project / 'frontend', project / 'backend'):
        with pytest.raises(ValueError):
            reset.plan(project, str(target))


def test_external_data_requires_explicit_path(project, monkeypatch):
    external = project.parent / 'custom-career-data'
    external.mkdir()
    (external / 'career.db').write_text('private RAG')
    monkeypatch.setenv('CAREER_ASSISTANT_DATA_DIR', str(external))
    with pytest.raises(ValueError, match='explicitly pass'):
        reset.plan(project)
    monkeypatch.setattr('builtins.input', lambda _: 'DELETE ALL DATA')
    assert reset.main(['--data-dir', str(external)]) == 0
    assert not external.exists()
    assert not (project / 'backend/data').exists()


def test_nested_link_is_refused_before_deletion(project):
    link = project / 'backend/data/escape'
    try:
        link.symlink_to(project / 'frontend', target_is_directory=True)
    except OSError:
        pytest.skip('Creating symlinks requires Windows developer mode or privilege')
    with pytest.raises(ValueError, match='link or junction'):
        reset.plan(project)
    assert (project / 'frontend/package.json').exists()

def test_keep_login_removes_everything_else_and_preserves_credentials(project,monkeypatch):
    import sqlite3
    database=project/'backend/data/career.db'
    database.unlink()
    with sqlite3.connect(database) as db:
        db.executescript('CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, email TEXT, password_hash TEXT); CREATE TABLE records (id TEXT, data TEXT); CREATE TABLE sessions (id TEXT); CREATE TABLE tasks (id TEXT); CREATE TABLE schema_versions (version INTEGER);')
        db.execute('INSERT INTO users VALUES (?,?,?,?)',('user-id','alice','alice@example.test','original-hash'))
        db.execute("INSERT INTO records VALUES ('r','private resume and RAG')")
        db.execute("INSERT INTO sessions VALUES ('active-token')")
        db.execute("INSERT INTO tasks VALUES ('pending')")
        db.execute('INSERT INTO schema_versions VALUES (1)')
    monkeypatch.setattr('builtins.input',lambda _: 'DELETE ALL DATA')
    assert reset.main(['--keep-login'])==0
    with sqlite3.connect(database) as db:
        assert db.execute('SELECT * FROM users').fetchall()==[('user-id','alice','alice@example.test','original-hash')]
        for table in ('records','sessions','tasks'):
            assert db.execute('SELECT COUNT(*) FROM '+table).fetchone()[0]==0
    assert not (project/'backend/data/files').exists()
    assert (project/'.env').exists()
