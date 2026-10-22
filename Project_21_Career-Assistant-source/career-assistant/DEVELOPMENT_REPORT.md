# Development report — 22 October 2026

**Delivered:** a substantial, runnable local implementation and source package. **Not delivered:** a verified complete production application. The original production definition of done has not been met. The Vercel frontend and API proxy are deployed at the requested URL, but no backend service has been provisioned or connected yet.

## What is implemented

- React/Vite/TypeScript light-mode UI with Domestic Jobs, Visa Sponsored Jobs, Interview Questions, Resume library, Candidate profile and Settings; the Amber Desk preview and an offline HTML comparison.
- Email/username/password registration, username/password login, Argon2id, hashed session/reset tokens, HttpOnly cookies, CSRF/origin enforcement, atomic persistent rate limits, session expiry/logout, one-time reset-mail adapter and tenant authorization.
- Validated PDF/DOCX uploads, private original storage, Markdown extraction, optional quote-grounded AI profile extraction, conservative offline extraction, profile review/approval, resume versions and diffs, content deduplication and overlapping experience calculations with explicitly tagged domain/technology totals.
- Qdrant indexing/retrieval adapter, per-user/model/hash embedding cache, namespace/version filtering and labelled lexical-only behavior when services are missing.
- Greenhouse/Lever official public-board adapters, manual listings, evidence/time fields, conservative sponsorship filtering, explainable weighted matches, deduplication, all required job columns/statuses, comments, multiple attachments, sorting/filters, 30-row pagination and 60-day active-result retention with history preserved.
- Bulk application preparation and dark-red invalid-row borders. External employer application plus separately labelled user receipt tracking. Optional employer-authorized Greenhouse connector rechecks the published form, requires explicit user consent, supports standard fields and current approved documents, and updates APPLIED only on an explicit success response. Unknown outcomes block duplicate retries.
- LangGraph generation/validation, configurable primary/fallback JSON-compatible models, saved resume/cover-letter text, review/edit/approval, edit version preservation and on-demand DOCX/PDF/LaTeX/ZIP rendering without AI format-conversion calls.
- Technical 12-category/36-question and HR 15-category/90-question generation pipelines, five mandatory HR groups, coded-answer/SQL/follow-up schemas, batch caching, preparation plans, guide Q&A tables, mock-round material/self-score sessions and saved-guide exports.
- Private disk/S3 adapter, authenticated temporary downloads, 24-hour expiry, minute-based worker cleanup, original/attachment preservation, local temporary orphan cleanup, expired metadata cleanup and regeneration from permanent text.
- Initial relational schema migration, Dockerfile/Compose, environment template, npm dependency lock and Windows Python dependency snapshot, README, Architecture, complete original specification and a ledger of all 72 non-negotiable requirements.

## Verification

| Check | Observed result |
| --- | --- |
| Backend pytest suite | 59 passed. Includes authentication, invalid inputs, password-reset single-use/revocation with mocked SMTP, sessions, CSRF, isolation, resume parsing/versioning, experience, matches, sponsorship, retention, attachments, partial bulk validation, content caching/review/rendering/expiry/cleanup, failover, discovery adapters, interview batching/cache, connector success/unknown-outcome duplicate protection, inline-worker lifecycle, production storage validation, and R2 upload compatibility. |
| Qdrant integration in tests | Actual Qdrant in-memory client; synthetic vectors. Tenant/version filters and embedding reuse passed. Local mode warns that payload indexes have no effect; hosted index behavior remains untested. |
| Frontend Node tests | 11 passed, including API proxy request, cookie, and error handling. |
| TypeScript and Vite production build | Passed; final asset sizes are available in the build output. |
| Local API | Started successfully; health endpoint returned HTTP 200. |
| Browser | Real local QA-account login, authenticated empty workspace, interview navigation and 390px mobile rendering checked. Fixed a localhost/127.0.0.1 origin mismatch found during browser testing. Screenshots supplied. |
| Parsing/rendering | PDF/DOCX text extraction, DOCX ZIP integrity, readable PDF parsing, LaTeX escaping, ZIP members and expiry/regeneration tested. No claim of TeX compilation or executing generated interview coding answers. |
| Live integrations | No real PostgreSQL, hosted Qdrant, embedding/LLM, S3, SMTP or employer-submission acceptance established. AI/source/mail/submission tests use explicit synthetic fixtures. |

The suite is a meaningful local regression suite, not complete coverage of every scenario in the master specification. A free-tier Render trial Blueprint now combines the FastAPI service and queue worker, uses free PostgreSQL, and requires private S3-compatible storage such as Cloudflare R2. The free database expires after 30 days and the web service may sleep; this is not production-durable. Security/load/concurrency audits, model fact accuracy, real international job eligibility, generated guide quality and full production acceptance remain outstanding.

## Deployment status

The Vercel frontend and same-origin API proxy are deployed at
`https://jobsearchandtracker.vercel.app`. The proxy returns HTTP 503 with an
explicit configuration message until `CAREER_API_URL` is set in Vercel.

`render.yaml` defines a free-tier trial: one Render free web service runs both
FastAPI and the inline queue worker, backed by free Render PostgreSQL. Private
Cloudflare R2 storage is required for production-mode startup so user files are
not written to Render's ephemeral filesystem. No Render services have been
created yet; the user must create the Blueprint and supply R2 credentials. The
free database expires after 30 days and has no backup, and the web service can
sleep. This trial is not production-durable.

## Known limitations and next required work

1. Create the Render Blueprint, configure R2, set `CAREER_API_URL` in Vercel, then run live registration and workflow acceptance. Do not share credentials in source or chat; use provider secret settings.
2. Extend discovery beyond configured Greenhouse/Lever boards through permitted integrations. Current title/country suggestions are inferred, not verified worldwide market research. No live company interview-pattern research is supplied.
3. Improve semantic JD/eligibility/seniority analysis, near-duplicate reconciliation, country coverage and sponsorship language validation. Current weighted fit is a heuristic, never a hiring probability.
4. Benchmark chunking/retrieval, model factuality, latency/cost and real interview content. Plans/question counts are structurally validated; all requested mock-round depth and answer timing are not guaranteed by structural checks.
5. Add OCR/malware scanning, distributed worker lease/heartbeat recovery, production load/security audits, full domain-specific relational constraints and a migration chain for future alterations. Account deletion across SQL/vector/object storage is not transactional.
6. Expand submission integrations only where authorized employer credentials/form support exist. Custom answers and legal consent remain external; no CAPTCHA bypass or speculative retries are implemented.
7. Validate all document layouts/fonts with real resumes/guides, compile TeX if required, and add S3 orphan inventory cleanup. Rendering is tested locally; generated PDFs do not currently use LaTeX as an intermediate.

The user selected Amber Desk. It is applied throughout the app. All other theme implementations, comparison options and the theme picker have been removed. Migration 002 updates existing preferences while preserving search settings. Source is maintained in the `ishankwalia398/AI-Projects` GitHub repository.


Final appearance: **Amber Desk only**. All alternative theme assets and switching controls are removed. Preference data migration 002 preserves existing search settings.
