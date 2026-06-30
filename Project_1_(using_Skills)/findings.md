# 🔍 Findings & Research

**Project:** JIRA Test Strategy Generator  
**Last Updated:** 2026-06-12

---

## 📚 Research Notes

### JIRA API Integration
- **Endpoint:** `GET /rest/api/3/issue/{issueIdOrKey}`
- **Authentication:** Basic Auth (email + API token encoded in Base64)
- **Required Headers:** 
  - `Authorization: Basic <base64(email:token)>`
  - `Accept: application/json`
- **Key Fields to Fetch:**
  - `fields.summary`
  - `fields.description`
  - `fields.attachment`
  - `fields.issuelinks` (linked issues)
  - `fields.subtasks`
  - `fields.issuetype`, `fields.priority`, `fields.status`

**Documentation:** https://developer.atlassian.com/cloud/jira/platform/rest/v3/

**Recommended Libraries:**
1. **jira-client (Node.js)** - Mature library with 500k+ weekly downloads
2. **axios** - For custom REST API calls with full control
3. **node-fetch** - Lightweight alternative

**Best Practice:** Use `axios` with custom wrapper for maximum flexibility and error handling

---

### GROQ API Integration
- **Model:** `openai/gpt-oss-120b` (FREE)
- **API Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Authentication:** `Authorization: Bearer <API_KEY>`
- **Context Window:** 32,768 tokens (confirmed for gpt-oss-120b)
- **Recommended Temperature:** 0.3 (for consistent, formal outputs)

**Documentation:** https://console.groq.com/docs

**Implementation Pattern (Node.js):**
```javascript
const Groq = require('groq-sdk');
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const response = await client.chat.completions.create({
  messages: [
    { role: "system", content: "You are a QA Test Strategy expert..." },
    { role: "user", content: "Generate test strategy for: [JIRA data]" }
  ],
  model: "llama-3.3-70b-versatile", // Updated from openai/gpt-oss-120b
  temperature: 0.3,
  max_tokens: 4000
});
```

**Key Features:**
- OpenAI-compatible API structure
- Supports streaming responses
- Fast inference (LPU architecture)
- No rate limits on free tier (usage-based)

**✅ Phase 2 Test Results:**
- Successfully tested with `llama-3.3-70b-versatile` model
- Generated high-quality, formal + technical content
- Token efficiency: ~163 tokens for basic test (95 completion tokens)
- Response time: < 2 seconds

---

### PDF Generation Options
1. **markdown-pdf (Node.js):**
   - Simple NPM package
   - Converts Markdown → PDF via Phantom.js
   - Command: `npx markdown-pdf input.md -o output.pdf`
   - ⚠️ Deprecated - last update 2018

2. **md-to-pdf (Node.js):** ✅ RECOMMENDED
   - Modern, actively maintained
   - Uses Puppeteer under the hood
   - Custom CSS styling support
   - Command: `npx md-to-pdf input.md`

3. **Puppeteer (Node.js):**
   - Headless Chrome for PDF generation
   - Full control over layout and styling
   - Can render custom HTML templates
   - Best for complex formatting

4. **jsPDF + html2canvas:**
   - Client-side PDF generation (runs in browser)
   - Good for React apps
   - No server-side dependencies

**Recommendation:** Use `md-to-pdf` (wrapper around Puppeteer) for best balance of simplicity and quality.

---

### React App Architecture
- **State Management:** React Context API or Zustand (lightweight)
- **UI Framework:** Tailwind CSS or Material-UI for quick styling
- **Backend Strategy:** 
  - Option A: Node.js Express backend (API proxy for JIRA/GROQ)
  - Option B: Electron app (desktop app with Node.js backend embedded)
  - Option C: Full client-side (CORS issues with JIRA API)

**✅ FINAL DECISION: Web App with Vercel Deployment**
- **Frontend:** React app deployed to Vercel
- **Backend:** Vercel Serverless Functions (API routes)
- **Solves CORS:** Backend makes JIRA/GROQ API calls
- **File Download:** Browser download (blob URLs for Markdown/PDF)

**Architecture Pattern:**
```
Frontend (React)
    ↓ HTTP Request
Vercel Serverless Function (/api/generate)
    ↓ Fetch JIRA data
JIRA API
    ↓ Generate strategy
GROQ API
    ↓ Convert to PDF
md-to-pdf (in serverless function)
    ↓ Return files
Frontend (download via browser)
```

**File Structure:**
```
jira-test-strategy-generator/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── GeneratorPage.jsx
│   │   │   └── OutputPage.jsx
│   │   ├── services/
│   │   │   └── apiService.js (calls backend)
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   └── App.jsx
│   ├── package.json
│   └── vercel.json (frontend config)
├── backend/
│   ├── api/
│   │   └── generate.js (Vercel serverless function)
│   ├── services/
│   │   ├── jiraService.js
│   │   ├── groqService.js
│   │   └── pdfService.js
│   ├── package.json
│   └── vercel.json (backend config)
└── README.md
```

---

## 🚧 Constraints & Limitations

### Technical Constraints
1. **JIRA Rate Limits:** 5 requests/second per user
2. **GROQ Token Limits:** 32k input tokens max
3. **PDF Generation:** Requires Node.js runtime (or Python fallback)

### User Constraints
- User must manually obtain JIRA API token (cannot automate)
- GROQ API key required (user-provided)

---

## 💡 Discoveries

### Test Strategy Structure (Generic Template)
Based on industry standards, the generated document should include:
1. **Executive Summary**
2. **Scope and Objectives**
3. **Test Approach** (Methodology)
4. **Test Types** (Unit, Integration, System, Acceptance, Regression)
5. **Risk Analysis** (High/Medium/Low risks)
6. **Test Environment**
7. **Schedule and Milestones**
8. **Resources** (Team, Tools)
9. **Deliverables** (Test cases, reports, metrics)
10. **Entry/Exit Criteria**
11. **Dependencies** (Linked issues, blockers)
12. **Assumptions and Risks**

---

## 🔗 Helpful Resources
- [JIRA REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [GROQ API Documentation](https://console.groq.com/docs)
- [GROQ Node.js SDK](https://www.npmjs.com/package/groq-sdk)
- [IEEE 829 Test Strategy Template](https://en.wikipedia.org/wiki/IEEE_829)
- [md-to-pdf NPM](https://www.npmjs.com/package/md-to-pdf)
- [Electron Documentation](https://www.electronjs.org/docs)
- [React + Electron Template](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

---

## 💎 Key Technical Decisions (FINALIZED)

### 1. Architecture Choice: Web App with Vercel Deployment ✅
**Why:** 
- Easy deployment with Vercel API key
- Serverless functions handle backend logic (no separate server needed)
- Solves CORS issues (backend makes API calls)
- Accessible from any browser

### 2. JIRA API Client: Custom Axios Wrapper ✅
**Why:** Maximum flexibility, better error handling than generic libraries

### 3. PDF Generation: md-to-pdf (in Vercel serverless function) ✅
**Why:** Modern, actively maintained, good styling support

### 4. GROQ Integration: Official Node.js SDK ✅
**Why:** Native support, maintained by GROQ, OpenAI-compatible

### 5. State Management: React Context API ✅
**Why:** Built-in, no extra dependencies for simple app

### 6. Filename Format: With Timestamp ✅
**Format:** `TestStrategy_PROJ-123_20260612_143045.md/pdf`

### 7. Deployment: Vercel ✅
**Frontend + Backend:** Single Vercel project with API routes

---

## 🎯 Features Roadmap

### Phase 3-4 (MVP):
- [x] Basic JIRA ID input → Generate Test Strategy
- [x] Markdown + PDF output with download
- [x] Settings page for JIRA/GROQ credentials
- [x] Generic Test Strategy structure

### Future Enhancements (Phase 5+):
- [ ] Auto-detect test types from JIRA labels/components
- [ ] Support custom Test Strategy templates
- [ ] Analyze JIRA attachments (PDFs) with GROQ
- [ ] Generate test cases (not just strategy)
- [ ] Batch processing (multiple JIRA IDs)
- [ ] Save/load credential presets
