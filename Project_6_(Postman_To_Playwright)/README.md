# Project 6 – Postman to Playwright

A web app that converts a Postman collection (and optional environment file) into a Playwright API test suite, using Gemini to restructure requests, scripts and assertions. Built in Google AI Studio.

## Features

- Upload a Postman collection JSON and environment file by drag and drop.
- Generates a `playwright.spec.ts` that keeps the collection's folder structure.
- Generates matching Playwright config and `package.json` tabs.
- Automatically injects an **OTP verification flow** (via Mailinator) for MFA login requests.
- Copy or download each generated file.

## Tech stack

- React 19, TypeScript, Vite, Tailwind CSS 4, Motion, Lucide icons
- Node.js and Express backend (`server.ts`, `POST /api/convert`), deployable on Vercel
- Google Gemini (`@google/genai`); output targets Playwright Test

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
