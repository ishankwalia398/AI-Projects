# Migration 002 — Amber Desk

Historical migration: `app.db.migrate()` changes the `design` field of existing preference records to `amber`, preserving all target titles, countries and other preferences. It records schema version 2. The preferences API still accepts this legacy ID. As of 2026-10-27, the selected **Cream & Brown** theme is rendered for this ID for both new and existing accounts; no data migration is needed for the palette update. See [current theme and routing](../../docs/THEME_AND_AI_ROUTING.md).

This idempotent data migration runs with the existing migration command before application startup. It does not alter resumes, profiles, jobs, applications or generated documents. No schema column changes are required.
