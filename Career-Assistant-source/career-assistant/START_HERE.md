# Career Assistant — Amber Desk

Amber Desk is the only theme in this final package. All other theme options and the picker were removed. Existing accounts are migrated to the chosen appearance while retaining their search preferences.

This download contains frontend and backend source, a built frontend, tests, dependency manifests, environment examples, Docker configuration, migration instructions, documentation and the selected-theme preview.

1. Open `docs/Amber-Desk-preview.html` to see the chosen design.
2. Follow `README.md` to install dependencies and run the FastAPI API, background worker and React frontend.
3. Register your own account and upload your resume. No real credentials are included.
4. Configure the services you need using `.env.example`. AI, live sources, email and hosted infrastructure require their own credentials/configuration.

Validation: 56 backend tests and 7 frontend logic tests passed; TypeScript and the production frontend build passed. The built frontend is in `frontend/dist` and needs an HTTP server with the API proxy for integrated workflows.

Production deployment remains incomplete. Read `DEVELOPMENT_REPORT.md` for the exact integration/deployment limitations and `docs/REQUIREMENT_COVERAGE.md` for the complete requirements ledger. Selecting the final theme does not change those limits.
