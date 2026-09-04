# Jira QA Crew

Streamlit application that runs four isolated CrewAI agents for each Jira ticket and produces validated requirements analysis, an exact 12-section test plan, test cases, Playwright TypeScript, traceability, and downloadable artifacts.

## Architecture

`app.py` contains presentation composition only. `jira/` implements deterministic MCP-first/REST fallback. `crew/factory.py` creates a fresh sequential `Crew` with exactly four agents per ticket. Pydantic models are the internal source of truth. `services/validation.py`, `traceability.py`, and `artifacts.py` validate and render outputs without trusting raw LLM Markdown.

The pipeline fetches each issue once through the read-only `JiraGateway` before LLM processing and injects the normalized payload only into the Jira Analyst task. This keeps Jira access out of the LLM provider and supports models that do not implement tool calls. `FetchJiraIssueTool` remains available for tool-capable direct crew construction, and no later agent receives Jira access. In `auto` mode the gateway tries MCP, validates the response, then uses REST. It never falls back to fixtures. Jira descriptions are treated as untrusted business content. Errors and logs redact configured secrets.

## Local installation

Python 3.11–3.13 is recommended (3.11 is the deployment baseline).

```powershell
cd Project_14_CrewAI_QA_Pipeline
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
```

Populate `.env`; never commit it. The default route uses CommandCode's OpenAI-compatible Provider API, followed by Gemini only if the primary attempt fails:

```dotenv
LLM_PRIMARY_MODEL=openai/deepseek/deepseek-v4-flash
COMMANDCODE_API_KEY=your_commandcode_api_key
LLM_PRIMARY_API_KEY=
LLM_PRIMARY_BASE_URL=https://api.commandcode.ai/provider/v1
LLM_FALLBACK_ENABLED=true
LLM_FALLBACK_MODEL=gemini/gemini-3.6-flash
LLM_FALLBACK_API_KEY=your_google_ai_studio_api_key
LLM_FALLBACK_BASE_URL=https://generativelanguage.googleapis.com
LLM_TEMPERATURE=0.1
LLM_MAX_OUTPUT_TOKENS=8192
LLM_PRIMARY_MAX_OUTPUT_TOKENS=16384
LLM_PRIMARY_TIMEOUT_SECONDS=300
LLM_PRIMARY_REASONING_EFFORT=low
```

Create the CommandCode key in Studio, then confirm that the configured model is available to the account:

```powershell
$headers = @{ Authorization = "Bearer $env:COMMANDCODE_API_KEY" }
Invoke-RestMethod https://api.commandcode.ai/provider/v1/models -Headers $headers
```

The `openai/` prefix selects CrewAI's native custom-OpenAI client; the provider receives `deepseek/deepseek-v4-flash` as the model ID. `LLM_PRIMARY_REASONING_EFFORT=low` prevents the reasoning model from consuming the complete output allowance before returning structured JSON. The application omits `temperature` for Gemini 3.6 because that model does not accept the sampling parameter. A fallback starts a fresh crew for the ticket; outputs from a failed primary attempt are never mixed with fallback outputs. Disable cloud fallback with `LLM_FALLBACK_ENABLED=false`.

The prior Ollama configuration remains supported as an optional local route. Set `LLM_PRIMARY_MODEL=ollama/jira-qa-gemma3:12b` and `LLM_PRIMARY_BASE_URL=http://localhost:11434`; see `ollama/Modelfile.jira-qa-gemma3` for the 32K-context alias.

Run on localhost:

```powershell
streamlit run app.py
```

Open `http://localhost:8501`. Appearance can be switched between Light and Dark from the sidebar.

## Jira MCP

Set either `JIRA_MCP_URL` for streamable HTTP or `JIRA_MCP_COMMAND` plus `JIRA_MCP_ARGS_JSON` for stdio. Set `JIRA_MCP_GET_ISSUE_TOOL` to the server's approved read-only issue-fetch tool and `JIRA_MCP_ISSUE_ARGUMENT` to its issue-key argument. Header JSON may reference literal values supplied by the runtime environment; protect `.env` as a secret. The MCP provider uses a contained official `MCPServerAdapter` lifecycle and exposes no write tools to agents.

## Jira REST fallback

Set `JIRA_URL`. For Basic auth, set `JIRA_AUTH_MODE=basic`, `JIRA_EMAIL`, and `JIRA_API_TOKEN`. For bearer auth, set `JIRA_AUTH_MODE=bearer` and `JIRA_BEARER_TOKEN`. The provider calls `/rest/api/3/issue/{key}`, handles ADF, bounded retry, timeouts, permissions, 404, and rate limits. Configure an acceptance-criteria custom field ID where applicable.

## Streamlit secrets

For Streamlit Community Cloud, copy the keys shown in `.streamlit/secrets.toml.example` into the deployment's secret manager. Environment variables are the canonical local configuration. Deploy the repository with `app.py` as the entrypoint. Persistent artifacts require external storage because Community Cloud local storage is ephemeral.

## Docker

```powershell
docker compose up --build
```

The app listens at `http://localhost:8501`, and `outputs/` is mounted to the host.

## Tests

```powershell
ruff check .
pytest -q
streamlit run app.py --server.headless true
```

Unit and AppTest tests use mocks and do not call Jira or a paid LLM. Live integration checks should be added/run only with explicit credentials and marked `integration`. Generated Playwright is intentionally not executed by the Streamlit server. To validate a generated ticket project externally, install `@playwright/test` in a copied artifact directory and run `npx playwright test --list`.

## Outputs

Artifacts are written under `outputs/<run-id>/<ticket-key>/`. Every path component is sanitized. Per-ticket failure does not stop later tickets; a failed ticket cannot be reported complete. ZIP construction is deferred until its download control is activated.

## Security and limitations

- Jira access is read-only; the app performs no transitions, edits, or defect creation.
- No shell command, dynamic evaluation, or Playwright execution is derived from Jira content.
- LLM output is schema-validated and deterministically checked, but human review remains required.
- Live Jira MCP, Jira REST, and LLM behavior requires valid credentials and compatible server/provider configuration.
- MCP tool names and schemas vary, so both tool name and issue argument are configurable.
- This stateful Streamlit service targets localhost, Docker, or Streamlit Community Cloud—not Vercel serverless.

## Troubleshooting

- **Configuration needs attention:** complete the named `.env` fields and restart Streamlit.
- **MCP tool not advertised:** verify `JIRA_MCP_GET_ISSUE_TOOL` against the server's tools list.
- **REST 401/403:** verify auth mode, token scope, email, and Jira project permission.
- **Structured output failure:** use a model with reliable JSON/Pydantic tool support; the ticket is failed rather than silently accepting malformed output.
- **CommandCode 401:** create a key in CommandCode Studio and set `COMMANDCODE_API_KEY`; the $1 Go plan does not include Provider API access.
- **CommandCode model error:** query `/provider/v1/models` and copy an available model ID after the `openai/` CrewAI prefix.
- **Gemini fallback unavailable:** set `LLM_FALLBACK_API_KEY` to a Google AI Studio API key, or disable fallback explicitly.
- **No artifacts:** inspect the ticket's Run Details; required missing output prevents success.
