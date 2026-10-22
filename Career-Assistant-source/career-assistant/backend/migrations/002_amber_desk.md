# Migration 002 — Amber Desk

The selected Amber Desk appearance is now the only supported application theme. `app.db.migrate()` changes the `design` field of existing preference records to `amber`, preserving all target titles, countries and other preferences. It records schema version 2. New accounts default to Amber Desk; the preferences API accepts only `amber`.

This idempotent data migration runs with the existing migration command before application startup. It does not alter resumes, profiles, jobs, applications or generated documents. No schema column changes are required.
