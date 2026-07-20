# QABuddy.AI — Master Build Prompt

## 0. Mission Statement

Build **QABuddy.AI** — a multi-source, hybrid-RAG chatbot for a QA organization. It answers any question about the team's Selenium/Playwright frameworks, 5,000-row test case bank, JIRA bug history, PRDs/SRS/BRD/FRD, meeting notes, Jenkins logs, Figma/Lucid artifacts — and **every answer must cite its source** (file, line, ticket ID, or page). The app is **deployed on Vercel** using a Vercel token I will provide.

Primary users: QA engineers, SDETs, QA leads, new joiners.

Primary use cases (priority order):
1. Instant knowledge lookup ("What is KAN-1002 and why is it still flaky?")
2. Test-failure / RCA analysis from Jenkins logs
3. Test-case & Test-Plan review, gap/missing-coverage identification
4. RTM generation, bug triage support
5. Framework-level coding help (Selenium/Playwright), doubt-busting
6. Long-term: raise automation coverage from ~30–40% (code-gen only) to 70–80% (code-gen + RAG + JIRA context)

## 1. Required Deliverables

### A — Application UI (must match reference screenshot)
- Top bar: 🤖 "QABuddy.AI" + "HYBRID RAG FOR QA" subtitle, pipeline label `understand → retrieve → rerank → answer with sources`, "architecture" link, "online" status dot.
- Left sidebar "KNOWLEDGE BASE": checklist of 10 sources, each with colored dot + name + item-count subtitle + chunk count + caret. Below: total chunk count, "all/none" toggles, MODE dropdown, INGEST button.
- Main hero panel "HOW THE ANSWER IS FETCHED": 4 numbered cards — Understand, Search, Rank, Answer.
- Suggested-prompt chips below the hero card.
- Bottom composer: "Ask anything — tests, bugs, frameworks, failures, docs…" + send button + hint text.
- Footer: `llm openai/gpt-oss-120b`, `embed BAAI/bge-m3`.
- Warm cream background, terracotta accent, hairline borders, small-caps labels, responsive, keyboard-accessible.
- Built as a **Next.js app** (App Router) so it deploys natively to Vercel.

### B — Flow Diagram
Mermaid + exported SVG/PNG covering:
1. **Query-time:** Question → Understand/Rewrite → Parallel Search (Dense + BM25) → Merge → Cross-Encoder Rerank → Context Assembly → LLM Answer with Citations.
2. **Ingestion-time:** 10 source folders + JIRA MCP (JQL) → Loader/Parser → Chunker → Embedding → Vector DB upsert + Metadata store → hourly cron (Phase 1) → webhook/file-watcher (Phase 2).

### C — Architecture HTML Page (`architecture.html`, also served as a route in the Next.js app)
1. How We Built the Backend (ingestion, chunking, embedding/indexing, retrieval, reranking, generation, JIRA MCP integration).
2. Overall Architecture (embedded diagrams from B + component/deployment topology, including the Vercel + external-services split).
3. Technologies & Implementation Details (stack table with justification per choice).

## 2. Folder Structure (Phase 1)

```
qabuddy-ai/
├── app/                       # Next.js App Router
│   ├── page.tsx               # main chat UI (Deliverable A)
│   ├── architecture/page.tsx  # Deliverable C
│   └── api/
│       ├── chat/route.ts      # retrieval + generation endpoint
│       ├── ingest/route.ts    # manual/triggered ingestion endpoint
│       └── cron/route.ts      # hourly re-ingestion (Vercel Cron target)
├── knowledge_base/
│   ├── 01_selenium_framework/
│   ├── 02_playwright_framework/
│   ├── 03_test_cases/
│   ├── 04_jira_tickets/
│   ├── 05_company_docs/
│   ├── 06_figma_designs/
│   ├── 07_meeting_notes_transcripts/
│   ├── 08_lucid_charts/
│   ├── 09_prd_srs_brd_frd/
│   └── 10_jenkins_logs/
├── lib/
│   ├── retrieval/             # hybrid search, reranker, context assembler
│   ├── ingestion/              # loaders, chunkers, embedding jobs
│   └── clients/                # Qdrant, Postgres, LLM, JIRA MCP clients
├── diagrams/                   # Deliverable B (mermaid + exported images)
├── vercel.json                 # cron schedule + function config
└── .env.local                  # API keys/URLs (never commit)
```

## 3. The 10 Knowledge Sources

| # | Source | Notes |
|---|--------|-------|
| 1 | Selenium framework | github.com/PramodDutta/ATB13xSeleniumAdvanceFramework |
| 2 | Playwright framework | github.com/PramodDutta/Advance-Playwright-Framework |
| 3 | Test cases | 5,000 rows, CSV/XLSX |
| 4 | JIRA tickets | via JIRA MCP + user-supplied JQL |
| 5 | Company docs | PDF / MD |
| 6 | Figma designs | Phase 2 |
| 7 | Meeting notes / recordings | transcribed to text first |
| 8 | Lucid charts | exported to text/description |
| 9 | PRD / SRS / BRD / FRD | PDFs |
| 10 | Jenkins logs & results | build logs |

## 4. Recommended Tech Stack

> **Note on Vercel:** Vercel hosts the frontend and serverless/edge functions, but it cannot run stateful, long-lived services (a vector DB, a Postgres instance, or a self-hosted LLM). Those layers must be **managed/hosted externally** and called over HTTPS from Vercel functions.

| Layer | Choice | Hosted where | Why |
|---|---|---|---|
| Frontend + API | Next.js (App Router) | **Vercel** | Native fit, zero-config deploys via Vercel token/CLI. |
| Embedding model | BAAI/bge-m3 | External inference endpoint (e.g. a small GPU box, or a hosted embeddings API) | Multilingual, 8k-token context, dense+sparse+ColBERT in one model. Too heavy to run inside a Vercel function. |
| Vector database | Qdrant | **Qdrant Cloud** (managed) | Same engine as before, but accessed via URL + API key from Vercel — no server to run yourself. |
| Keyword search | BM25 (Qdrant sparse vectors) | Same Qdrant Cloud instance | Exact-match recall for ticket IDs, exceptions, method names. |
| Reranker | BAAI/bge-reranker-v2-m3 | Same external inference endpoint as embeddings | Cross-encoder reorders merged candidates before the LLM context. |
| LLM | gpt-oss-120b | Hosted inference (e.g. Together.ai, Groq, Fireworks, or your own vLLM box) via OpenAI-compatible API | Too large for serverless; called from Vercel functions over HTTPS. |
| Metadata store | Postgres | **Neon** or **Supabase** (both have generous free tiers and work great with Vercel) | Tracks source path, ticket ID, line ranges, timestamps for citations. |
| Ingestion orchestration | Vercel Cron (hourly) triggering `app/api/cron/route.ts`, which calls the ingestion library | **Vercel** (trigger) + external compute if a job is long-running | Vercel Cron is free/simple for Phase 1; heavy batch embedding jobs can be offloaded to a queue/worker if they exceed the function time limit. |
| JIRA integration | JIRA MCP + JQL, called from the cron/ingest route | Vercel function → external JIRA | Pulls tickets hourly, normalizes, chunks, embeds, upserts. |

**Chunking rules (unchanged):**
- Code (Selenium/Playwright) → chunk by function/class, ~300–500 tokens, 15% overlap
- Test case CSV/XLSX → 1 chunk per ~10-row group, header repeated
- JIRA tickets → 1 chunk per ticket, split if >800 tokens
- PDFs (PRD/SRS/BRD/FRD, company docs) → ~500 tokens, 50–75 token overlap, split on headings first
- Meeting notes/transcripts → ~600 tokens by speaker-turn boundary, 100 token overlap
- Jenkins logs → chunk by build/stage boundary, ~400 tokens

## 5. Vercel Deployment

- I will provide a **Vercel token** (as `VERCEL_TOKEN`). Use it to deploy non-interactively via the Vercel CLI (`vercel deploy --token=$VERCEL_TOKEN --prod`) or the Vercel REST API — do not ask me to log in interactively.
- All secrets (Qdrant URL/API key, Postgres connection string, LLM API key/endpoint, JIRA MCP credentials, JQL) go into **Vercel Environment Variables**, set via `vercel env add` or the API — never hard-coded or committed.
- Add a `vercel.json` with:
  - A **cron entry** for hourly ingestion: `{"crons": [{"path": "/api/cron", "schedule": "0 * * * *"}]}`
  - Function `maxDuration` tuned for the ingestion route (Vercel Pro allows longer timeouts than Hobby — flag if we need to upgrade the plan for large batch embedding runs).
- Confirm the project's Vercel plan tier before relying on cron + long function durations, since the Hobby tier has stricter limits than Pro.
- After first deploy, share the resulting production URL and a short deploy log summary.

## 6. Phase Plan

- **Phase 1:** Manual folder drop-in for all 10 sources, Next.js app deployed to Vercel, hourly Vercel Cron re-ingestion against external Qdrant/Postgres/LLM, working chat UI, flow diagram, architecture page.
- **Phase 2:** Real-time auto-ingestion (repo webhooks, JIRA webhooks, Figma sync) triggering Vercel API routes directly instead of waiting for the hourly cron.

## 7. Acceptance Criteria

- [ ] UI visually matches the reference screenshot
- [ ] Every answer includes at least one inline citation resolving to a real source chunk
- [ ] Flow diagram exists as editable Mermaid + rendered image, covering both flows
- [ ] `architecture.html`/`architecture` route covers backend build, architecture (with diagram embedded, showing the Vercel + external-services split), and tech stack
- [ ] All 10 knowledge-base folders exist and are wired into ingestion, even if empty at first
- [ ] App deploys successfully to Vercel using the supplied token, with all secrets in Vercel env vars
- [ ] Vercel Cron triggers hourly ingestion and updates sidebar chunk counts