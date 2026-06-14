# AIJobtracker — Project Build Brief

> Hand this file to Claude (or Claude Code) as-is. It contains the full approved plan,
> tech decisions, feature list, data model, and AI integration details for building
> "AIJobtracker" from scratch. Treat everything below as **already approved** — start
> scaffolding the project, then build feature by feature, checking in with progress
> as you go rather than dumping everything at once.

---

## 1. Project Overview

**Name:** AIJobtracker

**What it is:** A premium, production-quality Job Application Tracker — an AI-enhanced
evolution of this reference app: https://jobtracker-ai-akila.vercel.app/
(source: https://github.com/Akila-iyer/jobtracker-ai-akila)

**Goal:** A publicly deployable (Vercel) web app with user authentication (Email/Password and Google OAuth),
where user data can be managed and synced across devices (or kept local, pending final DB decision), enhanced with
AI features powered by Grok (xAI).

---

## 2. Tech Stack (FINAL — approved)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Storage | IndexedDB via `idb`'s `openDB` (or Supabase Postgres, pending decision) |
| Auth | **Supabase Auth** (Email/Password + Google OAuth) |
| Drag & drop | `@dnd-kit` |
| Charts | Recharts |
| AI Provider | **Grok (xAI API)** — OpenAI-compatible endpoint `https://api.x.ai/v1`, called server-side via Next.js API routes. API key stored as `XAI_API_KEY` env var (never exposed client-side) |
| Deployment | Vercel |

**Important decisions made during planning:**
- Authentication has been added (Email/Password + Google OAuth) using **Supabase Auth**.
- The database layer was originally IndexedDB. With Auth added, we will either migrate to Supabase Postgres for cross-device sync or keep IndexedDB for local-only data tied to the login.
- AI provider was originally planned as Anthropic Claude, then **switched to Grok
  (xAI)** — use the OpenAI-compatible client pointed at `https://api.x.ai/v1`.

---

## 3. Feature Set (FINAL — approved)

### Auth
- **Supabase Auth**: Users can register and log in using Email/Password or an existing Google account.

### Views / Pages
- **Dashboard** — stat cards (total apps, response rate, interview rate, offers,
  avg days to response/offer), charts (status distribution, applications by month,
  interview funnel), monthly goal tracker, activity feed, AI Insights panel
- **Kanban Board** — drag & drop across 6 columns: Wishlist, Applied, Follow-up,
  Interview, Offer, Rejected. Priority badges (Urgent/High/Medium/Low). Company
  avatars (auto-generated colored initials)
- **List/Table view** — sortable columns; search across company/role/notes/recruiter/
  interviewer/source; filters by status, priority, tags, date range, source
- **Calendar view** — interview dates and follow-up reminders shown on a calendar
- **Analytics page** — resume performance tracking, source effectiveness, deeper
  charts/trends
- **Settings** — dark mode toggle, monthly goal config, import/export, AI key status

### Per-Application Data Fields
- Company, Role, JD link, Location, Salary, Applied date
- Status (6-column pipeline), Priority (Urgent/High/Medium/Low)
- Tags/labels (free-form)
- Resume reference / notes
- Recruiter, Source, Referral, Application ID (QA fields)
- Interview tracking: date, time, mode, meeting link, interviewer, round
  (HR/Technical/Manager/Director/Final)
- Status Timeline — auto-logged history of status changes with timestamps
- Activity log entries (audit trail)
- Created/Updated timestamps

### Productivity Features
- Follow-up reminder badges (overdue / due soon)
- Monthly application goal tracker
- Tags & advanced filtering
- JSON & CSV import/export
- Dark mode (persisted via localStorage)
- Fully responsive (desktop, tablet, mobile)
- Sample/demo data seeding option (like reference app's 15 sample jobs)

### AI Features (powered by Grok via `/api/ai/*` server routes)
1. **AI Readiness Score** — 0–100 score based on application data completeness +
   activity patterns, with actionable improvement suggestions
2. **AI Cover Letter / Outreach Generator** — input: JD text + user's resume text →
   output: tailored cover letter or LinkedIn outreach message
3. **Resume–JD Match Score** — compares resume text vs JD, returns match %, missing
   keywords, and improvement tips
4. **AI Insights Panel** (on Dashboard) — analyzes the user's overall pipeline and
   surfaces patterns/recommendations (e.g., "you apply mostly to X but get more
   interviews for Y — consider focusing there")

---

## 4. Data Model (IndexedDB via `idb`/`openDB`)

Mirror the structure below as IndexedDB object stores:

- **applications** (primary store)
  - id, company, role, jdLink, location, salary, status, priority, tags[],
    appliedDate, resumeRef, notes, recruiter, source, referral, applicationId,
    createdAt, updatedAt
- **statusTimeline**
  - id, applicationId, status, changedAt
- **interviews**
  - id, applicationId, date, time, mode, link, interviewer, round
- **activityLog**
  - id, applicationId (nullable), action, createdAt
- **settings** (single-record store)
  - darkMode, monthlyGoal, etc.

---

## 5. Route Structure

```
/                  → Dashboard (default landing)
/login             → User Login (Email/Google)
/register          → User Registration
/board             → Kanban board
/applications      → List/table view
/applications/[id] → Detail/edit view (modal or page)
/calendar          → Calendar view
/analytics         → Analytics page
/settings          → Settings (dark mode, goals, import/export, account)

/api/ai/cover-letter     → Grok-powered cover letter/outreach generator
/api/ai/match-score      → Grok-powered resume-JD match scoring
/api/ai/insights         → Grok-powered pipeline insights
/api/ai/readiness-score  → Readiness score (can be computed locally + AI-enhanced)
```

---

## 6. Build Order (suggested)

1. Scaffold Next.js 14 + TS + Tailwind + shadcn/ui project
2. Set up Supabase Auth and protected routes
3. Define TypeScript types + Database schema (IndexedDB or Supabase Postgres)
4. Build layout/navigation (sidebar, dark mode toggle, responsive shell, user profile)
5. Build Dashboard (stat cards, charts, activity feed, goal tracker)
5. Build Kanban board (drag & drop, columns, job cards, priority badges)
6. Build List/table view (search, filters, sort)
7. Build Application detail/edit modal (full data fields, timeline, interviews,
   activity log)
8. Build Calendar view
9. Build Analytics page
10. Add Import/Export (JSON & CSV)
11. Wire up AI features via `/api/ai/*` routes using Grok (xAI) — `XAI_API_KEY` env var
12. Seed sample/demo data option
13. Polish: responsiveness, dark mode consistency, empty states
14. Final review with user → deploy to Vercel (user provides Vercel token)

---

## 7. Environment Variables Needed

```
XAI_API_KEY=<grok/xai api key — provided by user before AI features can be tested>
```

---

## 8. Deployment

- Target: Vercel
- User will provide a Vercel deployment token at the end, once the app is built,
  tested, and approved.

---

*End of brief — proceed with scaffolding and building per the order above.*