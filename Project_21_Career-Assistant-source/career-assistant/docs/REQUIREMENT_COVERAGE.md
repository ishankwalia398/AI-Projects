# Requirement coverage

This is a traceability ledger, not a production-completion claim. Original wording is preserved below. **Implemented/local** means code and relevant local checks; **Configured integration** means provider-backed code still requires real credentials/services; **Partial** identifies remaining work; **Blocked** identifies an external execution constraint.

| ID | Original non-negotiable requirement | Status | Evidence / limitation |
| --- | --- | --- | --- |
| 1 | Preserve the Career Assistant name. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 2 | Registration requires Email, Username and Password only. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 3 | Login requires Username and Password. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 4 | Implement secure password recovery. | Configured integration | SMTP adapter tested with a fixture; no actual mail provider configured. |
| 5 | Enforce user-specific data isolation. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 6 | Accept PDF and Word resumes. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 7 | Convert resumes into Markdown. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 8 | Extract verified professional profiles. | Partial | Conservative extraction plus optional exact-quote AI extraction; manual review required. |
| 9 | Build persistent RAG knowledge. | Configured integration | Qdrant adapter and in-memory tenant/version tests; no hosted vector/embedding validation. |
| 10 | Support incremental resume updates. | Partial | Version/text dedup and line diff implemented; complete semantic contradiction resolution needs review. |
| 11 | Prevent duplicate embeddings. | Partial | Per-user/model/hash cache tested with in-memory Qdrant and synthetic vectors; no retrieval benchmark. |
| 12 | Provide Domestic Jobs. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 13 | Provide Visa Sponsored Jobs. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 14 | Provide Interview Questions. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 15 | Discover relevant job titles. | Configured integration | Saved AI title suggestions, not verified current market-title research. |
| 16 | Search current job opportunities. | Configured integration | Configured Greenhouse/Lever adapters; broad market search and real source deployment unverified. |
| 17 | Verify company listings where possible. | Configured integration | Official ATS publication evidence only; no company-site cross-source reconciliation. |
| 18 | Preserve clearly labeled third-party-only listings. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 19 | Require explicit sponsorship evidence for visa-sponsored jobs. | Partial | Explicit sponsorship sentences with negative/conditional exclusions; linguistic heuristics need broader validation. |
| 20 | Generate explainable CV-to-JD matching scores. | Partial | Weighted explainable heuristic; full semantic requirement/seniority/eligibility extraction unfinished. |
| 21 | Merge old and new jobs. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 22 | Remove duplicate listings. | Partial | Requisition/identity/canonical URL dedup; complex cross-source matching remains partial. |
| 23 | Preserve all required job table columns. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 24 | Support manual sorting and filtering. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 25 | Use 30-row pagination. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 26 | Apply 60-day active-job retention. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 27 | Preserve all required application statuses. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 28 | Support multiple job attachments. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 29 | Generate ATS-compatible resumes. | Configured integration | Grounded generation prompts and review workflow; real model factual/ATS quality not verified. |
| 30 | Generate tailored cover letters. | Configured integration | Provider-backed prompts and human review; live output length/quality unverified. |
| 31 | Preserve LaTeX output. | Implemented/local | Escaped LaTeX source delivered; PDF rendering is direct, TeX compilation not tested. |
| 32 | Support Word, PDF and ZIP downloads. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 33 | Store generated resume content in PostgreSQL. | Configured integration | JSON/Markdown relational storage and PostgreSQL driver/schema supplied; execution tests use SQLite. |
| 34 | Store generated cover letter content in PostgreSQL. | Configured integration | Same storage/verification boundary as generated resumes. |
| 35 | Store generated interview content in PostgreSQL. | Configured integration | Structured guides persist; full category pipeline tested with explicit fixtures, not a live LLM. |
| 36 | Generate binary files only when needed. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 37 | Avoid repeat LLM calls for file-format conversion. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 38 | Automatically expire temporary generated binaries after 24 hours. | Partial | 24-hour expiry plus minute-based worker cleanup tested; deployment scheduler not running remotely. |
| 39 | Keep original uploaded documents and attachments. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 40 | Preserve permanent user and application data on logout. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 41 | Support regeneration from stored content. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 42 | Secure temporary downloads. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 43 | Support bulk job selection and submission. | Partial | Bulk preparation and optional employer-authorized Greenhouse submission; employer keys unavailable and custom forms fall back externally. |
| 44 | Validate mandatory attachments. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 45 | Highlight invalid rows with dark red borders. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 46 | Update APPLIED only after verified submission. | Partial | Only explicit connector success updates APPLIED automatically; user-receipt tracking is separately classified. |
| 47 | Preserve application history. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 48 | Generate comprehensive technical questions and answers. | Configured integration | 36-question, 12-category pipeline tested with fixtures; actual model quality not established. |
| 49 | Include coding solutions. | Configured integration | Complete coding-field schema validated; generated code is never falsely claimed executed. |
| 50 | Include architecture and troubleshooting scenarios. | Configured integration | Category prompts/schema exist; real scenario depth requires provider acceptance tests. |
| 51 | Generate comprehensive HR questions and answers. | Configured integration | 90-question HR pipeline tested with fixtures; no live personalized quality check. |
| 52 | Preserve all five mandatory HR question groups. | Configured integration | All five groups requested, with required variants; exact timing quality remains unverified. |
| 53 | Generate STAR examples. | Configured integration | STAR data requested and hypothetical cases labelled; real output not verified. |
| 54 | Generate mock interviews. | Removed by user request (2026-10-25) | Mock interview and skills/research views are no longer exposed. |
| 55 | Generate interview preparation plans. | Configured integration | Seven-day plans are available for each saved batch and category. 14/30-day options removed by user request (2026-10-25). |
| 56 | Display interview questions and answers in tables. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 57 | Support Word and PDF interview-guide exports. | Configured integration | Guide rendering pipeline implemented; live AI guide layout/depth not validated. |
| 58 | Use React and Vite. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 59 | Use Python. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 60 | Use a suitable free or free-tier vector database. | Configured integration | Qdrant code/deployment config; no cloud service provisioned. |
| 61 | Support configurable primary and fallback LLMs. | Configured integration | Configurable Gemini Flash / Flash-Lite with OpenRouter Mistral Small 3.2 fallback; bounded retries and cooldowns. |
| 62 | Optimize token usage and latency. | Partial | Hash/batch caches and bounded fallback; no production cost/latency/load benchmarks. |
| 63 | Use light-mode UI only. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 64 | Provide three UI design previews. | Implemented/local | Design alternatives were presented; the user selected Cream & Brown and explicitly requested removal of the others. The final app retains only Cream & Brown. |
| 65 | Protect private data and credentials. | Partial | Core session/CSRF/isolation/private-file controls tested; full security audit and operational hardening outstanding. |
| 66 | Maintain README.md. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 67 | Maintain Architecture.md. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 68 | Update related files after changes. | Implemented/local | See README, Architecture, source modules and automated/local browser checks; production acceptance remains required. |
| 69 | Deploy the frontend to the requested Vercel URL. | Not in selected local setup | The user selected local-only personal use. The existing static Vercel site, if still available, has no connected backend; deployment files and helper were removed from this source project. |
| 70 | Never fabricate candidate facts, job listings, sponsorship evidence or application submission results. | Partial | No fabricated live data or success; model factuality and heuristic sponsorship still require review/validation. |
| 71 | Never conceal unfinished integrations with mock success messages. | Implemented/local | Unavailable integrations return explicit errors or 503; no success fallback data. |
| 72 | Preserve all original core functionality. | Partial | Empty initial workspace; all source requirements preserved. Remaining gaps explicitly documented. |

## Additional gaps from detailed requirements

- No current worldwide research provider, credible interview-pattern research or verified international agency database. Suggestions are explicitly inferred.
- Experience totals and explicit domain/technology tags merge overlapping dated roles. Untagged attribution and ambiguous dates require user review.
- No OCR/malware scanning or measured chunk/retrieval quality. Oversized semantic sections remain intact rather than being token-split.
- Generic tenant JSON records replace the recommended fully normalized relational table set. Future schema alterations need a proper migration chain.
- Employer-authorized Greenhouse supports simple standard forms only. Extra questions/consent require external completion. No CAPTCHA bypass or speculative retries.
- No live PostgreSQL/Qdrant/S3/SMTP/AI connection acceptance, distributed load tests or continuous production worker/cleanup verification.
- Manual status APPLIED is retained as explicitly requested, separately labelled from verified connector submissions.
- No unsupported claim that the entire production definition of done has been reached.


## Task priorities, deletion and fresh-candidate reset

See [task progress and reset controls](TASK_PROGRESS_AND_RESET.md) for worker priorities, concurrent processing, approximate ETA, job deletion, transient notices, and the destructive `--keep-login` reset. Profile saves remain synchronous. These notes supersede older descriptions of a single sequential worker.

Live Google grounding and an actual LaTeX/Pandoc conversion path are now implemented. Local exports use `DOCUMENT_RENDERER=latex` with installed portable tools; older limitations stating that LaTeX is never compiled are superseded by the current task-progress/reset notes. Live grounding verification hit the Gemini project HTTP429 quota limit; no live research success is claimed for that check.


Current appearance and AI configuration: [Cream & Brown and automatic OpenRouter fallback](THEME_AND_AI_ROUTING.md). This documents provider order, cooldowns, token limits, and the separate live-search and embedding requirements.


Current interview/search behaviour: [On-demand answers and candidate-based discovery](ON_DEMAND_INTERVIEWS_AND_SEARCH.md). Questions are generated first; answers are saved on request until explicit logout and included in exports. Saved regional title/country suggestions constrain searches. Gemini grounding failures use the authorized OpenRouter/Exa fallback (one search per request).
