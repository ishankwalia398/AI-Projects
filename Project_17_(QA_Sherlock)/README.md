# QA Sherlock — Autonomous AI Defect Investigation System

An evidence-led QA investigation project with six CrewAI agents, Pinecone retrieval, Jira MCP → REST failover, Playwright ingestion, generated regression tests, and DeepEval judging.

## Try the demo (no credentials or dependencies)

From this repository directory, on PowerShell:

```powershell
$env:PYTHONPATH = 'src'
python -m qa_sherlock.cli demo --out demo
python -m http.server 8080 --directory demo --bind 127.0.0.1
```

Open http://localhost:8080. The checked-in `demo/index.html` also opens directly. The demo is deterministic fixture analysis with lexical retrieval, **not a live CrewAI run**. DeepEval scores are explicitly marked not run. It shows a checkout expiry defect, correlated citations, competing hypotheses, next actions, and a complete Playwright regression test. The original referenced conversation supplied no complete visual example, so the report uses a custom dark investigation dashboard.

## Live setup

Use Python 3.12 (recommended for the live dependency ecosystem):

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e '.[live,dev]' -c constraints-tested.txt
Copy-Item .env.example .env
```

Fill `.env` locally. Never commit credentials. Edit `configs/default.json` to change providers, exact model IDs, Pinecone namespace, or MCP tool schema. Defaults use Command Code `Qwen/Qwen3.8-27B`, Google `gemini-3.6-flash` fallback, and direct DeepSeek `deepseek-v4-flash` judging. See `docs/model-verification.md`: model availability is documented, but account access and Command Code's Groq upstream selection require live verification. No undocumented routing header is invented.

## Upload real data in the UI

After installing the live dependencies and filling `.env`, start the local application:

```powershell
qa-sherlock-web
```

Open http://127.0.0.1:8080. Upload one Playwright JSON report plus supporting UTF-8 evidence files. Supported evidence formats are JSON, CSV, Markdown, text, logs, YAML, XML, Gherkin and common source-code formats. You can optionally enter a Jira issue, enable run-specific Pinecone retrieval, and enable DeepEval scoring.

Every real investigation is written to `runs/<run-id>/`; uploaded originals are retained under that run's `input/` directory. The `demo/` directory is read-only application content and is never used or modified by the upload flow. Use the **Open saved demo** link in the UI whenever you want the original demonstration.

The local server binds to `127.0.0.1` by default. Real uploads can contain confidential logs and source code, so do not expose it to a network without authentication, tenant isolation, HTTPS, and access controls.

```powershell
qa-sherlock models
qa-sherlock index
qa-sherlock investigate --failure samples/playwright-report.json --jira SHOP-142 --out runs/live
```

`models` checks primary/fallback IDs against authenticated catalogs. A catalog endpoint unsupported by a provider will report an error rather than claiming verification. `index` writes sample evidence to your selected Pinecone namespace. Configure an existing **integrated embedding** index with text field mapping `text: chunk_text` (for example `llama-text-embed-v2`) and place its host in `PINECONE_HOST`. The app does not create billable indexes. Allow indexing consistency before investigation. Live retrieval never silently switches to offline data.

For Jira, set `JIRA_MCP_URL` and optional bearer token, and adjust `mcp_tool`/`mcp_arguments` to your server's published schema. The example is `getJiraIssue` with cloudId and issueIdOrKey. OAuth setup belongs to your MCP server or gateway. Set Jira REST base URL, email and API token for automatic fallback on connection, timeout, protocol, tool error or malformed issue responses. Reads only; no ticket creation. Omit `--jira` to use indexed stories alone.

Use `--skip-eval` to explicitly skip paid evaluation. Otherwise live runs invoke two DeepEval GEval metrics with DeepSeek. Evaluation failure preserves the investigation, labels evaluation failed, and exits 2. Success or skipping exits 0; missing failures is a CLI error. Provider calls have bounded timeouts/retries and sanitized event logs.

## Regression test demonstration

```powershell
npm install
python samples/fixture_server.py
# In another terminal:
npm run test:regression
```

All three boundary tests should pass against the corrected fixture. Restart the fixture with `--buggy`; the equality test should fail while the before/after cases pass. These are API-only Playwright tests and need no browser installation. Production checkout must use its server clock; the local fixture's clock injection and seed endpoints are test support only. Generated live tests require review and environment adaptation and are never executed automatically.

## Tests

```powershell
$env:PYTHONPATH = 'src'
python -m unittest discover -s tests -v
# or after installation
pytest
```

Tests cover the offline pipeline, citation validation, recovered flakes, HTML escaping, model fallback, secret-safe events, and MCP success/error/malformed/timeout fallback. Live provider calls require credentials and are separate from this deterministic suite.

## Repository map

- `src/qa_sherlock/`: ingestion, retrieval, providers, integrations, CrewAI, evaluation, CLI, rendering
- `configs/`: swappable provider and integration settings
- `samples/datasets/`: 13 datasets / 39 synthetic evidence records across checkout, inventory, identity
- `samples/`: Playwright JSON input and local checkout fixture
- `tests/`: unit and offline integration tests
- `demo/`: ready-to-view HTML, JSON, Markdown and regression test
- `docs/`: architecture, model verification, Vercel deployment plan

## Vercel later

`vercel.json` builds the static demo using `npm run build` into `dist/`. This is ready for a later Vercel import; nothing has been deployed. No key is needed for the static demo. For live investigations, keep the Python worker on a persistent service and connect an authenticated Vercel UI to a queued job API; see `docs/vercel.md`. Do not place LLM/Jira keys in browser code or public environment variables.

## Scope and current limits

The six-agent live path is implemented but requires live credentials for end-to-end validation. Offline mode supports the bundled checkout case only, never fabricates an analysis for arbitrary input. Attachment metadata is ingested, but screenshots and trace ZIP contents are not inspected. Evidence records are small pre-chunked documents; large-document parsing/chunking and tenant-level authorization are future production work. Confidence is an analyst estimate; evaluation is model judgment, not proof. There is no autonomous production mutation or issue filing.

## Themes

Warm ivory/cream/amber light mode is inspired by https://qae2e.vercel.app/. Dark mode uses black and green. The control shows a sun for light and a moon for dark, remembers your selection, and defaults to light on first visit.
