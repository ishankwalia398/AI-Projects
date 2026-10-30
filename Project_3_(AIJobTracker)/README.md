# Project 3 – AI Job Tracker

A prototype AI-assisted job-application tracker built with Next.js, with sample data for testing.

## Contents

- `aijobtracker/` – the Next.js application.
- `job_tracker_test_data.csv` – sample applications (company, position, location, job type, date applied, status, salary range, source, contact, notes).
- `test-db.js` – script for checking the database connection.

## Features

- Kanban **board**, applications list, **calendar** and **analytics** views.
- Drag-and-drop status changes.
- Goal tracking on the dashboard and configurable settings.
- AI endpoints for **cover letters**, **match score**, **insights** and **readiness score**.
- CSV import and a seed route for demo data.
- Email/password auth with login, register and callback routes.
- Light/dark theme.

## Tech stack

- **Next.js 16**, **React 19**, TypeScript
- Tailwind CSS, shadcn/ui, Radix/Base UI, Lucide icons
- **Supabase** (auth and database)
- **OpenAI** (`gpt-4o-mini`) for AI features
- dnd-kit, Recharts, React Hook Form, Zod, PapaParse, date-fns

## Getting started

```bash
cd aijobtracker
npm install
```

Create `.env.local` with your Supabase URL and keys and your OpenAI key (see the app's config for the exact variable names), then:

```bash
npm run dev
```

Open http://localhost:3000.
