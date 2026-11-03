# On-demand interview answers and candidate-based discovery

## Interview workflow

Technical and non-technical generation creates **questions only**. Each unanswered question
has an **Answer** button. Pressing it queues generation for that question alone. All other
Answer buttons are disabled while the request is being submitted or an answer task is queued
or running, including after refresh or reopening the page. The backend also serializes answer
requests per account, so separate tabs cannot start simultaneous answers.

Answers are saved in the interview guide in the database, not just browser memory. Closing
the page or app, refreshing, or logging in again does not clear them. Explicit **Logout** clears
generated answers, preserves questions, cancels queued/running answer work and expires cached
downloads. An in-flight provider call may finish and incur usage, but its late answer cannot be
saved after logout. Downloaded files already on your computer are not deleted.

PDF and Word exports include all questions as Q1, Q2, etc., and the answers generated so far.
Unanswered questions remain unanswered. Exports refresh after answers change and exclude model
and token metadata. Code/SQL answers include solutions; generated code is not executed by the app.

## Search scope

1. Approve the current candidate profile.
2. In Domestic Jobs, generate title suggestions. Discovery uses these titles for India.
3. In Visa Sponsored Jobs, generate titles and countries. Discovery pairs each region's titles
   with that region's recommended countries, rather than mixing all titles and all countries.
4. Find jobs. The resolved scope is used for web search, deterministic filtering and the supplied
   search-prompt review. Suggestions take precedence over unrelated general preferences.

Without saved suggestions, explicitly configured title/country preferences or the candidate's
designation can supply the scope. With no usable scope, the app asks for suggestions instead of
searching every role. Regenerate suggestions after changing the resume/profile to update the scope.

Title matching normalizes common QA/QE/SDET terminology and requires role-specific matches;
sharing a word such as “Manager” is insufficient. Country and sponsorship checks remain required.
AI-rejected listings are excluded from current results. Old automatically discovered jobs outside
the latest suggestion scope are hidden from the current list; manually saved jobs and tracking
history are preserved. A source outage is not reported as an empty successful search.

## Live research fallback

Gemini Search grounding is tried first. On quota/rate-limit, connection or provider failure,
OpenRouter's web-search tool uses **Exa** through the existing `OPEN_ROUTER_API_KEY` and configured
OpenRouter model. Failed providers cool down for `LLM_FAILURE_COOLDOWN_SECONDS` (default 300).
This does not change or bypass Gemini's quota.

The user authorized sending job title, up to 20 skills, and target titles/countries to OpenRouter
and Exa. Name, contact information and raw resume text are excluded. Each fallback request allows
**one search**, up to eight results, low search context and 3,000 output tokens. Exa search uses
OpenRouter credits in addition to model tokens. This is not a free Gemini quota workaround.

Only provider citation annotations count as live search evidence. Discovery then fetches the
cited pages and validates JobPosting data, or reads official Greenhouse/Lever detail APIs. Search
snippets and model prose are never saved as verified jobs. Search coverage is bounded; the app
cannot guarantee a matching live sponsored vacancy in every suggested country. If both search
providers fail, reachable employer boards and candidate-based suggestions still work, with a clear
limited-coverage notice. Embeddings remain on the configured Gemini integration.

Reference: [OpenRouter web-search tool](https://openrouter.ai/docs/guides/features/server-tools/web-search).

## Validation — 2026-10-27

- Full backend regression: 164 passed, one skipped. Eleven focused checks passed after the
  final profile-signature and country-precedence changes, including one additional regression test.
- Frontend: 16 tests passed; production build passed.
- Synthetic live OpenRouter/Exa query: eight cited sources. A separate single-request discovery
  check fetched three structured live postings, two matching the synthetic India/QA title scope.
  These were verification checks only; no jobs or candidate data were written to the user's account.
- Lifecycle checks cover exported answers, refresh/re-login persistence, logout clearing,
  failure recovery, and rejecting late answer writes after logout.
