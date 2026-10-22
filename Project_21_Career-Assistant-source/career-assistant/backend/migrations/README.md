# Schema migration 001

`python -c "from app.db import migrate; migrate()"` applies the initial SQLAlchemy schema transactionally and records version 1 in `schema_versions`. It creates users, sessions, password_reset_tokens, records, files, tasks, rate_limits and schema_versions; tenant foreign keys cascade and record keys have tenant-scoped uniqueness constraints.

The initial migration is additive and idempotent. It does not implement alterations of an existing deployed schema. Before a future schema change, add a numbered, reviewed migration with backup/rollback instructions; `create_all` cannot migrate existing columns. Run migrations once before launching multiple API/worker processes. SQLite is a local development option only.

Migration 002 normalizes all existing appearance preferences to Amber Desk without changing search preferences. See `002_amber_desk.md`.
