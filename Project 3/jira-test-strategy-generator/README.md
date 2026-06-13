# 🚀 JIRA Test Strategy Generator

Automated Test Strategy document generation from JIRA tickets using GROQ AI.

## 📋 Features

- ✅ **Fetch JIRA Issues** - Automatically retrieves issue details, linked issues, subtasks, and attachments
- 🤖 **AI-Powered Generation** - Uses GROQ's LLaMA 3.3 70B model for intelligent test strategy creation
- 📄 **Primary Output: Markdown** - Generates Markdown (.md) as the primary output. PDF generation is optional and may be disabled in some environments.
- 🎨 **Clean UI** - Modern React interface with step-by-step workflow
- 🔒 **Secure** - Credentials stored locally in browser (localStorage)
- ⚡ **Fast** - Typical generation time: 30-60 seconds

## 🏗️ Architecture

Built following the **B.L.A.S.T.** framework:
- **Blueprint** ✅ - Requirements analysis and data schema design
- **Link** ✅ - API integration verification
- **Architect** ✅ - 3-layer architecture (SOPs, Backend Services, Frontend)
- **Stylize** - Professional UI/UX (in progress)
- **Trigger** - Vercel deployment

### Tech Stack

**Frontend:**
- React 18
- Vite
- Context API (state management)
- CSS3 (custom styling)

**Backend:**
- Node.js
- Vercel Serverless Functions
- Axios (JIRA API)
- GROQ SDK (AI generation)
- md-to-pdf (document conversion)

## 📂 Project Structure

```
jira-test-strategy-generator/
├── api/
│   └── generate.js          # Main serverless function
├── lib/
│   ├── jiraClient.js        # JIRA API client
│   ├── groqClient.js        # GROQ AI client
│   └── pdfGenerator.js      # PDF conversion service
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── GeneratorPage.jsx
│   │   │   └── OutputPage.jsx
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   ├── services/
│   │   │   └── apiService.js
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── architecture/            # Standard Operating Procedures
│   ├── jira_fetch_sop.md
│   ├── groq_prompt_sop.md
│   └── pdf_generation_sop.md
├── .env.example
├── vercel.json
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- JIRA account with API token
- GROQ API key

### Installation

1. **Clone/Navigate to project:**
   ```bash
   cd jira-test-strategy-generator
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   ```env
   JIRA_URL=https://yourcompany.atlassian.net/
   JIRA_EMAIL=your.email@company.com
   JIRA_API_TOKEN=your_jira_api_token
   GROQ_API_KEY=your_groq_api_key
   ```

### Local Development

1. **Start backend (Vercel dev server):**
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:3001`

2. **Start frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

3. **Open browser:**
   Navigate to `http://localhost:3000`

### Deployment to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Add environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `GROQ_API_KEY`

## 📖 Usage

### Step 1: Configure Settings

1. Enter your **JIRA Base URL** (e.g., `https://yourcompany.atlassian.net/`)
2. Enter your **JIRA Email**
3. Generate and enter your **JIRA API Token** ([Get it here](https://id.atlassian.com/manage-profile/security/api-tokens))
4. Enter your **GROQ API Key** ([Get it here](https://console.groq.com/keys))
5. Click **"Continue to Generator"**

### Step 2: Generate Test Strategy

1. Enter a JIRA Issue ID (e.g., `MTP-17248`)
2. Click **"Generate"**
3. Wait 30-60 seconds while the system:
   - Fetches JIRA issue data
   - Generates AI-powered test strategy
   - Creates PDF document

### Step 3: Download Files

1. Preview the generated test strategy
2. Download Markdown (.md) file
3. Download PDF file
4. Click **"Generate Another"** for a new issue

## 📄 Generated Document Structure

The Test Strategy includes:

1. **Executive Summary** - Overview and objectives
2. **Scope and Objectives** - What's in/out of scope
3. **Test Approach** - Methodology (Agile, Risk-based, etc.)
4. **Test Types and Levels** - Unit, Integration, E2E, Regression, etc.
5. **Risk Analysis** - Identified risks with mitigation strategies
6. **Test Environment** - Required environments (Dev, QA, Staging, Prod)
7. **Schedule and Milestones** - Testing timeline
8. **Resources** - Team roles and tools needed
9. **Deliverables** - Test cases, reports, metrics
10. **Entry and Exit Criteria** - Conditions to start/complete testing
11. **Dependencies** - Based on linked issues and subtasks
12. **Assumptions and Constraints** - Project limitations

## 🔧 Configuration

### GROQ Model Options

- **llama-3.3-70b-versatile** (Recommended) - Best balance of speed and quality
- **mixtral-8x7b-32768** - Alternative high-performance model
- **llama-3.1-70b-versatile** - Previous generation model

### Temperature Settings

- **0.3** (Default) - Consistent, formal outputs
- **0.5** - Balanced creativity and consistency
- **0.7** - More creative, varied outputs

### Max Tokens

- **4000** (Default) - Sufficient for full test strategy
- Increase to 6000-8000 for more detailed documents

## 🐛 Troubleshooting

### Common Issues

**"Invalid JIRA credentials"**
- Verify your JIRA email and API token
- Ensure JIRA URL has trailing slash

**"Issue not found"**
- Check JIRA ID format (e.g., `PROJ-123`)
- Verify you have permission to view the issue

**"GROQ API error"**
- Verify your GROQ API key
- Check API quota at [GROQ Console](https://console.groq.com)

**"PDF generation failed"**
- Try again (temporary Puppeteer issue)
- Check system memory availability

## 📊 Performance

- **JIRA Fetch:** 200-500ms
- **AI Generation:** 10-30 seconds
- **PDF Creation:** 2-5 seconds
- **Total Time:** 30-60 seconds

## 🔒 Security

- Credentials stored in browser localStorage (client-side only)
- No server-side credential storage
- HTTPS enforced for all API calls
- Input sanitization to prevent XSS/injection

## 📝 License

MIT License - See LICENSE file for details

## 👤 Author

**Ishank Walia**  
Built following the B.L.A.S.T. framework

## 🙏 Acknowledgments

- [JIRA API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [GROQ API](https://console.groq.com/docs)
- [md-to-pdf](https://www.npmjs.com/package/md-to-pdf)

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-12

## Change Log

- 2026-06-12: Updated API to return Markdown-only by default; PDF generation is now optional and may be skipped in serverless environments. Frontend updated to handle markdown-only responses.

## Deployment Notes

- During deployment, if Vercel reports project settings errors, remove the local `.vercel` directory and redeploy. Example:

```powershell
Remove-Item -Recurse -Force .vercel
npx vercel --prod --token $env:VERCEL_TOKEN --yes
```

Be sure to set `VERCEL_TOKEN` in your session or CI environment before running deploy.
