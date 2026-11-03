import importlib.util
from pathlib import Path

import pytest


SCRIPT = Path(__file__).resolve().parents[2] / 'scripts' / 'run_local.py'
SPEC = importlib.util.spec_from_file_location('career_assistant_run_local', SCRIPT)
run_local = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(run_local)


def test_parse_dotenv_supports_export_quotes_and_comments(tmp_path):
    dotenv = tmp_path / '.env'
    dotenv.write_text(
        'export LLM_API_KEY="test-value"\n'
        'GREENHOUSE_BOARDS=sample-board # comment\n'
        "LABEL='literal # value'\n",
        encoding='utf-8',
    )
    assert run_local.parse_dotenv(dotenv) == {
        'LLM_API_KEY':'test-value',
        'GREENHOUSE_BOARDS':'sample-board',
        'LABEL':'literal # value',
    }


def test_child_environment_loads_dotenv_and_enforces_local_worker(tmp_path, monkeypatch):
    root = tmp_path / 'project'
    backend = root / 'backend'
    root.mkdir()
    backend.mkdir()
    (root / '.env').write_text(
        'LLM_API_KEY=test-claude-key\n'
        'LLM_MODEL=claude-test-model\n'
        'GREENHOUSE_BOARDS=sample-board\n'
        'LEVER_SITES=sample-site\n'
        'INLINE_WORKER=false\n'
        'DATABASE_URL=postgresql://should-not-be-used\n',
        encoding='utf-8',
    )
    monkeypatch.setattr(run_local, 'ROOT', root)
    monkeypatch.setattr(run_local, 'BACKEND', backend)
    monkeypatch.setenv('CAREER_ASSISTANT_DATA_DIR', str(tmp_path / 'persistent-data'))
    for key in ('LLM_API_KEY', 'LLM_MODEL', 'GREENHOUSE_BOARDS', 'LEVER_SITES', 'INLINE_WORKER', 'DATABASE_URL'):
        monkeypatch.delenv(key, raising=False)

    env = run_local.child_environment()

    assert env['LLM_API_KEY'] == 'test-claude-key'
    assert env['LLM_MODEL'] == 'claude-test-model'
    assert env['GREENHOUSE_BOARDS'] == 'sample-board'
    assert env['LEVER_SITES'] == 'sample-site'
    assert env['INLINE_WORKER'] == 'true'
    assert env['DATABASE_URL'].startswith('sqlite:///')
    assert 'should-not-be-used' not in env['DATABASE_URL']
    assert env['STORAGE_DIR'] == str(tmp_path / 'persistent-data' / 'files')
    frontend_env = run_local.frontend_environment(env)
    assert 'LLM_API_KEY' not in frontend_env
    assert frontend_env['GREENHOUSE_BOARDS'] == 'sample-board'


def test_parse_dotenv_rejects_malformed_entries(tmp_path):
    dotenv = tmp_path / '.env'
    dotenv.write_text('LLM_API_KEY="unclosed\n', encoding='utf-8')
    with pytest.raises(ValueError, match='Unclosed quoted value'):
        run_local.parse_dotenv(dotenv)

def test_port_conflict_prevents_dependency_setup_or_service_start(monkeypatch):
    class BusySocket:
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def setsockopt(self,*args): pass
        def bind(self,address): raise OSError('Address already in use')
    monkeypatch.setattr(run_local.socket,'socket',lambda *args: BusySocket())
    def unexpected(): raise AssertionError('Dependencies must not run on a conflicting port')
    monkeypatch.setattr(run_local,'prepare_dependencies',unexpected)
    with pytest.raises(RuntimeError,match='Port 8000 is already in use'):
        run_local.main()
