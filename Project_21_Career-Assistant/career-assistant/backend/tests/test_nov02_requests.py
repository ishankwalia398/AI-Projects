import json
from types import SimpleNamespace

import httpx
import pytest

from app import ai, workflows
from app.config import settings
from app.prompt_library import section
from test_workflows import ingest


def words(n, closing=True):
    body = ' '.join(['word'] * n)
    return body


def letter(total):
    """A letter whose visible text has exactly `total` words across its sections."""
    first = max(1, total // 3)
    second = max(1, total // 3)
    third = total - first - second
    return {'name': 'Jane Example', 'contact': ['Pune, India'], 'title': 'Motivational Letter', 'sections': [
        {'heading': 'Why This Company', 'text': words(first)},
        {'heading': 'Why This Role', 'text': words(second)},
        {'heading': 'Closing', 'text': words(third)},
    ], 'unknowns': []}


@pytest.mark.parametrize('module', ['domestic', 'visa'])
def test_word_limits_are_read_from_each_motivational_prompt(module):
    assert ai.motivational_word_limits(section(module, 'motivational_letter')) == (320, 360)


@pytest.mark.parametrize('module', ['domestic', 'visa'])
def test_motivational_letter_over_the_prompt_maximum_is_rejected(module):
    validate = ai.document_validator('motivational_letter', module)
    validate(letter(340))
    validate(letter(360))
    with pytest.raises(ValueError, match='at most 360'):
        validate(letter(361))
    with pytest.raises(ValueError, match='requires 320'):
        validate(letter(200))


def test_headings_are_not_counted_and_other_documents_are_unaffected():
    data = letter(360)
    data['sections'][0]['heading'] = ' '.join(['heading'] * 50)
    ai.document_validator('motivational_letter', 'visa')(data)
    resume = {**letter(600), 'sections': [{'heading': 'Professional Summary', 'text': words(100)}, {'heading': 'Professional Experience', 'text': words(500)}]}
    ai.document_validator('resume', 'visa')(resume)
    ai.document_validator('cover_letter', 'domestic')(letter(900))


def test_motivational_prompt_states_the_strict_length():
    prompt = json.loads(ai.document_prompt('motivational_letter', {'name': 'Test'}, {'prompt_module': 'domestic'}))
    assert 'never more than 360' in prompt['task'] and '320–360' in prompt['task']


def test_too_long_letter_is_regenerated_before_saving(account, monkeypatch):
    client, _ = account
    ingest(client)
    profile = client.get('/api/profile').json()
    client.put('/api/profile', json={**profile, 'approved': True})
    prompts = []
    def call(prompt, validator=None, **kwargs):
        prompts.append(prompt)
        data = letter(700) if len(prompts) == 1 else letter(345)
        if validator: validator(data)
        return data, 'fixture', {}
    monkeypatch.setattr(ai, 'json_call', lambda prompt, validator=None, **kw: _retrying(call, prompt, validator))
    task = client.post('/api/documents', json={'kind': 'motivational_letter', 'country': 'Germany', 'jd': 'QA lead role in Berlin requiring Python automation and leadership.'}).json()
    workflows.run_one()
    result = client.get('/api/tasks/' + task['task_id']).json()
    assert result['status'] == 'completed', result['error']
    assert len(prompts) == 2 and 'at most 360' in prompts[1]
    saved = client.get('/api/content?source=documents_tab').json()[0]
    assert ai.word_count(ai.letter_text(saved['structured_content'])) == 345
    assert 'Why This Company' not in saved['markdown_content']
    rendered = client.post('/api/content/' + saved['id'] + '/render?format=docx').json()
    from docx import Document
    import io
    doc = Document(io.BytesIO(client.get(rendered['url']).content))
    assert not any('Why This Company' in p.text for p in doc.paragraphs)


def _retrying(call, prompt, validator):
    try:
        return call(prompt, validator)
    except ValueError as exc:
        return call(prompt + '\nValidation failure: ' + str(exc), validator)


def test_editing_a_letter_beyond_the_limit_is_refused(account):
    client, factory = account
    from app.db import User, put
    with factory() as db:
        user = db.query(User).one()
        row = put(db, user.id, 'content', 'letter', {'content_type': 'motivational_letter', 'source': 'documents_tab', 'prompt_module': 'visa',
                                                     'structured_content': letter(340), 'markdown_content': '', 'validation_status': 'needs_review'})
        db.commit(); content_id = row.id
    too_long = client.put('/api/content/' + content_id, json={'structured_content': letter(400)})
    assert too_long.status_code == 422 and 'at most 360' in too_long.json()['detail']
    assert client.put('/api/content/' + content_id, json={'structured_content': letter(350)}).status_code == 200


class FakeStream:
    def __init__(self, message): self.message = message
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def get_final_message(self): return self.message


def fake_anthropic(monkeypatch, calls, message=None, error=None):
    import anthropic
    class Messages:
        def stream(self, **kwargs):
            calls.append(kwargs)
            if error: raise error
            return FakeStream(message)
    class Client:
        def __init__(self, **kwargs):
            calls.append({'client': kwargs})
            self.messages = Messages()
    monkeypatch.setattr(anthropic, 'Anthropic', Client)


def message(text, stop='end_turn'):
    return SimpleNamespace(stop_reason=stop, model='claude-opus-5-5',
                           content=[SimpleNamespace(type='thinking', thinking=''), SimpleNamespace(type='text', text=text)],
                           usage=SimpleNamespace(input_tokens=10, output_tokens=5))


def test_claude_is_used_when_gemini_quota_is_exhausted(monkeypatch):
    monkeypatch.setattr(settings, 'llm_key', 'synthetic-gemini')
    monkeypatch.setattr(settings, 'fallback_key', '')
    monkeypatch.setattr(settings, 'anthropic_key', 'synthetic-anthropic')
    monkeypatch.setattr(settings, 'anthropic_url', 'http://127.0.0.1:9')
    gemini = []
    class Client:
        def __init__(self, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def post(self, url, **kwargs):
            gemini.append(url)
            return httpx.Response(429, request=httpx.Request('POST', url), json={'error': 'quota'})
    monkeypatch.setattr(ai.httpx, 'Client', Client)
    calls = []
    fake_anthropic(monkeypatch, calls, message('```json\n{"result": "ok"}\n```'))
    data, model, usage = ai.json_call('{"task":"x"}')
    assert data == {'result': 'ok'} and model == 'claude-opus-5-5' and gemini
    request = calls[-1]
    assert request['model'] == 'claude-sub-opus[1m]'
    assert request['output_config'] == {'effort': 'medium'} and 'thinking' not in request
    assert calls[0]['client']['base_url'] == 'http://127.0.0.1:9'
    # Quota-exhausted Gemini is now cooling down, so the next call goes straight to Claude.
    gemini.clear()
    ai.json_call('{"task":"y"}')
    assert gemini == []


def test_claude_errors_are_reported_and_cool_down(monkeypatch):
    import anthropic
    monkeypatch.setattr(settings, 'llm_key', '')
    monkeypatch.setattr(settings, 'fallback_key', '')
    monkeypatch.setattr(settings, 'anthropic_key', 'synthetic-anthropic')
    request = httpx.Request('POST', 'http://127.0.0.1:9/v1/messages')
    calls = []
    fake_anthropic(monkeypatch, calls, error=anthropic.RateLimitError('limit', response=httpx.Response(429, request=request), body=None))
    with pytest.raises(ValueError, match='HTTP 429'):
        ai.json_call('{"task":"x"}')
    with pytest.raises(ValueError, match='retry in'):
        ai.json_call('{"task":"x"}')


def test_claude_refusal_is_not_parsed_as_content(monkeypatch):
    monkeypatch.setattr(settings, 'llm_key', '')
    monkeypatch.setattr(settings, 'fallback_key', '')
    monkeypatch.setattr(settings, 'anthropic_key', 'synthetic-anthropic')
    fake_anthropic(monkeypatch, [], message('{"result": "ok"}', stop='refusal'))
    with pytest.raises(ValueError, match='declined'):
        ai.json_call('{"task":"x"}')


def test_anthropic_key_alone_enables_ai_features(account, monkeypatch):
    client, _ = account
    monkeypatch.setattr(settings, 'anthropic_key', 'synthetic-anthropic')
    assert client.get('/api/integrations').json()['ai'] is True
