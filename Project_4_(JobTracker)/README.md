# Project 4 – AI Job Tracker

A full-stack job-application tracker with an AI assistant, generated in Google AI Studio and deployable to Vercel. It tracks applications through the hiring pipeline and uses AI to write cover letters, score job matches and give pipeline insights. Design notes are in `plan.md`.

## Features

- Dashboard with pipeline visualisation, conversion rates, monthly goals and activity feed.
- Drag-and-drop **Kanban board** from Wishlist to Offer/Rejected.
- Searchable, sortable **list view** and a month **calendar** of interviews and outreach.
- **Analytics** view with yield percentages and company counts.
- Application detail modal with resume compliance, match score and outreach message builder.
- AI endpoints: cover letter, match score and insights.
- Seed data for demoing charts, settings for goals and profile, and a login screen.

## Tech stack

- React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Lucide icons
- Node.js and Express API (`api/index.ts`, `server.ts`), deployable on Vercel
- Google Gemini (`@google/genai`), with optional xAI Grok fallback

## Run locally

**Prerequisites:** Node.js

```bash
npm install
```

Create `.env.local` and set your Gemini key (`GEMINI_API_KEY`; optionally an xAI key as `XAI_API_KEY`), then start the app:

```bash
npm run dev
```

Other scripts: `npm run build`, `npm start`, `npm run lint`.
