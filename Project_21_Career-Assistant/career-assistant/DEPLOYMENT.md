# Personal local setup (no hosting provider)

For the automatic one-command setup on Windows, macOS, or Linux, use
[guide.md](guide.md). This document describes the same local setup in more
detail.

This setup runs the complete application on your Windows PC. It does not use
Render, Railway, Vercel functions, a hosted database, or cloud file storage.
The frontend, FastAPI API, background worker, SQLite database, and uploaded
files all run locally. Your computer must be on while you use the app; the
service is not accessible from the public internet.

## Requirements

- Python 3.12 or newer
- Node.js 22.12 or newer and npm
- PowerShell

No Docker, PostgreSQL account, or hosted service is needed for this setup.

## First-time setup

Open three PowerShell terminals in the project folder:
`Project_21_Career-Assistant-source/career-assistant`.

### Terminal 1: start the API

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:APP_ENV = "development"
$env:DATABASE_URL = "sqlite:///./data/career.db"
$env:FRONTEND_URL = "http://127.0.0.1:5173"
$env:COOKIE_SECURE = "false"
$env:STORAGE_DIR = "./data/files"
$env:QDRANT_URL = ""
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API creates its local database schema on startup. Keep this terminal open.
API documentation is available at `http://127.0.0.1:8000/docs`.

### Terminal 2: start background processing

```powershell
Set-Location backend
.\.venv\Scripts\Activate.ps1
$env:APP_ENV = "development"
$env:DATABASE_URL = "sqlite:///./data/career.db"
$env:FRONTEND_URL = "http://127.0.0.1:5173"
$env:COOKIE_SECURE = "false"
$env:STORAGE_DIR = "./data/files"
$env:QDRANT_URL = ""
python -m app.worker
```

Keep the worker running while using queued features such as resume parsing,
job discovery, and interview-material generation.

### Terminal 3: start the frontend

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`, register your personal account, and use the app.
The Vite development server forwards `/api` requests to the local API. Use
`127.0.0.1` consistently; `localhost` is a different browser origin for
security checks.

## Start it on later days

Start the API and worker again in their own terminals using the commands
above, but skip `python -m venv` and `pip install` after the first setup. In
the frontend terminal, run `npm run dev`; run `npm ci` again only if the
frontend dependencies change. Stop each process with `Ctrl+C`.

## Data, backups, and privacy

- SQLite data is stored in `backend/data/career.db`.
- Uploaded resumes and generated files are stored under `backend/data/files`.
- These files are local and are not synced to Vercel or another computer.
- Stop the API and worker before copying both paths to a backup location.
- Do not commit `backend/data`, `.env`, API keys, or personal resumes.
- A disk failure, accidental deletion, or loss of the PC can still lose data;
  keep a separate backup if the app contains anything important.

The Vercel site at `https://jobsearchandtracker.vercel.app` is a separate
public static frontend. A browser on Vercel cannot reach the API running on
your PC, so registration and app workflows must be opened at the local URL
above. No backend has been connected to the Vercel deployment.

## Optional integrations

The app's code and screens are unchanged, but services requiring third-party
systems need those systems' configuration:

- AI-assisted resume extraction, generation, and interview content need an
  Gemini API key in `LLM_API_KEY`, with optional OpenRouter fallback via `OPEN_ROUTER_API_KEY`. Set them in `.env` before starting the API.
- Greenhouse/Lever discovery requires configured board identifiers; no general
  job-site crawling is enabled.
- Qdrant vector retrieval is optional. With `QDRANT_URL` blank, the app uses
  its labelled lexical retrieval path. To enable vector retrieval locally,
  run Qdrant yourself and set `QDRANT_URL` in both backend terminals.
- Password-reset delivery requires SMTP settings. Without them, registration
  and login work, but reset email cannot be delivered.
- OCR for scanned resumes and employer-authorized submission connectors also
  require their respective external services or credentials.

Never put provider secrets in frontend `VITE_*` variables or commit them to
the repository. The `.env.example` file documents configuration names; plain
Python commands do not automatically load `.env`, so set optional values in
the backend terminals before starting their processes.

## Optional Docker Compose stack

The existing `compose.yaml` can be used instead of the native API/worker
terminals if Docker Desktop is installed. It runs PostgreSQL and Qdrant with
persistent Docker volumes. Follow the Compose-specific configuration in the
README; the frontend can still run locally with Vite. This is optional and not
needed for single-user local use.


Current appearance and AI configuration: [Cream & Brown and automatic OpenRouter fallback](docs/THEME_AND_AI_ROUTING.md). This documents provider order, cooldowns, token limits, and the separate Gemini grounding/embedding requirements.
