# ContentForge — Automated Content-Generation Dashboard

ContentForge is a local, high-fidelity Next.js 14 and TypeScript application that orchestrates an automated pipeline to generate, write, and produce visual assets for daily LinkedIn posts. 

## Features

- **Automated Agent Pipeline**:
  - **Agent 1 (Topic Generator)**: Selects a niche technical keyword, filters against historical topics in the spreadsheet to prevent duplicates, and generates an engineering-focused title using Groq (`llama-3.3-70b-versatile`).
  - **Agent 2 (Content Writer)**: Crafts direct, technical, hook-driven LinkedIn posts (~150-200 words) using Groq, strictly avoiding generic marketing filler words.
  - **Agent 3 (Image Generator)**: Generates 3 distinct landscape visual assets (1200x627) matching the topic using Gemini (`imagen-3.0-generate-002`) and writes them directly to local storage.
  - **Agent 4 (Sheet Updater / ExcelManager)**: Maintains atomic spreadsheet state in `content_calendar.xlsx` using an exclusive promise-based Mutex queue to prevent file corruption.
- **Daily Cron Orchestration**: Automatically starts and schedules daily runs at 9:00 AM local time using `node-cron` integrated via Next.js instrumentation hooks.
- **Vibrant Glassmorphic Dashboard**: Real-time status cards, inline copy button, visual image gallery, historical table, operations log, and direct download for the `.xlsx` sheet.

## Tech Stack

- **Framework**: Next.js 14 (App Router), React, Tailwind CSS
- **APIs**: `groq-sdk`, `@google/genai` (Imagen 3)
- **Data Store**: `exceljs` (`content_calendar.xlsx`)
- **Scheduler**: `node-cron`

## Getting Started

### 1. Installation

Install the project dependencies:
```bash
npm install
```

### 2. Configure API Keys

Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Edit `.env.local` and paste your API keys:
```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
```

### 3. Run Locally

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the dashboard.

## File Structure

```text
contentforge/
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.js
├── instrumentation.ts
├── content_calendar.xlsx (Auto-generated)
├── lib/
│   ├── types.ts          (TypeScript definitions)
│   ├── excelManager.ts   (Thread-safe atomic Excel operations)
│   ├── agents.ts         (Agent 1-4 logic blocks)
│   ├── pipeline.ts       (Sequence execution engine)
│   └── scheduler.ts      (Cron scheduler and date helper)
├── app/
│   ├── layout.tsx        (Display font and layout base)
│   ├── page.tsx          (Main Dashboard view)
│   └── api/
│       ├── run/          (Trigger pipeline POST)
│       ├── calendar/     (Get all records GET)
│       ├── today/        (Get today's post GET)
│       ├── download/     (Serve xlsx file GET)
│       └── status/       (System state & key checks GET)
├── components/
│   ├── StatusCards.tsx   (Key info cards)
│   ├── ContentTabs.tsx   (LinkedIn copy & image gallery)
│   ├── CalendarTable.tsx (Calendar table grid)
│   └── ExcelLog.tsx      (Log tables and spreadsheet download)
└── public/
    └── images/           (Output directory for generated assets)
```
