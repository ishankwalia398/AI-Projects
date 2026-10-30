# Project 2 – n8n Agents

A set of importable **n8n** workflows that use LLM agents to automate QA and content tasks: generating test artifacts from a PRD, producing LinkedIn posts on a schedule, and a lightweight QA assistant.

## What it does

| Workflow file | Purpose |
|---|---|
| `PRD → Test Artifacts Generator.json` | Upload a PRD in chat; agents read it and produce a test plan, test cases and Playwright scripts, saved as downloadable files. |
| `LinkedInPostGenerator.json` | Runs daily at 9 AM; one agent picks a topic and logs it to Google Sheets, a second agent writes the post and updates the sheet. |
| `QA_Buddy.json` / `AI_3X_01_QA_Buddy.json` | Minimal QA assistant workflow stubs. |

## Features

- Chat-triggered PRD ingestion with file extraction and conversation memory.
- Three specialised agents (test plan, test cases, Playwright scripts) merged into one response.
- Outputs saved as `.md` (test plan, scripts) and `.csv` (test cases).
- Scheduled, multi-agent content pipeline with Google Sheets as the topic/content tracker.
- Wait step between agents to respect LLM rate limits.

## Tech stack

- **n8n** (workflow automation: chat trigger, schedule trigger, agent, memory, merge, convert-to-file nodes)
- **LLMs:** OpenRouter chat models and Groq models
- **Google Sheets** integration
- Workflows stored as n8n JSON exports

## Getting started

1. Run n8n (cloud or `npx n8n`).
2. Import a workflow JSON via **Workflows → Import from file**.
3. Create credentials for OpenRouter and/or Groq, and Google Sheets where used, then attach them to the relevant nodes.
4. Activate the workflow (schedule trigger) or open the chat to test it.
