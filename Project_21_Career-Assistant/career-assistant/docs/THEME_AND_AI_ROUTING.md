# Cream & Brown and automatic AI fallback

The selected application theme is **Cream & Brown**, applied to login, navigation, jobs,
interview questions, generated documents, resume library, candidate profile and settings. It replaces the previous appearance. There is no theme picker.

| Element | Colour |
| --- | --- |
| Page background | Cream `#F5EEDF` |
| Panels and inputs | Warm cream `#FFFAF1` |
| Primary buttons and selected navigation | Walnut `#674633` |
| Sidebar | Sand `#E9DECD` |
| Soft accents | `#E6D7C4` |
| Borders | `#D7C7B2` |
| Text / secondary text | `#3F3027` / `#736254` |

Semantic success, warning and error colours remain distinct. The legacy `amber` preference
ID, migration 002 and preview filenames remain compatible; they now display Cream & Brown.
Generated candidate PDF/DOCX documents keep their existing ATS-friendly document styling.

## Configuration

Add these server-only settings to the project `.env`, then restart with `start.ps1` or `start.sh`:

```dotenv
OPEN_ROUTER_API_KEY=your-openrouter-key
OPEN_ROUTER_MODEL=mistralai/mistral-small-3.2-24b-instruct
```

The model setting is optional; this is the default. `OPENROUTER_API_KEY` is also accepted
as an alias. Never place keys in frontend variables or commit your `.env`.

## Automatic switching

- Complex generation: configured Gemini Flash → Gemini Flash-Lite → OpenRouter Mistral Small 3.2.
- Extraction, title/country suggestions and routine interviews: Flash-Lite → Flash → OpenRouter.
- OpenRouter is optional. When it is the only configured generation provider, generation can
  use it directly. Existing Gemini keys and model settings are unchanged.
- Network errors, rate limits, authentication/billing/model availability errors and server
  outages trigger a model cooldown, default 300 seconds. Later batches skip that model;
  it becomes eligible again after the cooldown. Cooldowns are local to each backend process.
- Each pass tries every eligible provider once. Invalid JSON/schema responses may be repaired:
  at most two passes normally or four for interviews. A Gemini quota error does not prevent
  repairing an OpenRouter answer. If all providers are unavailable, fail promptly with an
  actionable error and retain already saved work rather than fabricate output.
- Read timeout: 30 seconds normally, at least 90 seconds for interview answers; connect
  timeout: 10 seconds. These are per request, so the first outage can still cause a delay.
- OpenRouter can switch hosting providers for its configured model, requires request-parameter
  support, and excludes providers permitting data collection. The actual returned model and
  usage are recorded. Existing token caps and cached interview batches remain in use.

This is failure-based switching, not round-robin billing across healthy models. It cannot
guarantee uninterrupted operation if all services are unavailable or out of credits.
OpenRouter credits are separate from Google subscriptions and Gemini API quota.

Google Search grounding now has an authorized OpenRouter/Exa fallback; embedding requests still use Gemini;
generation fallback and live-search fallback are separate requests with separate usage. Employer-board job fetching
does not depend on an LLM. Failed grounding remains explicitly labelled unavailable.

References: [OpenRouter model](https://openrouter.ai/mistralai/mistral-small-3.2-24b-instruct),
[provider routing](https://openrouter.ai/docs/guides/routing/provider-selection).

## Local validation — 2026-10-27

152 backend tests passed, one skipped; 16 frontend tests passed; production build passed.
Fallback tests cover task routing, unavailable providers, cooldown recovery, OpenRouter-only
configuration, malformed responses, schema repair after Gemini quota errors, and safe errors.
A live synthetic OpenRouter check returned valid JSON from the configured default model
(165 tokens); no candidate data was sent. The cream and brown offline preview was visually
checked. These checks establish working failover, not a guarantee of future provider uptime.


Current interview/search behaviour: [On-demand answers and candidate-based discovery](ON_DEMAND_INTERVIEWS_AND_SEARCH.md). Questions are generated first; answers are saved on request until explicit logout and included in exports. Saved regional title/country suggestions constrain searches. Gemini grounding failures use the authorized OpenRouter/Exa fallback (one search per request).


### Provider recovery (27 October 2026)
Temporary network/timeouts and HTTP 5xx failures pause a model for at most 15 seconds by default, rather than blocking unrelated tasks for five minutes. The next request after that interval can use it again. Explicit numeric Retry-After headers take precedence. Authentication, billing, missing-model and quota errors retain the configured cooldown. During a pause, errors retain the sanitized failure reason and show seconds until retry. A provider outage can still prevent generation; no placeholder titles are presented as AI results. Restart the local services after updating to load this change.
