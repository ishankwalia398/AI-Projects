# QABuddy.AI - Setup & Run Guide

## What You Need Before Starting

| Account | Why | Link |
|---------|-----|------|
| Vercel | Hosts the frontend & API | Already deployed |
| Groq | LLM API for AI answers | https://console.groq.com |
| Qdrant Cloud | Vector database for search | https://cloud.qdrant.io |
| Neon Postgres | Metadata & citation tracking | https://neon.tech |

---

## ✅ Setup Status: COMPLETE

All environment variables have been pushed to Vercel and the app has been redeployed.

**Current Status:**
- ✅ Vercel app deployed
- ✅ All API keys configured (Qdrant, Groq, Neon Postgres)
- ⚠️ App requires Vercel login to access (see Step 6 below)

---

## Step 1: Get Your API Keys (Already Done)

Your `.env` file already contains:
- Qdrant Cloud URL + API Key
- Groq API Key
- Neon Postgres connection string

---

## Step 2: Add Environment Variables to Vercel (Already Done)

All env vars have been pushed to Vercel production:
- `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION`
- `GROQ_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_PROVIDER`
- `POSTGRES_URL`

The app has been redeployed with these variables.

---

## Step 3: Initialize the Database

The database tables will be auto-created on first API call. You can verify by visiting:

```
https://app-qabuddy-nyo1gnnuj-ishank-w-project.vercel.app/api/health
```

**Note:** If you see a Vercel login page, see Step 6 below.

---

## Step 4: Ingest Your Data

Trigger ingestion to populate the vector database:

```bash
curl -X POST https://app-qabuddy-nyo1gnnuj-ishank-w-project.vercel.app/api/ingest
```

This processes:
- Selenium framework code (cloned from GitHub)
- Playwright framework code (cloned from GitHub)
- Sample test cases, company docs, meeting notes, Jenkins logs

**Takes:** 5-10 minutes first time.

---

## Step 5: Test the App

1. Open: https://app-qabuddy-nyo1gnnuj-ishank-w-project.vercel.app
2. Type a question, e.g.:
   - "How does the Selenium framework handle waits?"
   - "Generate test cases for guest checkout"
   - "Why did Jenkins build 452 fail?"
3. You should get an answer with numbered citations like `[1]`, `[2]`
4. Click citation numbers to see source details

---

## Step 6: Verify Health

```bash
curl https://app-qabuddy-nyo1gnnuj-ishank-w-project.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "qdrant_connected": true,
  "collection_exists": true,
  "llm_provider": "groq",
  "llm_ready": true
}
```

---

## ⚠️ Important: Vercel Login Required

**Current Issue:** The app is currently redirecting to a Vercel login page when accessed publicly. This is because the project is under a team account that requires authentication.

### To Fix This:

**Option 1: Access via Vercel Dashboard (Immediate)**
1. Go to https://vercel.com/dashboard
2. Log in with your account
3. Find the project `app-qabuddy-ai`
4. Click the deployment URL to access it

**Option 2: Make Project Public (Recommended)**
1. Go to https://vercel.com/dashboard
2. Select the `app-qabuddy-ai` project
3. Go to **Settings** → **General**
4. Under **Project Protection**, set to **Public**
5. Save and redeploy

**Option 3: Add Custom Domain**
1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Configure DNS as instructed
4. The custom domain will be publicly accessible

---

## Architecture

```
User → Vercel (Next.js App)
              ↓
        API Routes (/api/chat)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Qdrant Cloud      Groq API
(Vector DB)       (LLM)
    ↓
Neon Postgres
(Metadata)

**Live URL:** https://app-qabuddy-nyo1gnnuj-ishank-w-project.vercel.app
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Failed to fetch" in chat | Backend env vars not set. Check Vercel dashboard. |
| Vercel login page appears | Project is set to private. Make it public in Vercel settings or log in. |
| Qdrant connection error | Check `QDRANT_URL` has `https://` and `QDRANT_API_KEY` is correct. |
| Ingestion fails | Check Vercel function logs. May need longer timeout (Pro plan). |
| No citations in answers | Ingestion didn't run. Re-run Step 4. |
| "No response generated" | Groq API key invalid or rate-limited. Check console.groq.com. |

---

## Project Structure

```
qabuddy-ai/
├── app/
│   ├── page.tsx              # Main chat UI
│   ├── architecture/         # Architecture documentation page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Styles
│   └── api/
│       ├── chat/route.ts     # Chat endpoint
│       ├── ingest/route.ts   # Manual ingestion
│       ├── cron/route.ts     # Hourly cron (daily on Hobby)
│       ├── health/route.ts   # Health check
│       └── stats/route.ts    # Stats endpoint
├── lib/
│   ├── clients/              # Qdrant, Postgres, LLM clients
│   ├── retrieval.ts          # Hybrid search + reranker
│   ├── ingestion.ts         # Data loaders + chunkers
│   └── llm.ts               # LLM prompt + generation
├── knowledge_base/           # 10 source folders
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
├── diagrams/                 # Mermaid flow diagrams
├── vercel.json              # Cron config + function timeouts
└── .env.local.example       # Environment variable template
```

---

## Next Steps

1. **Add JIRA integration** — Set `JIRA_URL`, `JIRA_USER`, `JIRA_TOKEN` in Vercel env vars
2. **Add more test cases** — Drop CSV/XLSX files into `knowledge_base/03_test_cases/`
3. **Add PRD/SRS docs** — Drop PDFs into `knowledge_base/09_prd_srs_brd_frd/`
4. **Re-ingest after adding files** — Run Step 4 again
5. **Upgrade to Vercel Pro** — For hourly cron jobs (daily on Hobby)
