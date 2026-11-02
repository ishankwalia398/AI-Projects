# Workspace reset, priorities and task progress

## Priority order

1. Resume upload and extraction.
2. Candidate profile re-extraction; profile edits/save are synchronous and do not wait behind AI tasks.
3. Domestic titles, then domestic job discovery.
4. Visa titles, countries, then visa discovery.
5. Technical, then non-technical interviews.

Three bounded workers can run independent tasks concurrently. Priorities select the next queued task; they do not interrupt a running provider request. The app shows approximate per-task completion times, including queue delay, and a combined estimate across worker slots. Provider response time and retries can change these estimates.

## Job and banner controls

Delete a job using its delete action. Its attachments are deleted, and a minimal suppression record prevents the same listing from returning on discovery. Existing generated documents remain available separately. Deletion is scoped to the signed-in account; active job tasks must finish first.

Title/country notices appear only after a click and disappear after ten seconds. Active work remains visible through task progress/ETA. Sidebar Settings and Logout follow the profile navigation without the large unused spacer.

## Clear candidate data, keep login

Stop the launcher and any separate workers. From the project folder:

```powershell
.\reset.ps1 --keep-login --dry-run
.\reset.ps1 --keep-login
```

macOS/Linux: `bash reset.sh --keep-login`.

**CAUTION: This permanently clears ALL local candidate data for EVERY account:** profiles, resumes, RAG knowledge/embeddings, jobs, titles/countries, interview guides, generated files, attachments, tasks, logs and local test/runtime artifacts. Only account usernames, email addresses, password hashes and database schema metadata are retained. Sessions/reset tokens are revoked; sign in again using the same credentials. API configuration stays in `.env`. Type `DELETE ALL DATA` to confirm. Do not combine this mode with `--for-sharing`.

This command targets the local launcher storage. External databases, Qdrant/S3, browser downloads and separate backups require their own cleanup. It is separate from `reset.ps1`, which also deletes login accounts, and `reset.ps1 --for-sharing`, which removes local `.env` configuration too.

The one-time cleanup requested for this update uses this reset after validation; it is never run automatically on startup.


## Live research and real document conversion

Google Search grounding uses the configured Gemini key. Title/country suggestions show
source links and Google Search suggestions when available. Discovery additionally fetches
cited public pages and accepts structured JobPosting data; snippets alone never become jobs.
Search coverage is limited by returned sources and site accessibility. HTTP429 means the
provider quota/rate limit is exhausted; the app cannot override that limit.

Portable Tectonic and Pandoc are installed under ignored `backend/.tools` on this computer.
`DOCUMENT_RENDERER=latex` is enabled in local configuration: PDF is compiled from escaped
LaTeX, and Word is converted from exactly the same source. Shell escape is disabled.
First use can download TeX packages; later exports reuse the compiler package cache.
Conversion errors are shown explicitly and do not replace output with unrelated content.
To set up another computer, install Tectonic (or MiKTeX/TeX Live) and Pandoc on PATH, then
set `DOCUMENT_RENDERER=latex`. Native rendering remains available as an explicit option.
Official setup: https://tectonic-typesetting.github.io/book/latest/installation/ and
https://www.pandoc.org/installing.html . The login-preserving reset keeps installed tools.

The selected Cream & Brown theme is now applied throughout the app; layout spacing remains corrected.

Final cleanup verification: one existing login account retained; records, files, tasks and sessions all empty. Existing password credentials were preserved by the reset integrity check. The app remains stopped for a clean user-managed launch.


Current appearance and AI configuration: [Cream & Brown and automatic OpenRouter fallback](THEME_AND_AI_ROUTING.md). This documents provider order, cooldowns, token limits, and the separate live-search and embedding requirements.


Current interview/search behaviour: [On-demand answers and candidate-based discovery](ON_DEMAND_INTERVIEWS_AND_SEARCH.md). Questions are generated first; answers are saved on request until explicit logout and included in exports. Saved regional title/country suggestions constrain searches. Gemini grounding failures use the authorized OpenRouter/Exa fallback (one search per request).
