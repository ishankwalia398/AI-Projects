# Career Assistant: One-Command Local Setup

This guide runs the app on your Windows, macOS, or Linux computer without
Render, Railway, a hosted database, or cloud file storage. One launcher checks
or installs the required runtimes, prepares application dependencies, starts
the API (including its inline background worker) and frontend together in the
current terminal, and opens the app in your browser.

The app is private to your computer. Your computer and the launcher must stay
running while you use it. This does not connect the public Vercel site to your
local API.

## 1. Get the project

Clone or download the repository. Run the launcher from the `career-assistant`
folder (the one containing `backend`, `frontend`, and `scripts`).

## 2. Run the one command for your system

**Windows PowerShell**

```powershell
.\start.ps1
```

Run that from the `career-assistant` folder.

If PowerShell blocks the script, run it with a process-only policy bypass:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

**macOS or Linux**

```sh
bash start.sh
```

Run that from the `career-assistant` folder.

The launcher checks for Python 3.12+, Node.js 22.12+, and npm. If needed, it
uses:

- Windows: `winget`
- macOS: Homebrew
- Linux: `apt`, `dnf`, `pacman`, or `zypper` (sudo/root permission may be
  needed)

If the required package manager is missing, the package source does not offer
a recent enough runtime, or installation requires an action the launcher
cannot complete, it prints what is missing and exits. Install the listed
runtime/package manager and rerun the same command. Package installation may
ask for administrator approval.

The launcher creates the backend Python virtual environment and installs its
Python requirements if needed. It runs `npm ci` if frontend dependencies are
missing or the lockfile has changed. On later starts it checks backend
requirements and normally skips reinstalling already satisfied packages; it
skips frontend installation when the installed lockfile matches.

Once startup succeeds, open <http://127.0.0.1:5173> if the browser did not open
automatically. The API health endpoint is <http://127.0.0.1:8000/api/health>.
The launcher displays API and frontend logs in the same terminal. Keep that
terminal open while using the app.

## 3. Stop and start it again

Press **Ctrl+C** in the launcher terminal to stop the API and frontend. Closing
that terminal also stops them, but does not delete the app's saved data.

To run the app later, open a terminal in the same project directory and run
the same OS command again. The launcher reuses its virtual environment and
installed frontend dependencies.

## 4. Data persistence and backups

By default, the app stores:

- Accounts, settings, jobs, and other records in `backend/data/career.db`
- Uploaded resumes and stored files under `backend/data/files/`

These files remain on your computer after closing the terminal and restarting
the app. You may need to log in again. Some generated/downloadable files are
temporary and expire according to the app's retention behavior.

To store the local data somewhere else, set `CAREER_ASSISTANT_DATA_DIR` before
starting the launcher. The app will use that folder for the SQLite database
and its `files` subfolder.

Back up both the database and files directory together:

1. Stop the app with Ctrl+C.
2. Copy `backend/data/career.db` and `backend/data/files/` to a safe, separate
   location, such as an external drive.
3. Restart the app.

The data is local and is not synchronized to another computer. A disk failure
or deletion of the project directory can still lose it. Local `data`
directories are ignored by Git and should not be committed.

## Optional integrations and costs

The app can start without external integrations, but these features need their
own services or credentials:

- AI-assisted extraction/generation uses Gemini with OpenRouter Mistral Small 3.2 fallback. Configure `LLM_API_KEY` and `OPEN_ROUTER_API_KEY` in `.env`.
- The local launcher loads `.env` settings into the backend process, including
  the inline background worker. A separate worker process is not needed.
- Greenhouse/Lever discovery uses configured board identifiers (defaults
  provided). No sample jobs are created when no live listings match.
- Qdrant is optional. Without it, the app uses its labelled lexical retrieval
  fallback.
- Password-reset emails need SMTP settings. Registration and login work
  without SMTP; password-reset email delivery does not.
- Scanned-resume OCR and employer-authorized application submission need
  their respective external tools or credentials.

See `.env.example` for optional setting names. The local launcher reads this
file; direct backend starts still require environment variables to be set
separately. Do not put secrets in browser-visible `VITE_*` variables or commit
credentials to Git.

## Vercel token

A Vercel token is **not required** to run this local setup. A token is only
needed to deploy or manage a Vercel project. The source project no longer
contains the Vercel deployment helper or API proxy. The already-published
Vercel frontend, if still online, is separate and cannot access this private
local backend.


## Task priorities, deletion and fresh-candidate reset

See [task progress and reset controls](docs/TASK_PROGRESS_AND_RESET.md) for worker priorities, concurrent processing, approximate ETA, job deletion, transient notices, and the destructive `--keep-login` reset. Profile saves remain synchronous. These notes supersede older descriptions of a single sequential worker.

Live Google grounding and an actual LaTeX/Pandoc conversion path are now implemented. Local exports use `DOCUMENT_RENDERER=latex` with installed portable tools; older limitations stating that LaTeX is never compiled are superseded by the current task-progress/reset notes. Live grounding verification hit the Gemini project HTTP429 quota limit; no live research success is claimed for that check.


Current appearance and AI configuration: [Cream & Brown and automatic OpenRouter fallback](docs/THEME_AND_AI_ROUTING.md). This documents provider order, cooldowns, token limits, and the separate live-search and embedding requirements.


Current interview/search behaviour: [On-demand answers and candidate-based discovery](docs/ON_DEMAND_INTERVIEWS_AND_SEARCH.md). Questions are generated first; answers are saved on request until explicit logout and included in exports. Saved regional title/country suggestions constrain searches. Gemini grounding failures use the authorized OpenRouter/Exa fallback (one search per request).
