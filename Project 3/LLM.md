# 📜 LLM.md - Project Constitution

**Last Updated:** 2026-06-12  
**Project:** JIRA Test Strategy Generator  
**Status:** Initialization Complete

---

## 🎯 Project Mission
Build a React application that automates Test Strategy generation from JIRA tickets using GROQ API, outputting formal technical documentation in Markdown and PDF formats.

---

## 📊 Data Schemas

### 1. Input Schema (User Configuration)
```json
{
  "jiraConfig": {
    "baseUrl": "string",        // e.g., "https://yourcompany.atlassian.net"
    "email": "string",          // JIRA account email
    "apiToken": "string"        // JIRA API token
  },
  "groqConfig": {
    "apiKey": "string",         // GROQ API key
    "model": "openai/gpt-oss-120b"  // Fixed model
  },
  "jiraId": "string"            // e.g., "PROJ-123"
}
```

### 2. JIRA Fetch Schema (API Response)
```json
{
  "issue": {
    "id": "string",
    "key": "string",            // JIRA ID (e.g., "PROJ-123")
    "fields": {
      "summary": "string",
      "description": "string",
      "issuetype": {
        "name": "string"        // Story, Bug, Epic, etc.
      },
      "priority": {
        "name": "string"
      },
      "status": {
        "name": "string"
      },
      "assignee": {
        "displayName": "string"
      },
      "reporter": {
        "displayName": "string"
      },
      "created": "ISO8601",
      "updated": "ISO8601",
      "labels": ["string"],
      "components": [{"name": "string"}],
      "attachment": [
        {
          "filename": "string",
          "content": "string",
          "mimeType": "string"
        }
      ],
      "issuelinks": [
        {
          "type": "string",
          "inwardIssue": {"key": "string", "fields": {"summary": "string"}},
          "outwardIssue": {"key": "string", "fields": {"summary": "string"}}
        }
      ],
      "subtasks": [
        {
          "key": "string",
          "fields": {
            "summary": "string",
            "status": {"name": "string"}
          }
        }
      ]
    }
  }
}
```

### 3. GROQ Prompt Schema (LLM Input)
```json
{
  "model": "openai/gpt-oss-120b",
  "messages": [
    {
      "role": "system",
      "content": "You are a QA Test Strategy expert. Generate formal, technical test strategies."
    },
    {
      "role": "user",
      "content": "Context: [JIRA data]\n\nGenerate a comprehensive Test Strategy document..."
    }
  ],
  "temperature": 0.3,          // Lower for consistency
  "max_tokens": 4000
}
```

### 4. Output Schema (Test Strategy Document)
```json
{
  "testStrategy": {
    "metadata": {
      "jiraId": "string",
      "generatedAt": "ISO8601",
      "generatedBy": "JIRA Test Strategy Generator v1.0"
    },
    "document": {
      "markdown": "string",     // Full Markdown content
      "pdf": "base64",          // PDF binary (converted)
      "sections": {
        "executiveSummary": "string",
        "scopeAndObjectives": "string",
        "testApproach": "string",
        "testTypes": ["Unit", "Integration", "E2E", "Regression"],
        "riskAnalysis": "string",
        "testEnvironment": "string",
        "schedule": "string",
        "resources": "string",
        "deliverables": "string",
        "exitCriteria": "string"
      }
    },
    "files": {
      "markdownPath": "./TestStrategy_PROJ-123_20260612.md",
      "pdfPath": "./TestStrategy_PROJ-123_20260612.pdf"
    }
  }
}
```

---

## 🔒 Behavioral Rules

### Tone & Style
- **Formal + Technical:** Professional language suitable for stakeholder review
- **Structured:** Follow generic test strategy format (adaptable to IEEE 829)
- **Actionable:** Include clear test types, criteria, and deliverables

### Do Not Rules
1. **Never hardcode credentials** → Always use `.env` or user settings
2. **Never skip JIRA validation** → Check API connectivity before generation
3. **Never generate without data** → If JIRA fetch fails, halt with clear error message
4. **Never overwrite existing files** → Append timestamps to filenames

### Logic Constraints
- Single JIRA ID per generation (future: batch processing)
- Timeout: JIRA fetch (10s), GROQ generation (60s)
- Error handling: Graceful failures with user-friendly messages
- PDF generation: Use `markdown-pdf` or `puppeteer` for conversion

---

## 🏗️ Architectural Invariants

### 3-Layer Architecture
1. **Architecture Layer:** SOPs in `architecture/` (Markdown docs)
2. **Navigation Layer:** React components and state management
3. **Tools Layer:** API clients in `tools/` (Python or Node.js)

### File Structure (Web App Architecture)
```
Tasks/Task(06th may)/
├── LLM.md                 # This file (Project Constitution)
├── task_plan.md           # Phase tracking
├── findings.md            # Research and discoveries
├── progress.md            # Execution log
├── architecture/          # SOPs
│   ├── jira_fetch_sop.md
│   ├── groq_prompt_sop.md
│   └── pdf_generation_sop.md
└── jira-test-strategy-generator/   # Main app
    ├── frontend/
    │   ├── public/
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── SettingsPage.jsx
    │   │   │   ├── GeneratorPage.jsx
    │   │   │   └── OutputPage.jsx
    │   │   ├── services/
    │   │   │   └── apiService.js
    │   │   ├── context/
    │   │   │   └── AppContext.jsx
    │   │   ├── App.jsx
    │   │   └── index.js
    │   ├── package.json
    │   └── vercel.json
    ├── api/                # Vercel serverless functions
    │   ├── generate.js     # Main endpoint
    │   ├── test-jira.js    # Connection test
    │   └── test-groq.js    # Connection test
    ├── lib/                # Shared backend logic
    │   ├── jiraClient.js
    │   ├── groqClient.js
    │   └── pdfGenerator.js
    ├── .env.local          # Local credentials (gitignored)
    ├── .env.example        # Template for credentials
    ├── package.json
    ├── vercel.json         # Deployment config
    └── README.md
```

---

## 🔄 Change Log
- **2026-06-12:** Initial schema definition and behavioral rules established
