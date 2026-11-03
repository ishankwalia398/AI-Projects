import json

import httpx
import pytest

from app import ai
from app.config import settings

GEMINI_EXTRA = ['gemini-extra-a', 'gemini-extra-b']
ROUTER_EXTRA = ['vendor/free-a:free', 'openrouter/free']


@pytest.fixture
def routed(monkeypatch):
    calls = []
    monkeypatch.setattr(settings, 'llm_key', 'fixture-google')
    monkeypatch.setattr(settings, 'fallback_key', '')
    monkeypatch.setattr(settings, 'openrouter_key', 'fixture-router')
    monkeypatch.setattr(settings, 'gemini_models', ','.join(GEMINI_EXTRA))
    monkeypatch.setattr(settings, 'openrouter_models', ','.join(ROUTER_EXTRA))
    monkeypatch.setattr(settings, 'llm_max_wait', 0)
    monkeypatch.setattr(ai.time, 'sleep', lambda seconds: None)

    def install(outcome):
        class Client:
            def __init__(self, **kwargs): pass
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def post(self, url, headers, json):
                calls.append((url, headers, json))
                response = outcome(url, json)
                if isinstance(response, Exception):
                    raise response
                status, body = response
                return httpx.Response(status, request=httpx.Request('POST', url), json=body)
        monkeypatch.setattr(ai.httpx, 'Client', Client)
    return calls, install


def answer(content=None):
    return {'model': 'actual-served-model', 'choices': [{'message': {'content': json.dumps(content or {'ok': True})}}], 'usage': {'total_tokens': 9}}


def gemini_order(purpose):
    primary = [settings.llm_model, settings.fallback_model]
    if purpose in ('extraction', 'interview_fast'):
        primary.reverse()
    return primary + GEMINI_EXTRA


ALL_MODELS = 2 + len(GEMINI_EXTRA) + 1 + len(ROUTER_EXTRA)


@pytest.mark.parametrize('purpose', ['generation', 'extraction', 'interview_fast', 'interview'])
def test_every_gemini_model_is_tried_before_openrouter_and_cooldowns_recover(routed, monkeypatch, purpose):
    calls, install = routed
    clock = [100.0]
    monkeypatch.setattr(ai.time, 'monotonic', lambda: clock[0])
    install(lambda url, body: (200, answer()) if 'openrouter.ai' in url else (429, {}))
    result, model, usage = ai.json_call('synthetic test', purpose=purpose)
    assert result == {'ok': True} and model == 'actual-served-model'
    assert usage['total_tokens'] == 9
    expected = gemini_order(purpose)
    assert [call[2]['model'] for call in calls] == expected + [settings.openrouter_model]
    router = calls[-1]
    assert router[1]['Authorization'] == 'Bearer fixture-router'
    assert 'reasoning_effort' not in router[2]
    assert router[2]['provider']['allow_fallbacks'] is True
    assert router[2]['provider']['require_parameters'] is True
    assert router[2]['provider']['data_collection'] == 'deny'
    assert router[2]['max_tokens'] == (settings.extraction_max_tokens if purpose == 'extraction' else settings.llm_max_tokens)
    before = len(calls)
    ai.json_call('next batch', purpose=purpose)
    assert len(calls) == before + 1  # quota-exhausted Gemini models are skipped while cooling down
    clock[0] += settings.llm_failure_cooldown + 1
    install(lambda url, body: (200, answer()))
    ai.json_call('after cooldown', purpose=purpose)
    assert calls[-1][2]['model'] == expected[0]


def test_free_openrouter_models_are_used_when_the_paid_one_has_no_credits(routed):
    calls, install = routed
    def outcome(url, body):
        if 'openrouter.ai' not in url or body['model'] == settings.openrouter_model:
            return 402, {}
        return 200, answer()
    install(outcome)
    assert ai.json_call('synthetic')[0] == {'ok': True}
    free = calls[-1][2]
    assert free['model'] == ROUTER_EXTRA[0]
    assert 'response_format' not in free and free['provider']['require_parameters'] is False
    assert free['provider']['data_collection'] == 'deny'


def test_quota_failure_does_not_block_router_validation_repair(routed):
    calls, install = routed
    router_attempts = []
    def outcome(url, body):
        if 'openrouter.ai' not in url:
            return 429, {}
        router_attempts.append(body)
        return 200, answer({'ok': len(router_attempts) > 1})
    install(outcome)
    def validate(data):
        if data.get('ok') is not True:
            raise ValueError('Incomplete answer.')
    assert ai.json_call('synthetic', validate)[0]['ok'] is True
    # An invalid answer moves on to the next OpenRouter model instead of failing the feature.
    assert [body['model'] for body in router_attempts] == [settings.openrouter_model, ROUTER_EXTRA[0]]


def test_invalid_answers_from_every_model_trigger_a_repair_round(routed):
    calls, install = routed
    seen = []
    def outcome(url, body):
        seen.append(body['messages'][1]['content'])
        return 200, answer({'ok': 'Validation failure:' in body['messages'][1]['content']})
    install(outcome)
    def validate(data):
        if data.get('ok') is not True:
            raise ValueError('Incomplete answer.')
    assert ai.json_call('synthetic', validate)[0]['ok'] is True
    assert 'Validation failure:' in seen[-1]


@pytest.mark.parametrize('content', [None, '', 7])
def test_malformed_provider_content_falls_through(routed, content):
    calls, install = routed
    install(lambda url, body: (200, answer()) if 'openrouter.ai' in url else
            (200, {'choices': [{'message': {'content': content}}]}))
    assert ai.json_call('synthetic')[0] == {'ok': True}
    assert 'openrouter.ai' in calls[-1][0]


def test_openrouter_only(routed, monkeypatch):
    calls, install = routed
    monkeypatch.setattr(settings, 'llm_key', '')
    install(lambda url, body: (200, answer()))
    assert ai.json_call('synthetic')[0] == {'ok': True}
    assert len(calls) == 1 and 'openrouter.ai' in calls[0][0]


def test_all_unavailable_is_bounded_and_does_not_expose_credentials(routed):
    calls, install = routed
    install(lambda url, body: (402, {}) if 'openrouter.ai' in url else httpx.ReadTimeout('fixture'))
    with pytest.raises(ai.ProviderUnavailable) as error:
        ai.json_call('synthetic', purpose='interview')
    assert len(calls) == ALL_MODELS
    assert 'credits' in str(error.value)
    assert 'fixture-router' not in str(error.value)
    assert 'fixture-google' not in str(error.value)


def test_openrouter_integration_status(account, monkeypatch):
    client, _ = account
    monkeypatch.setattr(settings, 'openrouter_key', 'fixture-router')
    status = client.get('/api/integrations').json()
    assert status['ai'] is True and status['fallback'] is True


@pytest.mark.parametrize('failure', ['timeout', 'overload'])
def test_all_transient_failures_recover_after_short_pause(routed, monkeypatch, failure):
    calls, install = routed
    clock = [100.0]
    monkeypatch.setattr(ai.time, 'monotonic', lambda: clock[0])
    install(lambda url, body: httpx.ReadTimeout('private request data') if failure == 'timeout' else (503, {}))
    with pytest.raises(ai.ProviderUnavailable):
        ai.json_call('title suggestions', purpose='extraction')
    assert len(calls) == ALL_MODELS
    clock[0] += 1
    with pytest.raises(ai.ProviderUnavailable) as error:
        ai.json_call('title suggestions', purpose='extraction')
    assert len(calls) == ALL_MODELS
    assert 'retry in 14 seconds' in str(error.value)
    assert ('ReadTimeout' if failure == 'timeout' else 'HTTP 503') in str(error.value)
    assert 'private request data' not in str(error.value)
    clock[0] += 15
    install(lambda url, body: (200, answer()))
    assert ai.json_call('title suggestions', purpose='extraction')[0] == {'ok': True}
    assert len(calls) == ALL_MODELS + 1


def test_waits_for_a_recovering_model_instead_of_failing(routed, monkeypatch):
    """When every model is briefly cooling down, the feature waits instead of erroring."""
    calls, install = routed
    clock = [100.0]
    slept = []
    monkeypatch.setattr(ai.time, 'monotonic', lambda: clock[0])
    def sleep(seconds):
        slept.append(seconds); clock[0] += seconds
    monkeypatch.setattr(ai.time, 'sleep', sleep)
    monkeypatch.setattr(settings, 'llm_max_wait', 60)
    state = {'down': True}
    install(lambda url, body: (503, {}) if state['down'] else (200, answer()))
    def recover(seconds):
        state['down'] = False; sleep(seconds)
    monkeypatch.setattr(ai.time, 'sleep', recover)
    assert ai.json_call('titles', purpose='extraction')[0] == {'ok': True}
    assert slept and slept[0] <= 15


def test_quota_cooldown_retains_actionable_cause(routed, monkeypatch):
    calls, install = routed
    clock = [100.0]
    monkeypatch.setattr(ai.time, 'monotonic', lambda: clock[0])
    install(lambda url, body: (402, {}) if 'openrouter.ai' in url else (429, {}))
    with pytest.raises(ai.ProviderUnavailable):
        ai.json_call('titles')
    clock[0] += 20
    with pytest.raises(ai.ProviderUnavailable) as error:
        ai.json_call('titles')
    assert len(calls) == ALL_MODELS
    assert 'HTTP 429' in str(error.value) and 'HTTP 402' in str(error.value)
    assert 'credits' in str(error.value)


def test_provider_retry_after_is_respected(monkeypatch):
    monkeypatch.setattr(ai.time, 'monotonic', lambda: 100.0)
    provider = ('synthetic', 'model')
    ai._pause_provider(provider, 'HTTP 503', transient=True, retry_after='60')
    assert ai._model_cooldowns[provider] == 160
