import generated from './generated.json'
import { PROJECT_REPOSITORY_URL } from '../profile'

const folderUrl = folder => `${PROJECT_REPOSITORY_URL}/tree/main/${encodeURIComponent(folder).replace(/%2F/g, '/')}`

// Case studies shown first. Text is drawn from each project's README.
export const FEATURED_PROJECTS = [
  {
    folder: 'Project_12_(OTT_DRM_AI_Troubleshooting_Copilot)',
    name: 'OTT DRM AI Troubleshooting Copilot',
    tagline: 'Diagnoses video playback and DRM failures',
    category: 'OTT / DRM',
    problem: 'Playback failures can come from the device, manifest, license, codec or HDCP policy, so diagnosing one means piecing evidence together by hand.',
    approach: 'Deterministic diagnostic rules combined with RAG over knowledge cards and past incidents. It ranks likely root causes, recommends the next verification tests and exports a PDF report.',
    stack: ['Python', 'FastAPI', 'RAG', 'Pinecone', 'OpenAI'],
    live: 'https://ott-drm-troubleshooting-copilot.vercel.app/'
  },
  {
    folder: 'Project_17_(QA_Sherlock)',
    name: 'QA Sherlock',
    tagline: 'Autonomous AI defect investigation',
    category: 'Defect investigation',
    problem: 'Explaining why a test failed means correlating Jira tickets, test runs and logs before anyone can act.',
    approach: 'Six CrewAI agents gather evidence through Pinecone retrieval and Jira (MCP with REST failover), weigh competing hypotheses and write a Playwright regression test; DeepEval judges the output.',
    stack: ['CrewAI', 'Pinecone', 'Jira MCP', 'Playwright', 'DeepEval'],
    live: 'https://qasherlock.vercel.app/'
  },
  {
    folder: 'Project_20_Langchain(QABugTriage)',
    name: 'QA Bug Triage',
    tagline: 'Severity, root cause and test strategy for a Jira defect',
    category: 'Defect triage',
    problem: 'Every new defect raises the same questions: how bad is it, why did it happen, and what should be tested so it does not come back?',
    approach: 'Three LangChain specialists (triage analyst, root-cause investigator, test-strategy advisor) answer in sequence with evidence excerpts, using Gemini Flash with automatic Groq fallback.',
    stack: ['LangChain', 'FastAPI', 'React', 'TypeScript', 'Gemini'],
    live: 'https://qa-bug-triage-lc.vercel.app/'
  },
  {
    folder: 'Project_16_DeepEvalFramework',
    name: 'DeepEval Live Lab',
    tagline: 'Quality gates for LLM chatbots and RAG',
    category: 'LLM evaluation',
    problem: 'LLM chatbots and RAG assistants need measurable quality checks, not spot checks.',
    approach: 'A live dashboard that runs 25 DeepEval metrics against fresh responses from a support chatbot and a RAG assistant, backed by a 100-case test dataset.',
    stack: ['Python', 'FastAPI', 'DeepEval', 'Groq', 'RAG'],
    live: 'https://deepeval-dashboard.vercel.app/'
  }
].map(project => ({ ...project, url: folderUrl(project.folder) }))

const PROJECT_DETAILS = {
  'Project_2_(n8n_Agents)': {
    name: 'n8n Agents',
    description: 'n8n workflows where LLM agents turn a PRD into a test plan, test cases and Playwright scripts, plus a scheduled LinkedIn content pipeline.'
  },
  'Project_6_(Postman_To_Playwright)': {
    name: 'Postman to Playwright',
    description: 'Converts Postman collections into a Playwright API test suite with Gemini, keeping folder structure and handling OTP-based MFA logins.'
  },
  'Project_7_(LinkedInContentGenerator)': {
    name: 'ContentForge',
    description: 'Next.js dashboard where four agents pick a topic, write a LinkedIn post, generate images and log it to a content calendar every day.'
  },
  'Project_8_(LangFlow_Agents)': {
    name: 'Langflow QA Agents',
    description: 'Langflow assistants for bug triage, RCA, flaky-test analysis, test-case and test-plan creation and API contract checks, connected to Jira and Confluence.'
  },
  'Project_9_(RAGs)': {
    name: 'RAG Experiments',
    description: 'RAG for QA compared across stacks (Ollama + ChromaDB, Pinecone, Qdrant), including QABuddy, an assistant that cites its QA knowledge-base sources.'
  },
  'Project_10_(Porfolio_Builder)': {
    name: 'Portfolio Builder',
    description: 'React app that turns a multi-step form into a portfolio site with GitHub stats and one-click Vercel deployment.'
  },
  'Project_13_Simple_CrewAI_Agent': {
    name: 'Simple CrewAI Agent',
    description: 'A minimal CrewAI agent with a senior-QA persona that writes test cases for a login page.'
  },
  'Project_14_CrewAI_QA_Pipeline': {
    name: 'Jira QA Crew',
    description: 'Four CrewAI agents turn a Jira ticket into requirements analysis, a 12-section test plan, test cases, Playwright TypeScript and traceability.'
  },
  'Project_15_DeepEval(AnswerRelevancy_Test)': {
    name: 'DeepEval Answer Relevancy',
    description: 'pytest and DeepEval tests that score how relevant an LLM\'s answers are, using an LLM judge and a pass threshold.'
  },
  'Project_18_CrewAI(LogAnalyzer)': {
    name: 'Logscope (CrewAI)',
    description: 'Upload HAR, Charles, CSV, PDF and other logs; three CrewAI agents parse them, find errors and timeouts and suggest fixes.',
    live: 'https://log-analyzer-ca.vercel.app/'
  },
  'Project_19_Langchain(LogAnalyzer)': {
    name: 'Logscope (LangChain)',
    description: 'The same log-analysis dashboard rebuilt with three sequential LangChain agents and evidence validation on every finding.',
    live: 'https://log-analyzer-lc.vercel.app/'
  },
  'Project_21_Career-Assistant': {
    name: 'Career Assistant',
    description: 'React and FastAPI career workspace for profile ingestion, candidate management, job tracking and AI-generated documents.'
  }
}

// Early or personal projects that are not shown.
const EXCLUDED_PROJECTS = new Set([
  'Project_1_(using_Skills)',
  'Project_3_(AIJobTracker)',
  'Project_4_(JobTracker)',
  'Project_5_(ai-global-career-and-resume-suite)'
])

function formatProjectName(folder) {
  const inner = folder.match(/\(([^)]+)\)/)?.[1] ?? folder
  return inner
    .replace(/^Project_\d+_?/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

const projectNumber = folder => Number(folder.match(/^Project_(\d+)/)?.[1] ?? 0)
const featuredFolders = new Set(FEATURED_PROJECTS.map(project => project.folder))

// Newest first; new folders appear automatically on the next deploy.
export const MORE_PROJECTS = generated.projectFolders
  .filter(folder => !featuredFolders.has(folder) && !EXCLUDED_PROJECTS.has(folder))
  .sort((a, b) => projectNumber(b) - projectNumber(a))
  .map(folder => ({
    folder,
    name: PROJECT_DETAILS[folder]?.name ?? formatProjectName(folder),
    description: PROJECT_DETAILS[folder]?.description ?? 'See the repository for details.',
    live: PROJECT_DETAILS[folder]?.live,
    url: folderUrl(folder)
  }))

const skillUrl = folder => `${PROJECT_REPOSITORY_URL}/tree/main/Skills_Created/${folder}`

export const QA_SKILLS = [
  { name: 'Software Test Plan Generator', description: 'Generates a full test plan from requirements in Jira, Confluence or documents.', url: skillUrl('TestPlan') },
  { name: 'Test Case Generator', description: 'Turns a test plan into step-by-step test cases in Jira and PractiTest formats.', url: skillUrl('TestCase') },
  { name: 'Backend Test Plan Generator', description: 'Backend-focused test plan as an Excel workbook and a Confluence page.', url: skillUrl('generate-backend-stp') },
  { name: 'Backend Test Case Generator', description: 'Detailed backend test cases with a coverage summary, from a plan and a spec.', url: skillUrl('generate-backend-testcases') },
  { name: 'PractiTest Uploader', description: 'Uploads test cases to PractiTest with validation, state tracking and rollback.', url: skillUrl('upload-testcases-to-practitest') },
  { name: 'Postman to Playwright Converter', description: 'Migrates Postman collections into Playwright API tests.', url: skillUrl('PostmanToPlaywright') },
  { name: 'Automation Report Analyzer', description: 'Summarizes nightly test runs and performs root-cause analysis on failures.' }
]

export const LANGUAGES = generated.languages
