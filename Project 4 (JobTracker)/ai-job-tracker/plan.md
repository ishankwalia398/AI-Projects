# AI JobTracker Project Plan & System Architecture

This document details the final approved layout, state architecture, component design system, and deployment configuration for **AI JobTracker**, a premium job application monitoring and pipeline intelligence suite.

---

## 1. System Overviews & Completed Implementations

AI JobTracker has been fully transitioned from a generic layout to a cohesive, high-contrast, polished interface adhering to a modern professional interface aesthetic.

### Completed Structural Alignment:
- **Atlassian-Inspired Palette**: Redesigned all background wrappers, text nodes, states, and border lines to use specific design-focused color tokens:
  - Base background: `#F4F5F7` (soft clean light gray)
  - Sidebar background: `#091E42` (deep professional slate navy)
  - Text accents: `#172B4D` (deep charcoal primary) and `#5E6C84` (subdued gray-blue body)
  - Specific, clean status tags/dot badges mapping out applied, interview, and offer milestones.
- **Architectural Honesty (No AI Slop)**: Removed generic purple-blue gradients, status logs, network simulator pings, or diagnostic coordinate banners. The canvas is completely dedicated to active metrics.
- **Durable Local State Layer & Seed System**: Implemented automated state management coupled with high-fidelity "Seed" system data, populating up to 15 cohesive mock career histories to immediately demonstrate velocity charts and conversion rates.

---

## 2. Directory & Directory Structure Map

```
/
├── api/
│   └── index.ts                 # Full-stack Serverless endpoint proxying Gemini & Grok queries
├── src/
│   ├── components/
│   │   ├── DashboardView.tsx    # Pipeline visualizations, Conversion rates, Monthly pacing goals, Activity feed, and AI Insights Controls
│   │   ├── KanbanBoardView.tsx  # Dynamic interactive drop-zone swimlanes mapping priorities (Wishlist to Offer/Rejected)
│   │   ├── ListView.tsx         # granula search inputs, status queries, multi-sortable tabular indexes
│   │   ├── CalendarView.tsx     # 42-cell automated month grid synchronizing technical/outreach loops
│   │   ├── AnalyticsView.tsx    # Metric visualizers highlighting yield percentages & company counts
│   │   ├── SettingsView.tsx     # Custom limits, target monthly volume metrics, profile overrides
│   │   ├── AuthScreen.tsx       # Handled profile credentials authentication page hook
│   │   └── ApplicationDetailModal.tsx # Grandular sub-tabs tracking resume compliance, score matches, and outreach message builders
│   ├── lib/
│   │   └── utils.ts             # CN utility class constructor
│   ├── types.ts                 # Enums: StatusType, PriorityType, and shared interfaces
│   ├── App.tsx                  # Core layout routing and global synchronized state engine
│   ├── index.css                # Global Tailwind CSS configurations and font pairings
│   └── main.tsx                 # Core bundle mount point
├── vercel.json                  # Production Vercel Serverless & SPA routing rules
├── package.json                 # Dependency manifests, linter scripts, and build targets
└── plan.md                      # [THIS FILE] Project roadmap and design systems blueprint
```

---

## 3. High-Fidelity Components & Views

### A. Dashboard & Velocity KPI Metric Tiles
- **High-Contrast KPIs**: Active Apps, Response Rates, Interview Rates, and Velocity response latencies calculated dynamically based on input changes.
- **Horizontal Sizing Distribution**: Shows custom color bar indicators based on active column numbers.
- **AI Command Coach Console**: Integrated with Gemini 3.5 Flash and Grok-beta (with automatic fallback), analyzing active application densities and returning technical strengths, growth vectors, and executive advice strings.

### B. Kanban Pipeline Board
- **Fluid Drag-and-Drop Swimlanes**: Native mouse drag handlers with temporary dashed highlighted blue accent borders when floating over potential targets.
- **Dynamic Avatars**: Renders contrasting, programmatically matched colorful initials for company names dynamically.
- **Granular Priority Tags**: Custom colors representing `Urgent`, `High`, `Medium`, and `Low` priority lines.

### C. Application Details Modal & Copilot
- **ATS Match Score Tool**: Compares job description strings with pasted resume text, generating compliance ratings, keyword gap assessments, and optimization lists.
- **Outreach & Letter Copywriter**: Writes customized cold LinkedIn templates or formalized cover letters with single-click clipboard copies.
- **Timeline Logs**: Keeps chronological record modifications synced with active user edits.

---

## 4. Vercel Deployment & Pipeline Setup

An automated, serverless deployment pattern has been configured:

1. **`vercel.json` Setup**:
   - Outlined root rewrite pointers letting Vite static UI bundles route with state history intact (`/index.html`).
   - Configured custom edge pathing to send `/api/*` requests directly to Serverless functions (`/api/index.ts`).
2. **`api/index.ts` Setup**:
   - Robust Express wrapper checking if `GEMINI_API_KEY` or `XAI_API_KEY` are present in environment variables.
   - Built server-guided schema structures strictly formatted using `@google/genai` classes to prevent schema drifting or unstructured responses.

---

## 5. Deployment Verification & Troubleshooting

During the deployment command execution, the supplied Vercel verification token suffered an authorization check error from Vercel CLI services:
```
Error: You are not authorized
```
*Solution*: The user should regenerate their Vercel personal access token or configure local system integrations directly via simple manual commands outlined in the final report.
