# CAREER ASSISTANT
# COMPLETE MASTER DEVELOPMENT PROMPT

## ROLE: EXPERT AI PRODUCT ARCHITECT, FULL-STACK DEVELOPER, CAREER COUNSELLOR AND QA ENGINEER

Act as an elite multidisciplinary engineering team responsible for building a complete, production-ready AI-powered career management platform named **Career Assistant**.

Your combined expertise includes:

- Senior Full-Stack Software Architect
- React, Vite and TypeScript Engineer
- Python and FastAPI Engineer
- AI/LLM and RAG Engineer
- LangChain, LangGraph and CrewAI Specialist
- Vector Database Engineer
- PostgreSQL Database Architect
- Career Counsellor and Recruitment Specialist
- Domestic and International Job Market Researcher
- Visa Sponsorship and Relocation Recruitment Specialist
- ATS Resume Optimization Specialist
- Professional Cover Letter Writer
- Technical Interviewer and Engineering Hiring Manager
- HR Interviewer and Behavioral Interview Coach
- Senior QA Automation Engineer
- Application Security Engineer
- DevOps and Vercel Deployment Engineer
- UI/UX Product Designer

## PRIMARY OBJECTIVE

Design, implement, test, document and deploy **Career Assistant** as a real, fully functional application.

The platform must help users:

1. Register with email, username and password.
2. Log in with username and password.
3. Upload and maintain professional resumes.
4. Build a persistent professional profile using RAG.
5. Discover relevant domestic jobs.
6. Discover international visa-sponsored jobs.
7. Match their qualifications against job descriptions.
8. Verify the authenticity and availability of job listings.
9. Track applications.
10. Generate personalized, ATS-friendly resumes and cover letters.
11. Attach mandatory application documents.
12. Apply to selected jobs through supported application channels.
13. Prepare for technical interviews.
14. Prepare for non-technical and HR interviews.
15. Generate detailed interview questions and answers.
16. Download documents in Word and PDF formats.
17. Minimize storage usage through intelligent document lifecycle management.
18. Reuse previously generated text to avoid unnecessary AI calls.
19. Access their saved profile and application history across sessions.

**CRITICAL: Do not remove, replace, or fundamentally alter any existing core functionality.**

Improvements in reliability, efficiency, performance, maintainability, security and user experience are encouraged.

Do not create a static mockup or a demonstration-only application.

---

# PART 1 — PROJECT OVERVIEW

## 1.1 Application Information

Application Name: Career Assistant

Application Type: AI-powered Career Management, Job Search, Job Application Tracking and Interview Preparation Platform

Frontend: React + Vite + TypeScript

Backend: Python + FastAPI

Vector Database: Qdrant, ChromaDB or another suitable free or free-tier alternative

Relational Database: PostgreSQL

AI Framework: LangGraph, LangChain, CrewAI or a justified combination

Primary LLM: Configurable high-capability model

Fallback LLM: Configurable alternative provider/model

Embedding Model: Select based on accuracy, speed and cost

Deployment Platform: Vercel for the frontend

Target Application URL:

https://jobsearchandtracker.vercel.app/

Theme: Light Mode Only

## 1.2 Primary Tabs

The application must contain three main tabs:

1. Domestic Jobs
2. Visa Sponsored Jobs
3. Interview Questions

## 1.3 Supporting Modules

Provide:

- User Registration
- User Login
- Password Recovery
- User Dashboard
- Resume Management
- RAG Knowledge Management
- Job Search
- Job Matching
- Job Verification
- Application Tracking
- Document Generation
- Document Downloads
- Interview Preparation
- User Settings
- Logout

---

# PART 2 — USER REGISTRATION AND LOGIN

## 2.1 Registration Requirements

A new user must be able to register using exactly three fields:

1. Email Address
2. Username
3. Password

Do not request personal or professional information during registration.

### Email Address

- Mandatory
- Must have valid email format
- Must be unique
- Case-insensitive uniqueness
- Used for registration, password recovery and account communication
- Not required for normal login

### Username

- Mandatory
- Must be unique
- Length: 3–30 characters
- Allow letters, numbers, underscores and periods
- No spaces
- Case-insensitive uniqueness
- Used for logging in

### Password

- Mandatory
- Minimum 8 characters
- Support long passwords and passphrases
- Allow special characters
- Show/Hide Password toggle
- Never store in plain text
- Store a secure hash using Argon2id or another appropriate algorithm

## 2.2 Register Button

When Register is clicked:

1. Validate email.
2. Validate username.
3. Validate password.
4. Check email uniqueness.
5. Check username availability.
6. Hash the password securely.
7. Create a user account.
8. Assign a unique internal User ID.
9. Initialize isolated user-specific data storage.
10. Display registration success.
11. Redirect to Login.

Handle database uniqueness conflicts.

## 2.3 Login Requirements

Users must log in using:

- Username
- Password

Email must not be required for login.

### Login Workflow

1. Validate credentials.
2. Retrieve account by username.
3. Verify password hash.
4. Create secure authenticated session.
5. Redirect to Career Assistant Dashboard.
6. Load the user's saved data.

Load:

- Active resume
- Candidate profile
- RAG knowledge
- Domestic jobs
- Visa Sponsored Jobs
- Applications
- Generated content
- Interview guides
- Preferences

Incorrect login message:

"Invalid username or password."

Do not reveal whether a username exists.

Implement rate limiting.

## 2.4 Authentication Page

Use a light-mode interface with two tabs.

### Login

- Username
- Password
- Show/Hide Password
- Login
- Forgot Password?
- Register Link

### Register

- Email
- Username
- Password
- Show/Hide Password
- Register
- Login Link

## 2.5 Forgot Password

Implement secure password reset using the registered email address.

Workflow:

1. User enters email.
2. Generate a secure one-time reset token.
3. Send a time-limited reset link.
4. User opens link.
5. User enters new password.
6. Validate password.
7. Hash new password.
8. Invalidate reset token.
9. Allow login using existing username and new password.

Do not reveal whether an account exists through the password-reset endpoint.

## 2.6 Session Security

Implement:

- HttpOnly cookies
- Secure cookies over HTTPS
- Appropriate SameSite policy
- CSRF protection
- Session expiration
- Secure logout
- Session invalidation
- Protected routes
- Server-side authorization

Never store authentication credentials in local storage.

## 2.7 User Data Isolation

Every user must have a unique internal User ID.

All records must belong to the authenticated user.

This includes:

- Resumes
- Resume versions
- Parsed Markdown
- Profile information
- RAG embeddings
- Job records
- Search preferences
- Applications
- Attachments
- Generated document content
- Interview guides
- Comments

User A must never access User B's information.

## 2.8 Authentication APIs

Implement:

- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`

---

# PART 3 — FIRST-TIME USER EXPERIENCE

## 3.1 New User

After successful registration and login:

1. Open Career Assistant dashboard.
2. Display a welcome message.
3. Ask the user to upload a resume.
4. Accept PDF and DOCX.
5. Process the resume on Submit.
6. Build the professional profile.
7. Initialize RAG.
8. Enable job-search and interview-preparation workflows.

## 3.2 Returning User

After login:

1. Load existing profile.
2. Retrieve active resume.
3. Retrieve saved jobs.
4. Retrieve application statuses.
5. Retrieve saved generated document content.
6. Retrieve interview guides.
7. Restore user preferences.

Do not require users to upload their resume every time.

---

# PART 4 — RESUME UPLOAD AND PROCESSING

## 4.1 Supported Formats

Accept:

- PDF
- DOCX

Provide upload validation, progress feedback and meaningful errors.

## 4.2 Resume Processing Workflow

When Submit is clicked:

1. Validate file.
2. Extract text.
3. Preserve headings and logical structure.
4. Convert extracted content to Markdown.
5. Identify resume sections.
6. Extract candidate facts.
7. Normalize structured fields.
8. Validate extraction.
9. Save original resume.
10. Save Markdown representation.
11. Generate embeddings.
12. Update user's RAG.
13. Present processing results.

Extract:

- Name
- Contact details
- Location
- Current designation
- Current employer
- Previous employers
- Employment dates
- Total experience
- Technical skills
- Functional skills
- Frameworks
- Tools
- Projects
- Responsibilities
- Achievements
- Leadership
- Education
- Certifications
- Training
- Domains

Never invent missing information.

## 4.3 Experience Calculation

Calculate experience using actual employment dates.

Avoid double-counting overlapping roles.

Differentiate:

- Total professional experience
- Domain experience
- Technology-specific experience

Handle current employment and incomplete dates accurately.

## 4.4 Updated Resume Upload

When an existing user uploads a new resume:

1. Retrieve previous active version.
2. Compare old and new content.
3. Identify unchanged facts.
4. Identify new facts.
5. Identify modified facts.
6. Identify removed facts.
7. Add only new facts.
8. Update changed facts.
9. Deactivate outdated facts.
10. Avoid duplicate embeddings.
11. Preserve resume version history.
12. Mark the latest approved version active.

Do not merge contradictory resume information blindly.

Use hashes, version IDs and stable source references.

---

# PART 5 — RAG ARCHITECTURE

## 5.1 Logical Separation

Maintain namespaces for:

### Candidate Profile

Professional information extracted from the user's resumes.

### Domestic Jobs

- India-specific job titles
- Search preferences
- Market research
- Job evidence
- Relevant contextual information

### Visa Sponsored Jobs

- International regions
- Target countries
- Job titles
- Sponsorship evidence
- International research
- Recruitment agencies

### Interview Preparation

- JDs
- Company research
- Technical interview context
- HR interview context
- Generated interview knowledge

Reuse the same authoritative candidate profile across all modules.

## 5.2 Chunking

Use structure-aware and heading-aware chunking.

Never separate:

- Employer from role
- Role from employment dates
- Achievements from relevant experience
- Project details from relevant project context
- Certifications from relevant issuing details

Start with a configurable approximate range of 400–800 tokens.

Use overlap where appropriate.

Benchmark retrieval performance and adapt chunk sizes.

## 5.3 Retrieval

Support:

- Semantic retrieval
- Metadata filtering
- Hybrid retrieval when beneficial
- Top-K retrieval
- Reranking when justified
- Source references
- Version filtering
- Deduplication
- User-specific access control

Use complete structured profiles for tasks requiring the full career history.

## 5.4 Structured Database

Use PostgreSQL for authoritative records.

Use the vector database for semantic retrieval.

Do not store application statuses or generated file binaries only in RAG.

---

# PART 6 — USER INTERFACE

## 6.1 Frontend

Use React + Vite + TypeScript.

Theme: Light mode only.

Provide three design previews:

1. Professional Corporate
2. Modern SaaS Dashboard
3. Minimal Productivity

Allow user selection.

## 6.2 Main Navigation

Provide:

- Domestic Jobs
- Visa Sponsored Jobs
- Interview Questions

Supporting navigation:

- Resume
- Profile
- Settings
- Logout

## 6.3 UI Requirements

Implement:

- Responsive design
- Accessible controls
- Loading indicators
- Error messages
- Success messages
- Empty states
- Confirmation dialogs
- Progress indicators
- Functional buttons
- Clear tables
- Search
- Sorting
- Filtering

---

# PART 7 — DOMESTIC JOBS

## 7.1 Find Jobs Workflow

When Domestic Jobs → Find Jobs is clicked:

1. Retrieve candidate profile.
2. Retrieve saved target titles.
3. Discover relevant target roles.
4. Update saved titles.
5. Search India-based jobs.
6. Verify listings.
7. Extract JDs.
8. Calculate matching scores.
9. Retrieve saved jobs.
10. Merge old and new jobs.
11. Remove duplicates.
12. Apply retention rules.
13. Sort results.
14. Display table.
15. Persist records.

## 7.2 Job Title Discovery Prompt

Act as an expert Indian recruitment-market analyst.

Using verified candidate information, identify the 20 most relevant and commonly advertised job titles suitable for the candidate's next role in India.

Consider:

- Current designation
- Professional experience
- Technical skills
- Functional skills
- Certifications
- Projects
- Leadership
- Industry expertise
- Current hiring trends

Do not restrict recommendations to the candidate's present domain.

Provide relevant titles across industries where skills are transferable.

For every title include relevance and supporting evidence where available.

Do not fabricate hiring statistics.

Store results in Domestic Jobs RAG.

## 7.3 Job Search Prompt

Find newly posted and still-active jobs in India only that strongly match the candidate.

Search legitimate sources including:

- Official company careers sites
- Official ATS platforms
- LinkedIn
- Indeed
- Naukri
- Shine
- Hirist
- ZipRecruiter
- JobLeads
- Other credible job portals

Respect website restrictions and permitted integrations.

## 7.4 Company Verification

If found on a third-party portal:

1. Identify employer.
2. Search official company careers.
3. Check corresponding role.
4. Compare role, location and requisition.
5. Retrieve official URL where available.
6. Record verification evidence and time.

If verified:

**Verified on company website**

If not found:

**Not found on company website / third-party listing only**

Do not exclude third-party-only listings.

Do not misrepresent uncertain availability as confirmed active.

---

# PART 8 — JOB MATCHING

Calculate CV-to-JD match scores between 0 and 100.

Recommended weights:

- Mandatory skills: 30%
- Relevant experience: 20%
- Job title/seniority: 15%
- Responsibilities: 15%
- Technical/domain relevance: 10%
- Preferred skills: 5%
- Location/eligibility: 5%

Display under:

**Matching Probability**

Clarify that this is an estimated candidate-to-JD fit score, not an actual hiring probability.

Include explanations for:

- Strong matches
- Partial matches
- Missing requirements
- Transferable skills
- Seniority
- Eligibility
- Main gaps

Never invent candidate qualifications.

---

# PART 9 — DOMESTIC JOBS TABLE

Use the exact columns:

1. S.No.
2. Checkbox
3. Company Name
4. Location
5. Role / Designation / Title
6. Link or URL to Apply
7. Matching Probability
8. Mandatory Documents
9. Generate Documents
10. Download Documents
11. Status
12. Date
13. Attachments
14. Comment

## Status Dropdown

Use:

- NOT APPLIED
- APPLIED
- SCREENING
- INTERVIEW
- WAITING FOR OFFER
- SELECTED
- REJECTED

Default: NOT APPLIED.

Allow manual status changes.

Persist all changes.

## Date Column

Display discovery date by default.

After confirmed application submission, display the application-related date according to the original requirement.

Preserve both discovery date and application date separately in storage.

## Attachments

Allow multiple:

- PDF files
- DOCX files

## Comments

Allow editable user comments.

Persist comments.

Do not overwrite them with system-generated validation errors.

---

# PART 10 — SORTING, FILTERING AND RETENTION

## Default Sorting

Rank combined old and new results by:

1. Highest matching score
2. NOT APPLIED status
3. Most recent relevant date
4. Stable deterministic tie-breaker

## Manual Sorting

Allow sorting/filtering by:

- Status
- Date
- Matching score

Provide Reset to Default.

## Pagination

Page size: 30.

Provide:

- First
- Previous
- Page numbers
- Next
- Last

## Deduplication

Use:

- Requisition ID
- Company
- Title
- Location
- Official URL
- Canonicalized third-party URL
- Posting metadata

Preserve user comments, attachments and statuses when refreshing duplicate listings.

## Retention

Remove jobs older than 60 days from active discovery results.

Retain meaningful application history separately.

---

# PART 11 — VISA SPONSORED JOBS

## Target Regions

- EU
- Middle East
- APAC excluding India
- EMEA
- New Zealand
- Australia
- United States
- Canada

Handle overlapping regions.

## Market Research Prompt

Identify:

1. Up to 10 relevant countries per region.
2. Countries actively recruiting in the candidate's domain.
3. Employers open to candidates from India.
4. Up to 20 relevant target titles.
5. Companies and recruitment agencies supporting international hiring.
6. Sponsorship and relocation evidence.

Companies such as Picnic, Dynatrace and Swisscom may be used as research starting points, not assumed sponsors.

Store country and title research in the international RAG namespace.

## International Job Search

Find newly posted and still-active jobs that match the candidate and explicitly mention:

- Visa sponsorship
- Work permit sponsorship
- Relocation assistance
- Equivalent employer-supported international recruitment

Capture:

- Company
- Role
- Location
- Country
- Job URL
- Sponsorship evidence
- Sponsorship verification date
- JD requirements
- Match score
- Required documents

## Sponsorship Categories

- Explicit visa sponsorship
- Explicit relocation assistance
- Both
- Sponsorship unverified
- No sponsorship identified

Only explicitly supported jobs qualify for the main Visa Sponsored Jobs results.

Do not assume sponsorship from company reputation alone.

## Verification

Apply the same official-company verification rules as Domestic Jobs.

Track official-job verification separately from sponsorship verification.

## Table

Use the same columns, statuses, sorting, pagination, attachments, document generation, download and application workflows as Domestic Jobs.

Make sponsorship evidence accessible from job details.

---

# PART 12 — DOCUMENT CONTENT GENERATION ENGINE

## 12.1 Core Architecture

Separate **AI content generation** from **file rendering**.

This is mandatory.

### Stage A — Content Generation

Use the LLM to generate:

- Tailored resume content
- Tailored cover letter content
- Technical interview content
- Non-technical interview content
- Preparation plans
- Relevant explanations

Store generated content as structured text in PostgreSQL.

### Stage B — File Rendering

Create DOCX, PDF, LaTeX or ZIP files from saved structured content only when requested or required for an application.

Do not make another LLM call merely to change the file format.

## 12.2 Content Storage

For generated resumes and cover letters, save:

- User ID
- Job ID
- Document type
- Generated content
- Structured sections
- Source resume version
- Source JD version/hash
- Prompt version
- Model identifier
- Generation timestamp
- Content version
- Content hash
- Validation status
- Associated metadata

For interviews, store question banks, answers and preparation plans as structured records.

Use an appropriate structured text representation such as JSON plus Markdown.

## 12.3 Content Caching

When a document is requested:

1. Check whether approved generated content already exists.
2. Compare candidate resume version.
3. Compare JD version or content hash.
4. Compare generation prompt version.
5. Compare relevant personalization settings.
6. If unchanged, reuse stored content.
7. If changed, regenerate only the necessary content.
8. Store the new version.
9. Render requested files.

This must reduce unnecessary LLM calls.

---

# PART 13 — ATS RESUME GENERATION

## Resume Generation Prompt

Act as an expert senior recruiter and ATS resume optimization specialist.

Analyze the original CV first without rewriting.

Analyze the target JD.

Generate an ATS-friendly resume tailored to the specific company and role.

Rules:

- Use verified candidate facts only.
- Preserve actual employers and dates.
- Preserve genuine job titles.
- Never invent achievements or metrics.
- Replace generic responsibilities with evidence-based contribution or achievement statements wherever possible.
- Use JD keywords naturally.
- Avoid robotic language.
- Use clear, professional English.
- Use ATS-compatible formatting.
- No complex tables or graphics.

## Resume Format

### 1. Contact Information

Name, phone, email, LinkedIn, portfolio if supplied, location.

### 2. Professional Summary

Maximum 50 words.

Include:

- Experience
- Specialization
- Relevant skills
- Verified achievements
- Relocation statement when applicable and confirmed

### 3. Work Experience

Maximum 350 words.

Reverse chronological order.

Latest role: approximately 5–6 impactful bullets.

Earlier roles: approximately 3–4 concise bullets each, adjusted when necessary.

### 4. Skills

Maximum 50 words.

### 5. Education

Maximum 50 words.

### 6. Certifications and Training

Maximum 50 words.

### 7. Optional Add-ons

Maximum 50 words.

## Target Resume Length

500–600 words.

Prioritize factual completeness when strict limits conflict with accurate career representation.

## Localization

Domestic Jobs:

Use terminology common in Indian recruitment.

Visa Sponsored Jobs:

Use terminology appropriate to the target country.

## Output

Save structured resume text in PostgreSQL.

Generate on demand:

- LaTeX source
- Word (.docx)
- PDF (.pdf)

Do not retain rendered files indefinitely.

---

# PART 14 — COVER LETTER GENERATION

Act as an expert recruiter and professional cover letter writer.

Generate a role-specific cover letter based on the actual JD and candidate resume.

Requirements:

- 220–250 words
- Natural professional language
- Strong opening
- Genuine company relevance
- 3–4 meaningful achievements or contributions
- XYZ method where evidence exists
- 2–3 concise bullet points
- No fabricated metrics
- No generic buzzwords
- Relevant JD keywords
- Relocation statement when confirmed and applicable
- Confident and polite closing

Do not hardcode the role as Test Manager unless the JD specifies that role.

## Output

Store generated text in PostgreSQL.

Render on demand:

- LaTeX
- Word
- PDF

Reuse saved content when unchanged.

---

# PART 15 — DOCUMENT DOWNLOADS

Each job row must contain:

- Generate button
- Download button

## Generate Button

When clicked:

1. Retrieve candidate profile.
2. Retrieve JD.
3. Generate required document content.
4. Validate content.
5. Save structured content.
6. Associate it with the job.
7. Make supported file formats available.

## Download Button

Offer:

- Word
- PDF
- ZIP containing both formats

When clicked:

1. Retrieve stored document content.
2. Render the requested format.
3. Save it temporarily.
4. Generate a secure temporary download link.
5. Return the file.
6. Apply automatic file expiry.

Use clear filenames.

Do not make new LLM calls solely for Word/PDF conversion.

---

# PART 16 — BULK APPLICATION ENGINE

## Selection

Allow multiple job rows to be selected using checkboxes.

Provide Apply button for selected jobs.

## Validation

Before submitting:

1. Verify selected jobs.
2. Check previous application status.
3. Validate job availability.
4. Check mandatory documents.
5. Check uploaded attachments.
6. Check supported submission mechanism.
7. Validate required candidate details.
8. Show submission confirmation.

## Missing Documents

When required documents are missing:

- Highlight row with dark red border.
- Show missing document details.
- Display a validation message near the Comment column.
- Preserve existing user comments.
- Prevent invalid submission.
- Remove red border after correction.

## Application Submission

Attempt submission through a supported and permitted integration or workflow.

Do not bypass CAPTCHAs or website restrictions.

Do not falsely report submission success.

## Confirmed Success

Only after successful submission:

- Set status APPLIED.
- Save application timestamp.
- Update displayed application-related date.
- Preserve date found separately.
- Store confirmation metadata.
- Persist application history.
- Synchronize relevant RAG metadata.

## Failure

- Preserve prior status.
- Show reason.
- Allow appropriate retry.
- Report individual outcomes in bulk operations.

---

# PART 17 — INTERVIEW QUESTIONS MODULE

Provide:

- JD URL input
- JD text input
- Resume upload/selection
- Technical Interview button
- Non-Technical Interview button
- Tabular questions and answers
- Word download
- PDF download

## JD URL Processing

1. Validate URL.
2. Retrieve accessible JD using a permitted method.
3. Extract text.
4. Populate input box.
5. Allow user review.
6. Use finalized JD.

If fetching fails, allow manual paste.

## Resume Selection

Allow:

- Existing active resume
- New PDF
- New DOCX

Do not overwrite the primary resume automatically when a different resume is supplied for interview preparation.

---

# PART 18 — TECHNICAL INTERVIEW ENGINE

## Role

Act as an expert Technical Interviewer, Senior Engineering Hiring Manager, Subject Matter Expert and Technical Interview Preparation Coach.

Analyze the resume and JD.

Extract:

- Job title
- Seniority
- Mandatory skills
- Preferred skills
- Technologies
- Frameworks
- Programming languages
- APIs
- Databases
- Cloud
- DevOps
- Architecture
- Testing
- Leadership
- Domain expertise

Analyze candidate experience, achievements, projects, tools, strengths and gaps.

Create a JD-to-resume skills matching matrix.

## Mandatory Technical Categories

Generate relevant questions across twelve categories.

### 1. Core Technical Fundamentals

Definitions, mechanisms, practical implementation, trade-offs, troubleshooting, limitations and advanced concepts.

### 2. Programming and Coding

Cover relevant:

- Strings
- Arrays
- Hash maps
- Sets
- Stacks
- Queues
- Data structures
- Algorithms
- Async programming
- Error handling
- OOP
- Clean code
- Data processing
- API automation
- Test automation
- Framework development
- Debugging
- Optimization
- Concurrency

For every coding question provide:

1. Problem statement
2. Difficulty
3. Interview rationale
4. Input/output
5. Constraints
6. Examples
7. Complete solution
8. Explanation
9. Time complexity
10. Space complexity
11. Edge cases
12. Test cases
13. Alternative solution where useful
14. Common mistakes
15. Follow-up questions with answers
16. Optimizations

Use the most relevant programming language.

Do not claim code was executed unless actually tested.

### 3. Frameworks and Tools

Include role-relevant:

- Playwright
- Selenium
- Cypress
- JavaScript
- TypeScript
- Python
- REST
- GraphQL
- Postman
- SQL
- Docker
- Kubernetes
- AWS
- Git
- Jenkins
- GitLab CI/CD
- Jira
- Observability tools

### 4. Technical Scenarios

Include:

- Production defects
- Flaky automation
- API failures
- CI/CD failures
- Data consistency problems
- Distributed failures
- Slow test execution
- Environment problems

Provide investigation, root causes, solution, validation, trade-offs and follow-up answers.

### 5. System Design and Architecture

Cover relevant:

- Automation frameworks
- API testing architectures
- Distributed execution
- CI/CD quality gates
- Test data
- Mocking
- Service virtualization
- Cloud testing
- Observability
- Performance
- Reliability
- Security
- AI-assisted testing

Include requirements, architecture, components, flows, technology choices, scalability, risks and trade-offs.

### 6. Resume-Based Technical Deep Dives

Investigate actual:

- Projects
- Responsibilities
- Technologies
- Decisions
- Achievements
- Architecture
- Ownership
- Challenges

### 7. Advanced Debugging

Include logs, SQL failures, performance, CI/CD, distributed failures, race conditions and production incidents.

### 8. Database and SQL

Include:

- Joins
- Subqueries
- Aggregations
- Window functions
- CTEs
- Indexes
- Query optimization
- Transactions
- ACID
- Isolation
- Data integrity
- Database testing

Provide schemas, sample data, SQL solutions and expected output where relevant.

### 9. API and Backend Engineering

Include:

- REST
- GraphQL
- HTTP
- Authentication
- Authorization
- OAuth2
- JWT
- Security
- Pagination
- Rate limits
- Retries
- Idempotency
- Contract testing
- Schemas
- Async processing
- Queues
- Microservices
- Performance
- API automation

### 10. Technical Leadership

Include:

- QA strategy
- Automation strategy
- Release readiness
- Defect leakage
- Risk assessment
- Hiring
- Mentoring
- Engineering maturity
- Stakeholder management
- Quality metrics
- AI adoption

### 11. Domain-Specific Questions

Where supported, include:

- OTT
- Streaming
- DRM
- Fintech
- Banking
- E-commerce
- Healthcare
- SaaS
- Mobile
- Cloud
- AI/ML
- Enterprise software

### 12. AI and Emerging Technologies

Include relevant:

- LLMs
- Prompt engineering
- RAG
- AI agents
- Agentic automation
- Vector databases
- DeepEval
- Model evaluation
- Hallucination prevention
- Grounding
- AI security
- Human-in-the-loop systems

## Company Interview Research

Research publicly reported company interview patterns using credible sources when available.

Distinguish:

- Publicly Reported
- Predicted
- General Preparation

Cite evidence.

Never claim predicted questions were actually asked.

## Prioritization

Weights:

- Mandatory JD relevance: 35%
- Resume relevance: 25%
- Seniority relevance: 20%
- Technical depth/gap: 10%
- Company research: 10%

Redistribute unavailable company-research weight.

Generate Top 30 Must-Prepare Questions.

## Every Technical Answer Must Include

- Unique ID
- Question
- Category
- Topic
- Difficulty
- Priority
- Interview Round
- JD Relevance
- Resume Relevance
- Source Classification
- Qualitative Likelihood
- Why It Matters
- Short Answer
- Detailed Answer
- Real-World Example
- Code/SQL/Architecture when relevant
- Follow-Ups with Answers
- Common Mistakes
- Senior-Level Differentiator

## Preparation Plans

Generate:

- Top 20 critical technical topics
- 7-day plan
- 14-day plan
- 30-day plan
- Skill-gap closure exercises

## Mock Technical Interviews

1. Core Technical Screening — 10 questions
2. Live Coding — 3–5 problems
3. Framework and Architecture — 8–10 questions
4. Troubleshooting — 5–8 scenarios
5. Technical Leadership — 8–10 questions

Include model answers and scoring rubrics.

## Technical Guide Output Order

1. Candidate Summary
2. JD Analysis
3. Skills Matrix
4. Skill Gaps
5. Top 30 Questions
6. Complete Question Bank
7. Coding Solutions
8. Architecture
9. Resume Deep Dives
10. Company Research
11. Troubleshooting
12. Mock Interviews
13. Preparation Plans
14. Readiness Checklist
15. Top 10 Final Revision Questions

Every generated question must have an answer.

---

# PART 19 — NON-TECHNICAL INTERVIEW ENGINE

## Role

Act as an expert HR Interviewer, Talent Acquisition Specialist, Hiring Manager, Behavioral Coach and Executive Communication Specialist.

Generate personalized first-person answers based on verified resume facts, JD, company, target country and seniority.

Prepare for:

- HR screening
- Recruiter screening
- Hiring manager
- Behavioral
- Leadership
- Cultural fit
- International hiring
- Salary
- Final HR

Analyze candidate career history, achievements, strengths, leadership, qualifications and relevant personal preferences.

Research the company when reliable sources are available.

Identify five selling points and five likely interview challenges.

---

# PART 20 — FIVE MANDATORY HR QUESTION GROUPS

## Q1 — Tell Me About Yourself

Recognize equivalent phrasings.

Generate answers covering:

1. Introduction
2. Current role
3. Previous experience
4. Certifications and learning
5. Why company/role/country
6. Strong closing

Required versions:

- 30 seconds
- 60 seconds
- 90 seconds
- 2 minutes
- Leadership-focused
- International-focused when relevant

Use verified facts consistently.

## Q2 — Why Do You Want to Work With Us?

Cover:

- Why company?
- Why role?
- What attracted you?
- Company knowledge
- Why should we hire you?
- Candidate strengths
- Expected contribution

Generate:

- 30–45-second answer
- 60–90-second answer
- 90–120-second answer
- Leadership answer

Base company claims on evidence.

## Q3 — Notice Period

Cover:

- Current notice
- Joining date
- Negotiability
- Early release
- Resignation status
- Serving notice
- Immediate joining
- Relocation timeline

Include templates for:

- 30 days
- 60 days
- 90 days
- Negotiable
- Non-negotiable
- Serving notice
- Immediately available
- International relocation

Show actual personalized information first.

Never fabricate notice details.

## Q4 — Salary Expectations

Cover:

- Current CTC
- Expected CTC
- Salary range
- Expected hike
- Minimum acceptable salary
- Negotiability
- Lower offers
- Recruiter pressure
- Competing offers
- Remote compensation
- International compensation
- Leadership compensation

Provide diplomatic and confident variations.

Never invent numbers.

## Q5 — Do You Have Any Questions for Me?

Prepare relevant questions covering:

- First six months
- Immediate priorities
- Team culture
- Learning and growth
- Team challenges
- Company direction
- Clarifying concerns
- Next hiring steps

Recommend questions by interviewer type.

**Advise asking only 1–3 questions in a single interview.**

Provide a natural closing statement.

---

# PART 21 — ADDITIONAL HR QUESTION CATEGORIES

Generate questions and complete answers for:

### 1. Career Background and Motivation

Job changes, progression, motivation, achievements and career decisions.

### 2. Strengths and Weaknesses

Strengths, genuine weaknesses, feedback, improvement, mistakes and learning.

### 3. Behavioral and Competency-Based

Teamwork, communication, accountability, ownership, adaptation, initiative, problem-solving, conflict, ethics and stakeholders.

### 4. Leadership and Management

Leadership style, delegation, mentoring, underperformance, team conflicts, decision-making, quality versus delivery and distributed teams.

### 5. Work Culture and Collaboration

Remote work, communication, feedback, trust, collaboration, global teams and time zones.

### 6. Company and Role-Specific

Company knowledge, role interest, first 90 days, expected challenges and candidate contributions.

### 7. Difficult and Tricky HR

Overqualification, career gaps, job switching, promotions, career changes, difficult managers, rejection and counteroffers.

### 8. International and Relocation

Why country, visa needs, sponsorship, work authorization, relocation timeline, cultural adaptation and international teams.

### 9. Career Goals

Three-year goals, five-year goals, management versus technical growth, learning and long-term career direction.

### 10. Final HR and Offers

Offer acceptance, compensation, joining, competing opportunities, counteroffers and final concerns.

---

# PART 22 — HR ANSWER STANDARDS

Every question must have:

- Unique HR ID
- Question
- Alternative phrasing
- Category
- Priority
- Interview round
- Interviewer objective
- Personalized first-person answer
- Short answer
- STAR example when appropriate
- Why the answer works
- Follow-up questions with answers
- Mistakes to avoid
- Personalization notes

## HR Prioritization

- JD relevance: 30%
- Resume relevance: 25%
- Seniority: 20%
- Interview round: 15%
- Company relevance: 10%

Generate:

1. Top 25 HR Questions
2. Top 15 Behavioral Questions
3. Top 15 Leadership Questions where relevant
4. Top 10 Challenging HR Questions
5. Top 10 Company Questions
6. Top 10 International Relocation Questions where relevant

Avoid duplicate question content.

## STAR Story Bank

Create stories covering:

1. Achievement
2. Difficult project
3. Critical problem
4. Leadership
5. Conflict
6. Collaboration
7. Process improvement
8. Pressure
9. Failure
10. Business value
11. Unexpected change
12. Stakeholder influence
13. Mentoring
14. Competing priorities
15. Initiative

For each include:

- Title
- Applicable questions
- Situation
- Task
- Action
- Result
- Learning
- Strengths
- 60-second version
- 2-minute version

Where verified evidence is insufficient, label the story as one the candidate must prepare.

Never fabricate actual career events.

---

# PART 23 — HR MOCK INTERVIEWS

Generate:

1. Recruiter Screening — 15–20 minutes
2. Hiring Manager — 30–45 minutes
3. Behavioral Interview — 30–45 minutes
4. Senior Leadership Interview
5. Final HR and Offer Discussion

Include:

- Questions
- Answers
- Follow-ups
- Suggested duration
- Evaluation rubric
- Common mistakes

Provide communication coaching on:

- Natural English
- Confidence
- Speaking pace
- Answer structure
- Avoiding jargon
- Handling interruptions
- Difficult questions
- International communication
- Nervousness
- Clarification

Create:

- One-day emergency plan
- Three-day plan
- Seven-day plan

## HR Guide Output Order

1. Candidate Summary
2. Company/JD Analysis
3. Candidate Fit
4. Five Selling Points
5. Five Challenges
6. Tell Me About Yourself
7. Why Company/Role
8. Notice Period
9. Salary
10. Questions to Ask
11. Top 25 HR Questions
12. Behavioral
13. Leadership
14. Company Questions
15. Difficult Questions
16. International Questions
17. STAR Story Bank
18. Mock Interviews
19. 1/3/7-Day Plans
20. Checklist
21. Top 10 Revision Questions

---

# PART 24 — INTERVIEW CONTENT PERSISTENCE

This is a critical storage optimization requirement.

## 24.1 Save Structured Interview Content

When technical or HR interview material is generated, store:

- User ID
- Resume version
- JD reference/hash
- Company
- Role
- Interview type
- Questions
- Answers
- Categories
- Priorities
- Follow-ups
- Mock interviews
- Preparation plans
- Generation timestamp
- Prompt version
- Content version
- Content hash

Use structured PostgreSQL records.

## 24.2 Regeneration

When a user revisits Interview Questions:

1. Check for existing saved content.
2. Compare relevant resume/JD versions.
3. If unchanged, retrieve existing content.
4. Do not call the LLM again unnecessarily.
5. Allow explicit regeneration when requested.

## 24.3 Word/PDF Export

When Download is clicked:

1. Retrieve saved interview content.
2. Render Word or PDF.
3. Generate secure temporary download.
4. Expire the file after the retention period.
5. Preserve underlying question and answer content.

Every generated question must retain its answer.

---

# PART 25 — AUTOMATIC DOCUMENT CLEANUP

## 25.1 Objective

Minimize persistent binary storage without losing the user's career data, generated content or application history.

## 25.2 Temporary Files

Treat these as temporary:

- Generated resume DOCX
- Generated resume PDF
- Generated cover letter DOCX
- Generated cover letter PDF
- Generated LaTeX files
- Generated interview guide DOCX
- Generated interview guide PDF
- Generated ZIP files
- Intermediate conversion files
- Temporary job description downloads
- Temporary generation artifacts

## 25.3 Retention Rules

Default generated-file retention:

**24 hours from creation.**

Implement:

1. Delete intermediate files after processing when no longer needed.
2. Expire generated downloadable files after 24 hours.
3. Remove expired binaries through scheduled cleanup or storage lifecycle policies.
4. Invalidate temporary download references.
5. Clean up failed and interrupted generation artifacts.
6. Never delete files belonging to another user.
7. Avoid deleting files needed for an active application submission.
8. Allow configurable retention periods.

## 25.4 Logout Behavior

When the user logs out:

- Invalidate authenticated session.
- Revoke access through authenticated download endpoints.
- Clear temporary client-side references.
- Preserve structured generated content.
- Preserve original documents.
- Preserve job records.
- Preserve application history.

Do not rely on logout for binary-file deletion.

The scheduled lifecycle cleanup remains responsible for expiry.

## 25.5 Browser Close Behavior

Closing the tab or browser must not delete permanent user data.

Do not depend on unreliable browser close events to trigger server-side cleanup.

Temporary binaries will expire automatically.

## 25.6 Permanent Data

Do not automatically delete merely because of logout, browser closure or temporary-file expiry:

- Original uploaded resume
- Active candidate profile
- Resume version records
- User-uploaded attachments
- User-uploaded certifications
- Domestic job records
- Visa job records
- Application statuses
- Application history
- User comments
- RAG embeddings
- Saved resume text
- Saved cover letter text
- Saved interview questions
- Saved interview answers
- Saved preparation plans
- Relevant generation metadata

Apply separately defined data-retention and user-deletion policies.

---

# PART 26 — ON-DEMAND DOCUMENT GENERATION

## 26.1 Mandatory Design Principle

**Generate document content once; render file formats whenever needed.**

Do not treat LLM text generation and DOCX/PDF conversion as the same operation.

## 26.2 First Document Generation

When the user clicks Generate:

1. Retrieve active resume.
2. Retrieve JD.
3. Check cached content.
4. If necessary, call LLM.
5. Generate document content.
6. Validate factual accuracy.
7. Store content in PostgreSQL.
8. Associate with user and job.
9. Return generation success.
10. Enable supported downloads.

Do not create every file format immediately unless required for a pending application workflow.

## 26.3 Download Workflow

When the user selects Word:

1. Retrieve stored content.
2. Render DOCX.
3. Return secure download.
4. Delete after expiry.

When PDF is selected:

1. Retrieve stored content.
2. Render PDF.
3. Return secure download.
4. Delete after expiry.

When ZIP is selected:

1. Retrieve stored content.
2. Render necessary formats.
3. Create ZIP.
4. Return secure download.
5. Delete ZIP and temporary binaries after expiry.

## 26.4 Expired Documents

If a binary file expires:

Display:

"Document expired. Click Download to recreate the file."

If saved content remains valid, recreate the file without another LLM request.

If document content must be updated because the source resume/JD has changed, require regeneration or explicit reuse of the prior version.

## 26.5 Application Documents

When a generated document is required for an application:

1. Retrieve saved content.
2. Render necessary format.
3. Attach it to the supported submission process.
4. Keep it available while submission is active.
5. Confirm submission outcome.
6. Apply retention policy after processing.

Preserve appropriate submission evidence and status history.

Do not destroy user-uploaded supporting documents.

---

# PART 27 — STORAGE OPTIMIZATION

Implement:

- Structured text storage in PostgreSQL
- Temporary object storage for binary outputs
- Configurable expiry
- Lifecycle cleanup
- Deduplication
- Hash-based caching
- Orphan-file cleanup
- Secure download URLs
- Storage usage monitoring
- Metadata cleanup
- Version-aware regeneration

Do not store file binaries in the vector database.

Avoid unnecessary repeated copies.

Never delete original resumes or important user attachments under the generated-file cleanup policy.

## Recommended Storage Model

**PostgreSQL**

Store:

- Profiles
- Applications
- Job records
- Generated document text
- Interview content
- Metadata

**Qdrant**

Store:

- Embeddings
- Semantic-search metadata
- Candidate knowledge references

**Object Storage**

Store:

- Original user-uploaded files
- User-uploaded attachments
- Temporary rendered documents

Original uploads and temporary outputs must follow different retention policies.

---

# PART 28 — MODEL AND AI STRATEGY

Choose a configurable primary and fallback LLM.

Selection criteria:

- Instruction following
- Coding quality
- Structured outputs
- Resume analysis
- Interview quality
- Latency
- Cost
- Provider reliability

ChatGPT Plus must not be assumed to include API credits.

Configure API access separately.

Use a suitable embedding model.

Select LangGraph, LangChain or CrewAI based on workflow reliability and efficiency.

Prefer deterministic code for validation, sorting, deduplication and persistence.

Do not use LLM agents for tasks that simple reliable programmatic logic can perform.

---

# PART 29 — PERFORMANCE AND TOKEN OPTIMIZATION

Implement:

1. Resume extraction caching.
2. Incremental resume updates.
3. Embedding deduplication.
4. Efficient RAG retrieval.
5. JD content caching.
6. Job record caching.
7. Company verification caching.
8. Sponsorship evidence caching.
9. Structured-output validation.
10. Prompt templates.
11. Batch processing where appropriate.
12. Async background jobs.
13. Content-hash based regeneration.
14. Saved resume content reuse.
15. Saved cover letter content reuse.
16. Saved interview content reuse.
17. Word/PDF generation without LLM calls.
18. Token usage monitoring.
19. Bounded retries.
20. Safe failure recovery.

Do not sacrifice factual accuracy or meaningful question coverage merely to reduce tokens.

---

# PART 30 — BACKEND ARCHITECTURE

Use Python and FastAPI.

Create modules for:

- Authentication
- Users
- Resumes
- Profile extraction
- RAG
- Job discovery
- Job verification
- Sponsorship verification
- Matching
- Applications
- Document content generation
- Document rendering
- File lifecycle management
- Interview generation
- Background tasks
- Configuration

Use validated APIs and typed schemas.

Enforce user authorization.

Long-running tasks must not block short-lived HTTP requests.

---

# PART 31 — DATABASE DESIGN

Recommended tables:

- Users
- PasswordResetTokens
- Sessions
- Resumes
- ResumeVersions
- CandidateProfiles
- CandidateSkills
- SearchPreferences
- TargetJobTitles
- TargetCountries
- JobListings
- JobSources
- JobVerifications
- SponsorshipEvidence
- JobMatches
- Applications
- ApplicationStatusHistory
- ApplicationAttempts
- Attachments
- GeneratedContent
- GeneratedContentVersions
- TemporaryFiles
- InterviewGuides
- InterviewQuestions
- InterviewSessions
- AuditEvents

## GeneratedContent

Fields should include:

- content_id
- user_id
- job_id, when applicable
- content_type
- structured_content
- markdown_content
- resume_version_id
- jd_hash
- prompt_version
- model_id
- content_hash
- created_at
- updated_at
- validation_status

## TemporaryFiles

Fields should include:

- file_id
- user_id
- content_id
- file_type
- storage_key
- created_at
- expires_at
- deletion_status

Use appropriate indexes, constraints and database migrations.

---

# PART 32 — SECURITY

Implement:

- HTTPS
- Secure password hashing
- HttpOnly sessions
- Server-side authorization
- Rate limiting
- CSRF protection where needed
- File validation
- Safe parsing
- Secrets management
- Private object storage
- Secure download access
- User data isolation
- Audit history
- User data deletion controls

Treat resumes, JDs and retrieved websites as untrusted input.

Defend against prompt injection.

Never expose secrets to the frontend.

Use short-lived signed URLs when appropriate.

---

# PART 33 — ANTI-HALLUCINATION POLICY

Apply the following process:

## Step 1 — Extract Facts

Use:

- User input
- Uploaded resumes
- Approved structured profile
- Verified job sources
- Credible company sources
- Other identified evidence

## Step 2 — Identify Unknowns

Explicitly identify missing or uncertain information.

## Step 3 — Generate

Use verified facts for factual outputs.

Clearly classify estimates, predictions and hypothetical examples.

## Step 4 — Validate

Check for:

- Fabricated resume achievements
- Unsupported metrics
- Incorrect employers
- Incorrect dates
- Duplicate jobs
- False sponsorship
- False company verification
- Incorrect application statuses
- Unsupported mandatory documents
- Inconsistent generated content

Where facts cannot be established, say:

"Insufficient information to determine."

Where appropriate label:

"Inference (low confidence)."

Maintain evidence classifications:

- Verified
- User-provided
- Inferred
- Hypothetical
- Unknown

---

# PART 34 — TESTING

Create automated tests for all critical workflows.

## Authentication Tests

- Registration
- Invalid email
- Duplicate email
- Duplicate username
- Password validation
- Password hashing
- Login
- Invalid login
- Password reset
- Session expiration
- Logout
- Authorization
- User isolation

## Resume Tests

- PDF parsing
- DOCX parsing
- Markdown conversion
- Profile extraction
- Experience calculation
- Versioning
- Incremental RAG
- Deduplication

## Job Tests

- Domestic filtering
- International filtering
- Official verification
- Sponsorship verification
- Match scoring
- Sorting
- Pagination
- Retention
- Deduplication

## Application Tests

- Single selection
- Bulk selection
- Missing documents
- Red border validation
- Attachments
- Successful submission
- Failed submission
- Partial batch failure
- Status persistence
- Date changes

## Document Tests

- Content generation
- Content persistence
- Cache reuse
- Resume accuracy
- Cover letter accuracy
- Word rendering
- PDF rendering
- LaTeX rendering
- ZIP rendering
- Download integrity
- Expiry
- Regeneration without LLM

## Interview Tests

- JD URL extraction
- Pasted JD
- Resume selection
- Technical questions
- Non-technical questions
- Answer completeness
- Question IDs
- Mock interviews
- Preparation plans
- Saved content retrieval
- Word/PDF export

## Cleanup Tests

- 24-hour expiration
- Original files preserved
- User attachments preserved
- Saved content preserved
- Expired downloads blocked
- Files recreated from stored content
- Logout access revoked
- No cross-user deletion
- Active submissions protected
- Orphan-file cleanup

## Frontend Tests

- Registration form
- Login form
- Navigation
- Tables
- Filters
- Pagination
- Downloads
- Responsive layout
- Accessibility
- Loading states
- Error states

---

# PART 35 — VERCEL DEPLOYMENT

Deploy the React/Vite frontend to Vercel.

Target URL:

https://jobsearchandtracker.vercel.app/

Use a suitable Python-compatible backend hosting environment for operations that exceed Vercel serverless execution constraints.

Configure:

- Backend API URL
- Database
- Vector database
- LLM providers
- Embeddings
- Authentication
- Object storage
- Background worker
- Cleanup scheduler
- Email provider
- Vercel credentials where required

Create `.env.example`.

Never commit real credentials.

## Deployment Verification

Verify:

1. Frontend build
2. Backend startup
3. Registration
4. Login
5. Password recovery
6. Database connection
7. Vector database connection
8. Resume upload
9. Job search
10. Document content generation
11. Temporary file downloads
12. Interview generation
13. Protected APIs
14. Cleanup configuration
15. Frontend/backend connectivity
16. Production URL

Do not declare deployment successful without verification.

---

# PART 36 — DOCUMENTATION

## README.md

Include:

- Project overview
- Features
- Requirements
- Installation
- Frontend setup
- Backend setup
- Database setup
- Vector database setup
- LLM configuration
- Registration
- Login
- Password reset
- Resume upload
- Domestic jobs
- Visa jobs
- Application tracking
- Document generation
- Interview preparation
- Downloads
- Automatic cleanup
- Regeneration
- Testing
- Deployment
- Troubleshooting
- Known limitations

## Architecture.md

Include:

- System architecture
- Frontend design
- Backend modules
- Authentication
- Database schema
- Vector database
- Resume ingestion
- Chunking
- RAG
- Job search
- Verification
- Matching
- Applications
- Structured content persistence
- On-demand document rendering
- File cleanup
- Security
- Model orchestration
- Performance
- Deployment
- Architectural trade-offs

Include useful data-flow and architecture diagrams.

---

# PART 37 — CHANGE MANAGEMENT

Whenever functionality changes:

1. Identify affected frontend files.
2. Identify affected backend files.
3. Update shared data contracts.
4. Update migrations when necessary.
5. Update tests.
6. Update README.md.
7. Update Architecture.md.
8. Update configuration documentation.
9. Run regression tests.
10. Verify existing features remain operational.

---

# PART 38 — IMPLEMENTATION PHASES

## Phase 1 — Architecture and UI

- Analyze requirements.
- Select architecture.
- Compare vector databases.
- Select embedding model.
- Select LLMs.
- Select orchestration framework.
- Present three light-mode UI previews.
- Record architecture decisions.

## Phase 2 — Authentication

- Registration
- Username/password login
- Password recovery
- Sessions
- Logout
- User data isolation

## Phase 3 — Resume and RAG

- Upload
- Parsing
- Markdown conversion
- Extraction
- Embeddings
- Incremental RAG
- Versioning

## Phase 4 — Domestic Jobs

- Title research
- Search
- Verification
- Matching
- Persistence
- Table
- Sorting
- Filtering
- Pagination

## Phase 5 — Visa Sponsored Jobs

- Country research
- Title research
- International search
- Sponsorship verification
- Tracking

## Phase 6 — Content and Application Engine

- Resume content generation
- Cover letter content generation
- PostgreSQL storage
- LaTeX rendering
- DOCX/PDF rendering
- ZIP downloads
- Attachments
- Submission workflows
- Status tracking

## Phase 7 — Interview Engine

- Technical questions
- Non-technical questions
- Complete answers
- Company research
- Mock interviews
- Preparation plans
- Structured content storage
- Downloadable guides

## Phase 8 — Storage Optimization

- Temporary object storage
- On-demand rendering
- 24-hour expiration
- Cleanup scheduler
- Orphan cleanup
- Cache reuse
- Regeneration without unnecessary LLM calls

## Phase 9 — Testing and Deployment

- Automated tests
- Security validation
- Performance improvements
- Documentation
- Vercel deployment
- Production verification

---

# PART 39 — DEFINITION OF DONE

A feature is complete only when:

- Required UI exists.
- Backend functionality exists.
- Frontend/backend are integrated.
- Data is validated.
- Records persist correctly.
- Security is enforced.
- Errors are handled.
- Relevant tests pass.
- Documentation is updated.
- The workflow behaves correctly.

Do not consider non-functional buttons complete.

Do not present mock data as live results.

Do not report application success without confirmation.

Do not claim automatic cleanup works unless the expiry and cleanup mechanisms are implemented and tested.

---

# PART 40 — FINAL NON-NEGOTIABLE REQUIREMENTS

1. Preserve the Career Assistant name.
2. Registration requires Email, Username and Password only.
3. Login requires Username and Password.
4. Implement secure password recovery.
5. Enforce user-specific data isolation.
6. Accept PDF and Word resumes.
7. Convert resumes into Markdown.
8. Extract verified professional profiles.
9. Build persistent RAG knowledge.
10. Support incremental resume updates.
11. Prevent duplicate embeddings.
12. Provide Domestic Jobs.
13. Provide Visa Sponsored Jobs.
14. Provide Interview Questions.
15. Discover relevant job titles.
16. Search current job opportunities.
17. Verify company listings where possible.
18. Preserve clearly labeled third-party-only listings.
19. Require explicit sponsorship evidence for visa-sponsored jobs.
20. Generate explainable CV-to-JD matching scores.
21. Merge old and new jobs.
22. Remove duplicate listings.
23. Preserve all required job table columns.
24. Support manual sorting and filtering.
25. Use 30-row pagination.
26. Apply 60-day active-job retention.
27. Preserve all required application statuses.
28. Support multiple job attachments.
29. Generate ATS-compatible resumes.
30. Generate tailored cover letters.
31. Preserve LaTeX output.
32. Support Word, PDF and ZIP downloads.
33. Store generated resume content in PostgreSQL.
34. Store generated cover letter content in PostgreSQL.
35. Store generated interview content in PostgreSQL.
36. Generate binary files only when needed.
37. Avoid repeat LLM calls for file-format conversion.
38. Automatically expire temporary generated binaries after 24 hours.
39. Keep original uploaded documents and attachments.
40. Preserve permanent user and application data on logout.
41. Support regeneration from stored content.
42. Secure temporary downloads.
43. Support bulk job selection and submission.
44. Validate mandatory attachments.
45. Highlight invalid rows with dark red borders.
46. Update APPLIED only after verified submission.
47. Preserve application history.
48. Generate comprehensive technical questions and answers.
49. Include coding solutions.
50. Include architecture and troubleshooting scenarios.
51. Generate comprehensive HR questions and answers.
52. Preserve all five mandatory HR question groups.
53. Generate STAR examples.
54. Generate mock interviews.
55. Generate interview preparation plans.
56. Display interview questions and answers in tables.
57. Support Word and PDF interview-guide exports.
58. Use React and Vite.
59. Use Python.
60. Use a suitable free or free-tier vector database.
61. Support configurable primary and fallback LLMs.
62. Optimize token usage and latency.
63. Use light-mode UI only.
64. Provide three UI design previews.
65. Protect private data and credentials.
66. Maintain README.md.
67. Maintain Architecture.md.
68. Update related files after changes.
69. Deploy the frontend to the requested Vercel URL.
70. Never fabricate candidate facts, job listings, sponsorship evidence or application submission results.
71. Never conceal unfinished integrations with mock success messages.
72. Preserve all original core functionality.

---

# PART 41 — EXECUTION INSTRUCTIONS

You are responsible for implementing Career Assistant according to this specification.

Proceed as follows:

**Step 1:** Analyze and preserve every requirement.

**Step 2:** Design the application architecture.

**Step 3:** Select and justify the vector database, embedding model, primary LLM, fallback LLM, database and orchestration framework.

**Step 4:** Present three professional light-mode UI previews.

**Step 5:** Implement secure registration and username/password login.

**Step 6:** Implement resume ingestion, structured candidate profiles and incremental RAG.

**Step 7:** Implement Domestic Jobs and Visa Sponsored Jobs.

**Step 8:** Implement job verification, sponsorship verification and CV matching.

**Step 9:** Implement application tracking and supported submissions.

**Step 10:** Implement generated resume and cover letter content storage in PostgreSQL.

**Step 11:** Implement on-demand Word, PDF, LaTeX and ZIP rendering.

**Step 12:** Implement comprehensive technical and non-technical interview preparation.

**Step 13:** Store generated interview questions, answers and plans as structured content.

**Step 14:** Implement automatic 24-hour temporary document cleanup.

**Step 15:** Ensure files can be recreated from saved content without unnecessary LLM calls.

**Step 16:** Optimize performance, security and token consumption.

**Step 17:** Run automated tests and fix defects.

**Step 18:** Generate README.md and Architecture.md.

**Step 19:** Deploy the frontend to Vercel and verify the application.

**Step 20:** Provide a truthful final development report listing completed features, tests, integrations, limitations and deployment status.

## FINAL INSTRUCTION

Build **Career Assistant** as a complete, secure, efficient, production-oriented AI-powered career management platform.

Do not remove any core functionality.

Use intelligent RAG, reliable job verification, persistent user data, structured AI content storage, on-demand document rendering and automatic temporary-file cleanup.

Optimize for performance, storage efficiency, low unnecessary LLM usage, accuracy, maintainability and professional user experience.

Never claim functionality works unless it has been implemented and validated.