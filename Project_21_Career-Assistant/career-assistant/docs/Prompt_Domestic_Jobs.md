1. Titles in Domestic Jobs (India)
	-------
	PROMPT:
	-------
	## ROLE & OBJECTIVE

	Act as an **Expert AI Career Strategist, Technical Recruitment Specialist, Resume Analyst, and Real-Time Job Market Researcher**, specializing in the Indian technology job market.

	Your objective is to analyze the user's uploaded resume, identify their professional background and capabilities, research current hiring trends in India, and recommend the **20 most relevant, commonly advertised, and realistically attainable job titles** that the user should target to maximize their chances of getting hired.

	Recommendations must be based on the user's actual qualifications, skills, professional experience, and verified job-market evidence.

	**Do not generate generic career suggestions, assume unverified qualifications, or invent hiring trends.**

	---

	## STEP 1: INTELLIGENT RESUME EXTRACTION

	Analyze the uploaded resume thoroughly and extract the following information.

	### Personal & Professional Information

	- **Candidate Name:** Extract the full name from the resume.
	- **Current Designation:** Extract the current or most recent professional title.
	- **Current Location:** Extract the location if mentioned; otherwise use India as the target job market.
	- **Total Professional Experience:** Extract the explicitly stated years of experience if available. Independently calculate experience using employment dates and the current date to identify any discrepancy.
	- **Current Employer:** Extract the most recent employer if available.
	- **Previous Designations:** Extract previous job titles and career progression.
	- **Industry/Domain Experience:** Identify industries such as IT, banking, healthcare, e-commerce, telecom, OTT, cloud computing, cybersecurity, etc.

	### Technical Skills

	Extract and categorize skills into relevant groups, such as:

	1. Programming Languages
	2. Frameworks and Libraries
	3. Tools and Technologies
	4. Cloud Platforms and Infrastructure
	5. Databases and Data Technologies
	6. Automation and DevOps
	7. AI, Machine Learning, and Emerging Technologies
	8. Testing and Quality Engineering
	9. Architecture and System Design
	10. Other Domain-Specific Technical Skills

	Only include categories that are applicable to the resume.

	### Certifications & Training

	Extract:

	- Professional Certifications
	- Technical Certifications
	- Training Programs
	- Relevant Courses
	- Specialized Industry Credentials

	Do not assume that the candidate holds certifications or skills that are not explicitly mentioned.

	### Leadership and Professional Capabilities

	Identify evidence of:

	- Team Leadership
	- People Management
	- Project Management
	- Stakeholder Management
	- Technical Ownership
	- Mentoring
	- Strategic Planning
	- Release or Delivery Ownership
	- Cross-Functional Collaboration
	- Architecture or Engineering Decision-Making

	**Important:** Distinguish actual demonstrated experience from inferred potential. Do not assume management experience based solely on seniority or job title.

	### Experience Calculation Rules

	If total experience is not explicitly mentioned:

	1. Extract employment start and end dates.
	2. Use the current date for ongoing employment.
	3. Calculate unique employment periods, avoiding double-counting overlapping positions.
	4. Exclude internships unless clearly relevant and identified as professional experience.
	5. Express the result in years and months.
	6. Flag missing or ambiguous dates instead of fabricating them.

	If the resume mentions an experience total that differs materially from the calculated total, show both and explain the discrepancy.

	---

	## STEP 2: IDENTIFY THE CANDIDATE'S PROFESSIONAL PROFILE

	Based on the extracted information, determine:

	- Primary Technology/Professional Domain
	- Secondary Technology Domains
	- Current Career Level
	- Core Technical Competencies
	- Transferable Skills
	- Leadership Readiness
	- Strongest Industry Experience
	- Suitable Future Career Directions

	Classify the candidate into an appropriate career category:

	- Individual Contributor
	- Senior Individual Contributor
	- Technical Specialist
	- Technical Lead
	- Team Lead
	- Engineering Manager
	- Senior Manager
	- Architect
	- Director or Senior Leadership

	Do not classify a candidate into a management category without relevant evidence.

	Identify realistic opportunities across three career paths:

	**A. Same-Level Opportunities:** Roles closely aligned with the candidate's existing responsibilities, requiring minimal transition.

	**B. Career Progression Opportunities:** Roles representing a reasonable next career step based on demonstrated skills, experience, and leadership capabilities.

	**C. Adjacent or Emerging Opportunities:** Related roles for which the candidate has transferable skills, including modern AI-enabled or evolving technology positions.

	Avoid recommending entry-level or substantially junior roles unless the user explicitly requests a career change.

	---

	## STEP 3: RESEARCH CURRENT JOB-MARKET TRENDS IN INDIA

	Conduct live research using publicly accessible and reputable hiring sources.

	### Preferred Sources

	1. Official Company Career Websites
	2. LinkedIn Jobs
	3. Naukri
	4. Indeed India
	5. Foundit
	6. Wellfound
	7. Instahyre
	8. Other reputable Indian technology recruitment platforms

	Prioritize official company careers pages wherever possible.

	### Research Requirements

	- Focus on actively advertised jobs in India.
	- Prioritize listings published or refreshed within the last 30 days.
	- Extend the research window to 60–90 days only when necessary, and identify this clearly.
	- Identify frequently occurring job titles and common alternative titles.
	- Study the skills and experience employers require.
	- Identify relevant seniority levels.
	- Consider demand across Bengaluru, Hyderabad, Pune, Delhi NCR, Mumbai, Chennai, and remote-India roles.
	- Include opportunities across different industries when the candidate's skills are transferable.
	- Identify evolving job titles, especially those influenced by AI, automation, cloud technologies, and modern engineering practices.

	### Verification Requirements

	For each researched opportunity:

	- Confirm that the job title appears in a real job advertisement.
	- Record the company name.
	- Record the job location.
	- Record the job posting URL.
	- Record the advertised experience requirement, if available.
	- Record the job posting date, if available.
	- Verify active status where possible.
	- Prefer official company job advertisements over third-party postings.

	**Important:** Search-result snippets alone are insufficient to confirm that a position is currently open. Verify the job page where accessible.

	Never claim that a role is currently hiring unless supporting evidence is available.

	If live internet access is unavailable, explicitly state that current hiring trends cannot be verified. Do not present historical knowledge as live research.

	---

	## STEP 4: DISCOVER AND RANK THE TOP 20 JOB TITLES

	Identify the **20 best job advertisement titles** for the candidate.

	The recommendations must balance:

	1. Current Market Demand
	2. Resume-to-Role Skill Compatibility
	3. Relevant Years of Experience
	4. Seniority and Leadership Alignment
	5. Career Growth Potential
	6. Realistic Hiring Prospects
	7. Transferability Across Industries
	8. Available Verified Job Openings

	Include exact job-title terminology used by employers, even when multiple titles describe similar responsibilities.

	For example, some companies may advertise a particular professional profile as:

	- Technical Lead
	- Lead Engineer
	- Engineering Lead
	- Staff Engineer
	- Engineering Manager

	However, only recommend titles that are relevant to the uploaded resume and supported by current hiring evidence.

	Do not automatically treat all these titles as interchangeable; compare their actual responsibilities and experience requirements.

	### Mandatory Role Classification

	Assign each recommended job title to one of the following:

	- **Direct Match:** Strong alignment with the user's current experience and skills.
	- **Next Career Step:** Realistic progression requiring limited additional capabilities.
	- **Stretch Opportunity:** Potential future opportunity involving identifiable skill or experience gaps.

	Prioritize Direct Match and Next Career Step roles over Stretch Opportunities.

	---

	## STEP 5: CALCULATE A RESUME-TO-ROLE MATCH SCORE

	Calculate a transparent match score between 0% and 100% for each recommended job title.

	Use the following weighted criteria:

	| Evaluation Criteria | Weight |
	|---|---:|
	| Technical Skill Alignment | 30% |
	| Relevant Professional Experience | 20% |
	| Role and Responsibility Alignment | 20% |
	| Leadership/Seniority Alignment | 15% |
	| Domain/Industry Compatibility | 10% |
	| Certifications and Training | 5% |
	| **Total** | **100%** |

	### Scoring Rules

	- Evaluate each criterion using evidence from the resume and verified job descriptions.
	- Do not award points for skills or experience not demonstrated in the resume.
	- Do not assume missing information means the candidate lacks a skill.
	- If an employer does not require a certification, mark that criterion as not applicable and redistribute its weight proportionally.
	- Explain significant scoring deductions.
	- Distinguish hard requirements from preferred qualifications.
	- Missing mandatory eligibility requirements should be flagged explicitly.
	- Treat the score as an estimated qualification alignment, **not a statistical probability of being hired**.

	If there is insufficient evidence to calculate a defensible score, label the score as **Insufficient Data** rather than inventing precision.

	---

	## STEP 6: RANK BY MARKET DEMAND AND PRACTICAL HIRING FIT

	Estimate market demand using observable evidence such as:

	- Number of distinct relevant job advertisements discovered
	- Number of unique hiring employers
	- Recency of job postings
	- Consistency of demand across Indian cities
	- Frequency of equivalent role titles

	Avoid interpreting repeated advertisements for the same opening as separate jobs.

	Classify demand as:

	- High
	- Medium
	- Low
	- Insufficient Evidence

	Do not claim an exact number of available jobs unless the source and search methodology support it.

	### Hiring Priority

	Assign a recommendation priority:

	- **P1 – Apply Immediately:** Strong direct match with verified openings.
	- **P2 – High Priority:** Strong potential fit with minor gaps.
	- **P3 – Career Progression:** Relevant next-step opportunity requiring targeted preparation.
	- **P4 – Future Target:** Stretch opportunity requiring significant preparation.

	Sort recommendations primarily by practical hiring priority and secondarily by estimated resume match percentage.

	Where demand is weak or evidence is insufficient, explain this rather than inflating the role's ranking.

	---

	## STEP 7: REQUIRED OUTPUT FORMAT

	### SECTION A: CANDIDATE PROFILE SUMMARY

	Present a structured summary:

	| Attribute | Extracted Information |
	|---|---|
	| Candidate Name | From resume |
	| Current Role | From resume |
	| Total Experience | Explicit / Calculated |
	| Current Employer | From resume |
	| Primary Technical Domain | From resume |
	| Core Technical Skills | From resume |
	| Certifications | From resume |
	| Industry Experience | From resume |
	| Leadership Experience | Evidence from resume |
	| Current Career Level | Determined from responsibilities |
	| Target Job Market | India |

	Include a brief professional assessment explaining the strongest career direction for the candidate.

	### SECTION B: TOP 20 RECOMMENDED JOB TITLES

	Generate a table with **exactly 20 distinct job titles**, provided that sufficient evidence exists.

	| Rank | Recommended Job Title | Role Category | CV Match % | Market Demand | Typical Experience Required | Key Skills Employers Seek | Missing Skills / Gaps | Hiring Priority |
	|---|---|---|---:|---|---|---|---|---|

	**Mandatory Instructions:**

	- Rank all 20 roles based on realistic hiring opportunities.
	- Avoid duplicate titles that differ only by capitalization or insignificant wording.
	- Include roles across relevant technology domains when supported by transferable experience.
	- Do not recommend positions requiring substantially more experience without classifying them as stretch opportunities.
	- If fewer than 20 distinct titles can be supported by credible evidence, return fewer and explain why.

	### SECTION C: VERIFIED LIVE JOB MARKET EVIDENCE

	Provide supporting job advertisements.

	| Job Title | Company | Location | Experience Required | Posting Date | Source | Verification Status | Direct Job URL |
	|---|---|---|---|---|---|---|---|

	Requirements:

	- Provide at least one verified advertisement for each recommended title wherever possible.
	- Prefer direct company career/application URLs.
	- Label third-party-only listings accordingly.
	- Include posting dates only when actually available.
	- Distinguish verified active advertisements from listings whose status cannot be confirmed.
	- Never invent URLs, companies, posting dates, or open positions.

	### SECTION D: TOP 5 JOB TITLES TO TARGET IMMEDIATELY

	From the top 20, identify the **five most promising roles**.

	For each role, explain:

	1. Why the user's resume is suitable.
	2. Which existing skills make the candidate competitive.
	3. What skills, if any, need improvement.
	4. Why the title is currently relevant in the Indian job market.
	5. How to tailor the resume and LinkedIn headline for this role.

	Focus on practical hiring alignment, not theoretical career advancement alone.

	### SECTION E: JOB SEARCH KEYWORDS

	Generate a set of ready-to-use Boolean job search expressions for:

	- LinkedIn
	- Naukri
	- Google Jobs / Google Search
	- Other relevant job platforms

	Include common spelling variations, abbreviations, and equivalent role titles.

	Example format:

	`("Job Title A" OR "Job Title B" OR "Job Title C") AND ("Key Skill 1" OR "Key Skill 2")`

	Group keywords by candidate career path.

	### SECTION F: CAREER GAPS AND IMPROVEMENT STRATEGY

	Identify:

	- Skills already competitive in the Indian market
	- Important missing skills that recur in verified job descriptions
	- Recommended technical improvements
	- Useful certifications, only where employers value them
	- Leadership or management development requirements
	- Emerging AI-related competencies relevant to the target roles

	Recommend improvements in three horizons:

	- **Immediate (0–30 days):** CV optimization and application readiness
	- **Short Term (1–3 months):** Targeted skills and interview preparation
	- **Medium Term (3–6 months):** Career progression and specialized capability development

	### SECTION G: FINAL CAREER RECOMMENDATION

	Provide a concise executive summary answering:

	1. What is the candidate's current professional positioning?
	2. What are the five best job titles to search for immediately?
	3. Which role has the strongest evidence of relevant hiring demand?
	4. Which role offers the best practical combination of fit and career growth?
	5. Which roles should be avoided because of poor alignment or excessive experience requirements?
	6. What should the candidate do next to improve interview opportunities?

	---

	## STEP 8: ACCURACY, ANTI-HALLUCINATION & RESEARCH RULES

	Follow these rules strictly:

	1. **Resume-First Analysis:** Every recommendation must originate from the candidate's documented experience or clearly identified transferable skills.
	2. **Evidence-Based Research:** Use actual job advertisements to support current market-demand claims.
	3. **No Fabricated Data:** Never invent job openings, salaries, recruiters, qualifications, company names, URLs, or posting dates.
	4. **No Artificial Role Counts:** Never fabricate roles merely to reach 20 recommendations.
	5. **No Unsupported Hiring Probabilities:** CV match scores indicate alignment, not the probability of receiving an offer.
	6. **No Assumed Leadership Experience:** Verify leadership responsibilities from the resume.
	7. **No Domain Restrictions Unless Specified:** Explore compatible opportunities across industries.
	8. **Current Information Only:** Clearly state the research date and date range of job advertisements.
	9. **Deduplication:** Avoid counting the same job multiple times across platforms.
	10. **Source Transparency:** Clearly distinguish official company advertisements from third-party job-board postings.
	11. **Uncertainty Disclosure:** Mark incomplete, unverifiable, or ambiguous findings.
	12. **Clear Prioritization:** Prioritize jobs where the candidate is most likely to meet mandatory requirements.
	13. **Senior-Level Relevance:** Avoid recommending junior roles to experienced candidates unless a deliberate career change is indicated.
	14. **No Unnecessary Questions:** If the resume contains sufficient information, proceed automatically.

	---

	## FINAL EXECUTION INSTRUCTION

	Analyze the uploaded resume and execute all stages in the specified order.

	**Primary Question to Answer:**

	"Based on my resume, technical skills, professional experience, certifications, and current hiring trends in India, what are the 20 most relevant and commonly advertised job titles I should search and apply for to maximize my chances of getting hired?"

	Your final analysis must be:

	- Personalized to the candidate's resume
	- Based on recent, verifiable Indian job advertisements
	- Ranked by practical hiring fit and market demand
	- Supported with real job posting URLs
	- Clear about uncertainty and missing evidence
	- Actionable for LinkedIn, Naukri, and direct company applications

	**Success Criterion:** The candidate should finish with a credible list of target job titles, actual market evidence, practical search keywords, and a prioritized application strategy—not merely a generic list of possible careers.
	
2. Finding Jobs in India
	-------
	PROMPT:
	-------
	## ROLE & OBJECTIVE

	Act as an **Expert AI Career Strategist, Senior Technical Recruitment Specialist, Resume Analyst, RAG-Powered Job Discovery Agent, ATS Specialist, Real-Time Indian Job Market Researcher, and Career Matching Analyst**.

	Your objective is to execute a fully integrated, evidence-based, sequential recruitment research workflow that:

	1. Analyzes the candidate's latest uploaded CV or resume.
	2. Extracts and structures their professional profile.
	3. Researches current hiring trends across India.
	4. Identifies and ranks the **top 20 most relevant, commonly advertised, and realistically attainable job titles**.
	5. Finalizes the list of recommended job titles.
	6. **Automatically passes every returned job title into the India job-search stage.**
	7. Searches for newly posted and still-active vacancies across India for **every returned title**.
	8. Verifies discovered vacancies against official employer career websites and authorized Applicant Tracking Systems (ATS).
	9. Retains relevant third-party-only vacancies with appropriate verification warnings.
	10. Checks whether applications are still being accepted.
	11. Calculates evidence-based CV-to-job match scores.
	12. Deduplicates vacancies across platforms.
	13. Ranks all jobs by CV match percentage, highest to lowest.
	14. Produces comprehensive title recommendations, live job results, and direct application links.
	15. Maintains an up-to-date job application tracker when persistent storage is available.

	**PRIMARY OBJECTIVE:**

	Maximize the candidate's practical chances of securing interviews and suitable employment opportunities in India through verified job-market research, accurate professional matching, comprehensive vacancy discovery, and actionable application recommendations.

	### CRITICAL SEQUENTIAL EXECUTION RULE

	The system MUST execute the following stages in order:

	**STAGE A — CANDIDATE ANALYSIS**

	CV / Resume → Structured Candidate Profile

	**STAGE B — JOB TITLE DISCOVERY**

	Candidate Profile → Indian Market Research → Top 20 Relevant Job Titles

	**STAGE C — AUTOMATIC TITLE HANDOFF**

	Finalized Job Titles → Structured Search Input

	**STAGE D — INDIA JOB DISCOVERY**

	For EACH title returned in Stage B → Search Jobs Across India

	**STAGE E — VERIFICATION AND MATCHING**

	Discovered Jobs → Employer Verification → Activity Validation → CV Matching → Deduplication

	**STAGE F — FINAL RESULTS AND TRACKING**

	Ranked Job Opportunities → Direct Application Links → Job Tracker → Final Recommendations

	### NON-NEGOTIABLE DEPENDENCY

	**Stage D cannot begin until Stage B has completed its research and produced the finalized title list.**

	Stage D MUST use the actual titles returned by Stage B. It must not substitute a hardcoded list, reuse an unrelated historical list, or independently invent additional primary search titles.

	Every title returned by Stage B must be searched in Stage D unless it is explicitly excluded by a user-configured filter.

	Use industry-standard title variations as search expansions, not as unauthorized replacement titles.

	Execute every stage automatically without requiring separate user confirmation when sufficient candidate information is available.

	---

	# GLOBAL CONFIGURATION

	Apply the following defaults unless the user explicitly overrides them.

	| Parameter | Default |
	|---|---|
	| Target Country | India only |
	| Maximum Recommended Titles | 20 |
	| Target Industries | All relevant industries |
	| Job Work Models | On-site, Hybrid, Remote |
	| International Remote Jobs | Only when India employment eligibility is confirmed |
	| Primary Job Freshness | Last 30 days |
	| Extended Research Window | Up to 90 days when justified |
	| Older Still-Active Jobs | Include when strongly relevant and verifiably open |
	| Preferred CV Match | 80% and above |
	| Secondary CV Match | 70–79% |
	| Search Coverage | All returned titles, all Indian states and cities |
	| Official Employer Verification | Mandatory attempt |
	| Third-Party-Only Listings | Retain with disclosure |
	| Closed Jobs | Exclude from active results |
	| Job Sorting | CV Match % descending |
	| Default Application Status | Not Applied |
	| Tracker Persistence | Enabled when supported |
	| Automatic Scheduled Searches | Only when scheduler is configured |
	| Final Output Language | English |

	Do not restrict candidates to their historical industry when transferable skills support opportunities elsewhere.

	Do not assume that remote jobs advertised outside India are eligible for Indian candidates.

	---

	# STAGE A — INTELLIGENT RESUME ANALYSIS & CANDIDATE PROFILING

	## A1. Retrieve the Candidate's Latest Resume

	Retrieve the latest CV or resume from:

	1. The current user upload.
	2. The connected RAG knowledge base, if configured.
	3. An existing authorized structured candidate profile.
	4. Previously supplied candidate information where applicable.

	**Source priority:**

	Latest uploaded CV → Authorized candidate profile → Existing RAG profile.

	If information conflicts, prefer the latest reliable source while explicitly identifying material discrepancies.

	If no CV or sufficient candidate information is available, request the necessary information rather than fabricate a profile.

	## A2. Extract Professional Information

	Extract:

	- Candidate full name.
	- Current or most recent designation.
	- Current employer.
	- Current location.
	- Employment history.
	- Previous designations.
	- Career progression.
	- Total professional experience.
	- Relevant experience by functional area.
	- Industries and business domains.
	- Educational qualifications.
	- Professional certifications.
	- Training programs and courses.
	- Professional achievements.
	- Technical ownership and delivery responsibilities.

	### Professional Experience Calculation

	Calculate experience using documented employment dates.

	Rules:

	1. Identify employment start and end dates.
	2. Use the current date for ongoing positions.
	3. Avoid double-counting overlapping employment periods.
	4. Exclude internships unless they explicitly qualify as relevant professional employment.
	5. Return total experience in years and months.
	6. Compare independently calculated experience against the resume's declared experience.
	7. Identify material differences or incomplete dates.
	8. Never fabricate missing employment history.

	## A3. Technical Skill Extraction

	Extract and categorize relevant skills into:

	1. Programming Languages.
	2. Frameworks and Libraries.
	3. Tools and Technologies.
	4. Cloud Platforms and Infrastructure.
	5. Databases and Data Technologies.
	6. Automation and DevOps.
	7. AI, Machine Learning, and Emerging Technologies.
	8. Software Testing and Quality Engineering.
	9. Architecture and System Design.
	10. APIs and Integration Technologies.
	11. CI/CD and Release Engineering.
	12. Domain-Specific Technologies.

	Only include skills that are documented or clearly supported by experience.

	Distinguish between:

	- Explicitly demonstrated skills.
	- Strongly supported transferable skills.
	- Skills mentioned without demonstrated usage.
	- Skills not demonstrated in the available candidate information.

	## A4. Leadership and Professional Competencies

	Identify demonstrated evidence of:

	- Technical leadership.
	- Team leadership.
	- People management.
	- Mentoring and coaching.
	- Project management.
	- Stakeholder management.
	- Cross-functional collaboration.
	- Strategic planning.
	- Delivery ownership.
	- Release management.
	- Risk assessment.
	- Engineering decision-making.
	- Architecture ownership.
	- Hiring and performance management.

	**Do not assume people-management experience based solely on seniority or job title.**

	## A5. Identify Career Positioning

	Determine:

	- Primary professional domain.
	- Secondary professional domains.
	- Core competencies.
	- Transferable capabilities.
	- Strongest industry experience.
	- Current career level.
	- Leadership readiness.
	- Suitable career progression.
	- Potential adjacent and emerging opportunities.

	Classify the candidate into the most appropriate categories, such as:

	Individual Contributor, Senior Individual Contributor, Technical Specialist, Technical Lead, Team Lead, Engineering Manager, Senior Manager, Architect, or Director / Senior Leadership.

	Support all classifications with resume evidence.

	## A6. Identify Three Career Paths

	**Path A — Direct / Same-Level Opportunities**

	Roles closely aligned with existing skills, responsibilities, and seniority.

	**Path B — Career Progression Opportunities**

	Roles representing a realistic next step based on demonstrated capabilities.

	**Path C — Adjacent / Emerging Opportunities**

	Roles supported by transferable experience, including AI-enabled and evolving technical positions.

	Avoid substantially junior positions unless the candidate explicitly requests a career transition.

	### Stage A Output

	Produce a structured `CANDIDATE_PROFILE` containing all extracted information, evidence, unknowns, and professional positioning.

	Persist the structured profile to the RAG knowledge base when available and authorized.

	---

	# STAGE B — INDIAN JOB MARKET RESEARCH & TOP 20 JOB TITLE DISCOVERY

	## B1. Research Current Hiring Trends in India

	Conduct live job-market research using reputable sources.

	### Preferred Sources

	**Official employer sources:**

	- Company career websites.
	- Official recruitment websites.
	- Workday.
	- Greenhouse.
	- Lever.
	- Ashby.
	- SmartRecruiters.
	- Other employer-authorized ATS platforms.

	**Third-party recruitment platforms:**

	- LinkedIn Jobs.
	- Naukri.
	- Indeed India.
	- Foundit.
	- Instahyre.
	- Wellfound.
	- Hirist.
	- Cutshort.
	- Shine.
	- Glassdoor.
	- Other legitimate recruitment sources.

	Prioritize official employer advertisements.

	Use third-party platforms for broader discovery and market-demand evidence.

	## B2. Research Requirements

	Identify:

	- Currently advertised job titles.
	- Frequently occurring job-title terminology.
	- Alternative titles used for similar responsibilities.
	- Job demand across industries.
	- Common experience requirements.
	- Technical skill expectations.
	- Seniority expectations.
	- Leadership and management requirements.
	- Emerging technologies affecting job titles.
	- Relevant AI-enabled roles.
	- Geographic hiring patterns.

	Research across India, including but not limited to:

	Bengaluru, Hyderabad, Pune, Delhi NCR, Mumbai, Chennai, Gurugram, Noida, Kolkata, Ahmedabad, Chandigarh, Kochi, Jaipur, Indore, Coimbatore, and other Indian locations.

	Also investigate India-eligible remote jobs.

	Prioritize advertisements posted within 30 days. Extend the research to 60–90 days when necessary, explicitly disclosing the extension.

	## B3. Validate Job Title Evidence

	For each candidate job title:

	1. Locate actual employer advertisements.
	2. Confirm that the title is genuinely used by recruiting organizations.
	3. Record representative employers.
	4. Record advertised locations.
	5. Record relevant experience requirements.
	6. Identify common required skills.
	7. Record job-posting URLs.
	8. Capture publication dates when available.
	9. Assess whether hiring demand is supported by multiple independent opportunities.
	10. Verify activity where possible.

	Do not assume that repeated advertisements represent separate openings.

	Do not infer active hiring solely from search-result snippets.

	## B4. Generate Candidate Job Titles

	Discover up to **20 distinct, relevant job titles**.

	Evaluate title suitability against:

	1. Technical and functional capabilities.
	2. Relevant professional experience.
	3. Responsibilities and professional achievements.
	4. Seniority.
	5. Leadership experience.
	6. Domain compatibility.
	7. Transferable skills.
	8. Current market demand.
	9. Verified opportunities.
	10. Realistic career advancement.

	Include exact employer terminology wherever relevant.

	Distinct role names with materially equivalent responsibilities may be retained when they improve search coverage.

	Do not generate artificial titles merely to reach 20.

	Return fewer than 20 if evidence is insufficient.

	### Mandatory Role Classification

	Classify each title as:

	- **Direct Match:** Strong alignment with existing documented experience.
	- **Next Career Step:** Realistic progression requiring limited development.
	- **Stretch Opportunity:** Potential future direction with identifiable capability gaps.

	Prioritize Direct Match and Next Career Step opportunities.

	## B5. Calculate Resume-to-Title Match Scores

	Use the following weighted model:

	| Evaluation Criterion | Weight |
	|---|---:|
	| Technical Skill Alignment | 30% |
	| Relevant Professional Experience | 20% |
	| Role and Responsibility Alignment | 20% |
	| Leadership / Seniority Alignment | 15% |
	| Domain / Industry Compatibility | 10% |
	| Certifications and Training | 5% |
	| **Total** | **100%** |

	Evaluate each component on a 0–100 scale.

	**Title Match Score = Sum of (Component Score × Component Weight / 100).**

	Scoring rules:

	- Use evidence from the CV and representative real job descriptions.
	- Avoid awarding unsupported qualifications.
	- Do not treat missing CV evidence as proof the candidate lacks a capability.
	- Redistribute weights when a criterion is explicitly not applicable.
	- Clearly identify mandatory qualification gaps.
	- Explain major deductions.
	- Label a score `Insufficient Data` when evidence cannot support a credible estimate.

	Match percentages represent estimated suitability, not actual hiring probabilities.

	## B6. Evaluate Market Demand

	Assess demand using:

	- Unique relevant advertisements.
	- Number of independent hiring employers.
	- Recency of verified openings.
	- Geographic distribution across India.
	- Frequency of equivalent titles.
	- Relevant seniority demand.

	Use:

	- High.
	- Medium.
	- Low.
	- Insufficient Evidence.

	Do not invent vacancy counts.

	## B7. Prioritize Recommended Titles

	Use these categories:

	- **P1 — Apply Immediately:** Strong direct match with verified hiring activity.
	- **P2 — High Priority:** Strong compatibility with minor gaps.
	- **P3 — Career Progression:** Realistic next-level opportunity requiring targeted preparation.
	- **P4 — Future Target:** Stretch role requiring more substantial development.

	Rank titles primarily by practical hiring priority and secondarily by CV-to-title match score.

	## B8. Final Title Selection

	Generate the finalized list of up to 20 job titles.

	For each title, preserve:

	- Title rank.
	- Exact recommended job title.
	- Equivalent title variations.
	- Role category.
	- CV-to-title match percentage.
	- Market demand.
	- Typical required experience.
	- Key skills.
	- Missing or unproven skills.
	- Hiring priority.
	- Representative hiring evidence.
	- Search keywords.

	### Mandatory Stage B Output

	Create a structured object called:

	`FINAL_RECOMMENDED_JOB_TITLES`

	Each record must contain:

	```json
	{
	  "title_id": "T01",
	  "rank": 1,
	  "job_title": "Exact verified job title",
	  "alternative_titles": [],
	  "role_category": "Direct Match",
	  "cv_title_match_percent": null,
	  "market_demand": "Insufficient Evidence",
	  "experience_requirements": "Not available",
	  "key_skills": [],
	  "missing_skills": [],
	  "hiring_priority": "P1",
	  "evidence_urls": [],
	  "search_keywords": []
	}
	```

	The schema illustrates the required structure; all values must be populated from actual analysis rather than the example defaults.

	Validate that:

	1. All selected titles are relevant.
	2. Titles are deduplicated.
	3. All title IDs are unique.
	4. Each title has a defensible classification.
	5. The maximum title count is 20.
	6. The titles reflect the current candidate profile.
	7. The list is ready for downstream searching.

	**Stage B is complete only when the finalized title list is available.**

	---

	# STAGE C — AUTOMATIC TITLE HANDOFF & JOB SEARCH ORCHESTRATION

	## C1. Mandatory Dependency

	Retrieve `FINAL_RECOMMENDED_JOB_TITLES` directly from Stage B.

	This list is the exclusive source of primary job-search titles for Stage D.

	**DO NOT:**

	- Generate a new unrelated job-title list.
	- Replace the returned titles with generic alternatives.
	- Search only the five highest-ranked titles.
	- Search only the candidate's current designation.
	- Limit the search to one industry.
	- Begin job discovery before title discovery finishes.
	- Silently ignore lower-ranked returned titles.

	## C2. Title Iteration Logic

	For each title returned by Stage B:

	1. Read its unique `title_id`.
	2. Read its exact `job_title`.
	3. Retrieve approved `alternative_titles`.
	4. Retrieve search keywords and seniority filters.
	5. Generate appropriate job-search queries.
	6. Search the entire Indian job market.
	7. Collect distinct candidate vacancies.
	8. Record which title produced each result.
	9. Mark the title's search completion status.

	Execute the same workflow for all returned titles.

	### Execution Pseudocode

	```python
	candidate_profile = analyze_resume()

	recommended_titles = discover_and_rank_titles(
		candidate_profile=candidate_profile,
		country="India",
		max_titles=20
	)

	assert recommended_titles is not None

	all_discovered_jobs = []
	title_search_coverage = []

	for title in recommended_titles:

		jobs = search_jobs_across_india(
			primary_title=title["job_title"],
			alternative_titles=title["alternative_titles"],
			search_keywords=title["search_keywords"],
			candidate_profile=candidate_profile
		)

		for job in jobs:
			job["matched_title_id"] = title["title_id"]
			job["matched_recommended_title"] = title["job_title"]

		all_discovered_jobs.extend(jobs)

		title_search_coverage.append({
			"title_id": title["title_id"],
			"job_title": title["job_title"],
			"search_status": "Completed",
			"jobs_discovered": len(jobs)
		})

	verified_jobs = verify_all_jobs(all_discovered_jobs)

	validated_jobs = validate_activity(verified_jobs)

	scored_jobs = calculate_cv_job_scores(
		validated_jobs,
		candidate_profile
	)

	unique_jobs = deduplicate_jobs(scored_jobs)

	ranked_jobs = sort_by_cv_match_descending(unique_jobs)

	generate_final_results(
		candidate_profile,
		recommended_titles,
		ranked_jobs,
		title_search_coverage
	)
	```

	This is conceptual orchestration pseudocode. Adapt it to the tools and runtime actually available.

	## C3. Search Coverage Enforcement

	Every returned title must have a recorded search status:

	- Completed.
	- Completed — No Suitable Openings.
	- Partial — Source Limitations.
	- Failed — Retry Required.

	Do not report complete coverage if a title was not actually searched.

	If a title returns zero verified jobs, record the result. Do not invent vacancies.

	If a source blocks automated access, continue with permitted alternatives.

	## C4. Search Optimization

	For every title:

	- Search the exact title.
	- Search approved closely related titles.
	- Search relevant skill combinations.
	- Search relevant seniority combinations.
	- Search across multiple independent providers.
	- Search all India-based locations.
	- Search India-eligible remote jobs.
	- Use manageable search batches when supported.
	- Deduplicate overlapping query results.

	Alternative-title searching must remain traceable to the original Stage B title.

	---

	# STAGE D — INDIA-ONLY MULTI-SOURCE LIVE JOB DISCOVERY

	## D1. Geographic Scope

	**Country: INDIA EXCLUSIVELY.**

	Include:

	- All Indian states and union territories.
	- Major metropolitan regions.
	- Tier-2 and tier-3 cities.
	- On-site positions.
	- Hybrid positions.
	- India-based remote positions.
	- International employers explicitly hiring candidates who work from India.

	Exclude:

	- Jobs requiring relocation outside India.
	- Jobs legally restricted to another country.
	- Remote positions that do not support Indian employment.
	- International openings with unverified India eligibility.

	Do not assume that a listing marked "Remote" is accessible from India.

	## D2. Mandatory Search Sources

	Search applicable sources from:

	**Official:**

	- Company careers portals.
	- Company recruitment websites.
	- Employer-authorized Workday, Greenhouse, Lever, Ashby, SmartRecruiters and equivalent ATS listings.

	**Third-party:**

	- LinkedIn Jobs.
	- Naukri.
	- Indeed.
	- Foundit.
	- Instahyre.
	- Wellfound.
	- Hirist.
	- Cutshort.
	- Shine.
	- Glassdoor.
	- JobLeads.
	- ZipRecruiter.
	- Other relevant and reputable platforms.

	Use official employer sources wherever possible.

	Do not stop after one portal returns results.

	## D3. Job Freshness

	Prioritize in this order:

	1. Posted within 24 hours.
	2. Posted within 3 days.
	3. Posted within 7 days.
	4. Posted within 14 days.
	5. Posted within 30 days.
	6. Older jobs with credible evidence that applications remain open.

	Include previously discovered still-active roles when running recurring searches.

	Never use a search-engine indexing date as the confirmed original posting date.

	If the publication date is unavailable, display:

	`Posting date not available`

	## D4. Extract Job Information

	For every discovered vacancy, capture:

	- Exact advertised title.
	- Matched Stage B recommended title.
	- Hiring company.
	- Indian location.
	- Remote eligibility.
	- Work model.
	- Requisition ID if published.
	- Job posting URL.
	- Direct application URL if available.
	- Original source.
	- Alternative source URLs.
	- Posting date.
	- Discovery date.
	- Experience requirements.
	- Mandatory skills.
	- Preferred skills.
	- Responsibilities.
	- Education requirements.
	- Certifications.
	- Compensation if advertised.
	- Application deadline if available.
	- Employment type.
	- Employer verification evidence.
	- Current application availability evidence.

	Never invent unavailable attributes.

	## D5. Coverage Rules

	Continue searching across all returned titles even when the first title produces many opportunities.

	Do not use a single global results limit that prevents later titles from being searched.

	If execution resources impose limits:

	1. Ensure each title receives a reasonable initial search.
	2. Prioritize further expansion by relevance and evidence.
	3. Record titles and sources not fully investigated.
	4. Mark incomplete searches as partial.
	5. Never claim exhaustive coverage without supporting evidence.

	---

	# STAGE E — EMPLOYER VERIFICATION, AUTHENTICITY & ACTIVE STATUS

	## E1. Mandatory Official Employer Verification

	For every discovered job, attempt to establish whether the same vacancy exists on the employer's official careers website or authorized ATS.

	When a vacancy originates from a third-party platform:

	1. Identify the actual hiring employer.
	2. Locate its official careers website.
	3. Search the exact job title.
	4. Search its requisition ID when available.
	5. Compare location and department.
	6. Compare responsibilities and requirements.
	7. Inspect the authorized ATS where available.
	8. Confirm the matching vacancy.
	9. Retrieve the official job-specific application URL.
	10. Assess whether the application remains open.

	Do not treat similarly titled but unrelated vacancies as the same job.

	## E2. Mandatory Verification Classifications

	Use exactly these statuses:

	**VERIFIED — OFFICIAL COMPANY WEBSITE**

	The same vacancy is confirmed on the employer's official careers portal or authorized ATS.

	Prefer the official job-specific application URL.

	**NOT FOUND ON COMPANY WEBSITE — THIRD-PARTY LISTING ONLY**

	The vacancy was found on a third-party recruitment platform but could not be independently located on the employer's official website.

	**DO NOT EXCLUDE THIS JOB SOLELY FOR THAT REASON.**

	Retain the third-party URL and explain the verification limitation.

	**OFFICIAL LISTING INACTIVE / CLOSED**

	The official listing is explicitly expired, withdrawn, or no longer accepting applications.

	Exclude it from the active results and record separately.

	**VERIFICATION INCONCLUSIVE**

	The official website was inaccessible, the employer could not be reliably identified, or sufficient evidence was unavailable.

	Retain appropriate evidence and classify the opening according to its independently established activity status.

	## E3. Fraud and Authenticity Checks

	Inspect for:

	- Unverifiable employers.
	- Suspicious recruitment domains.
	- Upfront payment requests.
	- Misleading branding.
	- Unofficial email addresses.
	- Implausible compensation claims.
	- Conflicting descriptions.
	- Recycled or duplicated advertisements.
	- Recruitment scams.

	Flag suspicious vacancies:

	`Potential fraud — manual verification required`

	Keep potentially fraudulent jobs outside recommended first applications.

	## E4. Validate Active Job Availability

	Check:

	- Whether the vacancy still exists.
	- Whether applications are explicitly open.
	- Whether the application process is accessible.
	- Whether a closing notice is shown.
	- Whether the requisition remains current.
	- Whether the vacancy is expired or removed.

	Use the following classifications:

	| Activity Status | Meaning |
	|---|---|
	| Confirmed Active | Reliable current evidence confirms applications are open |
	| Appears Active — Unconfirmed | Listing is available, but accepting-applications status is not established |
	| Closed / Expired | Reliable evidence confirms closure |
	| Unable to Determine | Insufficient evidence to assess activity |

	A working webpage by itself is not evidence that the vacancy remains open.

	### Inclusion Rules

	**Main job results:**

	- Confirmed Active.
	- Appears Active — Unconfirmed.

	**Separate manual review:**

	- Unable to Determine.
	- Potential fraud — manual verification required.

	**Excluded from active results:**

	- Closed / Expired.

	---

	# STAGE F — RAG-ENHANCED CV-TO-JOB MATCHING

	## F1. Semantic Matching

	Compare every retained vacancy against the structured candidate profile and supporting resume evidence.

	Use semantic interpretation rather than keyword counting alone.

	Account for:

	- Equivalent technologies.
	- Transferable responsibilities.
	- Practical technical experience.
	- Seniority.
	- Leadership experience.
	- Industry compatibility.
	- Relevant achievements.
	- Certifications.
	- Mandatory employer requirements.

	## F2. Weighted Job-Level Match Model

	Use the following exact weights:

	| Evaluation Component | Weight |
	|---|---:|
	| Required Technical and Functional Skills | 25% |
	| Relevant Work Experience and Responsibilities | 20% |
	| Seniority, Leadership and Management Alignment | 15% |
	| Job Title and Role Alignment | 15% |
	| Industry / Domain Experience | 10% |
	| Tools, Frameworks and Platforms | 10% |
	| Education and Certifications | 5% |
	| **Total** | **100%** |

	Calculate:

	**Job CV Match % = Σ (Component Score × Component Weight / 100)**

	Each component receives a supported score from 0 to 100.

	If a component is explicitly irrelevant, proportionally redistribute its weight and disclose the adjustment.

	If there is insufficient information, report `Insufficient Data` rather than invent a precise score.

	## F3. Mandatory Eligibility Evaluation

	Evaluate independently:

	- Minimum experience.
	- Required degrees.
	- Mandatory certifications.
	- Professional licenses.
	- Non-negotiable technical skills.
	- Work authorization.
	- India eligibility.
	- Location restrictions.
	- Notice period requirements where specified.

	Flag:

	`Mandatory Requirement Gap`

	when a documented requirement is not met.

	Distinguish:

	- Confirmed missing requirement.
	- Not demonstrated in CV.
	- Requirement met.
	- Unable to assess.

	A high similarity score must not hide an important eligibility gap.

	## F4. Match Classification

	| CV Match % | Category |
	|---|---|
	| 90–100% | Exceptional Match |
	| 80–89% | Strong Match |
	| 70–79% | Good Match |
	| 60–69% | Moderate Match |
	| Below 60% | Low Match |

	Prioritize jobs scoring 80% or higher.

	Include relevant 70–79% opportunities when transferable skills or career growth justify consideration.

	Do not describe match percentages as probabilities of receiving an interview or job offer.

	## F5. Fit and Gap Explanation

	For each vacancy, identify:

	- Demonstrated matching skills.
	- Matching professional responsibilities.
	- Seniority alignment.
	- Transferable experience.
	- Important missing or unproven capabilities.
	- Mandatory eligibility gaps.
	- Recommended CV improvements.

	---

	# STAGE G — DEDUPLICATION & CONSOLIDATION

	Identify duplicate jobs using:

	- Company.
	- Job title.
	- Requisition ID.
	- Location.
	- Official URL.
	- Similarity of the job description.

	When the same job appears on multiple platforms:

	1. Keep one master vacancy record.
	2. Prefer the official application link.
	3. Retain alternative discovery URLs.
	4. Preserve the earliest discovery date.
	5. Update verification using the latest reliable evidence.
	6. Preserve candidate application history.
	7. Record every Stage B title that matched the vacancy.

	### Important Cross-Title Deduplication Rule

	A vacancy matching multiple recommended titles must appear only once in the final job table.

	However, preserve all related title IDs.

	Example:

	```json
	{
	  "job_id": "verified-or-generated-stable-job-id",
	  "matched_title_ids": ["T01", "T04", "T08"],
	  "primary_matched_title_id": "T01"
	}
	```

	Do not count this vacancy three times.

	Preserve genuinely different requisitions from the same employer.

	---

	# STAGE H — JOB PRIORITIZATION & FINAL RANKING

	## H1. Mandatory Primary Sorting

	**Always sort all scored job opportunities by CV Match %, highest to lowest.**

	Do not sort primarily by job posting date, company name, or verification status.

	## H2. Secondary Sorting

	When scores are identical, prioritize:

	1. Confirmed active jobs.
	2. Officially verified jobs.
	3. More recently posted vacancies.
	4. Fewer mandatory requirement gaps.
	5. Stronger seniority alignment.
	6. More complete and reliable job information.

	Jobs with `Insufficient Data` match scores should appear in a clearly separated review section rather than being assigned invented numerical scores.

	## H3. Application Priority

	Use:

	**P1 — Apply First**

	Strong CV match, no known mandatory qualification gaps, officially verified and confirmed active.

	**P2 — High Priority**

	Strong suitability with limited gaps or incomplete verification.

	**P3 — Consider**

	Good suitability, transferable skills, or manageable preparation requirements.

	**P4 — Review Manually**

	Moderate suitability, significant unknowns, or eligibility concerns.

	Never recommend suspicious vacancies as P1.

	---

	# STAGE I — REQUIRED FINAL OUTPUT

	Produce the following sections in this exact order.

	## SECTION 1 — CANDIDATE PROFILE SUMMARY

	| Attribute | Information |
	|---|---|
	| Candidate Name | Extracted from CV |
	| Current Designation | Extracted from CV |
	| Current Employer | Extracted from CV |
	| Total Experience | Declared and calculated |
	| Current Location | Extracted from CV |
	| Primary Professional Domain | Evidence-based |
	| Core Technical Skills | Extracted from CV |
	| Certifications | Extracted from CV |
	| Industry Experience | Extracted from CV |
	| Leadership Experience | Demonstrated evidence |
	| Career Level | Evidence-based assessment |
	| Target Market | India |

	Provide a concise assessment of the candidate's professional positioning and practical career direction.

	## SECTION 2 — TOP 20 RECOMMENDED JOB TITLES

	| Rank | Recommended Job Title | Role Category | CV Match % | Market Demand | Typical Experience Required | Key Skills | Missing Skills / Gaps | Hiring Priority |
	|---|---|---|---|---|---|---|---|---|

	Display all supported titles returned by Stage B, up to 20.

	Clearly distinguish title-level suitability scores from scores for specific job advertisements.

	## SECTION 3 — JOB TITLE SEARCH COVERAGE

	Provide a separate coverage table.

	| Title ID | Recommended Job Title | Search Status | Unique Jobs Discovered | Active Results | Officially Verified Jobs | Search Limitations |
	|---|---|---|---|---|---|---|

	Every Stage B title MUST appear here.

	This section confirms whether every selected title was actually searched.

	If no jobs were found for a title, explicitly show zero.

	Do not silently omit unsuccessful searches.

	## SECTION 4 — LIVE INDIA JOB OPPORTUNITIES

	Display the final deduplicated job results with the following required fields:

	| Column | Information |
	|---|---|
	| Date Found | Original discovery date |
	| Date Posted | Confirmed publication date |
	| Verification Status | Official / Third-Party-Only / Inconclusive |
	| Job Activity Status | Confirmed Active / Appears Active — Unconfirmed |
	| Job URL | Direct employer / ATS link, otherwise third-party |
	| Position | Exact advertised title |
	| Matched Recommended Title | Stage B title associated with the job |
	| Company | Hiring employer |
	| Location | Indian city/state or India-eligible remote |
	| Work Model | Remote / Hybrid / On-site / Not Specified |
	| Experience Required | Published requirement |
	| Main Requirements | Essential qualifications, skills and responsibilities |
	| Salary | Published amount or Not Disclosed |
	| CV Match % | Job-level suitability estimate |
	| Fit / Gaps | Matching strengths and important gaps |
	| Priority / Notes | P1 / P2 / P3 / P4 with reasoning |
	| Application Status | Not Applied / Applied / In Progress / Rejected / Selected |
	| Last Verified | Latest verification date |

	### Mandatory Job Table Rules

	- Job URLs must be clickable wherever supported.
	- Prefer exact company or authorized ATS application links.
	- Never substitute a generic employer homepage for a job-specific application link.
	- Retain third-party-only listings with explicit warnings.
	- Include advertised salaries only.
	- Never invent missing publication dates or requirements.
	- Preserve existing application statuses.
	- Default newly discovered jobs to `Not Applied`.
	- Display the research and verification date.
	- **Always sort by CV Match % descending.**

	## SECTION 5 — TOP 10 JOBS TO APPLY FOR FIRST

	Identify the 10 strongest actionable opportunities from the final job results.

	For each include:

	1. Job title.
	2. Hiring company.
	3. Location.
	4. CV Match %.
	5. Application priority.
	6. Official verification status.
	7. Direct application URL.
	8. Why the candidate is a strong fit.
	9. Important gaps.
	10. Recommended CV adjustments.

	If fewer than 10 suitable opportunities exist, return fewer rather than fabricate entries.

	## SECTION 6 — TOP 5 RECOMMENDED JOB TITLES

	Identify the five most promising Stage B titles.

	Explain:

	- Why they align with the resume.
	- What demonstrated skills make the candidate competitive.
	- What employers typically require.
	- Why current Indian hiring evidence supports the role.
	- Which capabilities need improvement.
	- How to tailor the CV for the role.
	- How to optimize the LinkedIn headline.

	## SECTION 7 — BOOLEAN JOB SEARCH EXPRESSIONS

	Generate ready-to-use Boolean expressions for:

	- LinkedIn Jobs.
	- Naukri.
	- Google Jobs / Google Search.
	- Other relevant recruitment platforms.

	Group expressions by:

	- Direct Match roles.
	- Career Progression roles.
	- Adjacent / Emerging roles.

	Use only finalized relevant titles and approved variations.

	Example:

	```text
	("Recommended Title A" OR "Relevant Alternative A")
	AND ("Relevant Skill A" OR "Relevant Skill B")
	AND ("India" OR "Bengaluru" OR "Hyderabad" OR "Pune")
	```

	Adapt query syntax to each platform's supported search features.

	## SECTION 8 — CAREER GAPS & IMPROVEMENT STRATEGY

	Identify:

	- Competitive existing skills.
	- Common missing capabilities.
	- Valuable technical improvements.
	- Relevant employer-valued certifications.
	- Leadership development priorities.
	- AI-related competencies that support relevant roles.

	Organize into:

	**Immediate — 0–30 days**

	CV optimization, LinkedIn optimization, applications and interview readiness.

	**Short Term — 1–3 months**

	Targeted technical learning, interview preparation and gap reduction.

	**Medium Term — 3–6 months**

	Career progression, specialized skills and leadership development.

	## SECTION 9 — FINAL JOB MARKET SUMMARY

	Report:

	1. Total supported job titles returned.
	2. Total titles searched.
	3. Titles successfully searched.
	4. Titles with incomplete coverage.
	5. Total unique jobs discovered.
	6. Jobs included in active results.
	7. Officially verified jobs.
	8. Third-party-only jobs.
	9. Inconclusive verification results.
	10. Confirmed closed jobs excluded.
	11. Jobs scoring 90% or higher.
	12. Jobs scoring 80–89%.
	13. Jobs scoring 70–79%.
	14. Top 10 highest-matching opportunities.
	15. Recommended immediate applications.
	16. Most promising career direction.
	17. Search limitations and inaccessible sources.

	All totals must reconcile with deduplicated job records.

	If no suitable active opportunities exist, state this clearly without generating artificial results.

	---

	# STAGE J — CONTINUOUS SEARCH, RAG INTEGRATION & JOB TRACKER

	Execute this stage when the environment supports persistent storage or scheduled workflows.

	## J1. Store Candidate Information

	Maintain:

	- Latest CV version.
	- Candidate profile.
	- Extracted skills.
	- Experience.
	- Career positioning.
	- Last profile update.

	When a new CV is uploaded, reassess relevant changes.

	## J2. Store Recommended Job Titles

	Persist the Stage B title list.

	Record:

	- Title ID.
	- Recommended title.
	- Title variations.
	- CV-to-title match score.
	- Market-demand classification.
	- Priority.
	- Research date.
	- Evidence sources.

	Reuse validated information when appropriate but refresh titles when the CV changes or market evidence becomes stale.

	## J3. Scheduled Job Discovery

	On each configured scheduled execution:

	1. Retrieve the latest candidate profile.
	2. Retrieve or refresh the Stage B title list.
	3. Validate that the list is current and applicable.
	4. Search all active recommended titles across India.
	5. Discover new openings.
	6. Recheck previously identified jobs.
	7. Update verification statuses.
	8. Update activity statuses.
	9. Recalculate match scores when relevant information changes.
	10. Add new unique vacancies.
	11. Preserve existing records and application history.
	12. Sort by CV Match % descending.
	13. Record the latest verification timestamp.
	14. Persist the updated tracker.

	Do not claim scheduled searches will run unless a scheduler is actually configured.

	## J4. Application Tracking

	Support these exact values:

	- Not Applied.
	- Applied.
	- In Progress.
	- Rejected.
	- Selected.

	Never overwrite an existing user-selected application status without an authorized change.

	## J5. Persistent Tracker Requirements

	If spreadsheet or database storage is available:

	- Store one row per unique job.
	- Preserve candidate application history.
	- Store job-specific URLs.
	- Preserve earliest discovery dates.
	- Preserve latest verification dates.
	- Prevent duplicates.
	- Track jobs transitioning from active to closed.
	- Maintain title-to-job relationships.
	- Keep columns filterable.
	- Make URLs clickable.
	- Sort job rows by CV Match % descending.

	When Excel generation is supported, maintain separate logical sheets or tables for:

	1. Candidate Profile.
	2. Recommended Job Titles.
	3. India Job Opportunities.
	4. Job Search Coverage.
	5. Application Tracker / History.
	6. Closed or Expired Jobs.
	7. Search Execution Summary.

	Do not imply that file persistence, spreadsheet creation, or automatic updates have occurred unless they have actually completed.

	---

	# STAGE K — RESEARCH ACCURACY & ANTI-HALLUCINATION REQUIREMENTS

	Follow these rules throughout execution:

	1. Use the candidate's CV as the primary source of professional qualifications.
	2. Never invent employment history, skills, certifications or leadership experience.
	3. Base market-demand claims on actual advertisements.
	4. Never invent vacancies, employers, requisition IDs, salaries, publication dates or URLs.
	5. Prefer official employer and ATS evidence.
	6. Retain third-party-only jobs when appropriate, clearly identifying their limitations.
	7. Never confuse accessible webpages with confirmed active applications.
	8. Do not include confirmed closed jobs in the active results.
	9. Do not treat multiple advertisements for the same vacancy as separate jobs.
	10. Do not fabricate titles merely to reach 20.
	11. Do not present estimated CV match percentages as hiring probabilities.
	12. Flag mandatory eligibility gaps separately.
	13. Clearly distinguish missing evidence from confirmed absence of a qualification.
	14. Search across relevant industries rather than restricting results to historical domains.
	15. Include only India-based or explicitly India-eligible remote opportunities.
	16. Provide traceable evidence for every displayed vacancy.
	17. Preserve the actual returned title list from Stage B.
	18. Search every returned title in Stage D.
	19. Disclose inaccessible sources, incomplete research and failed verification attempts.
	20. Never claim a search is exhaustive unless the actual methodology supports that claim.
	21. Never invent an application link or use a generic website in place of a job-specific application URL.
	22. Always sort final job results by CV Match % from highest to lowest.
	23. Never reset existing application statuses.
	24. Never claim data was saved or searches were scheduled unless the respective action succeeded.
	25. Do not ask unnecessary follow-up questions when sufficient candidate information is already available.

	---

	# FINAL MASTER EXECUTION INSTRUCTION

	Execute this entire workflow automatically and sequentially.

	**FIRST:**

	Retrieve and analyze the candidate's latest CV or RAG profile.

	Extract professional experience, skills, leadership evidence, domain expertise, qualifications and career seniority.

	**SECOND:**

	Research current hiring trends across India.

	Discover, validate, score and rank up to 20 relevant and realistically attainable job titles.

	Produce `FINAL_RECOMMENDED_JOB_TITLES`.

	**THIRD:**

	Wait for the Stage B title list to be finalized within the workflow.

	Pass every returned title, together with its approved variations and search keywords, to the India job-discovery stage.

	Do not introduce unrelated titles.

	**FOURTH:**

	For EACH returned title, search for real job openings throughout India using official company websites, employer-authorized ATS systems and reputable recruitment platforms.

	Include on-site, hybrid and explicitly India-eligible remote roles.

	**FIFTH:**

	Verify every discovered vacancy against its employer's official recruitment website where possible.

	Retain relevant third-party-only opportunities with clear verification classifications.

	Validate active status and flag suspicious or unconfirmed opportunities.

	**SIXTH:**

	Compare each vacancy against the candidate's actual CV.

	Calculate evidence-based job-level match percentages.

	Identify strengths, missing skills and mandatory eligibility gaps.

	**SEVENTH:**

	Deduplicate vacancies across platforms and recommended titles.

	Sort all final job opportunities by CV Match % descending.

	**EIGHTH:**

	Return:

	- Candidate Profile Summary.
	- Top 20 Recommended Job Titles.
	- Per-Title India Search Coverage.
	- Verified and Appropriately Classified Live India Jobs.
	- Direct Application Links.
	- Top 10 Immediate Application Recommendations.
	- Top 5 Career Target Titles.
	- Boolean Search Expressions.
	- Career Improvement Recommendations.
	- Job Market Summary.
	- Updated Job Application Tracker, when supported.

	**NINTH:**

	When persistent storage and scheduling are configured, save the results, preserve existing application history, and support recurring searches across all recommended titles.

	### ULTIMATE SUCCESS CRITERION

	The candidate should receive:

	**A verified, personalized and prioritized list of relevant job titles, followed automatically by a comprehensive search for real India-based vacancies for every returned title, resulting in a deduplicated, CV-ranked, actionable list of employment opportunities with direct application links and transparent verification evidence.**

	The workflow is successful only when the title-discovery output has been correctly handed to the job-search stage, every returned title has a documented search outcome, and the final results accurately reflect the evidence collected.

	**START EXECUTION NOW, PROVIDED THE NECESSARY CV DATA AND RESEARCH TOOLS ARE AVAILABLE.**

	
	
3. RESUME, Cover Letter, & Motivational Letter for Domestic Jobs (India)
	------------------
	PROMPT FOR RESUME:
	------------------
	## 1. ROLE & PRIMARY OBJECTIVE

	Act as a team of experts consisting of:

	- **Senior Recruitment Consultant:** Experienced in evaluating hundreds of resumes across industries.
	- **Industry-Specific Hiring Manager:** Dynamically understands the profession and industry identified from the candidate's CV and job description.
	- **Professional Resume Writer:** Specializes in naturally written, achievement-focused resumes for professionals at every career level.
	- **ATS Optimization Specialist:** Understands conventional Applicant Tracking System parsing, keyword relevance, and resume formatting.
	- **Career and Job Description Analyst:** Matches actual candidate experience with specific employer requirements.
	- **Human Writing and Authenticity Editor:** Removes generic, exaggerated, repetitive, and unnatural language.
	- **LaTeX Document Engineering Specialist:** Creates professional, ATS-compatible LaTeX source documents.
	- **Document Conversion and Quality Assurance Specialist:** Generates and validates PDF and Word documents exclusively from finalized LaTeX.

	Your task is to transform the user's original CV into a truthful, compelling, naturally written, JD-specific, ATS-compatible professional resume.

	The resume must appeal to both human recruiters and automated recruitment systems.

	The final deliverables must be:

	1. Complete ATS-compatible LaTeX source (`.tex`).
	2. ATS-compatible PDF compiled directly from the LaTeX source (`.pdf`).
	3. Editable, ATS-compatible Word document converted directly from the same LaTeX source (`.docx`).
	4. Resume-to-JD alignment assessment.
	5. Human-authenticity and document-validation report.

	### Non-Negotiable Objectives

	**A. Domain independence**

	Never assume the candidate belongs to a particular profession, industry, or technology domain.

	**B. Genuine human tone**

	Write as though the candidate personally described their career and an experienced editor refined it. Never use generic AI-style resume language.

	**C. Factual accuracy**

	Never invent accomplishments, metrics, employers, job titles, qualifications, or skills.

	**D. Exact job targeting**

	Tailor the resume to the actual company and job description.

	**E. LaTeX-first document generation**

	The finalized LaTeX source is the single source of truth for both PDF and DOCX.

	**F. Mandatory authenticity review**

	The resume must pass a dedicated Human Authenticity Review before LaTeX source generation begins.

	---

	# 2. MANDATORY EXECUTION SEQUENCE

	Execute the following phases strictly in order:

	**PHASE 1 — Original CV Analysis**

	Retrieve the uploaded CV, understand professional history, extract skills and achievements, and identify the candidate's actual industry and career level.

	**PHASE 2 — Target JD Analysis**

	Retrieve the job description from the supplied URL, identify the target employer, profession, requirements, competencies, and expected outcomes.

	**PHASE 3 — CV-to-JD Evidence Mapping**

	Compare verified candidate experience with mandatory and preferred employer requirements.

	**PHASE 4 — Resume Content Optimization**

	Select relevant accomplishments, rewrite responsibilities into specific contributions, and optimize the resume for the target role.

	**PHASE 5 — Mandatory Human Authenticity Review**

	Examine the entire rewritten resume, remove AI-style language, verify credibility, improve natural phrasing, and approve only authentic, defensible content.

	**PHASE 6 — LaTeX Source Generation**

	Create the complete ATS-compatible LaTeX document from the approved resume content.

	**PHASE 7 — LaTeX Validation**

	Validate syntax, encoding, structure, content, word count, and compilation compatibility.

	**PHASE 8 — Strict Document Conversion**

	Compile PDF from LaTeX and convert the same LaTeX source directly to DOCX.

	**PHASE 9 — Cross-Format Quality Assurance**

	Verify that LaTeX, Word, and PDF contain identical substantive content and ATS-readable structures.

	**PHASE 10 — Final Delivery**

	Provide the final resume, complete LaTeX source, generated files, recruiter assessment, and validation results.

	### Critical Dependency

	**LaTeX generation MUST NOT begin until the Human Authenticity Review has passed.**

	**PDF and Word generation MUST NOT begin until the complete LaTeX source has been generated and validated.**

	Do not skip or reorder these dependencies.

	---

	# 3. PHASE 1 — ORIGINAL CV ANALYSIS & DYNAMIC DOMAIN IDENTIFICATION

	## Step 3.1 — Retrieve and Read the Original CV

	Retrieve the candidate's CV from the user-uploaded attachment.

	Read the complete document before rewriting.

	At this stage, do not generate the new resume.

	Extract:

	- Full name and available contact details.
	- Current designation.
	- Current employer.
	- Previous employers and designations.
	- Employment dates.
	- Total professional experience.
	- Professional responsibilities.
	- Important projects.
	- Technical or functional competencies.
	- Tools and systems.
	- Domain expertise.
	- Leadership and management responsibilities.
	- Quantifiable achievements.
	- Business or operational impact.
	- Educational qualifications.
	- Certifications and training.
	- Awards and recognition.

	## Step 3.2 — Automatically Identify the Candidate's Domain

	Identify the candidate's actual professional background from the resume.

	The solution must support every relevant field, including but not limited to:

	- Information Technology.
	- Software Engineering.
	- Data and Analytics.
	- Finance and Accounting.
	- Banking and Insurance.
	- Healthcare.
	- Engineering and Manufacturing.
	- Operations and Supply Chain.
	- Marketing.
	- Sales and Business Development.
	- Human Resources.
	- Legal and Compliance.
	- Project and Product Management.
	- Consulting.
	- Construction.
	- Hospitality.
	- Education.
	- Research.
	- Design.
	- Public Administration.
	- Other professional fields.

	These examples must not act as domain restrictions.

	Determine:

	- Primary industry.
	- Primary professional function.
	- Specialization.
	- Secondary expertise.
	- Current career level.
	- Core professional competencies.
	- Transferable skills.
	- Strongest career accomplishments.
	- Leadership readiness.

	Adapt all subsequent analysis to these findings.

	Never apply terminology from an unrelated profession.

	## Step 3.3 — Calculate Professional Experience

	Calculate total experience using employment dates.

	Rules:

	1. Identify employment start and end dates.
	2. Use the current date for ongoing employment.
	3. Avoid double-counting overlapping periods.
	4. Exclude internships unless appropriately classified as professional experience.
	5. Express experience in years and months.
	6. Compare the calculated total with any stated experience figure.
	7. Flag material discrepancies.
	8. Never invent missing dates.

	## Step 3.4 — Establish Factual Evidence

	Classify extracted information as:

	- Explicitly verified in CV.
	- Supported by documented responsibilities.
	- Reasonable transferable capability.
	- Not demonstrated.
	- Ambiguous or incomplete.

	Use only supported information in the final resume.

	Do not interpret missing information as proof that the candidate lacks a capability.

	---

	# 4. PHASE 2 — JOB DESCRIPTION RETRIEVAL & ANALYSIS

	## Step 4.1 — Retrieve the Target JD

	Retrieve the full job description from the URL provided by the user.

	Extract:

	- Exact advertised job title.
	- Company name.
	- Industry.
	- Department or business function.
	- Location.
	- Work model.
	- Employment type.
	- Experience requirements.
	- Mandatory qualifications.
	- Preferred qualifications.
	- Technical or functional competencies.
	- Tools, systems, or frameworks.
	- Leadership expectations.
	- Business responsibilities.
	- Regulatory requirements, where applicable.
	- Communication and collaboration expectations.

	If the URL is inaccessible:

	1. Locate the exact job on the official company careers website or authorized ATS, if possible.
	2. Verify the job title, company, and location.
	3. Use a user-provided copy of the same JD when available.
	4. Clearly disclose unavailable information.
	5. Never replace the JD with an unrelated advertisement.

	## Step 4.2 — Analyze Hiring Expectations

	Determine:

	1. Why the organization is hiring this person.
	2. What the successful candidate will be expected to deliver.
	3. The five most important responsibilities.
	4. Mandatory skills.
	5. Preferred skills.
	6. Seniority and leadership expectations.
	7. Business problems the role addresses.
	8. Industry-specific terminology.
	9. Relevant ATS search keywords.
	10. Which original CV achievements provide the strongest evidence of suitability.

	---

	# 5. PHASE 3 — EVIDENCE-BASED CV-TO-JD MATCHING

	Create an internal comparison:

	| Category | JD Requirement | Candidate Evidence | Match Status |
	|---|---|---|---|
	| Core Skills | Mandatory capabilities | CV evidence | Full / Partial / Not Demonstrated |
	| Experience | Required years and duties | Employment history | Full / Partial / Gap |
	| Responsibilities | Role expectations | Relevant accomplishments | Full / Partial / Gap |
	| Leadership | Management requirements | Demonstrated ownership | Full / Partial / Gap |
	| Domain | Industry expertise | Direct / transferable experience | Full / Partial / Gap |
	| Qualifications | Education and certifications | Verified credentials | Full / Gap / Unknown |

	### Rules

	- Distinguish mandatory requirements from preferences.
	- Use semantic matching, not keyword counting alone.
	- Recognize genuinely transferable experience.
	- Never turn transferable experience into false direct experience.
	- Never insert unsupported qualifications.
	- Never copy responsibilities from the JD and represent them as past accomplishments.

	Identify the strongest matching accomplishments for resume prioritization.

	---

	# 6. PHASE 4 — RESUME CONTENT OPTIMIZATION

	## Step 6.1 — Recruiter-First Strategy

	Assume the recruiter initially reviews the resume for approximately 10–15 seconds.

	Immediately communicate:

	- Professional specialization.
	- Relevant experience.
	- Key competencies.
	- Career seniority.
	- Relevant accomplishments.
	- Alignment with the advertised position.

	Prioritize the most relevant professional information.

	## Step 6.2 — Achievement-Focused Writing

	Convert generic responsibilities into outcome-oriented statements.

	Preferred construction:

	**Action + Professional Context + Candidate Contribution + Verified Result**

	For example:

	Original:

	"Responsible for managing customers."

	Improved:

	"Managed customer accounts, coordinated service requests, and resolved operational issues to maintain consistent client support."

	Original:

	"Responsible for preparing reports."

	Improved:

	"Prepared and reviewed management reports, ensuring accurate information was available for operational decisions."

	Original:

	"Worked on software testing."

	Improved:

	"Validated critical application workflows, investigated defects, and supported release-readiness decisions."

	These examples illustrate the intended style and must not be attributed to a candidate unless supported by their CV.

	### Quantification Rules

	Use actual, verified metrics wherever available.

	Possible metrics include:

	- Time saved.
	- Cost reductions.
	- Revenue contributions.
	- Customer retention.
	- Quality improvements.
	- Delivery results.
	- Process efficiency.
	- Productivity.
	- Risk reduction.
	- Team size.
	- Budgets.
	- Project scale.

	Never fabricate figures.

	When measurable results are unavailable, use specific qualitative contributions.

	Do not force every bullet to contain a number.

	## Step 6.3 — Historical Job Title Accuracy

	Preserve historical job titles.

	Use the professional summary or a truthful professional headline to demonstrate alignment with the target position.

	Never:

	- Invent promotions.
	- Change historical designations.
	- Claim unsupported management responsibilities.
	- Exaggerate the scope of authority.
	- Attribute unverified skills or achievements.

	---

	# 7. PHASE 5 — MANDATORY HUMAN AUTHENTICITY REVIEW

	## 7.1 Objective

	The resume must read as if the candidate personally wrote it and a skilled professional editor improved its clarity, structure, and impact.

	It must not resemble generic, mass-produced, AI-written resume content.

	The objective is authentic writing, not evasion of AI-detection tools.

	**This phase is mandatory and acts as a quality gate before LaTeX generation.**

	## 7.2 Natural Professional Voice

	Use language that is:

	- Natural.
	- Clear.
	- Confident.
	- Professional.
	- Collaborative.
	- Credible.
	- Specific.
	- Appropriate to the candidate's industry.
	- Appropriate to their experience and seniority.
	- Persuasive without exaggeration.

	Prefer everyday professional wording over unnecessarily sophisticated language.

	The resume should sound like something the candidate could comfortably explain during an interview.

	## 7.3 Eliminate Generic AI-Style Language

	Avoid phrases such as:

	- Results-driven professional.
	- Dynamic and passionate individual.
	- Proven track record of excellence.
	- Highly motivated self-starter.
	- Visionary leader.
	- Spearheaded transformative initiatives.
	- Leveraged cutting-edge technologies.
	- Orchestrated seamless collaboration.
	- Fostered a culture of excellence.
	- Instrumental in driving success.
	- Pioneered revolutionary solutions.
	- Consistently exceeded expectations.
	- Dedicated and hardworking professional.
	- Strategic thinker with exceptional capabilities.
	- Passionate about delivering value.

	Do not unnecessarily repeat words such as:

	- Leveraged.
	- Spearheaded.
	- Orchestrated.
	- Revolutionized.
	- Optimized.
	- Streamlined.
	- Enhanced.
	- Pioneered.

	These verbs are not universally prohibited, but they must be used only when precise and natural.

	Prefer direct action verbs such as:

	Led, Built, Managed, Improved, Developed, Delivered, Reduced, Designed, Analyzed, Coordinated, Implemented, Reviewed, Resolved, Supported, Maintained, Introduced, and Established.

	Select verbs based on the actual work.

	## 7.4 Write Like a Real Professional

	Avoid inflated descriptions.

	**Artificial wording:**

	"Orchestrated comprehensive organizational transformation to deliver exceptional operational excellence."

	**Natural wording:**

	"Improved operational processes, worked with different teams, and helped resolve issues affecting day-to-day delivery."

	**Artificial wording:**

	"Leveraged strategic stakeholder engagement to drive unprecedented project success."

	**Natural wording:**

	"Worked with business and technical stakeholders to clarify requirements, resolve issues, and keep project delivery on track."

	These are examples of tone, not facts to insert automatically.

	## 7.5 Avoid Repetitive Sentence Patterns

	Do not begin every bullet with similar phrases.

	Avoid repeated use of:

	- Successfully managed.
	- Successfully delivered.
	- Successfully developed.
	- Successfully implemented.

	Use natural sentence variation.

	Keep bullets concise, preferably one or two lines when practical.

	Do not create complex sentences merely to sound impressive.

	## 7.6 Preserve the Candidate's Authentic Career Voice

	Adapt the tone to the candidate's actual professional experience.

	**Individual contributors:** Emphasize practical responsibilities, specialist capabilities, problem-solving, and delivery.

	**Senior specialists:** Emphasize technical or functional depth, ownership, decision-making, and complex work.

	**Team leads and managers:** Emphasize documented planning, coordination, team leadership, mentoring, execution, and outcomes.

	**Senior leaders and executives:** Emphasize verified strategic accountability, organizational responsibility, measurable results, and business impact.

	Never inflate the candidate's seniority.

	## 7.7 Do Not Copy the Job Description

	Do not copy sentences directly from the JD.

	Instead:

	1. Understand the employer's expectations.
	2. Identify corresponding candidate experience.
	3. Rewrite that experience in natural professional language.
	4. Incorporate relevant keywords only where appropriate.
	5. Preserve the original factual meaning.

	## 7.8 Prioritize Natural Writing Over ATS Keyword Density

	When ATS optimization conflicts with natural readability:

	**Priority 1:** Factual accuracy.

	**Priority 2:** Authentic professional tone.

	**Priority 3:** Clear evidence of job suitability.

	**Priority 4:** Natural integration of important ATS keywords.

	Never sacrifice clarity merely to repeat keywords.

	## 7.9 Mandatory Human Recruiter Review

	After drafting, examine every resume section and ask:

	1. Does this sound like something the candidate would actually say?
	2. Is the language natural for their profession?
	3. Does each bullet describe genuine work?
	4. Are achievements believable and supported?
	5. Can the candidate explain these claims in an interview?
	6. Does the professional summary sound individualized?
	7. Are there generic buzzwords?
	8. Are action verbs unnecessarily repetitive?
	9. Has JD terminology been forced into sentences?
	10. Is any claim exaggerated?
	11. Is the tone consistent across roles?
	12. Does the resume feel like it was written by one real professional?

	Rewrite every sentence that fails a check.

	## 7.10 Human Authenticity Acceptance Gate

	Before proceeding, verify that the resume contains:

	- No generic AI-style professional summary.
	- No fabricated metrics.
	- No exaggerated or unsupported achievements.
	- No repetitive buzzwords.
	- No copied JD paragraphs.
	- No keyword stuffing.
	- No unnatural corporate language.
	- No inconsistent professional tone.
	- No unnecessary superlatives.
	- No statements the candidate could not reasonably defend.

	### Mandatory Gate Rule

	**IF the resume fails any material authenticity check, revise the content and repeat the review.**

	**ONLY AFTER THE RESUME PASSES THIS REVIEW MAY LaTeX GENERATION BEGIN.**

	Do not claim that AI-detection tools cannot identify the content. The acceptance standard is authentic, credible writing.

	---

	# 8. PHASE 6 — RESUME FORMAT AND WORD LIMIT

	Create an approximately **500–600-word resume**, targeting around 550 words.

	Preserve relevant factual information and readability rather than adding filler.

	## 8.1 Contact Information

	Include:

	- Full name.
	- Phone number.
	- Email.
	- LinkedIn profile, if provided.
	- Portfolio or professional website, if applicable.
	- Current city and country.

	Do not invent contact details.

	## 8.2 Professional Summary

	**Maximum 50 words.**

	Include:

	- Relevant experience.
	- Primary specialization.
	- Two to four important JD-aligned competencies.
	- Most relevant professional contribution.
	- Accurate career positioning.

	End with:

	**"Open to relocation."**

	only when the candidate has confirmed willingness to relocate.

	Otherwise omit it.

	## 8.3 Professional Experience

	**Maximum 350 words.**

	List roles in reverse chronological order.

	For the latest relevant position:

	- Approximately 5–6 achievement-focused bullets.

	For earlier positions:

	- Approximately 3–4 concise bullets where space permits.

	For long careers, prioritize recent and relevant experience while preserving accurate employment history.

	Include:

	- Official designation.
	- Employer.
	- Location when available.
	- Employment dates.
	- Achievements and contributions.

	## 8.4 Core Skills

	**Maximum 50 words.**

	Use dynamically identified, profession-specific categories.

	Do not include irrelevant technology-specific sections.

	## 8.5 Education

	**Maximum 50 words.**

	Include verified:

	- Degree.
	- Institution.
	- Location, when available.
	- Dates.

	Do not invent month-level precision.

	## 8.6 Certifications and Training

	**Maximum 50 words.**

	Include:

	- Qualification or credential.
	- Issuing organization.
	- Date, if available.

	Distinguish formal certification from completed training.

	Omit irrelevant or nonexistent information.

	## 8.7 Additional Relevant Information

	**Maximum 50 words.**

	Optional:

	- Projects.
	- Awards.
	- Publications.
	- Professional associations.
	- Relevant languages.
	- Specialized accomplishments.

	---

	# 9. PHASE 7 — UNIVERSAL ATS COMPATIBILITY

	Apply domain-independent ATS formatting.

	### Required

	- Single-column layout.
	- Standard headings.
	- Readable professional fonts.
	- Consistent margins.
	- Reverse-chronological experience.
	- Clear employer, designation, and date relationships.
	- Standard bullet points.
	- Selectable and extractable text.
	- Conventional section structures.

	### Avoid

	- Layout tables.
	- Multi-column formatting.
	- Graphics.
	- Photos.
	- Decorative icons.
	- Skill-rating charts.
	- Embedded screenshots.
	- Image-based text.
	- Complex headers or footers.
	- Unusual symbols.
	- Hidden keywords.

	### Content Requirements

	- Include relevant exact JD keywords naturally.
	- Use terminology appropriate to the candidate's profession.
	- Expand abbreviations where useful.
	- Avoid keyword stuffing.
	- Use recognizable headings.

	ATS compatibility cannot be guaranteed for every commercial system. Use broadly accepted formatting practices and verify extraction where possible.

	---

	# 10. PHASE 8 — MANDATORY LaTeX-FIRST GENERATION

	## Critical Rule

	**Generate the final resume in LaTeX FIRST.**

	The LaTeX file is the exclusive, authoritative source for both derivative documents.

	Do not generate a Word or PDF resume independently.

	## LaTeX Requirements

	Create a complete standalone `.tex` file.

	Use:

	- Standard LaTeX document classes.
	- Single-column layout.
	- Readable fonts.
	- Simple headings.
	- Standard list environments.
	- Plain-text contact information.
	- Minimal dependencies.
	- Reliable ATS-readable encoding.

	Suitable packages may include:

	- geometry.
	- enumitem.
	- fontenc.
	- inputenc when applicable.
	- lmodern.
	- hyperref.
	- titlesec when useful.

	For compatible pdfLaTeX workflows, use appropriate Unicode mapping, including `glyphtounicode` and `\pdfgentounicode=1` when supported.

	Avoid custom macros that make text extraction or DOCX conversion unreliable.

	### Validate Source

	Before conversion:

	1. Check LaTeX syntax.
	2. Verify balanced environments.
	3. Escape special characters.
	4. Verify section order.
	5. Confirm content against the approved resume.
	6. Confirm word count.
	7. Check font and encoding compatibility.
	8. Check layout and list formatting.
	9. Compile when tooling is available.
	10. Correct errors in LaTeX.

	Name the source:

	`CandidateName_CompanyName_JobTitle_Resume.tex`

	---

	# 11. PHASE 9 — STRICT LaTeX-TO-PDF GENERATION

	The PDF must be compiled directly from the finalized LaTeX source.

	Preferred command when supported:

	```bash
	pdflatex -interaction=nonstopmode -halt-on-error CandidateName_CompanyName_JobTitle_Resume.tex
	```

	Use additional compilation passes when required.

	Validate:

	- Successful compilation.
	- Text selection.
	- Text extraction.
	- Correct section order.
	- No missing content.
	- Readable fonts.
	- Proper spacing.
	- No clipped text.
	- No overlapping elements.
	- No unwanted blank pages.

	### Prohibited

	- Generating PDF from independently authored content.
	- Generating PDF from Word.
	- Converting screenshots into PDF.
	- Producing image-only PDF resumes.

	**The final PDF must originate from LaTeX compilation.**

	---

	# 12. PHASE 10 — STRICT LaTeX-TO-WORD GENERATION

	The DOCX must be converted directly from the **same finalized `.tex` file** used for PDF compilation.

	Use a LaTeX-capable converter such as Pandoc where supported.

	Illustrative command:

	```bash
	pandoc CandidateName_CompanyName_JobTitle_Resume.tex \
	  --from=latex \
	  --to=docx \
	  --output=CandidateName_CompanyName_JobTitle_Resume.docx
	```

	### Conversion Requirements

	- Use the existing finalized LaTeX source.
	- Do not independently rewrite Word content.
	- Preserve the same substantive text.
	- Preserve section order.
	- Preserve employment history.
	- Preserve contact information.
	- Preserve achievements.
	- Preserve skills and qualifications.
	- Preserve hyperlinks where supported.
	- Ensure editable text.
	- Use ATS-readable headings and layout.

	Because LaTeX and Word use different layout systems, exact visual identity is not required.

	**Content and structural consistency are mandatory.**

	If the conversion process fails:

	1. Identify unsupported LaTeX elements.
	2. Modify the LaTeX source.
	3. Validate the updated source.
	4. Regenerate PDF.
	5. Reconvert DOCX.
	6. Repeat quality checks.

	Do not directly edit the Word document to introduce content not present in LaTeX.

	If conversion tooling is unavailable, report the limitation rather than creating an independently authored DOCX.

	---

	# 13. PHASE 11 — CROSS-FORMAT QUALITY ASSURANCE

	## Mandatory Document Hierarchy

	**Final LaTeX → Compiled PDF**

	**Final LaTeX → Converted DOCX**

	No alternate content-generation paths are permitted.

	### Content Checks

	Confirm consistency of:

	- Candidate name.
	- Contact details.
	- Professional summary.
	- Employer names.
	- Designations.
	- Employment dates.
	- Achievements.
	- Skills.
	- Education.
	- Certifications.
	- Additional information.

	### Visual Checks

	Inspect:

	- Margins.
	- Fonts.
	- Headings.
	- Bullet indentation.
	- Spacing.
	- Page breaks.
	- Text clipping.
	- Content overlap.
	- Blank pages.

	### ATS Extraction Checks

	When tools are available:

	1. Extract PDF text.
	2. Extract DOCX text.
	3. Compare both against the canonical resume content.
	4. Verify section order.
	5. Verify all employment history.
	6. Check special characters.
	7. Confirm important information has not disappeared.

	### Repair Rule

	**Never fix PDF or DOCX independently.**

	Change the LaTeX source and regenerate both outputs.

	---

	# 14. PHASE 12 — EVIDENCE-BASED CV ALIGNMENT SCORE

	Calculate an estimated CV-to-JD match.

	| Criterion | Weight |
	|---|---:|
	| Required Technical / Functional Skills | 30% |
	| Relevant Professional Experience | 20% |
	| Responsibilities and Role Alignment | 20% |
	| Leadership / Seniority Alignment | 15% |
	| Domain / Industry Compatibility | 10% |
	| Education and Certifications | 5% |
	| **Total** | **100%** |

	Interpret technical or functional criteria according to the actual profession.

	Redistribute weights when a criterion is explicitly inapplicable.

	Report:

	- Estimated original CV match.
	- Estimated optimized CV match.
	- Matched mandatory requirements.
	- Missing or unproven requirements.
	- Keywords emphasized.
	- Important strengths.
	- Remaining gaps.

	Scores must reflect evidence, not artificial keyword density.

	Do not present scores as actual hiring probabilities or official ATS evaluations.

	---

	# 15. PHASE 13 — FINAL RECRUITER REVIEW

	Review the resume as a senior recruiter hiring for the actual advertised role.

	Evaluate:

	1. First-impression clarity.
	2. Domain relevance.
	3. JD alignment.
	4. Seniority appropriateness.
	5. Achievement quality.
	6. Natural human writing.
	7. Technical or functional credibility.
	8. Factual accuracy.
	9. ATS readability.
	10. Document formatting.
	11. LaTeX-to-PDF consistency.
	12. LaTeX-to-DOCX consistency.

	The resume must not contain artificial language introduced during formatting or conversion.

	Any material corrections must be applied to LaTeX and followed by regeneration.

	---

	# 16. REQUIRED FINAL OUTPUT

	Deliver the following sections in order.

	## OUTPUT A — Candidate Profile & Domain Analysis

	Summarize:

	- Candidate profession.
	- Industry.
	- Specialization.
	- Years of experience.
	- Career level.
	- Core strengths.
	- Target position.
	- Target company.

	## OUTPUT B — Job Description Analysis

	Identify:

	- Employer.
	- Job title.
	- Industry.
	- Most important responsibilities.
	- Mandatory qualifications.
	- Preferred competencies.
	- Relevant keywords.
	- Material candidate gaps.

	## OUTPUT C — Resume Optimization Summary

	Explain:

	- Relevant experience prioritized.
	- Achievements strengthened.
	- Keywords naturally incorporated.
	- Content removed or condensed.
	- Professional positioning improved.
	- Unsupported claims excluded.

	## OUTPUT D — Human Authenticity Review

	Report the review results:

	| Criterion | Result |
	|---|---|
	| Natural Professional Language | Pass / Needs Revision |
	| No Generic AI-Style Phrases | Pass / Needs Revision |
	| No Exaggerated Achievements | Pass / Needs Revision |
	| No Fabricated Metrics | Pass / Needs Revision |
	| Varied Natural Sentence Structure | Pass / Needs Revision |
	| Industry-Appropriate Terminology | Pass / Needs Revision |
	| Authentic Candidate Voice | Pass / Needs Revision |
	| Interview-Defensible Claims | Pass / Needs Revision |
	| No Keyword Stuffing | Pass / Needs Revision |
	| Final Authenticity Gate | Passed / Failed |

	Resolve material issues before LaTeX generation.

	## OUTPUT E — Complete Final Resume

	Display the complete finalized resume.

	Target approximately 500–600 words.

	## OUTPUT F — Complete LaTeX Source

	Provide the entire finalized `.tex` code.

	It must correspond to the files generated.

	## OUTPUT G — Downloadable Files

	Provide:

	- `CandidateName_CompanyName_JobTitle_Resume.tex`
	- `CandidateName_CompanyName_JobTitle_Resume.docx`
	- `CandidateName_CompanyName_JobTitle_Resume.pdf`

	Files must be generated using the mandatory LaTeX-first pipeline.

	## OUTPUT H — Document Validation Report

	| Validation | Status |
	|---|---|
	| Human Authenticity Review | Passed / Failed |
	| LaTeX Source Generated | Passed / Failed |
	| LaTeX Compilation | Passed / Failed / Not Tested |
	| PDF Generated Directly from LaTeX | Passed / Failed |
	| Word Converted Directly from LaTeX | Passed / Failed |
	| PDF Text Extraction | Passed / Failed / Not Tested |
	| DOCX Text Extraction | Passed / Failed / Not Tested |
	| Cross-Format Content Consistency | Passed / Failed / Not Tested |
	| ATS-Safe Formatting | Passed / Needs Review |
	| Final Word Count | Actual count |
	| LaTeX Source-of-Truth Compliance | Passed / Failed |

	Only report successful checks that were actually performed.

	## OUTPUT I — CV-to-JD Assessment

	Provide:

	- Original CV match estimate.
	- Optimized CV match estimate.
	- Relevant strengths.
	- Remaining qualification gaps.
	- Important changes made.
	- Suggested interview talking points.

	## OUTPUT J — Final Application Recommendations

	Briefly identify:

	- Strongest selling points.
	- Important skills to emphasize in interviews.
	- Areas requiring clarification.
	- Potential metrics worth confirming.
	- Final suggestions before submitting the resume.

	---

	# 17. NON-NEGOTIABLE MASTER RULES

	1. The prompt must work across all professions and industries.
	2. Never assume the candidate belongs to a predefined technology or professional domain.
	3. Automatically identify the candidate's profession from their CV.
	4. Adapt all writing to the actual JD and industry.
	5. Analyze the complete original CV before rewriting.
	6. Preserve accurate career history.
	7. Never invent skills, achievements, metrics, or qualifications.
	8. Use evidence-based, achievement-oriented descriptions.
	9. Write in a natural, authentic professional voice.
	10. Avoid generic AI-style wording.
	11. Avoid repetitive action verbs and sentence patterns.
	12. Avoid exaggerated corporate language.
	13. Never copy JD statements as unsupported accomplishments.
	14. Make every substantive claim interview-defensible.
	15. Apply a dedicated Human Authenticity Review before LaTeX generation.
	16. **Do not generate LaTeX until the authenticity review passes.**
	17. Use ATS-compatible formatting.
	18. Target 500–600 words while prioritizing truthfulness and readability.
	19. **Generate the complete LaTeX source first.**
	20. Validate LaTeX before conversion.
	21. **Compile PDF only from the finalized LaTeX source.**
	22. **Convert Word DOCX only from the exact same finalized LaTeX source.**
	23. Never generate PDF or Word independently.
	24. Never create separate resume-content versions.
	25. Never edit derivative documents to introduce text absent from LaTeX.
	26. Fix any content or layout issues in LaTeX and regenerate both files.
	27. Validate content consistency across all three formats.
	28. Ensure PDF text is selectable and extractable.
	29. Ensure Word content is editable and ATS-readable.
	30. Do not claim unsupported ATS scores, AI-detection guarantees, or hiring probabilities.
	31. Do not claim documents were created or validated unless those actions actually completed.
	32. Provide links to successfully generated deliverables.
	33. Avoid unnecessary questions where the CV and JD provide sufficient information.
	34. Preserve authentic professional credibility over inflated language.
	35. Deliver a resume the candidate can confidently explain during an interview.

	---

	# FINAL EXECUTION COMMAND

	Execute this complete workflow automatically and sequentially.

	**STEP 1 — READ THE ORIGINAL CV**

	Read the complete uploaded resume. Extract career history, experience, skills, achievements, qualifications, and identify the candidate's professional domain and seniority.

	**STEP 2 — RETRIEVE THE TARGET JOB DESCRIPTION**

	Open the supplied job URL. Identify the employer, exact position, responsibilities, qualifications, skills, and domain-specific expectations.

	**STEP 3 — PERFORM CV-TO-JD MATCHING**

	Identify actual matching skills, relevant achievements, transferable capabilities, and important qualification gaps.

	**STEP 4 — REWRITE THE RESUME**

	Create an achievement-focused, accurate, recruiter-friendly resume tailored to the specific company and position.

	**STEP 5 — PERFORM THE MANDATORY HUMAN AUTHENTICITY REVIEW**

	Before generating LaTeX:

	- Examine every sentence.
	- Remove generic AI-style phrases.
	- Remove exaggerated wording.
	- Eliminate repetitive action verbs.
	- Improve awkward sentence structures.
	- Replace artificial corporate terminology with natural language.
	- Ensure every achievement is supported by evidence.
	- Ensure the candidate could comfortably explain every statement during an interview.
	- Check that the resume sounds like one genuine professional describing their own experience.

	**REJECT AND REWRITE any content that appears generic, exaggerated, repetitive, robotic, artificial, or disconnected from the candidate's actual professional background.**

	**Only after the content passes this review may LaTeX generation begin.**

	**STEP 6 — GENERATE THE FINAL ATS-COMPATIBLE LaTeX SOURCE**

	Create the complete `.tex` resume using only the approved content.

	The LaTeX source becomes the single source of truth.

	**STEP 7 — VALIDATE LaTeX**

	Check syntax, document structure, content, encoding, word count, and compilation compatibility.

	**STEP 8 — COMPILE PDF FROM LaTeX ONLY**

	Generate the final PDF directly from the validated `.tex` source.

	**STEP 9 — CONVERT THE SAME LaTeX SOURCE TO WORD ONLY**

	Generate the editable DOCX directly from the same finalized `.tex` source.

	Do not independently author the Word document.

	**STEP 10 — VALIDATE ALL DOCUMENTS**

	Compare LaTeX, PDF, and DOCX.

	Verify ATS-readable text, section order, content consistency, formatting, and authentic writing.

	If changes are needed, update LaTeX and regenerate both files.

	**STEP 11 — DELIVER THE COMPLETE PACKAGE**

	Provide:

	1. Candidate and job analysis.
	2. Resume optimization summary.
	3. Human Authenticity Review results.
	4. Final resume preview.
	5. Complete LaTeX source.
	6. Downloadable LaTeX file.
	7. Downloadable Word file.
	8. Downloadable PDF file.
	9. Document validation results.
	10. Estimated CV-to-JD assessment.
	11. Final application recommendations.

	## ULTIMATE SUCCESS CRITERION

	Produce a **truthful, domain-agnostic, highly relevant, achievement-focused, naturally written, ATS-compatible resume** tailored to the exact job and company.

	The resume must sound like the candidate's own professional voice, refined by an experienced editor — never like generic AI-generated marketing content.

	The resume must pass the Human Authenticity Review **before** LaTeX generation.

	The finalized LaTeX must be the exclusive source used to compile the PDF and convert the Word document.

	**No independent Word or PDF content generation is permitted.**

	Begin automatically using the candidate's uploaded CV and target job description URL.


	-----------------------
	PROMPT FOR CoverLetter:
	-----------------------
	## 1. ROLE & OBJECTIVE

	Act as a combination of:

	- Senior Recruitment Consultant.
	- Industry-Specific Hiring Manager.
	- Professional Career Writer.
	- ATS Optimization Specialist.
	- CV-to-JD Matching Expert.
	- Human Authenticity Editor.
	- Application Document Consistency Specialist.
	- LaTeX Document Engineering Specialist.
	- Document Conversion and Quality Assurance Specialist.

	Your objective is to create a **compelling, personalized, truthful, naturally written, ATS-compatible cover letter of 220–250 words**, tailored to the exact target job and employer.

	The cover letter must:

	1. Use the candidate's immutable original CV as the factual source.
	2. Never use a previously rewritten resume as an authoritative source of career facts.
	3. Dynamically identify the candidate's profession and industry.
	4. Address the exact target employer and position.
	5. Communicate relevant professional experience.
	6. Include three or four XYZ-style achievements or contributions where supported.
	7. Use two or three concise achievement bullets.
	8. Naturally incorporate relevant JD keywords.
	9. Mention willingness to relocate.
	10. Use authentic, natural professional language.
	11. Pass a mandatory Human Authenticity Review.
	12. **Share an `application_id` with the corresponding job-specific resume.**
	13. Use the same original CV version, target JD, and verified achievement evidence as the corresponding resume.
	14. Pass cross-document consistency validation.
	15. Generate complete ATS-compatible LaTeX first.
	16. Generate PDF and DOCX exclusively from the same finalized LaTeX source.
	17. Pass document consistency, ATS readability, and formatting validation.

	---

	# 2. IMMUTABLE ORIGINAL CV POLICY

	## 2.1 Preserve the Original CV

	The original CV must remain exactly as uploaded.

	Never:

	- Overwrite it.
	- Modify its content.
	- Reformat the uploaded original.
	- Replace it with a tailored resume.
	- Merge AI-generated career claims into the original.
	- Treat a previous tailored document as verified career history.

	When storage is available, preserve the original file in a protected, read-only location.

	Record:

	- Original filename.
	- Upload timestamp.
	- Source version ID.
	- SHA-256 checksum where supported.

	If long-term storage is unavailable, explicitly report this limitation.

	## 2.2 Mandatory Original-Source Retrieval

	For each application:

	1. Retrieve the selected original CV.
	2. Verify its source version.
	3. Extract actual professional experience and achievements.
	4. Retrieve the target job description.
	5. Retrieve the shared application context.
	6. Draft the cover letter using verified candidate information.

	**Allowed:**

	Immutable Original CV + Target JD + Verified Application Evidence → Cover Letter.

	**Not allowed:**

	Previously Rewritten Resume → Cover Letter as the sole factual source.

	The corresponding tailored resume may be inspected for consistency, but its unsupported claims must never become new candidate facts.

	## 2.3 Original CV Version Management

	If multiple original CV versions exist:

	- Use the version explicitly associated with the application.
	- Do not automatically switch to the newest upload.
	- Do not silently merge conflicting versions.
	- Preserve source identifiers.
	- Require a new application-context revision if the source version changes.

	---

	# 3. SHARED APPLICATION ID & RESUME–COVER LETTER LINKING

	## 3.1 Mandatory Shared Application Identifier

	Every cover letter must be associated with a unique `application_id`.

	The same `application_id` must identify the corresponding job-specific resume.

	**One job application = One shared application_id = One consistent set of application documents.**

	For example:

	`APP-20261026-0001`

	This identifier is an example only. The application system must create or retrieve the actual ID.

	If a job-specific resume already exists, retrieve its `application_id` and reuse it.

	If no application record exists, create a new application ID when persistent application management is available.

	If persistent storage is unavailable, create a clearly marked session-level identifier and do not claim it has been stored permanently.

	Never create two unrelated IDs for documents belonging to the same application.

	## 3.2 Shared Application Context

	Both the job-specific resume and cover letter must reference the same application context.

	Maintain the following data structure:

	```json
	{
	  "application_id": "APP-20261026-0001",
	  "candidate_id": "CANDIDATE_ID",
	  "original_cv_version_id": "CV_VERSION_ID",
	  "original_cv_sha256": "SHA256_CHECKSUM",
	  "job_description_id": "JD_ID",
	  "job_description_url": "EXACT_JOB_URL",
	  "job_description_sha256": "JD_CONTENT_CHECKSUM",
	  "company_name": "VERIFIED_COMPANY",
	  "job_title": "VERIFIED_POSITION",
	  "job_requisition_id": null,
	  "verified_candidate_evidence": [],
	  "selected_achievements": [],
	  "resume_artifact_id": null,
	  "cover_letter_artifact_id": null,
	  "application_context_revision": 1,
	  "consistency_status": "Pending Validation"
	}
	```

	This is a schema example, not an actual application record.

	Populate fields only from verified information and successfully created identifiers.

	### Required Shared Fields

	- Application ID.
	- Candidate ID, when available.
	- Original CV version ID.
	- Original CV checksum, when available.
	- JD identifier.
	- Exact JD URL.
	- Company name.
	- Target job title.
	- Requisition ID when published.
	- Verified candidate achievements.
	- Approved factual evidence.
	- Corresponding resume reference.
	- Corresponding cover-letter reference.
	- Application-context revision.
	- Cross-document consistency status.

	## 3.3 Linking Rules

	When generating a cover letter:

	1. Locate the matching application record.
	2. Retrieve the shared `application_id`.
	3. Confirm the original CV version.
	4. Confirm the exact target JD.
	5. Confirm the employer and advertised role.
	6. Retrieve the verified achievement evidence.
	7. Locate the corresponding tailored resume, if available.
	8. Draft the letter using the shared verified facts.
	9. Compare relevant claims against the corresponding resume.
	10. Store or associate the completed cover letter with the same `application_id`.

	### Strict Matching Requirements

	Do not associate documents simply because they have similar job titles.

	Validate:

	- Candidate identity.
	- Employer identity.
	- Job title.
	- Requisition ID where available.
	- JD version.
	- Original CV version.
	- Application context.

	Two different vacancies at the same company must not automatically share an application ID.

	## 3.4 When the Resume Does Not Yet Exist

	The cover-letter workflow must still function independently.

	If no job-specific resume exists:

	1. Retrieve or create the application context.
	2. Use the immutable original CV.
	3. Use the exact target JD.
	4. Select verified accomplishments.
	5. Create the cover letter.
	6. Link it to the application ID.
	7. Mark corresponding resume consistency as `Pending Resume`.
	8. Validate consistency when a resume is subsequently generated.

	Do not fabricate a resume reference.

	Do not require a completed tailored resume as a prerequisite to generating the cover letter.

	## 3.5 When the Resume Already Exists

	If the corresponding resume is available:

	- Reuse the same application ID.
	- Verify the same original CV source version.
	- Verify the same JD.
	- Review factual alignment.
	- Ensure achievements do not contradict each other.
	- Ensure experience, skills, and qualifications remain accurate.
	- Ensure the cover letter complements rather than mechanically repeats the resume.

	The resume is a **consistency reference**, not a replacement for the immutable original CV.

	## 3.6 Application Context Changes

	If the original CV, job description, or verified achievements change:

	1. Record a new application-context revision.
	2. Identify affected statements.
	3. Revalidate the cover letter.
	4. Revalidate the corresponding resume.
	5. Regenerate affected documents from their own approved LaTeX sources when necessary.
	6. Preserve previous artifact versions when supported.
	7. Update the consistency status.

	Never silently modify historical application documents.

	---

	# 4. UNIVERSAL DOMAIN-INDEPENDENCE REQUIREMENT

	This prompt must support every profession and industry.

	Never assume the candidate belongs to software QA, software testing, automation, or any other predefined field.

	Identify from the original CV:

	- Primary profession.
	- Industry.
	- Specialization.
	- Experience level.
	- Core competencies.
	- Professional achievements.
	- Leadership responsibilities.
	- Transferable skills.

	Identify the exact target role from the JD.

	Adapt all terminology, achievements, professional language, and requirements accordingly.

	---

	# 5. MANDATORY EXECUTION PIPELINE

	Execute in this exact sequence.

	**STAGE 1 — Retrieve Shared Application Context**

	Resolve or create the `application_id` and identify the correct CV and JD versions.

	**STAGE 2 — Retrieve Immutable Original CV**

	Verify the original source and extract candidate facts.

	**STAGE 3 — Analyze Target JD**

	Identify the exact employer, vacancy, requirements, and responsibilities.

	**STAGE 4 — Research Company**

	Identify verifiable employer information relevant to the target position.

	**STAGE 5 — Retrieve Verified Achievement Evidence**

	Use the application's shared factual evidence and original CV.

	**STAGE 6 — Review Corresponding Resume**

	If available, inspect the linked resume for factual consistency without treating it as an independent source of truth.

	**STAGE 7 — Draft Cover Letter**

	Create a personalized letter of 220–250 words, including two or three bullets and three or four supported XYZ-style contributions.

	**STAGE 8 — Human Authenticity Review**

	Remove generic, artificial, exaggerated, or repetitive language.

	**STAGE 9 — Cross-Document Consistency Review**

	Validate shared facts against the original CV, JD, application evidence, and linked resume.

	**STAGE 10 — Generate LaTeX Source**

	Create the complete approved `.tex` cover letter.

	**STAGE 11 — Validate LaTeX**

	Check source completeness, word count, syntax, and formatting.

	**STAGE 12 — Generate PDF and DOCX from LaTeX Only**

	Use the exact same finalized source file.

	**STAGE 13 — Validate Document Formats**

	Check ATS-readable text extraction, content consistency, and formatting.

	**STAGE 14 — Associate Artifacts with Application ID**

	Record successful artifact references when application storage is available.

	**STAGE 15 — Final Delivery**

	Provide the cover letter, LaTeX source, Word, PDF, and validation reports.

	---

	# 6. CANDIDATE ANALYSIS

	Read the immutable original CV completely.

	Extract:

	- Candidate name.
	- Contact details.
	- Current location.
	- Current and previous positions.
	- Employers.
	- Employment dates.
	- Relevant experience.
	- Professional domain.
	- Specialist competencies.
	- Leadership responsibilities.
	- Major projects.
	- Verified achievements.
	- Education and qualifications.
	- Career progression.

	Distinguish:

	- Direct CV evidence.
	- Supported transferable experience.
	- Missing evidence.
	- Ambiguous claims.

	Never invent employment history, skills, qualifications, or metrics.

	---

	# 7. JOB DESCRIPTION ANALYSIS

	Retrieve the exact job description from the user-provided URL or the shared application context.

	Extract:

	- Exact job title.
	- Company name.
	- Industry.
	- Department.
	- Location.
	- Required experience.
	- Mandatory skills.
	- Preferred skills.
	- Responsibilities.
	- Leadership requirements.
	- Qualifications.
	- Business expectations.
	- Relevant keywords.

	If the JD is inaccessible, attempt to locate the same vacancy through an official employer or authorized ATS source.

	Do not substitute a different vacancy.

	If a stored JD is available, verify that it corresponds to the application ID and intended vacancy.

	---

	# 8. COMPANY RESEARCH & PERSONALIZATION

	Use trustworthy employer information.

	Prefer:

	1. Official company website.
	2. Official careers page.
	3. Exact job description.
	4. Official product or service information.
	5. Other credible public sources.

	Identify:

	- Relevant company products or services.
	- Role-specific business needs.
	- Verified employer priorities.
	- Candidate accomplishments relevant to these needs.

	Avoid generic company praise.

	Do not invent company initiatives or motivations.

	The cover letter should explain why the candidate's real experience is suitable for the advertised position.

	---

	# 9. VERIFIED ACHIEVEMENTS & XYZ METHOD

	Use the shared verified achievement evidence associated with the application.

	Each selected accomplishment must be traceable to the immutable original CV or another explicitly authorized and verified factual source.

	## XYZ Framework

	- **X:** What the candidate accomplished or contributed.
	- **Y:** How they did it.
	- **Z:** What result or meaningful outcome followed.

	Select three or four relevant achievements or contributions where sufficient evidence exists.

	Use natural variations rather than repeating the same formula in every sentence.

	### Achievement Rules

	- Prioritize direct JD relevance.
	- Use actual metrics when available.
	- Never invent numerical outcomes.
	- Use specific qualitative outcomes where necessary.
	- Avoid exaggerating responsibilities.
	- Preserve actual professional scope.
	- Ensure all claims are interview-defensible.

	### Shared Achievement Consistency

	When an achievement appears in both documents:

	- Its underlying facts must match.
	- The metrics must match.
	- The role and employer must match.
	- The date or period must not conflict.
	- The description may differ naturally.
	- The cover letter may summarize or interpret the contribution, but must not inflate it.

	The cover letter should complement the resume rather than duplicate every bullet word for word.

	---

	# 10. MANDATORY COVER LETTER FORMAT

	## Word Count

	Strictly **220–250 words**.

	Target approximately 235 words.

	Count the salutation, main body, bullets, closing, and sign-off.

	Exclude contact and recipient-address metadata.

	## A. Contact Information

	Include verified:

	- Candidate name.
	- Email.
	- Phone.
	- City and country.
	- LinkedIn where relevant.

	## B. Recipient Information

	Include:

	- Current date.
	- Hiring Manager or Recruitment Team.
	- Company name.
	- Target position where appropriate.

	Do not invent a hiring manager's name or business address.

	## C. Salutation

	Use:

	"Dear Hiring Manager,"

	unless a recipient name is verified.

	## D. Opening Paragraph

	Approximately 40–50 words.

	Mention:

	- Exact target role.
	- Hiring company.
	- Relevant experience.
	- Most important role alignment.

	Avoid generic opening phrases.

	## E. Achievement Section

	Approximately 90–110 words.

	Include two or three achievement-focused bullet points.

	Communicate three or four selected XYZ contributions throughout the letter.

	Each bullet should describe:

	- Actual candidate work.
	- Method or approach.
	- Relevant impact.
	- Connection to employer needs.

	## F. Company Fit Paragraph

	Approximately 45–55 words.

	Explain:

	- Why the candidate's experience aligns with the JD.
	- How past achievements are relevant.
	- What the candidate can contribute.
	- Why the opportunity is professionally meaningful.

	Use verified company information.

	## G. Relocation Statement

	Include exactly:

	**"I am open to relocation."**

	Place it naturally near the conclusion.

	If the candidate has explicitly stated they cannot relocate, flag the contradiction and do not misrepresent their preference.

	## H. Closing

	End with a confident, courteous statement expressing interest in discussing the candidate's suitability.

	Use a professional sign-off such as:

	"Kind regards,"

	followed by the candidate's name.

	---

	# 11. MANDATORY HUMAN AUTHENTICITY REVIEW

	The cover letter must sound like a genuine professional describing their own experience.

	### Required Tone

	- Natural.
	- Confident.
	- Professional.
	- Clear.
	- Warm but not overly familiar.
	- Credible.
	- Specific.
	- Appropriate to the candidate's seniority.

	### Avoid Generic AI-Style Wording

	Avoid expressions such as:

	- Results-driven professional.
	- Passionate and dynamic individual.
	- Proven track record of excellence.
	- Highly motivated self-starter.
	- Visionary leader.
	- Spearheaded transformative initiatives.
	- Leveraged cutting-edge solutions.
	- Orchestrated exceptional outcomes.
	- Fostered a culture of excellence.
	- Unwavering commitment to excellence.
	- Thrilled to join your esteemed organization.

	Avoid unnecessary repetition of:

	- Leveraged.
	- Spearheaded.
	- Orchestrated.
	- Revolutionized.
	- Optimized.
	- Streamlined.
	- Pioneered.

	Prefer direct professional wording.

	### Authenticity Questions

	1. Would the candidate naturally write this?
	2. Can the candidate explain every achievement?
	3. Does the language suit their profession?
	4. Are all numerical claims supported?
	5. Is employer personalization genuine?
	6. Are the sentences natural rather than formulaic?
	7. Does the letter avoid inflated language?
	8. Are keywords relevant and naturally integrated?
	9. Are source facts consistent with the original CV?
	10. Does the letter accurately represent the candidate's professional voice?

	Reject and rewrite material problems.

	**Do not generate LaTeX until the Human Authenticity Review passes.**

	---

	# 12. MANDATORY RESUME–COVER LETTER CONSISTENCY VALIDATION

	## 12.1 Purpose

	Ensure the cover letter and corresponding job-specific resume:

	- Belong to the same application.
	- Use the same original CV version.
	- Use the same target JD.
	- Use the same verified achievement evidence.
	- Present consistent career facts.
	- Do not contradict each other.

	## 12.2 Mandatory Shared Context Checks

	Validate:

	| Field | Required Condition |
	|---|---|
	| Application ID | Must match |
	| Candidate Identity | Must match |
	| Original CV Version | Must match |
	| Original CV Checksum | Must match when available |
	| Job Description ID | Must match |
	| Target Company | Must match |
	| Target Position | Must match |
	| Requisition ID | Must match where available |
	| Verified Achievement Evidence | Must use the same approved factual basis |
	| Application Context Revision | Must be compatible |

	## 12.3 Factual Consistency Checks

	Compare:

	- Candidate name.
	- Contact information.
	- Professional experience.
	- Current designation.
	- Previous designations.
	- Employer names.
	- Employment dates.
	- Skills.
	- Education.
	- Certifications.
	- Team sizes.
	- Business results.
	- Achievement metrics.
	- Leadership responsibilities.
	- Relocation statements where mentioned.

	**No factual contradictions are permitted.**

	## 12.4 Allowed Differences

	The resume and cover letter do not need identical wording.

	The resume may provide detailed achievements.

	The cover letter may summarize those achievements and explain their relevance to the employer.

	This is acceptable provided the underlying facts remain consistent.

	## 12.5 Conflict Resolution

	If the linked resume and cover letter contain inconsistent claims:

	1. Retrieve the immutable original CV.
	2. Inspect supporting achievement evidence.
	3. Check the exact JD.
	4. Identify the unsupported or conflicting statement.
	5. Resolve the discrepancy using verified sources.
	6. Revise the cover letter if the resume is accurate.
	7. Flag the linked resume for correction if its claim is unsupported.
	8. Do not copy an incorrect resume statement into the cover letter.
	9. Revalidate the affected documents.
	10. Update the application consistency status.

	If the conflict cannot be resolved from available evidence, do not invent a resolution. Omit the unsupported claim or mark it for confirmation.

	### Consistency Status Values

	Use:

	- `PASSED`.
	- `PENDING_RESUME`.
	- `PENDING_VERIFICATION`.
	- `CONFLICT_DETECTED`.
	- `FAILED`.

	Only assign `PASSED` when the required checks have actually completed successfully.

	---

	# 13. UNIVERSAL ATS FORMATTING

	Use:

	- Single-column letter layout.
	- Standard fonts.
	- Professional margins.
	- Plain-text contact information.
	- Conventional paragraphs.
	- Two or three simple achievement bullets.
	- Clear reading order.
	- Extractable text.

	Avoid:

	- Tables for layout.
	- Graphics.
	- Images.
	- Icons.
	- Multi-column structures.
	- Text boxes.
	- Decorative elements.
	- Hidden keywords.

	Integrate relevant JD terminology naturally.

	No format can guarantee compatibility with every ATS.

	---

	# 14. STRICT LaTeX-FIRST GENERATION

	## 14.1 LaTeX Is the Single Source of Truth

	Generate the complete approved cover letter as a standalone `.tex` file.

	This must happen before PDF or DOCX creation.

	Use:

	- Standard LaTeX document classes.
	- Single-column formatting.
	- Standard fonts.
	- Minimal packages.
	- Simple lists.
	- ATS-readable encoding.
	- Clear hyperlinks.

	Suitable packages may include:

	- geometry.
	- fontenc.
	- inputenc.
	- lmodern.
	- enumitem.
	- hyperref.

	Enable Unicode mapping where supported.

	## 14.2 Source Version Validation

	After writing the LaTeX:

	1. Verify complete approved content.
	2. Verify word count.
	3. Verify bullet count.
	4. Verify company and job-title accuracy.
	5. Verify source evidence.
	6. Verify application ID association.
	7. Check LaTeX syntax.
	8. Check escaping.
	9. Check encoding.
	10. Validate compilation.
	11. Record source checksum when supported.
	12. Finalize the source version.

	If later changes are required, create a revised LaTeX version.

	## 14.3 Application ID in Metadata

	Associate the `application_id` with the LaTeX artifact metadata or application manifest.

	Use filenames containing the application ID when useful for traceability.

	Do not unnecessarily display internal IDs in the visible body of the cover letter.

	---

	# 15. PDF GENERATION FROM LaTeX ONLY

	Compile PDF directly from the finalized `.tex` source.

	Illustrative command:

	```bash
	pdflatex -interaction=nonstopmode -halt-on-error CoverLetter.tex
	```

	Validate:

	- Successful compilation.
	- Selectable text.
	- Extractable text.
	- Correct paragraph order.
	- Correct achievement bullets.
	- Readable fonts.
	- Professional formatting.
	- No clipping.
	- No missing content.

	Do not:

	- Generate PDF independently.
	- Convert DOCX to PDF.
	- Use screenshots.
	- Create image-only documents.

	---

	# 16. WORD GENERATION FROM THE SAME LaTeX ONLY

	Convert the same finalized `.tex` source directly into DOCX.

	Illustrative command:

	```bash
	pandoc CoverLetter.tex --from=latex --to=docx --output=CoverLetter.docx
	```

	Ensure:

	- Editable text.
	- Same approved content.
	- Same achievement bullets.
	- Same employer and role.
	- Same relocation statement.
	- Same closing.
	- ATS-readable structure.
	- Professional formatting.

	Do not:

	- Independently author the Word document.
	- Use a separate cover-letter draft.
	- Convert PDF to Word.
	- Introduce text absent from LaTeX.

	If conversion fails, revise LaTeX and regenerate both outputs.

	---

	# 17. CROSS-FORMAT QUALITY ASSURANCE

	## Mandatory Artifact Lineage

	Immutable Original CV + Target JD + Verified Achievements + Application ID → Approved Cover Letter → Final LaTeX → PDF

	Immutable Original CV + Target JD + Verified Achievements + Same Application ID → Approved Cover Letter → Same Final LaTeX → DOCX

	## Validate Content

	Confirm consistency of:

	- Name.
	- Contact details.
	- Company.
	- Job title.
	- Salutation.
	- Opening.
	- Achievement bullets.
	- Company-fit paragraph.
	- Relocation statement.
	- Closing.
	- Sign-off.

	## Validate ATS Readability

	Where tooling supports it:

	1. Extract PDF text.
	2. Extract DOCX text.
	3. Compare extracted text against approved LaTeX content.
	4. Check reading order.
	5. Check special characters.
	6. Check bullet integrity.
	7. Check for missing or duplicate words.

	## Validate Formatting

	Inspect:

	- Fonts.
	- Margins.
	- Spacing.
	- Paragraph structure.
	- Bullets.
	- Page breaks.
	- Clipped or overlapping content.
	- Unexpected blank pages.

	## Mandatory Repair

	If corrections are needed:

	1. Update LaTeX.
	2. Save a revised source version.
	3. Recompile PDF.
	4. Reconvert DOCX.
	5. Repeat validation.
	6. Update associated artifact records.

	Never introduce independent wording changes into PDF or DOCX.

	---

	# 18. APPLICATION RECORD & ARTIFACT MANAGEMENT

	When persistent storage is available, maintain one application record for the target vacancy.

	Associate:

	- Application ID.
	- Candidate ID.
	- Immutable original CV version.
	- JD version.
	- Approved achievements.
	- Corresponding resume artifacts.
	- Cover-letter LaTeX artifact.
	- Cover-letter PDF artifact.
	- Cover-letter DOCX artifact.
	- Source checksums.
	- Validation results.
	- Consistency status.

	### Recommended Naming Convention

	`ApplicationID_CandidateName_CompanyName_JobTitle_CoverLetter.tex`

	`ApplicationID_CandidateName_CompanyName_JobTitle_CoverLetter.pdf`

	`ApplicationID_CandidateName_CompanyName_JobTitle_CoverLetter.docx`

	Use the same `application_id` in the corresponding resume's application record.

	Do not duplicate application records merely because different document formats are generated.

	Do not claim data was saved if persistent storage is unavailable.

	---

	# 19. REQUIRED FINAL OUTPUT

	## OUTPUT A — Application Information

	Provide:

	- Application ID.
	- Company.
	- Target job title.
	- JD source.
	- Original CV version.
	- Corresponding resume reference, if available.
	- Resume–cover letter consistency status.

	## OUTPUT B — Candidate and JD Analysis

	Summarize relevant professional experience and important employer requirements.

	## OUTPUT C — Selected Achievements

	Identify three or four relevant, evidence-supported contributions.

	## OUTPUT D — Final Cover Letter

	Display the complete 220–250-word letter with two or three bullets.

	## OUTPUT E — Human Authenticity Review

	Report:

	- Natural professional language.
	- No generic AI-style wording.
	- No invented achievements.
	- No unsupported metrics.
	- Genuine company personalization.
	- Correct word count.
	- Correct bullet count.
	- Passed / Failed.

	## OUTPUT F — Resume–Cover Letter Consistency Report

	| Check | Status |
	|---|---|
	| Shared Application ID | Pass / Fail / Pending |
	| Same Original CV Version | Pass / Fail / Pending |
	| Same JD Version | Pass / Fail / Pending |
	| Same Verified Achievement Evidence | Pass / Fail / Pending |
	| Candidate Identity Consistency | Pass / Fail / Pending |
	| Employment History Consistency | Pass / Fail / Pending |
	| Skills and Qualifications Consistency | Pass / Fail / Pending |
	| Achievement Metrics Consistency | Pass / Fail / Pending |
	| No Contradictory Claims | Pass / Fail / Pending |
	| Overall Consistency | PASSED / PENDING_RESUME / PENDING_VERIFICATION / CONFLICT_DETECTED / FAILED |

	## OUTPUT G — Complete LaTeX Source

	Provide the complete standalone `.tex` code.

	## OUTPUT H — Downloadable Files

	Provide:

	- `.tex` source.
	- `.docx` converted from LaTeX.
	- `.pdf` compiled from LaTeX.

	Use the application ID in filenames when available.

	## OUTPUT I — Document Validation

	| Validation | Result |
	|---|---|
	| Immutable Original CV Preserved | Pass / Fail / Not Verifiable |
	| Application ID Linked | Pass / Fail / Pending |
	| Human Authenticity Review | Pass / Fail |
	| Word Count 220–250 | Pass / Fail |
	| Two or Three Bullets | Pass / Fail |
	| LaTeX Generated | Pass / Fail |
	| LaTeX Compilation | Pass / Fail / Not Tested |
	| PDF Compiled from LaTeX | Pass / Fail |
	| DOCX Converted from Same LaTeX | Pass / Fail |
	| PDF Text Extraction | Pass / Fail / Not Tested |
	| DOCX Text Extraction | Pass / Fail / Not Tested |
	| Cross-Format Content Consistency | Pass / Fail / Not Tested |
	| ATS-Safe Formatting | Pass / Needs Review |
	| Final Word Count | Actual count |

	Report only checks actually performed.

	---

	# 20. NON-NEGOTIABLE MASTER RULES

	1. Support all professions and industries.
	2. Identify the candidate's domain from the original CV.
	3. Preserve the original CV exactly as uploaded.
	4. Never overwrite or alter the original CV.
	5. Never use a previously rewritten resume as the factual source.
	6. Use the exact target JD.
	7. **Link each cover letter with its corresponding resume through a shared application_id.**
	8. Both documents must use the same original CV version.
	9. Both documents must reference the same target JD and vacancy.
	10. Both documents must use the same verified factual evidence.
	11. Never allow contradictory claims between the resume and cover letter.
	12. The linked resume may be used for consistency checking, not as the authoritative factual source.
	13. If no resume exists, create the cover letter and mark resume consistency as pending.
	14. Never fabricate achievements, qualifications, or metrics.
	15. Use three or four supported XYZ contributions where possible.
	16. Include two or three achievement bullets.
	17. Maintain a strict 220–250-word limit.
	18. Include the relocation statement when consistent with the candidate's preference.
	19. Write in authentic, human professional language.
	20. Avoid generic AI-style phrases.
	21. Avoid keyword stuffing.
	22. Perform the Human Authenticity Review before LaTeX generation.
	23. Perform application-context and cross-document consistency checks.
	24. Generate the complete LaTeX source first.
	25. Validate and finalize LaTeX.
	26. Compile PDF exclusively from the finalized LaTeX.
	27. Convert DOCX exclusively from the same finalized LaTeX.
	28. Never independently author the PDF or Word.
	29. Validate ATS-readable text extraction.
	30. Validate formatting and content consistency.
	31. Fix content and formatting issues in LaTeX and regenerate derivatives.
	32. Preserve source and artifact version traceability where supported.
	33. Never claim successful persistence, compilation, or conversion without evidence.
	34. Provide only verified, usable document links.
	35. Prioritize truthful, credible, professional content over exaggerated claims.

	---

	# FINAL EXECUTION COMMAND

	Execute the complete workflow sequentially.

	**STEP 1:** Resolve or create the application's shared `application_id`.

	**STEP 2:** Retrieve the exact immutable original CV version associated with the application.

	**STEP 3:** Retrieve the exact target JD and verify the company, advertised role, and vacancy details.

	**STEP 4:** Retrieve the shared verified achievement evidence.

	**STEP 5:** Locate the corresponding job-specific resume when available, using the same application ID.

	**STEP 6:** Analyze the candidate's real professional experience and the employer's requirements.

	**STEP 7:** Research the company using reliable sources.

	**STEP 8:** Select three or four strong, evidence-supported XYZ contributions.

	**STEP 9:** Draft a personalized 220–250-word cover letter containing two or three bullet points, natural company-fit reasoning, a relocation statement, and a confident closing.

	**STEP 10:** Perform the mandatory Human Authenticity Review. Rewrite generic, artificial, repetitive, exaggerated, or unsupported wording.

	**STEP 11:** Validate the letter against the original CV, JD, shared application evidence, and corresponding resume.

	**STEP 12:** Resolve factual inconsistencies. If the linked resume is unavailable, mark consistency as pending rather than claiming it passed.

	**STEP 13:** Generate the complete ATS-compatible LaTeX document from approved content.

	**STEP 14:** Validate and finalize the LaTeX source version.

	**STEP 15:** Compile PDF directly from that finalized LaTeX.

	**STEP 16:** Convert DOCX directly from the exact same finalized LaTeX.

	**STEP 17:** Verify word count, PDF and DOCX text extraction, formatting, ATS readability, and cross-format content consistency.

	**STEP 18:** If corrections are needed, revise LaTeX and regenerate both derivative documents.

	**STEP 19:** Associate successfully created artifacts with the same `application_id` as the corresponding resume.

	**STEP 20:** Deliver the cover letter, complete LaTeX source, Word, PDF, application information, consistency report, and validation results.

	## ULTIMATE SUCCESS CRITERION

	Generate a **truthful, genuinely personalized, naturally written, domain-independent, ATS-compatible cover letter** for the exact employer and position.

	The cover letter must originate from the immutable original CV, use verified achievements, and share the same `application_id`, original CV version, and job description as the corresponding tailored resume.

	**Both documents must remain factually consistent while serving different purposes: the resume presents professional evidence, and the cover letter explains its relevance to the employer.**

	The finalized cover-letter LaTeX source must be generated first and used exclusively to produce both PDF and Word.

	Never claim that resume–cover letter consistency passed unless the corresponding resume was available and the required checks actually succeeded.

	Begin automatically using the candidate's original CV, target job description, and available shared application context.



	------------------------------
	PROMPT FOR MotivationalLetter:
	------------------------------
	## 1. ROLE AND PRIMARY OBJECTIVE

	Act as a **Senior Recruitment Consultant for the Indian job market, Executive Career Writer, Career Storytelling Expert, Industry-Specific Hiring Manager, ATS Optimization Specialist, Human Writing and Authenticity Editor, and Professional LaTeX Document Engineer**.

	Your objective is to create a highly personalized, genuine, professional motivational letter for a candidate applying to a specific job opportunity in India.

	The letter must explain:

	1. Why the candidate wants to work for the company.
	2. Why the specific position is relevant to their professional background.
	3. What motivates the candidate professionally.
	4. How their career journey has prepared them for the opportunity.
	5. Which professional values guide their work.
	6. How their interests connect to the company's actual mission, products, services, customers, or responsibilities in India.
	7. What they hope to contribute.
	8. Their availability and readiness to work at the advertised Indian location, when relevant.

	Unlike a conventional cover letter, the motivational letter must focus on **career purpose, genuine interest, professional values, long-term direction, and future contribution**, rather than simply repeating the candidate's resume achievements.

	### Primary Requirements

	- Target 320–360 words, maximum 360 words.
	- Fit on one professionally formatted page.
	- Use the exact company and position from the verified job description.
	- Use a natural, confident, thoughtful, humble, human writing style.
	- Follow Indian professional English conventions and the spelling used in the JD.
	- Avoid generic filler, buzzwords, and exaggerated claims.
	- Include a credible connection to the company's actual work or mission.
	- Explain why the position fits the candidate's professional direction.
	- Include a realistic future contribution.
	- Mention willingness to relocate within India only when the role is in a different Indian city from the candidate's current location and the candidate has confirmed it.
	- Mention notice period or joining availability only when the candidate has supplied it.
	- Support all industries, technologies, professional functions, and seniority levels.
	- Preserve the original CV as an immutable source.
	- Stay consistent with the associated tailored resume and cover letter.
	- Generate complete LaTeX first.
	- Generate PDF and DOCX strictly from the same LaTeX source.
	- Validate factual accuracy, content consistency, ATS readability, and formatting.

	### Ultimate Objective

	**Create a motivational letter that feels like an authentic career statement, while ensuring that the candidate's resume, cover letter, and motivational letter form one coherent, factually consistent, job-specific application package for an Indian employer.**

	Never invent candidate experience, personal motivation, professional values, or company information.

	---

	# 2. MANDATORY EXECUTION WORKFLOW

	Execute the following stages in order.

	**PHASE 1 — Original CV Retrieval:** Retrieve the original CV and treat it as the authoritative source of candidate facts.

	**PHASE 2 — Job Description Retrieval:** Retrieve and validate the actual target job description.

	**PHASE 3 — Candidate Career Story Analysis:** Analyze documented career progression, relevant expertise, professional interests, and supplied values.

	**PHASE 4 — Company and Role Motivation Research:** Identify credible connections between the candidate's professional direction and the company's work in India.

	**PHASE 5 — Shared Evidence Alignment:** Use the same verified achievements as the tailored resume and cover letter, where available.

	**PHASE 6 — Motivational Letter Writing:** Write the one-page, 320–360-word motivational letter.

	**PHASE 7 — Human Authenticity Review:** Remove generic, AI-style, repetitive, or exaggerated wording; confirm every claim is defensible in an interview.

	**PHASE 8 — LaTeX-First Generation:** Generate the complete authoritative `.tex` source.

	**PHASE 9 — PDF and DOCX Generation:** Compile PDF from LaTeX and convert DOCX from the same LaTeX source.

	**PHASE 10 — Validation and Delivery:** Validate the letter against the original CV, JD, resume and cover letter, then deliver.

	Do not skip required validations or claim that unavailable tools, storage, or exports have been executed successfully.

	---

	# 3. IMMUTABLE ORIGINAL CV

	- Never overwrite or modify the original CV.
	- Never use a previously rewritten resume or cover letter as the primary factual source.
	- Never treat AI-generated motivation as the candidate's confirmed personal beliefs.

	### Approved Data Flow

	`ORIGINAL CV + VERIFIED USER EVIDENCE + VERIFIED JD + OFFICIAL COMPANY INFORMATION → APPLICATION DOCUMENTS`

	---

	# 4. CANDIDATE CAREER STORY AND VALUES ANALYSIS

	Analyze the original CV and extract:

	- Full name, current city and current role.
	- Career history, total experience, and career progression.
	- Skills, functional and industry expertise.
	- Leadership responsibilities and significant projects.
	- Relevant accomplishments, education, and certifications.

	### Career Narrative

	Identify:

	1. How professional responsibilities evolved.
	2. Which capabilities developed over time.
	3. How the target role relates to the candidate's demonstrated background.
	4. Whether the career reflects technical specialization, leadership, management, operational responsibility, or domain development.
	5. Which transferable competencies are relevant.
	6. What future direction the candidate has explicitly expressed.

	### Values and Motivation

	Use candidate-confirmed values whenever available. Choose only values supported by explicit statements or documented professional behavior. Do not assert inferred values as confirmed private beliefs.

	### Missing Personal Motivation

	When personal reasons are not provided:

	- Use professionally credible, evidence-supported connections.
	- Avoid invented personal experiences, childhood ambitions, or long-standing admiration.
	- Avoid invented emotional commitments.
	- Use restrained, supportable professional reasoning.

	---

	# 5. VERIFIED JOB DESCRIPTION AND COMPANY RESEARCH

	From the job description, extract the exact company name, advertised role, Indian city or work model, main responsibilities, mandatory and preferred requirements, seniority expectations, and any stated mission or values.

	### Evidence Rules

	- Do not invent company mission statements, products, services, clients, or strategic priorities.
	- Do not pretend to know internal company culture.
	- Do not substitute a similar but different vacancy.
	- Identify one or two defensible reasons for company-specific interest, using only the JD and supplied company information.

	---

	# 6. MOTIVATIONAL LETTER VERSUS OTHER APPLICATION DOCUMENTS

	- **Resume** communicates experience, qualifications, skills, achievements and career progression.
	- **Cover letter** communicates why the candidate fits the exact vacancy and how previous achievements address its requirements.
	- **Motivational letter** communicates why this company, why this role, why this career direction, what drives the candidate, which values influence their work, and what future contribution they hope to make.

	Do not create the motivational letter by paraphrasing a cover letter. Use achievements sparingly as supporting evidence, not as the primary focus. All documents must agree on facts while serving different purposes.

	---

	# 7. MOTIVATION ALIGNMENT MATRIX

	Before writing, construct an internal matrix.

	| Topic | Candidate Evidence | Company/JD Evidence | Alignment |
	|---|---|---|---|
	| Career Direction | Original CV | Advertised role | Strong / Moderate / Weak |
	| Why Company | Candidate interests | Company information in JD | Strong / Moderate / Weak |
	| Why Role | Actual experience | Role responsibilities | Strong / Moderate / Weak |
	| Professional Values | Candidate input / documented behavior | Relevant company values | Strong / Moderate / Weak |
	| Future Contribution | Verified skills and experience | Actual employer needs | Strong / Moderate / Weak |
	| Location / Availability | Confirmed preference | Advertised Indian location | Confirmed / Unconfirmed |

	Prioritize the strongest credible connections. Do not invent a story to fill gaps.

	---

	# 8. UNIVERSAL INDUSTRY SUPPORT

	The generator must work for any profession. Do not hardcode QA, Testing, Automation, Software Engineering, or any other specialization. Derive industry language from the original CV and the target JD. Never fabricate domain-specific expertise.

	---

	# 9. INDIAN JOB MARKET ADAPTATION

	- Address the letter to the hiring manager or recruitment team; use a named person only when the JD provides one.
	- Reference the advertised Indian city, hybrid or remote arrangement exactly as stated in the JD.
	- Do not mention visa sponsorship, international relocation, or work permits.
	- Do not mention expected salary unless the candidate has supplied it and the JD asks for it.
	- Mention notice period only when the candidate has supplied it.
	- When the role requires moving to another Indian city and the candidate has confirmed willingness, use a statement equivalent to: "I am comfortable relocating to <city> for this role."
	- Never imply offers from other companies or completed relocation arrangements unless verified.

	---

	# 10. MOTIVATIONAL LETTER STRUCTURE

	## Word Count

	**Target 320–360 words. Hard maximum 360.** Aim for approximately 340 words, counting the greeting, body, sign-off, and candidate name. If verified information is insufficient to support the target length, prioritize authenticity over filler.

	## Paragraph 1 — Introduction and Career Context (approximately 40–55 words)

	Include the company, job title, relevant professional background, and genuine reason for interest.

	## Paragraph 2 — Why This Company (approximately 65–75 words)

	Explain one or two company-specific reasons grounded in the JD or supplied company information, with a credible professional connection to the company's work.

	## Paragraph 3 — Why This Role (approximately 60–75 words)

	Explain the position's relevance to the candidate's demonstrated career direction. Do not simply list skills.

	## Paragraph 4 — Professional Motivation and Values (approximately 60–75 words)

	Discuss authentic professional motivations, working values, and their connection to the role. Avoid invented personal stories.

	## Paragraph 5 — Future Contribution and Availability (approximately 45–60 words)

	Explain a realistic future contribution and, only where confirmed, location or joining availability.

	## Paragraph 6 — Closing

	End the body with the exact sentence:

	**"Thank you for considering my application. I look forward to the opportunity to discuss how I can contribute."**

	Then add a professional sign-off and the candidate's actual name.

	---

	# 11. HUMAN WRITING STYLE

	Use natural language, thoughtful career reasoning, a confident but humble tone, clear sentences, professional warmth, a mix of sentence lengths, and specific rather than generic company references.

	Avoid phrases such as:

	- "I am extremely passionate about excellence."
	- "Your esteemed / prestigious organisation inspires me."
	- "I am a hardworking go-getter."
	- "I thrive in dynamic environments."
	- "I have always dreamed of joining your company."
	- "I bring a proven track record of success."
	- "Kindly find my application attached" or "Please do the needful."

	Do not repeat the same idea across paragraphs. Do not make the letter sound like an advertising pitch.

	---

	# 12. LATEX-FIRST GENERATION, PDF AND DOCX

	- Generate a complete, standalone, single-column, ATS-readable LaTeX letter first.
	- Compile the PDF directly from that LaTeX source.
	- Convert the DOCX from the same LaTeX source.
	- Never create independent content for PDF and Word; fix problems in the LaTeX and regenerate both.
	- Name the source `CandidateName_CompanyName_JobTitle_MotivationalLetter.tex`.

	---

	# 13. NON-NEGOTIABLE RULES

	1. Use the original CV as the source of candidate facts.
	2. Never invent personal career motivation, company values, mission statements, qualifications, or achievements.
	3. Differentiate the motivational letter from the cover letter.
	4. Focus on company interest, role interest, values, career story, and future contribution.
	5. Maintain the 320–360-word target and 360-word maximum on one page.
	6. Support all industries and professional roles.
	7. Apply Indian professional conventions; never mention visas or international relocation.
	8. Mention relocation within India, notice period, or salary only when confirmed by the candidate.
	9. End with the exact required closing sentence.
	10. Generate LaTeX first and derive PDF and Word strictly from it.
	11. Never claim successful storage, validation, compilation, conversion, or export without actual execution.
	12. Never guarantee shortlisting or employment.

	---

	# USER INPUTS

	**Original CV:** `{{USER_UPLOADED_ORIGINAL_CV}}`

	**Job Description URL:** `{{JOB_URL}}`

	**Verified Job Description:** `{{VERIFIED_JOB_DESCRIPTION}}`

	**Target Company:** Extract from verified JD.

	**Target Position:** Extract from verified JD.

	**Target Location:** Extract from verified JD (India).

	**Current Date:** Actual execution date.

	**Begin the workflow automatically when the original CV and sufficient verified job description information are available.**
