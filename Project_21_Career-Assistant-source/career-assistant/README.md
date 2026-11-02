# Career Assistant

A working local React/Vite/TypeScript and FastAPI career workspace, with secure accounts, resume ingestion, reviewed candidate profiles, job tracking, document rendering and provider-backed AI workflows. **This delivery is not a verified production deployment.** External services still need configuration. See `DEVELOPMENT_REPORT.md` and `docs/REQUIREMENT_COVERAGE.md` for the remaining gaps.

## Personal local setup

The simplest personal setup runs the React frontend, FastAPI API, worker,
SQLite database, and uploaded files on your own PC. It requires Python 3.12+,
Node 22.12+, npm, and a terminal; no hosting account, Docker, PostgreSQL
service, or cloud storage is needed. Your computer must be on while you use
the app.

Follow [guide.md](guide.md) for Windows, macOS, and Linux setup, start,
restart, and backup instructions. [DEPLOYMENT.md](DEPLOYMENT.md) contains the
personal local setup details. You can launch from the repository folder with
`.\start.ps1` (Windows) or `bash start.sh` (macOS/Linux), or run the
corresponding script directly from this folder.

Open `http://127.0.0.1:5173`; the frontend proxies API requests to the local
backend at `http://127.0.0.1:8000`. The API creates a local SQLite database
and stores files under `backend/data`. Keep the API and worker processes
running while using queued workflows.

Cream & Brown is the only application theme. Login, navigation, cards, forms and interview preparation use its cream and walnut-brown palette. The read-only preview is at `/?view=designs` or `docs/Amber-Desk-preview.html`. There is no theme picker or browser-stored theme choice. Migration 002 updates existing accounts to Cream & Brown while preserving their search settings. Sessions use HttpOnly cookies; CSRF tokens stay in memory.

## Clear all local data / prepare a clean copy

> **CAUTION — THIS PERMANENTLY DELETES ALL LOCAL APP DATA. There is no undo.**
> Accounts, passwords/sessions, candidate profiles, original resumes (including archived
> versions), saved jobs, preferences, interview guides, generated downloads, tasks,
> logs, and the local RAG knowledge database/embedding cache are removed for **every user**.
> Deleting a resume in the library preserves RAG; this full reset deletes RAG too.

Stop the app and any separate workers first (Ctrl+C in the launcher terminal).
Run these commands from this folder or `Project_21_Career-Assistant-source`:

```powershell
# Preview only; nothing is deleted
.\reset.ps1 --dry-run

# Reset all local app data; retain API configuration for your own next use
.\reset.ps1

# Prepare for sharing: also delete .env files containing keys/private settings
.\reset.ps1 --for-sharing
```

On macOS/Linux use `bash reset.sh` with the same options. Every destructive
invocation requires typing `DELETE ALL DATA`. The command refuses to run while
ports 8000/5173 are in use. It needs Python, but does not install dependencies,
contact AI services, or start the app. Source code and `.env.example` are kept.
The next launch creates an empty database; register a new account.

The default reset removes the entire `backend/data` directory, including SQLite,
its sidecar files, local uploads and all local RAG records. It also resets a
configured `CAREER_ASSISTANT_DATA_DIR`; if that directory is outside this project,
you must explicitly supply `--data-dir "C:\path\to\career-data"` after reviewing
the path. `--dry-run` works with `--for-sharing` and `--data-dir` too.

**Before handing over a copy:** use `--for-sharing`, then share only source files.
Do not include separate backups, exported/downloaded files outside `backend/data`,
private configuration stored elsewhere, `.git` history, `.venv`, or `node_modules`.
The recipient should create their own `.env` from `.env.example` and add their own
API keys. Clear site data for `127.0.0.1`/`localhost` in the browser if handing over
the computer itself. The command does not erase browser downloads or backups.

**Optional external services:** this command resets the personal **local launcher**
only. It does not delete external PostgreSQL databases, Qdrant servers, or S3 objects.
If you used the optional Compose stack, its separate full-volume reset is
`docker compose down --volumes --remove-orphans` from this folder, **before** removing
`.env`. **CAUTION: this deletes the Compose PostgreSQL, Qdrant RAG, and private-file
volumes permanently.** Externally hosted services and S3 must be purged separately
using their administration tools; do not share credentials or copies of their data.

## Configuration settings

The local defaults use SQLite and local disk storage. `.env.example` documents
optional settings, but plain Python commands do not automatically load `.env`;
set optional variables in the API and worker terminals before starting them.
For the selected no-hosting personal setup, see [guide.md](guide.md). The
existing Vercel site is separate from the local app and is not connected to
your local API; use the local URL for registration and app workflows.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | Optional local `sqlite:///./data/career.db`; PostgreSQL is available for the optional Compose stack. |
| `APP_ENV=development` | Application environment. Production mode enables strict checks. |
| `FRONTEND_URL`, `COOKIE_SECURE` | Exact browser origin; local default is `http://127.0.0.1:5173` and `false`. |
| `INLINE_WORKER=true` | Runs background job processing inside the API process automatically. Enabled by default. |
| `LLM_API_KEY` | Server-only Gemini API key for the configured Google endpoint. |
| `LLM_MODEL` | Primary generation model (`gemini-3.8-flash`). |
| `FALLBACK_MODEL` | Fast extraction model and generation fallback (`gemini-3.5-flash-lite`). |
| `GREENHOUSE_BOARDS` | Comma-separated employer ATS board identifiers (default: `canonical,automattic,cloudflare`). |
| `LEVER_SITES` | Optional comma-separated Lever employer identifiers. |
| `STORAGE_DIR` | Local persistent file storage; default is `./data/files` relative to the backend working directory. |

The default configuration uses Google Gemini through its compatible chat-completions endpoint (`https://generativelanguage.googleapis.com/v1beta/openai`). Gemini 3.8 Flash handles complex technical categories (coding, architecture, debugging, SQL and backend engineering) and document generation. Gemini 3.5 Flash-Lite handles routine technical questions, HR questions, extraction and search suggestions. Preparation plans are removed from interview guides and exports. On failure, the other Gemini model and then configured OpenRouter fallback are tried. Invalid responses have bounded repair passes. Requests have a 30-second read timeout (at least 90 seconds for interviews); models with transient network, server, or rate-limit failures are skipped for five minutes so every interview batch does not repeat the same delay. Configure these limits with `LLM_REQUEST_TIMEOUT_SECONDS` and `LLM_FAILURE_COOLDOWN_SECONDS`. Both use the same `LLM_API_KEY` unless an explicit fallback key is configured. Complete local resume parsing skips AI extraction entirely. Requests use low reasoning effort, compact JSON, bounded output (4,096 extraction / 12,000 generation tokens), and saved interview batches. Full candidate source text remains available, while duplicate extraction metadata and long repeated question-bank answers are omitted. Google API usage/billing is separate from consumer subscription usage.

For the optional Compose stack, set `POSTGRES_PASSWORD`, configure
`DATABASE_URL` with the matching password and host `postgres`, set
`QDRANT_URL=http://qdrant:6333` and `STORAGE_DIR=/app/data/files`, then run
`docker compose up --build`. The Compose stack uses persistent named volumes;
do not expose PostgreSQL or Qdrant to the public internet.

## Account and resume workflows

Register with exactly email, username and password; then log in with username and password. Usernames/emails are normalized for case-insensitive uniqueness. Passwords use Argon2id. Login and reset requests have persistent rate limits. Logout invalidates the current session while preserving stored data. Password reset revokes all existing sessions and consumes all outstanding reset tokens for the account. With missing email configuration the endpoint returns the same generic response for every address; Settings shows that delivery is not configured.

Upload a PDF or DOCX up to 10 MB in Resume library. Submit queues parsing; keep the worker running. Text extraction preserves headings and DOCX table order. Scanned PDFs require external OCR. Original uploads remain private. Re-uploaded identical text reuses the same processed resume version even if DOCX archive metadata changed. Different content creates a version with added/removed line comparisons. Inactive resumes can be deleted from the library: the original file is removed, while processed knowledge, RAG version references, and saved guides are retained. Choose another active resume first before deleting the active one. Re-uploading an archived resume restores the same processed version.

Set a processed version active, review the profile and approve it. With an AI key, extraction accepts only facts and supporting quotes that are exact substrings of the resume; otherwise local parsing extracts supported header/contact fields, current role titles, and skills. DOCX headers, footers, and tables are included. Unknown fields remain empty for review. Employment dates accept ISO dates/months; total experience merges overlapping intervals and reports incomplete roles. Per-domain and per-technology experience merges overlapping dated roles when you explicitly tag their `domain` and `technologies`; untagged role duration is not inferred. Resume activation never blindly merges contradictory history. An already-active resume does not overwrite a reviewed profile. Older extraction versions are repaired locally on loading the profile or library, filling only empty values. Local extraction includes explicit month/year employment ranges, contact details, education, certifications, projects, and awards; absent facts remain empty. For a previously uploaded resume with missing fields, use **Re-extract missing profile fields** on Candidate Profile. This rereads the original file and fills empty fields while preserving saved edits and approval.

Qdrant indexing caches embeddings by user, model and text hash. Tenant, namespace and version filtering is mandatory. Shared chunks retain their version references; removed chunks disappear from active-version retrieval. Full approved profiles, including source text, are supplied to generation tasks requiring the full history. A retrieval benchmark and reranker have not been delivered.

## Jobs and application tracking

See [Job title prompts and search rules](docs/JOB_PROMPTS_AND_SEARCH.md) for the exact
current/previous suggestion prompts, their editable source, and the domestic/visa
search filters. Job discovery uses ATS adapters and code filters, not an LLM prompt.

Domestic Jobs filters to India. Visa Sponsored Jobs requires an explicit country outside India and a positive sponsorship/relocation sentence. Negative, uncertain and conditional wording is conservatively excluded. This heuristic needs broader linguistic validation. Configured Greenhouse and Lever adapters fetch published employer ATS listings; they do not scrape restricted portals. Manual listings are retained with user-provided / third-party-only labels. Board publication evidence does not prove an employer website cross-check, a new posting date, or the candidate's visa eligibility.

Find Jobs queues discovery. With both source settings blank, built-in Greenhouse boards (`canonical,cloudflare,stripe,datadog`) are used. Override `GREENHOUSE_BOARDS` / `LEVER_SITES` with comma-separated employer identifiers to customize sources. Empty results never create sample jobs; source failures are shown separately. Discovery notices belong to the selected jobs page. Suggest titles creates saved, labelled AI inferences, **not verified current market research**. Saved title/country preferences filter configured-board results. Matching Probability is a weighted, explainable estimate of CV/JD fit; unknown components get zero. JD skill mentions are a heuristic and may not be mandatory requirements. View a job for evidence, missing skills and component scores.

The table preserves all 14 requested columns, seven statuses, editable comments, multiple PDF/DOCX attachments, 30-row pagination, filters, stable default sorting and 60-day active-discovery retention. Include history shows older stored records. Updating a duplicate retains status, comments, attachments and history. Basic identity uses source/requisition, normalized company/title/location, or canonical URLs; difficult cross-source near-duplicates still need stronger reconciliation.

Select jobs and Apply selected validates employer document requirements and approved generated content/typed attachments. Invalid rows receive dark red borders; comments remain intact. Confirm document requirements in job details. The supported channel is the employer's external application site. Complete submission there and record the employer receipt in job details. This is labelled **User-provided submission confirmation**. Opening a link never sets APPLIED. Manual status changes have a distinct history label and do not invent a submission date. An optional Greenhouse connector supports confirmed bulk submissions to employer boards listed in `GREENHOUSE_SUBMISSION_KEYS` (JSON board-to-key mapping). These keys are employer-authorized credentials, not general job-seeker credentials. A second confirmation names the employers and data to send. The worker rechecks publication/form requirements, sends approved current-version resume/cover-letter PDFs or typed uploaded documents, and sets APPLIED only after an explicit ATS success response. Extra employer questions or consent require external completion. Unknown transmission outcomes retain the previous status and block automatic duplicate retries. This connector is fixture-tested, not verified with a live employer key.

## Content and downloads

Generate queues separate saved resume and cover letter content. It requires an approved profile, saved JD and configured AI. LangGraph runs generation and structural validation. Prompt rules require factual resume content and label unknowns. These rules are not a formal truth guarantee: all generated career claims need human review.

Review/edit the saved text and approve it. Content and prior edited versions persist as structured JSON and Markdown. Word, PDF, LaTeX and ZIP are rendered on demand from stored text; no AI calls occur for format changes. Cache keys include profile/resume, job/company/country/JD and prompt version. Content edits expire previous temporary binaries and require fresh approval. LaTeX source is escaped but is not compiled in this release. PDF is rendered directly with ReportLab. Unicode font availability varies by deployment.

Generated files expire after 24 hours; downloads require an active authenticated session, matching user and unexpired file. The worker sweeps expired temporary binaries at least once per minute when running. Metadata is tombstoned; saved text and original uploads survive. Local orphan sweeping only touches old unreferenced files in temporary directories. S3 expiry is enforced by API and metadata-driven cleanup; S3 orphan inventory cleanup is not yet implemented. Rendered files can be regenerated after expiry without another generation call. Logout revokes access, not permanent data.

## Interview preparation

Paste a JD or extract from a public HTTPS job page on any host. Extraction prefers structured JobPosting data, then the main readable page content. Redirect destinations are validated; private/local destinations and overly large pages are rejected. Pages that require sign-in or JavaScript may require pasting the JD. Choose an existing resume or upload an alternate, without changing the active profile automatically. Alternate uploads show terminal success/failure and are selected automatically once processed.

Technical generation requests three answered questions for each of twelve categories (36 total), including code/SQL solutions, follow-up answers and scenarios. HR generation preserves all five mandatory groups plus ten additional categories, requesting larger behavioral/leadership/challenging/company/international banks (90 total). Completed category batches are cached so retries can reuse them. Questions have unique IDs and detailed fields; incomplete answers fail validation. The interview page contains questions and a must-prepare view; preparation plans are removed; mock interviews and skills/research views are removed. Company interview research is labelled general preparation unless supplied with supporting citations; no live research provider is configured. Exact counts/depth/quality across real LLM providers remain unverified.

Question batches contain one fully answered question per provider call, with bounded schema repair and at least a 90-second interview response timeout. They appear progressively and the current guide opens automatically. Completed batches remain usable if a later call fails; retrying reuses those saved batches. Task failures show actionable provider errors rather than an indefinite queue notice. Provider failures are reported explicitly and do not create substitute practice/coaching answers. Legacy built-in practice records are preserved internally but excluded from the preparation library. New generation uses a separate cache version and rejects identical short/detailed answers, coaching in place of answers, incomplete code, and invalid Python syntax. Gemini HTTP 401/403 indicates an API-key or permission issue: check the Google AI Studio key and project access in `.env`, then restart. Saved guides show direct short answers, expanded detailed answers, complete code/SQL solutions, and numbered questions. Internal question metadata is hidden from answers and exports. Word/PDF exports use saved text. A resume chosen only for interviews may still need manual fact review; generated hypothetical examples must not be treated as actual candidate accomplishments. The application does not execute coding solutions or automatically grade mock interviews.

## Testing

From `backend`: `python -m pytest -q`. From `frontend`: `npm test` and `npm run build`. Node 24 is needed for the tests' direct TypeScript import; the Vite build supports Node 22.12+.

The backend suite uses isolated SQLite databases and private temporary directories. It covers accounts, password reset with mocked SMTP, CSRF/origin enforcement, sessions, isolation, parsing, versions, experience, sponsorship rules, matching, retention/pagination, attachments, partial bulk validation, content caching, approved rendering, expiry and cleanup. Provider responses are explicit test fixtures. Tests do not prove live PostgreSQL/Qdrant/S3/SMTP/AI access or production performance. See the report for observed results and browser checks.

## Starting the personal app

Use one command from this project folder:

- **Windows PowerShell:** `.\start.ps1`
- **macOS/Linux:** `bash start.sh`

The launcher checks for Python 3.12+ and Node.js 22.12+ (with npm), installs
missing runtimes through winget, Homebrew, or a supported Linux package
manager, prepares project dependencies, starts the API/worker/frontend, and
opens the local site. All service logs appear in the launcher terminal; press
Ctrl+C there to stop them together. Linux package installation may ask for
sudo authorization. Read [guide.md](guide.md) for details and limitations.

No Vercel token or hosted deployment is required for local use. The legacy
public Vercel site is separate and has no connected backend. Redeploying or
reconnecting that hosted site is outside this local setup.

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


Final appearance: **Cream & Brown only**. All alternative theme assets and switching controls are removed. Preference data migration 002 preserves existing search settings.

### Local network and page behavior

Start the app from `start.ps1` in a normal terminal. A backend spawned inside a restricted execution sandbox can inherit blocked outbound sockets (Windows 10013), preventing job discovery, Google calls and URL extraction. Job-source outages fail explicitly rather than reporting a successful empty search. Discovery streams source/scanned counts; title suggestions stream progress and open their saved results automatically. Known retired default boards are replaced in the local configuration. Apple job pages decode their embedded React Router job data without executing JavaScript; title-only HTML is rejected.

Candidate Profile disables Save while unchanged or saving, preserves edits across background refreshes, and clears the save notification. Its extraction success notice expires after 20 seconds. Employment date placeholders accept `YYYY-MM` or `YYYY-MM-DD`; notice periods are labelled in days.


### User-maintained prompts and visa documents

Generation loads the relevant sections of `docs/Prompt_Domestic_Jobs.md`,
`docs/Prompt_VISA_Sponsored_Jobs.md`, and `docs/Prompt_Interview.md` directly.
Document/interview cache keys include the prompt text hash. Existing removed interview
plans and metadata remain excluded by the application output schema.

Visa jobs generate a resume, cover letter, and motivational letter; domestic jobs
retain resume and cover letter only. All use the existing review, approval and download flow.
The visa page also offers **Suggest Countries** and **Saved countries**, grouped by
region with up to ten distinct countries per region (fewer where necessary).

Research calls currently have no browsing tool. Country/title suggestions therefore
cannot verify current immigration rules or live market demand. Discovery still fetches
configured Greenhouse/Lever listings, then applies the supplied search prompt to review
those real listings in batches. It preserves existing records/history and marks review
outcomes internally; provider failure retains the local filter results with a notice.
The prompt files request broader research and LaTeX-first conversion; these capabilities
are not implemented by the current adapters and renderer. Generated text must not claim
that unavailable browsing, compilation or conversion was performed.


## Task priorities, deletion and fresh-candidate reset

See [task progress and reset controls](docs/TASK_PROGRESS_AND_RESET.md) for worker priorities, concurrent processing, approximate ETA, job deletion, transient notices, and the destructive `--keep-login` reset. Profile saves remain synchronous. These notes supersede older descriptions of a single sequential worker.

Live Google grounding and an actual LaTeX/Pandoc conversion path are now implemented. Local exports use `DOCUMENT_RENDERER=latex` with installed portable tools; older limitations stating that LaTeX is never compiled are superseded by the current task-progress/reset notes. Live grounding verification hit the Gemini project HTTP429 quota limit; no live research success is claimed for that check.


Current appearance and AI configuration: [Cream & Brown and automatic OpenRouter fallback](docs/THEME_AND_AI_ROUTING.md). This documents provider order, cooldowns, token limits, and the separate live-search and embedding requirements.


Current interview/search behaviour: [On-demand answers and candidate-based discovery](docs/ON_DEMAND_INTERVIEWS_AND_SEARCH.md). Questions are generated first; answers are saved on request until explicit logout and included in exports. Saved regional title/country suggestions constrain searches. Gemini grounding failures use the authorized OpenRouter/Exa fallback (one search per request).
