# 📋 Task Plan: JIRA Test Strategy Generator

## Project Overview
**Goal:** Build a lightweight React app that auto-generates Test Strategy documents from JIRA tickets using GROQ API.

---

## ✅ Phases & Checklists

### Phase 0: Initialization ✅
- [x] Create project memory files
- [x] Define objective and discovery questions
- [x] Document user requirements

### Phase 1: Blueprint (Vision & Logic) ✅
- [x] Discovery Questions Answered
- [x] Data Schema defined in LLM.md
- [x] Research existing solutions (JIRA API, GROQ integration, PDF generation)
- [x] Architecture blueprint approved (Web App + Vercel)
- [x] Technical stack finalized
- [x] File structure defined

### Phase 2: Link (Connectivity) ✅
- [x] Verify JIRA API connection (REST API with email + token)
- [x] Verify GROQ API connection (llama-3.3-70b-versatile)
- [x] Test handshake scripts (test_jira.js, test_groq.js)
- [x] Validate .env credentials
- [x] Successfully fetched test issue MTP-17248
- [x] Successfully generated test content with GROQ

### Phase 3: Architect (3-Layer Build)
- [ ] **Layer 1 (Architecture):** Create SOPs in `architecture/`
  - [ ] JIRA fetching logic SOP
  - [ ] GROQ prompt engineering SOP
  - [ ] PDF generation SOP
- [ ] **Layer 2 (Navigation):** React app routing and state management
  - [ ] Create React app structure
  - [ ] Build SettingsPage component
  - [ ] Build GeneratorPage component
  - [ ] Build OutputPage component
  - [ ] Set up React Context for state management
- [ ] **Layer 3 (Tools):** Build backend services
  - [ ] Create Vercel serverless function `/api/generate`
  - [ ] Build JIRA API client (`lib/jiraClient.js`)
  - [ ] Build GROQ API client (`lib/groqClient.js`)
  - [ ] Build PDF generator (`lib/pdfGenerator.js`)
  - [ ] Create API test endpoints (`/api/test-jira`, `/api/test-groq`)

### Phase 4: Stylize (Refinement & UI)
- [ ] Design React UI (Settings page, JIRA input, Generate button)
- [ ] Format Test Strategy output (Markdown + PDF)
- [ ] User feedback and refinement

### Phase 5: Trigger (Deployment)
- [ ] Package app for distribution
- [ ] Create deployment documentation
- [ ] Final testing and validation

---

## 🎯 Success Criteria
1. User enters JIRA ID → clicks 'Generate' → receives Test Strategy in Markdown + PDF
2. App successfully fetches JIRA issue with attachments, linked issues, subtasks
3. Test Strategy follows generic structure with formal + technical tone
4. Files saved to current directory automatically
