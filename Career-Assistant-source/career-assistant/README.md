# Career Assistant

A working local React/Vite/TypeScript and FastAPI career workspace, with secure accounts, resume ingestion, reviewed candidate profiles, job tracking, document rendering and provider-backed AI workflows. **This delivery is not a verified production deployment.** External services still need configuration. See `DEVELOPMENT_REPORT.md` and `docs/REQUIREMENT_COVERAGE.md` for the remaining gaps.

## Run locally

Requirements: Python 3.12+, Node 22.12+ (Node 24 used for verification), npm. PostgreSQL and Qdrant are recommended; SQLite is available only for development. No repository or account is required for a local run.

From `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal, from `backend`, activate the same environment and start the required background worker:

```powershell
python -m app.worker
```

In a third terminal, from `frontend`:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The API is proxied through Vite. `FRONTEND_URL` must match the browser origin exactly; `localhost` and `127.0.0.1` are different origins. API docs are at `http://127.0.0.1:8000/docs`.

Amber Desk is the only application theme. Login, navigation, cards, forms and interview preparation use its cream and burnt-orange palette. The read-only preview is at `/?view=designs` or `docs/Amber-Desk-preview.html`. There is no theme picker or browser-stored theme choice. Migration 002 updates existing accounts to Amber Desk while preserving their search settings. Sessions use HttpOnly cookies; CSRF tokens stay in memory.

## Configuration

Copy `.env.example` to `.env` and configure it using your host's secret manager. Plain uvicorn does **not** load this file automatically. Export values in your shell, or install `python-dotenv` and launch `uvicorn ... --env-file ../.env`; export the same values for the worker. Docker Compose loads `.env` for both services.

For production deployment, follow [DEPLOYMENT.md](DEPLOYMENT.md) to run the FastAPI backend and worker, connect persistent services, and configure the Vercel API proxy.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://...` for authoritative records. Empty/default uses local SQLite. |
| `APP_ENV=production` | Enforces PostgreSQL, HTTPS frontend URL and secure cookies. |
| `FRONTEND_URL`, `COOKIE_SECURE` | Exact browser origin; use `true` with production HTTPS. |
| `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` | Server-only OpenAI-compatible chat-completions provider. |
| `FALLBACK_*` | Optional second model/provider, attempted once after primary failure. |
| `EMBEDDING_MODEL` | Configurable embeddings; default `text-embedding-3-small`. |
| `QDRANT_URL`, `QDRANT_API_KEY` | Private vector service. Missing config provides labelled lexical text retrieval, not fake embeddings. |
| `GREENHOUSE_BOARDS`, `LEVER_SITES` | Comma-separated employer ATS board identifiers. No broad web search runs without a configured integration. |
| `SMTP_*`, `MAIL_FROM` | STARTTLS email delivery for 30-minute one-time password reset links. |
| `STORAGE_DIR` | Private persistent disk shared by API and worker. |
| `S3_BUCKET`, `S3_ENDPOINT_URL`, `AWS_*` | Optional private S3-compatible object store instead of local files. |

The current defaults are configurable example choices, not a claim of latest/best models or account eligibility. Primary `gpt-5.1` emphasizes structured generation; fallback `gpt-4.1` uses a different model family through the same API contract. You may configure a separate compatible provider. ChatGPT subscriptions must not be assumed to include API credits. Provider model availability, latency, cost and output quality need real benchmarking before launch.

For Compose, set `POSTGRES_PASSWORD` and replace `DATABASE_URL` with the matching password and host `postgres`; set `QDRANT_URL=http://qdrant:6333`, `STORAGE_DIR=/app/data/files`. Run `docker compose up --build`. Do not expose PostgreSQL/Qdrant directly to the public internet. Compose was supplied but was not run in this environment.

## Account and resume workflows

Register with exactly email, username and password; then log in with username and password. Usernames/emails are normalized for case-insensitive uniqueness. Passwords use Argon2id. Login and reset requests have persistent rate limits. Logout invalidates the current session while preserving stored data. Password reset revokes all existing sessions and consumes all outstanding reset tokens for the account. With missing email configuration the endpoint returns the same generic response for every address; Settings shows that delivery is not configured.

Upload a PDF or DOCX up to 10 MB in Resume library. Submit queues parsing; keep the worker running. Text extraction preserves headings and DOCX table order. Scanned PDFs require external OCR. Original uploads remain private. Re-uploaded identical text reuses the same processed resume version even if DOCX archive metadata changed. Different content creates a version with added/removed line comparisons.

Set a processed version active, review the profile and approve it. With an AI key, extraction accepts only facts and supporting quotes that are exact substrings of the resume; otherwise only conservative skill/email extraction runs. Unknown fields remain empty for review. Employment dates accept ISO dates/months; total experience merges overlapping intervals and reports incomplete roles. Per-domain and per-technology experience merges overlapping dated roles when you explicitly tag their `domain` and `technologies`; untagged role duration is not inferred. Resume activation never blindly merges contradictory history. An already-active resume does not overwrite a reviewed profile.

Qdrant indexing caches embeddings by user, model and text hash. Tenant, namespace and version filtering is mandatory. Shared chunks retain their version references; removed chunks disappear from active-version retrieval. Full approved profiles, including source text, are supplied to generation tasks requiring the full history. A retrieval benchmark and reranker have not been delivered.

## Jobs and application tracking

Domestic Jobs filters to India. Visa Sponsored Jobs requires an explicit country outside India and a positive sponsorship/relocation sentence. Negative, uncertain and conditional wording is conservatively excluded. This heuristic needs broader linguistic validation. Configured Greenhouse and Lever adapters fetch published employer ATS listings; they do not scrape restricted portals. Manual listings are retained with user-provided / third-party-only labels. Board publication evidence does not prove an employer website cross-check, a new posting date, or the candidate's visa eligibility.

Find Jobs queues discovery. Suggest titles creates saved, labelled AI inferences, **not verified current market research**. Saved title/country preferences filter configured-board results. Matching Probability is a weighted, explainable estimate of CV/JD fit; unknown components get zero. JD skill mentions are a heuristic and may not be mandatory requirements. View a job for evidence, missing skills and component scores.

The table preserves all 14 requested columns, seven statuses, editable comments, multiple PDF/DOCX attachments, 30-row pagination, filters, stable default sorting and 60-day active-discovery retention. Include history shows older stored records. Updating a duplicate retains status, comments, attachments and history. Basic identity uses source/requisition, normalized company/title/location, or canonical URLs; difficult cross-source near-duplicates still need stronger reconciliation.

Select jobs and Apply selected validates employer document requirements and approved generated content/typed attachments. Invalid rows receive dark red borders; comments remain intact. Confirm document requirements in job details. The supported channel is the employer's external application site. Complete submission there and record the employer receipt in job details. This is labelled **User-provided submission confirmation**. Opening a link never sets APPLIED. Manual status changes have a distinct history label and do not invent a submission date. An optional Greenhouse connector supports confirmed bulk submissions to employer boards listed in `GREENHOUSE_SUBMISSION_KEYS` (JSON board-to-key mapping). These keys are employer-authorized credentials, not general job-seeker credentials. A second confirmation names the employers and data to send. The worker rechecks publication/form requirements, sends approved current-version resume/cover-letter PDFs or typed uploaded documents, and sets APPLIED only after an explicit ATS success response. Extra employer questions or consent require external completion. Unknown transmission outcomes retain the previous status and block automatic duplicate retries. This connector is fixture-tested, not verified with a live employer key.

## Content and downloads

Generate queues separate saved resume and cover letter content. It requires an approved profile, saved JD and configured AI. LangGraph runs generation and structural validation. Prompt rules require factual resume content and label unknowns. These rules are not a formal truth guarantee: all generated career claims need human review.

Review/edit the saved text and approve it. Content and prior edited versions persist as structured JSON and Markdown. Word, PDF, LaTeX and ZIP are rendered on demand from stored text; no AI calls occur for format changes. Cache keys include profile/resume, job/company/country/JD and prompt version. Content edits expire previous temporary binaries and require fresh approval. LaTeX source is escaped but is not compiled in this release. PDF is rendered directly with ReportLab. Unicode font availability varies by deployment.

Generated files expire after 24 hours; downloads require an active authenticated session, matching user and unexpired file. The worker sweeps expired temporary binaries at least once per minute when running. Metadata is tombstoned; saved text and original uploads survive. Local orphan sweeping only touches old unreferenced files in temporary directories. S3 expiry is enforced by API and metadata-driven cleanup; S3 orphan inventory cleanup is not yet implemented. Rendered files can be regenerated after expiry without another generation call. Logout revokes access, not permanent data.

## Interview preparation

Paste a JD or extract from supported Greenhouse/Lever HTTPS pages. Other hosts, redirects, private/local destinations and overly large pages are rejected; paste remains available. Choose an existing resume or upload an alternate, without changing the active profile automatically.

Technical generation requests three answered questions for each of twelve categories (36 total), including code/SQL solutions, follow-up answers and scenarios. HR generation preserves all five mandatory groups plus ten additional categories, requesting larger behavioral/leadership/challenging/company/international banks (90 total). Completed category batches are cached so retries can reuse them. Questions have unique IDs and detailed fields; incomplete answers fail validation. Plans request 7/14/30 daily entries, mock rounds, topic lists and skills matrices. Company interview research is labelled general preparation unless supplied with supporting citations; no live research provider is configured. Exact counts/depth/quality across real LLM providers remain unverified.

Saved guides show tabular Q&A, priorities, plans and mock round material. Practice answers and self-scores persist. Word/PDF exports use saved text. A resume chosen only for interviews may still need manual fact review; generated hypothetical examples must not be treated as actual candidate accomplishments. The application does not execute coding solutions or automatically grade mock interviews.

## Testing

From `backend`: `python -m pytest -q`. From `frontend`: `npm test` and `npm run build`. Node 24 is needed for the tests' direct TypeScript import; the Vite build supports Node 22.12+.

The backend suite uses isolated SQLite databases and private temporary directories. It covers accounts, password reset with mocked SMTP, CSRF/origin enforcement, sessions, isolation, parsing, versions, experience, sponsorship rules, matching, retention/pagination, attachments, partial bulk validation, content caching, approved rendering, expiry and cleanup. Provider responses are explicit test fixtures. Tests do not prove live PostgreSQL/Qdrant/S3/SMTP/AI access or production performance. See the report for observed results and browser checks.

## Deployment

Deploy FastAPI and its continuous worker to a Python/container host, with PostgreSQL, Qdrant, private shared storage and secrets. Run the initial migration once before API/worker scaling. Configure HTTPS, `APP_ENV=production`, `COOKIE_SECURE=true`, and `FRONTEND_URL=https://jobsearchandtracker.vercel.app`.

In `frontend/vercel.json`, replace `YOUR-BACKEND-HOST.example` with your backend's public HTTPS hostname. Remove `frontend/api/[...path].js`, which is an explicit 503 handler intended only for a disconnected frontend preview. Keep the same-origin `/api` rewrite so browser sessions work without third-party cookies. Set `VITE_BACKEND_CONFIGURED=true` for an integrated deployment; a frontend-only preview must use `false` and display its connection notice.

The `scripts/deploy_vercel.py` helper accepts a Vercel token through a hidden prompt, keeps it only in RAM, uploads frontend source, starts a deployment and polls its state. Its frontend-only mode deliberately leaves account/workflow APIs unavailable and labelled. Install `httpx`, then run `python scripts/deploy_vercel.py` yourself if agent execution is blocked. It cannot provision PostgreSQL, Qdrant, SMTP, AI credentials or a backend. Do not regard a successful frontend deployment as complete product deployment. The requested alias depends on Vercel account/project availability.

Production acceptance must include registration/login/reset email, database persistence across restarts, Qdrant tenant filters, real resume processing, real source discovery, real AI outputs, rendering/download expiry, worker recovery, cleanup, supported submissions and API/frontend connectivity. This acceptance has not been completed.

## Troubleshooting and limits

- Queued tasks do not advance: start the worker with the same DB/storage/environment as the API.
- Browser login rejected: match `FRONTEND_URL` exactly; HTTPS requires secure cookies. Clear old development cookies after host changes.
- AI task fails: configure a model/key with JSON output support and inspect the provider account. No fabricated content replaces provider errors.
- Empty discovery: configure real employer board identifiers and review title/country filters. Broad search across LinkedIn/Naukri/Indeed is not implemented.
- Empty profile fields: supply missing user facts and confirm dates rather than trusting inferred career history.
- Files unavailable: check session/expiry, approve stored content and render again. Use persistent shared disk or private S3 for multiple processes.
- Schema upgrades: the initial migration is additive only; future column changes need explicit reviewed migrations.
- Security/operations: sustained load, upload malware scanning, email timing equalization, account deletion recovery, provider cost limits and all production infrastructure still require further validation/hardening.

Full original requirements are preserved in `docs/MASTER_REQUIREMENTS.md`. Keep requirements, contracts, affected backend/frontend modules, migrations, tests, README, Architecture and environment documentation aligned after every functional change.


Final appearance: **Amber Desk only**. All alternative theme assets and switching controls are removed. Preference data migration 002 preserves existing search settings.
