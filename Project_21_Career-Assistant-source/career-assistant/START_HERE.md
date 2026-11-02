# Career Assistant — Cream & Brown

This package is set up for personal local use without Render, Railway, or a
hosted backend. See [guide.md](guide.md) for the one-command setup on Windows,
macOS, and Linux, including restart and backup instructions.

1. Open a terminal in this project directory and run `.\start.ps1` on Windows
   or `bash start.sh` on macOS/Linux.
2. Open `http://127.0.0.1:5173` and register your personal account.
3. Keep the launcher terminal running while you use the app. Back up
   `backend/data/career.db` and `backend/data/files` with the app stopped.

The public Vercel page is a static frontend and cannot connect to a backend
running privately on your PC. Use the local URL above for working registration
and app workflows.

The main app features remain in the code. AI providers, email, job-board
integrations, Qdrant vector retrieval, OCR, and employer-authorized submission
connectors are optional integrations that need their own service setup or
credentials. Without Qdrant, the app uses its labelled lexical retrieval
fallback; without AI or SMTP credentials, AI features or password-reset email
cannot use those providers.

Cream & Brown is the only theme in this package. Existing accounts are migrated
to the chosen appearance while retaining search preferences. Read
`DEVELOPMENT_REPORT.md` for implementation and validation details and
`docs/REQUIREMENT_COVERAGE.md` for the requirements ledger.


Current appearance and AI configuration: [Cream & Brown and automatic OpenRouter fallback](docs/THEME_AND_AI_ROUTING.md). This documents provider order, cooldowns, token limits, and the separate Gemini grounding/embedding requirements.
