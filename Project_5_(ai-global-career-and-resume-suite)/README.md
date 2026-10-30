# Project 5 – AI Global Career and Resume Suite

An AI career toolkit, generated in Google AI Studio, that helps job seekers review resumes, find jobs, write application letters and prepare for interviews.

## Features

- **Resume reviewer (ATS)** and **resume reviewer against a job description**, with scoring and feedback.
- **Job search** across markets and a **job tracker**.
- **Skill finder** to identify skill gaps.
- **Letters generator** for cover letters and similar documents.
- **Interview cheat sheet** generator.
- Resume upload/paste input, PDF download of results and a sign-in gateway.

## Tech stack

- React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Lucide icons
- Node.js and Express API (`api/index.ts`), deployable on Vercel
- Google Gemini (`@google/genai`) with model fallback; jsPDF for downloads

## Run locally

**Prerequisites:** Node.js

```bash
npm install
```

Create `.env.local` and set your Gemini key (`GEMINI_API_KEY`), then start the app:

```bash
npm run dev
```

Other scripts: `npm run build`, `npm start`, `npm run lint`.
