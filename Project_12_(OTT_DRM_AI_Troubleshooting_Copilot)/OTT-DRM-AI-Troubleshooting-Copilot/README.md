# OTT DRM AI Troubleshooting Copilot

An evidence-first AI troubleshooting assistant for diagnosing OTT video playback, DRM, device-capability, manifest, license, codec, HDCP, and delivery failures.

The project combines deterministic diagnostic rules with retrieval-augmented generation (RAG). It can compare device capabilities against content policy, retrieve related technical guidance and historical incidents, rank likely root causes, and recommend the next verification tests.

> **Current status:** Version 1.2.1 runnable MVP with a FastAPI API, Operations Console browser UI, Pinecone vector RAG, resilient local fallback retrieval, downloadable PDF reports, optional OpenAI explanations, automated tests, and Vercel deployment configuration.

## Application Link

| Environment | URL | Status |
|---|---|---|
| Local application | [http://localhost:8000](http://localhost:8000) | Available after starting the app |
| API documentation | [http://localhost:8000/api/docs](http://localhost:8000/api/docs) | Available after starting the app |
| Main Vercel application | [ott-drm-copilot.vercel.app](https://ott-drm-copilot.vercel.app/) | Production |
| Custom Vercel application | [ott-drm-troubleshooting-copilot.vercel.app](https://ott-drm-troubleshooting-copilot.vercel.app/) | Production |
| Production API documentation | [ott-drm-troubleshooting-copilot.vercel.app/api/docs](https://ott-drm-troubleshooting-copilot.vercel.app/api/docs) | Production |

The custom-domain URL is the recommended link to share with reviewers. The main Vercel URL remains available as a deployment alias.

## Screenshot

### Operations Console

![PROJECT ARCHITECTURE: OTT DRM AI Troubleshooting Copilot flowchart diagram showing four main sections. INPUT DATA (left) displays form fields for Failure Description, Device & Player Context, DRM & HDCP Policy, MPD/M3U8 Manifest Text, Redacted License Result, and Redacted Logs. ANALYSIS ENGINE (center-left) contains: Deterministic Rules & Evidence Parsing (with rules, parsing, validations), RAG Retrieval (with Pinecone Vector DB and Local Fallback Retrieval), and knowledge sources (Knowledge Cards, Historical Incidents, Device Capabilities). INTEGRATION & GENERATION (center-right) leads to optional OpenAI Explanation. DIAGNOSIS OUTPUT (right) shows Executive Summary, Ranked Causes & Probabilities, Evidence & Implication Chain, Expected Behavior, Suggested Verification Tests, Retrieved Knowledge Sources, and Important Caveats. Dark blue background with teal, orange, and green accents.](docs/screenshots/Architecture%20Overview.png)

The console provides incident input, DRM policy comparison, technical-evidence collection, live evidence readiness, RAG status, and an evidence-weighted diagnostic workflow.

## Problem Statement

OTT playback failures are difficult to diagnose because the visible symptom is often far removed from the actual cause. A user may report a black screen, playback start failure, low-quality fallback, or an error code, but the root cause can exist in several different systems:

- Device DRM security level, such as Widevine L1 versus L3
- Content-license policy and output-protection requirements
- HDCP capability across the complete device, cable, receiver, and display chain
- HLS or MPEG-DASH manifest signaling
- CENC, CBCS, PSSH, KID, and encryption metadata
- License authentication, entitlement, or server responses
- Codec, profile, level, HDR, or secure-decoder support
- Player, CDM, and operating-system behavior
- CDN authorization, range requests, token expiry, or regional delivery failures
- Previously observed production incidents

Traditional troubleshooting requires an engineer to manually correlate player logs, manifests, device specifications, DRM policies, license responses, and internal runbooks. This process is slow, depends heavily on specialist knowledge, and can produce inconsistent conclusions between engineers.

For example:

> 4K playback works on Chrome but shows a black screen on Android TV.

That symptom alone does not prove a CDN, codec, player, DRM, or display-path failure. The investigation must determine which signals support or contradict each possible cause.

## Solution

OTT DRM AI Troubleshooting Copilot provides one investigation surface for entering the failure report and its supporting evidence. The system then performs the following workflow:

1. **Validates the incident input.** Pydantic models ensure the API receives a predictable structure.
2. **Parses technical evidence.** Manifest text, license information, device fields, and player/CDM logs are converted into diagnostic signals.
3. **Compares policy with capability.** The rule engine detects conditions such as an L3 device attempting content that requires L1, or an HDCP 1.4 path attempting content that requires HDCP 2.2.
4. **Ranks likely root causes.** Evidence changes the weight assigned to each candidate cause. The largest weights are normalized into relative probabilities.
5. **Retrieves supporting knowledge.** Pinecone searches technical knowledge cards and historical incidents that are relevant to the current symptom and evidence.
6. **Falls back safely.** If Pinecone is unavailable or not configured, the application uses its local retrieval implementation.
7. **Generates a test sequence.** The result includes concrete tests designed to confirm the leading hypothesis and eliminate alternatives.
8. **Optionally produces an AI explanation.** When explicitly enabled, OpenAI converts the evidence and retrieved context into a structured explanation. It does not silently change the rule-engine probabilities.
9. **Exports the diagnosis.** The results view generates and downloads a multi-page PDF report directly in the browser, so no incident data is sent to a separate PDF service.

The output contains:

- Executive diagnosis summary
- Confidence level and analysis mode
- Ranked root-cause probabilities
- Evidence and implication chain
- Expected playback behavior
- Suggested verification tests
- Retrieved knowledge and incident sources
- Important caveats
- Downloadable PDF diagnosis report

### Example diagnosis

Given:

- Android TV reports Widevine L3
- The content policy requires Widevine L1
- The requested stream is 4K/UHD
- The player reports a black screen after license acquisition

The system should rank a DRM security-policy mismatch above codec, CDN, or unrelated delivery causes, explain why 4K playback is expected to be blocked, and recommend testing the same asset on an L1 device.

## Architecture

```text
Incident form
   ├── failure description
   ├── device and player context
   ├── DRM and HDCP policy
   ├── MPD/M3U8 manifest text
   ├── redacted license result
   └── redacted player/CDM logs
            │
            ▼
   Evidence parsing and signal extraction
            │
       ┌────┴────────────────┐
       ▼                     ▼
 Diagnostic rule engine   RAG retrieval
                           ├── Pinecone
                           └── local fallback
       │                     │
       └──────────┬──────────┘
                  ▼
      Optional OpenAI explanation
                  │
                  ▼
 Ranked causes + evidence + tests + sources
```

## Tech Stack

| Area | Technology | Purpose |
|---|---|---|
| Programming language | Python 3.13 | Backend, parsing, rules, retrieval, scripts, and tests |
| API framework | FastAPI | REST API, validation integration, and Vercel Python entrypoint |
| API server | Uvicorn | Local ASGI development server |
| Data validation | Pydantic 2 | Validated incident and diagnosis models |
| Frontend | HTML5, CSS3, vanilla JavaScript | Responsive Cinematic Operations Console and client-side PDF export without a frontend build step |
| Vector database | Pinecone Serverless | Free-tier vector storage and RAG retrieval |
| Embeddings | Pinecone integrated `llama-text-embed-v2` | Converts knowledge and incident text into searchable vectors |
| AI explanation | OpenAI API, optional | Produces an evidence-grounded structured explanation |
| Local retrieval | Built-in Python similarity retrieval | Keeps the app functional when Pinecone is unavailable |
| Secondary local UI | Streamlit | Optional development/demo interface |
| Testing | Pytest and HTTPX | Unit, evaluation, retrieval, and API tests |
| Configuration | `python-dotenv` | Loads local environment variables from `.env` |
| Deployment | Vercel | Hosts the static UI and FastAPI Python Function |

## Repository Structure

```text
OTT-DRM-AI-Troubleshooting-Copilot/
├── api/
│   └── index.py                 # FastAPI and Vercel entrypoint
├── public/
│   ├── index.html               # Cinematic Operations Console
│   ├── styles.css               # Responsive visual design
│   └── app.js                   # Form, live signals, API calls, result rendering
├── src/drm_copilot/
│   ├── ai.py                    # Optional OpenAI explanation
│   ├── chunking.py              # 1000-character, 15%-overlap chunking
│   ├── corpus.py                # Shared JSONL, CSV, and Markdown RAG loader
│   ├── models.py                # Input and output schemas
│   ├── parsers.py               # Manifest and log signal extraction
│   ├── retrieval.py             # Pinecone and local retrieval
│   ├── rules.py                 # Root-cause ranking rules
│   └── service.py               # End-to-end orchestration
├── data/
│   ├── knowledge_base.jsonl     # RAG knowledge cards
│   ├── historical_incidents.jsonl
│   ├── device_capabilities.csv
│   ├── evaluation_cases.jsonl
│   ├── sources/OTT_DRM_Streaming_RAG_Resources.md
│   └── templates/               # Templates for adding data
├── scripts/
│   ├── build_demo_data.py       # Rebuilds the four 50-record starter datasets
│   ├── check_environment.py
│   ├── validate_data.py
│   ├── index_pinecone.py
│   └── evaluate.py
├── tests/                       # Automated tests
├── docs/screenshots/            # README screenshots
├── run_app.py                   # Cross-platform local launcher
├── requirements.txt             # Production/Vercel dependencies
├── requirements-all.txt         # All local, optional, and test dependencies
├── vercel.json                  # Vercel function configuration
└── .env.example                 # Environment-variable template
```

## Prerequisites

Before running the project, install or obtain:

- Python **3.13**
- `pip`
- A terminal or PowerShell
- A Pinecone Starter account and API key for hosted RAG
- An OpenAI API key only if optional AI explanations are required
- Node.js and the Vercel CLI only when deploying to Vercel

The project supports macOS, Windows, Linux, and other Unix-like operating systems.

## How to Run

### 1. Open the project

Open the project folder in Visual Studio Code, then open its integrated terminal.

```bash
cd "OTT-DRM-AI-Troubleshooting-Copilot"
```

### 2. Create a virtual environment

#### macOS, Linux, and Unix

```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Windows PowerShell

```powershell
py -3.13 -m venv .venv
.venv\Scripts\Activate.ps1
```

#### Windows Command Prompt

```bat
py -3.13 -m venv .venv
.venv\Scripts\activate.bat
```

After activation, the terminal prompt should normally begin with `(.venv)`.

### 3. Install all dependencies

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements-all.txt
```

Use `python -m pytest` instead of only `pytest`. This guarantees that Pytest is executed from the active virtual environment and avoids a `command not found: pytest` error.

### 4. Create the environment file

macOS, Linux, or Unix:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows Command Prompt:

```bat
copy .env.example .env
```

Configure `.env`:

```dotenv
RAG_PROVIDER=pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=ott-drm-ai-copilot
PINECONE_NAMESPACE=knowledge
PINECONE_EMBED_MODEL=llama-text-embed-v2
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1

RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP_PERCENT=15

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
ENABLE_AI_EXPLANATION=false
```

`OPENAI_API_KEY` can remain empty. Rules and RAG work without the optional AI explanation.

Never commit `.env` or expose API keys in browser JavaScript, screenshots, logs, or Git history.

### 5. Validate the environment and data

```bash
python scripts/check_environment.py
python scripts/validate_data.py
```

Expected data-validation output:

```text
Valid: 100 knowledge/incident records, 50 device profiles, 50 evaluation cases, 165 total RAG source records
```

### 6. Create the Pinecone index and upload the RAG data

```bash
python scripts/index_pinecone.py
```

If the namespace already contains an older unchunked version of the data, rebuild it:

```bash
python scripts/index_pinecone.py --rebuild
```

The indexing workflow uses a chunk size of **1000 characters** and an overlap of **15%**, which equals **150 characters**. Each vector includes metadata connecting it to its parent record and chunk position.

The indexed corpus contains 50 knowledge cards, 50 synthetic historical incidents, 50 synthetic device capability profiles, and 15 Markdown section records. The 50 labeled evaluation cases remain excluded from retrieval to prevent answer leakage.

### 7. Run the automated tests

```bash
python -m pytest -q
python scripts/evaluate.py
```

### 8. Start the web application

```bash
python run_app.py
```

Open:

- Application: [http://localhost:8000](http://localhost:8000)
- FastAPI documentation: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

If port 8000 is already being used, select another port.

macOS, Linux, or Unix:

```bash
APP_PORT=8080 python run_app.py
```

Windows PowerShell:

```powershell
$env:APP_PORT = "8080"
python run_app.py
```

Windows Command Prompt:

```bat
set APP_PORT=8080
python run_app.py
```

## Demo Scenario

Use the default incident already shown in the console:

| Field | Value |
|---|---|
| Summary | `4K playback works on Chrome but shows a black screen on Android TV.` |
| Platform | Android TV |
| DRM | Widevine |
| Reported security | L3 |
| Required security | L1 |
| Reported HDCP | 2.2 |
| Required HDCP | 2.2 |
| Requested quality | 4K/UHD |
| Codec | HEVC/H.265 |
| Player log | `Widevine: L3` and `black screen after license acquisition` |

Select **Run forensic analysis**. The security-level policy mismatch should rank first because the device reports L3 while the content requires L1. Select **Export PDF** in the completed diagnosis header to download a multi-page report containing the incident context, ranked causes, evidence, expected behavior, test sequence, retrieved sources, and caveats.

Next, change the reported security level to L1 and the reported HDCP version to 1.4. The HDCP/output-protection hypothesis should become more important. This demonstrates that the diagnosis responds to evidence rather than repeating a fixed answer.

The navigation and hero status display the provider returned by `/api/config`. A correctly configured deployment shows **PINECONE**. If a specific request cannot reach Pinecone and uses the resilience path, that diagnosis reports **LOCAL-FALLBACK** as its knowledge source.

The Knowledge section shows the system's coverage areas as non-interactive labels. Detailed source material remains available to the diagnosis through Pinecone retrieval and the local fallback retriever, but is not directly browsable from the public UI.

## RAG Data

The project contains four structured datasets plus a curated Markdown knowledge source. The current starter set contains exactly 50 records in each structured dataset.

### Knowledge cards

`data/knowledge_base.jsonl` contains concise, verified technical cards. Each record should include:

- Stable ID
- Title and topic
- Search tags
- Source type and authoritative URL
- Verification date
- Condition
- Observable evidence
- Technical implication
- Discriminating test

Use `data/templates/knowledge_record.json` when adding records.

Current size: **50 records**.

### Historical incidents

`data/historical_incidents.jsonl` contains normalized, resolved incident examples. Store only redacted evidence and clearly separate confirmed causes from unresolved hypotheses.

Use `data/templates/historical_incident.json` when adding incidents.

Current size: **50 synthetic records**. Replace synthetic examples with confirmed, redacted incidents before production use.

### Device capability matrix

`data/device_capabilities.csv` records tested device, OS, player, DRM, codec, resolution, secure-decoder, HDR, and HDCP capabilities. The starter rows are synthetic examples and must not be presented as official device specifications.

Use `data/templates/device_capability.csv` for new measurements.

Current size: **50 synthetic profiles**. Device profiles are converted to searchable RAG records by the shared corpus loader.

### Evaluation cases

`data/evaluation_cases.jsonl` contains labeled cases used to verify expected root-cause ranking. Keep evaluation cases out of the RAG corpus so the retriever cannot return the answer verbatim.

Current size: **50 labeled synthetic cases**, all expected to pass the deterministic top-1 evaluation.

### Curated Markdown resources

`data/sources/OTT_DRM_Streaming_RAG_Resources.md` is the supplied OTT/DRM/streaming resource index. The loader treats it strictly as source content, splits it by level-two headings, and then applies the configured 1000-character chunks with 15% overlap. Its 15 sections cover OTT, Widevine, FairPlay, PlayReady, HLS, MPEG-DASH, CDN, ABR, HDCP, CENC/PSSH, licenses, player errors, devices, incidents, and source-maintenance notes.

### Rebuilding the starter datasets

Run this only when you intentionally want to regenerate the four deterministic starter datasets:

```bash
python scripts/build_demo_data.py
```

The command writes 50 records to each structured dataset. It does not overwrite the Markdown resource file.

After modifying data, run:

```bash
python scripts/validate_data.py
python scripts/index_pinecone.py
python -m pytest -q
python scripts/evaluate.py
```

## How Root-Cause Probabilities Work

The displayed probabilities are evidence-weighted relative likelihoods. Each possible cause begins with a small prior weight. Strong observations add weight to relevant causes. The four strongest causes are then normalized to 100%.

For example:

- Reported L3 plus required L1 strongly increases the DRM security-policy cause.
- Reported HDCP 1.4 plus required HDCP 2.2 strongly increases the output-protection cause.
- An HTTP 403 license response increases authentication, entitlement, or policy causes.
- Codec initialization errors increase codec/device compatibility causes.
- Segment HTTP failures increase CDN or delivery causes.

These percentages are heuristic rankings, not statistically calibrated probabilities. Production calibration requires a sufficiently large labeled dataset of resolved incidents, a held-out evaluation set, and calibration measurement.

## Deploy to Vercel

The production deployment uses:

- `public/` for the static frontend
- `api/index.py` for the FastAPI Python Function
- `vercel.json` for function configuration
- `requirements.txt` for production dependencies

### 1. Install the Vercel CLI

```bash
npm install --global vercel
```

### 2. Authenticate with a Vercel token

Keep the token in the shell or a CI secret store. Do not add it to `.env` or source control.

macOS, Linux, or Unix:

```bash
export VERCEL_TOKEN="your_vercel_token"
```

Windows PowerShell:

```powershell
$env:VERCEL_TOKEN = "your_vercel_token"
```

Windows Command Prompt:

```bat
set VERCEL_TOKEN=your_vercel_token
```

### 3. Link the project

macOS, Linux, or Unix:

```bash
vercel link --yes --token "$VERCEL_TOKEN"
```

Windows PowerShell:

```powershell
vercel link --yes --token $env:VERCEL_TOKEN
```

Windows Command Prompt:

```bat
vercel link --yes --token %VERCEL_TOKEN%
```

### 4. Configure Vercel environment variables

Add these values in **Vercel Project → Settings → Environment Variables**:

```text
RAG_PROVIDER=pinecone
PINECONE_API_KEY=<secret>
PINECONE_INDEX=ott-drm-ai-copilot
PINECONE_NAMESPACE=knowledge
PINECONE_EMBED_MODEL=llama-text-embed-v2
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP_PERCENT=15
OPENAI_API_KEY=<optional secret>
OPENAI_MODEL=gpt-5-mini
ENABLE_AI_EXPLANATION=false
```

For a public demonstration, keep `ENABLE_AI_EXPLANATION=false` unless authentication and rate limiting are added. Rules and Pinecone retrieval continue to work while AI explanations remain disabled.

### 5. Deploy a preview

macOS, Linux, or Unix:

```bash
vercel deploy --yes --token "$VERCEL_TOKEN"
```

Windows PowerShell:

```powershell
vercel deploy --yes --token $env:VERCEL_TOKEN
```

### 6. Deploy to production

macOS, Linux, or Unix:

```bash
vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```

Windows PowerShell:

```powershell
vercel deploy --prod --yes --token $env:VERCEL_TOKEN
```

Vercel prints the production URL after a successful deployment. Update the **Application Link** section at the top of this README with that exact URL.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns API health status |
| `GET` | `/api/config` | Returns public AI and RAG configuration flags |
| `POST` | `/api/analyze` | Accepts incident evidence and returns the diagnosis |
| `GET` | `/api/docs` | Interactive FastAPI/OpenAPI documentation |

## Security and Privacy

- Never submit production bearer tokens, cookies, private keys, certificates, subscriber data, PII, signed URLs, or complete license challenges/responses.
- Redact logs before sending them to the application, Pinecone, or an AI provider.
- Keep Pinecone, OpenAI, and Vercel credentials server-side.
- Do not prefix secrets with browser-exposed naming conventions.
- Add authentication, authorization, rate limiting, audit logging, and server-side redaction before using the project with production incident data.
- Treat the application as decision support, not an automatic production-remediation system.

## Troubleshooting

### `pytest: command not found`

Install all dependencies and run Pytest through Python:

```bash
python -m pip install -r requirements-all.txt
python -m pytest -q
```

### Pinecone is unavailable

Confirm `PINECONE_API_KEY`, index name, namespace, cloud, and region in `.env`. If Pinecone remains unavailable, the application falls back to local retrieval and reports the active backend in the UI.

### AI explanation is disabled

Set `OPENAI_API_KEY`, then set:

```dotenv
ENABLE_AI_EXPLANATION=true
```

Restart the app. Keep AI mode disabled for unauthenticated public deployments unless cost controls and rate limiting are implemented.

### Port 8000 is already in use

Set `APP_PORT` to another port using the operating-system examples in **How to Run**.

## Disclaimer

This project is a QA and engineering decision-support tool. A ranked cause must be verified with the suggested tests before production remediation. Device profiles and starter incidents marked as synthetic are examples and must be replaced with verified lab measurements and confirmed, redacted production cases.
