from pathlib import Path

from streamlit.testing.v1 import AppTest


def test_initial_render(monkeypatch):
    monkeypatch.setenv("LLM_MODEL", "test-model")
    app = Path(__file__).parents[1] / "app.py"
    at = AppTest.from_file(str(app)).run(timeout=60)
    assert not at.exception
    assert at.title[0].value == "Jira QA Crew"
    assert at.button[0].disabled is False


def test_validation_error(monkeypatch):
    monkeypatch.setenv("LLM_MODEL", "test-model")
    at = AppTest.from_file(str(Path(__file__).parents[1] / "app.py")).run(timeout=60)
    at.button[0].click().run(timeout=60)
    assert any("valid Jira" in e.value for e in at.error)
    assert at.button[0].disabled is False
    assert at.session_state.qa_processing is False
