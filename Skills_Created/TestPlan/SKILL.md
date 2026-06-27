---
name: TestPlan
description: Create comprehensive Software Test Plans (STP) from requirements in any format - Jira tickets, Confluence URLs, documents (PDF, Word, MD), or text - and output in .md, .docx, .pdf, and .xlsx formats. ALWAYS use this skill when the user mentions test plans, STP, test planning, QA planning, testing strategy, test documentation, test design, or asks to create/generate tests from requirements, PRDs, specifications, user stories, or acceptance criteria. Also trigger when user provides a Jira ticket/Confluence page/requirement doc and wants testing documentation, asks to convert requirements into test cases, needs QA documentation, or wants to structure test scenarios. This skill focuses on backend/microservice testing with comprehensive positive, negative, edge-case, and configuration validation scenarios. Make sure to use this even if they say "create a test plan" without explicitly mentioning the skill name.
---

# TestPlan Skill

Create a comprehensive Software Test Plan (STP) from various requirement sources focusing on backend/microservice testing with thorough scenario coverage including positive, negative, edge-case, and configuration validation scenarios.

## Core Principles

**Testing Focus:**
- Backend and microservice (MS) logic, APIs, and data flows
- DO NOT include frontend (FE) or UI logic, flows, or caching
- All scenarios validate backend services, APIs, or databases

**Scenario Coverage Philosophy:**
- Every use case includes both positive and negative scenarios
- Cover technical failures (database/service errors, retries)
- Cover business logic failures (thresholds not met, missing configuration)
- Include edge cases that unit tests may not cover
- Validate all filtering, inclusion, exclusion logic
- Validate all thresholds and limits affecting feature behavior

## Workflow

### Step 1: Gather Requirements Source

Ask the user to provide one of the following sources for PRD/Requirements:

1. **Jira ID** - Jira ticket key (e.g., "PROJ-123")
2. **Confluence URL** - Link to Confluence page with requirements
3. **Document** - File path to requirements document (PDF, Word, MD, TXT, etc.)
4. **Text** - Requirements provided directly in the conversation

**Permission handling:** If you need access to Jira/Confluence MCP tools and don't have it, ask the user to either:
- Grant permission to access Atlassian tools
- Provide the requirements content manually (copy-paste or document upload)

### Step 2: Read and Analyze Requirements

Based on the source type, fetch and thoroughly read the requirements:

**For Jira tickets:**
- Use `mcp__atlassian__getJiraIssue` to fetch ticket details
- Extract: summary, description, acceptance criteria, use cases, technical specs
- Check for linked tickets or attachments with additional requirements
- If access denied, ask user to grant permission or provide content manually

**For Confluence URLs:**
- Use `mcp__atlassian__getConfluencePage` for Confluence pages
- Parse the content to identify requirements, acceptance criteria, specifications
- If access denied, ask user to grant permission or provide content manually

**For Documents:**
- Use `Read` to access the file
- Extract and structure the requirement details
- If permission denied, ask user to paste content or grant file access

**For Text:**
- Requirements are already in the conversation
- Parse and structure the information

**Comprehensive Analysis:**
Go through each requirement carefully and identify:
- Business requirements and objectives
- Technical specifications and APIs
- Integration points and dependencies
- Configuration parameters, flags, toggles, thresholds, limits, default values, environment variables
- Filtering logic (inclusion/exclusion rules)
- Thresholds or limits affecting feature behavior
- Business rules and validation logic
- Error handling requirements
- Edge cases and boundary conditions

### Step 3: Ask Clarifying Questions

**CRITICAL: Do NOT assume or hallucinate anything.**

Before proceeding, review what you've read and ask the user any questions about:
- Ambiguous requirements or acceptance criteria
- Missing technical details (API endpoints, data formats, error codes)
- Unclear business logic or validation rules
- Configuration parameters that need clarification
- Integration points with other services
- Expected error handling behavior
- Edge cases not explicitly covered
- Any assumptions you might need to make

Present your questions clearly and wait for user responses before moving forward.

### Step 4: Draft Test Scenario List

Based on the requirements and clarifications, create a comprehensive list of test scenarios covering:

**A. Positive Scenarios:**
- Happy path with valid inputs and expected behavior
- Successful API calls with correct responses
- Proper data flow through the system

**B. Negative Scenarios:**
- Invalid inputs (malformed data, wrong types, out-of-range values)
- Missing required fields or parameters
- Unauthorized access attempts
- Invalid state transitions

**C. Technical Failure Scenarios:**
- Database connection failures
- Service/API unavailability or timeouts
- Network errors and retries
- Transaction rollbacks
- Data consistency issues

**D. Business Logic Failure Scenarios:**
- Thresholds not met
- Missing or invalid configuration
- Business rules violated
- Validation failures
- Authorization failures based on business rules

**E. Filtering & Exclusion Logic Scenarios:**
For each filtering rule in the specification, validate:
- Items correctly included based on criteria (completion, status, entitlement, type, etc.)
- Items correctly excluded based on criteria
- Behavior when all items are excluded
- Behavior when no items match filters
- Combination of multiple filter conditions

**F. Threshold & Limit Validation Scenarios:**
For each threshold or limit, validate:
- Behavior when threshold is met
- Behavior when threshold is not met
- Minimum and maximum boundary values
- Edge cases around thresholds (just below, exactly at, just above)

**G. Configuration Validation Scenarios:**
For EVERY configuration parameter mentioned or implied in the specification:
- Correct/expected values (positive path)
- Missing or unset values (default/fallback behavior)
- Invalid, out-of-range, or unsupported values (negative path)
- Edge cases (min/max, empty, null, special characters)
- Cross-parameter dependencies or interactions

**Scenario Format:**
Create a table with two columns:
- **Test Name**: Clear, concise name describing what is being tested
- **Test Description**: Brief description of the scenario without detailed steps

### Step 5: Get User Approval and Iterate

Present the scenario list to the user in tabular format and ask: **"Do you approve this scenario list, or would you like to add/update/delete any scenarios?"**

**A. If user approves:** Continue to Step 7

**B. If user wants changes:** Enter an interactive loop:

**Interactive Change Loop:**
Ask the user: "What would you like to do? (Add / Update / Delete / Done)"

- **Add:**
  1. Ask: "What is the test name you'd like to add?"
  2. User provides test name
  3. Ask: "Would you like to provide a description? (Yes / No)"
     - If Yes: Ask for description and add test with provided name and description
     - If No: Add test with provided name and auto-generate description based on test name
  4. Return to "What would you like to do?" question

- **Update:**
  1. Ask: "Which test name would you like to update?"
  2. User provides test name
  3. Ask: "Do you want to update only the test name? (Yes / No)"
     - If Yes: Ask for new test name, update name only, keep existing description
     - If No: Ask "Do you want to update both name and description? Provide: [new name] / [new description] (leave blank to keep existing)"
  4. Return to "What would you like to do?" question

- **Delete:**
  1. Ask: "Which test name would you like to delete?"
  2. User provides test name
  3. Delete the test from the list
  4. Return to "What would you like to do?" question

- **Done:**
  - Exit the loop and continue to Step 7

Allow the user to make multiple changes in one session before moving forward.

### Step 7: Final Approval

Share the updated scenario list with the user again in tabular format (Test Name | Test Description).

Ask: **"Is this final scenario list approved? (Yes / No)"**

- **If Yes:** Continue to Step 8
- **If No:** Go back to Step 6 (interactive change loop)

### Step 8: Generate the Test Plan Document

Create a comprehensive test plan following this structure:

#### Document Structure

**1. Introduction**
- **Purpose:** Brief explanation of the test plan's purpose
- **Scope:** Features and components covered (backend/MS focus)
- **References:** Links or documents related to the specification (Jira tickets, Confluence pages, PRDs)

**2. Test Items**
- **Features to be tested:** List all features/components in scope
- **Features not to be tested:** List what's explicitly out of scope (e.g., frontend, UI caching)

**3. Use Cases and Test Scenarios**

For each use case, include comprehensive detail:

**Use Case Title**

**Description:** What this use case represents and its business purpose

**Actors:** Who/what interacts with this use case (services, APIs, users)

**Preconditions:** Required state before execution (system state, data setup, config)

**Main Flow:**
- Bulleted or numbered steps showing the typical execution path
- Include API calls, data transformations, service interactions

**Alternate Flows:**
- Variations from the main flow (if any)
- Optional paths or conditional logic

**Postconditions / Expected Results:**
- System state after successful execution
- Data changes, API responses, side effects

**Notes / Assumptions:**
- Special considerations, dependencies, or assumptions

**Test Scenarios (minimum 2-3 per use case):**

Present each test scenario with clear formatting:
- Use bullets or table format
- Write in full sentences
- Include typical path, edge cases, and failure paths
- Optionally use Given/When/Then format
- **Add a line break between each scenario** - present each point as a distinct bullet, not in a row

For each scenario, clearly state:
- The filtering/threshold/business rule being validated (if applicable)
- The expected system behavior
- Both positive and negative outcomes

**4. Configuration Validation**

Create a dedicated section or table for configuration validation.

For each configuration parameter from the specification:

| Config Parameter | Test Scenario | Input/Condition | Expected Behavior | Type |
|-----------------|---------------|-----------------|-------------------|------|
| [config_name] | Correct value | [valid value] | [expected behavior] | Positive |
| [config_name] | Missing/unset | [not set] | [default/fallback behavior] | Negative |
| [config_name] | Invalid value | [invalid/out-of-range] | [error/rejection behavior] | Negative |
| [config_name] | Edge case | [min/max/null/special] | [edge behavior] | Edge |

**IMPORTANT:** 
- Explicitly mention the config parameter name in each scenario description
- Only include parameters explicitly described or clearly implied in the specification
- Do NOT invent or assume config names not present in the spec

**5. Unit Test Table (Negative Flows)**

Generate a unit test table focused on negative flows:

| # | Scenario | Input | Expected Output | Developer Test Name | Pass/Fail/NA |
|---|----------|-------|-----------------|---------------------|--------------|
| 1 | [negative scenario] | [malformed/missing/invalid input] | [error/empty/failure response] | test_[descriptive_name] | |
| 2 | ... | ... | ... | ... | |

Focus on:
- Direct input to the service or component
- Malformed, missing, or invalid data
- Expected output (error codes, empty results, specific failure responses)
- Clear developer test names

**6. Dependencies**
- External systems required for testing
- Test data dependencies
- Environment requirements
- Configuration dependencies

**7. Team/Responsibilities**
- QA responsibilities
- Dev responsibilities  
- PM/SA responsibilities (if applicable)

**8. Estimations**
- Reasonable time estimate for test execution
- Per use case or overall

**9. Important Notes**
- Special considerations
- Risks or assumptions
- Known limitations
- Testing constraints

#### Formatting Guidelines

Use clear, readable formatting:
- **Bold section titles**
- Bulleted lists for actors, preconditions, flows, test items
- Consistent indentation and formatting
- Tables for test cases, scenarios, configurations, dependencies where appropriate
- Line breaks between scenarios for clarity

### Step 9: Generate Output Files

Create the test plan in **FOUR** formats in the `./test-plans/` directory:

**9.1 Markdown File** (`<project-name>-test-plan.md`)
- Standard Markdown formatting
- Tables for structured data
- Headings for sections
- Lists for dependencies and notes

**9.2 Word Document** (`<project-name>-test-plan.docx`)
- Use `python-docx` library
- Apply heading styles (Heading 1, Heading 2, etc.)
- Format tables with borders and headers
- Include emphasis (bold, italic)

**9.3 PDF File** (`<project-name>-test-plan.pdf`)
- Convert from docx using `docx2pdf` (Windows/Mac) or `pypandoc`
- If conversion tools unavailable, inform user

**9.4 Excel Workbook** (`<project-name>-test-plan.xlsx`)

Create a structured Excel workbook with multiple sheets using `openpyxl`:

**Sheet 1: Test Scenarios**
| # | Test Name | Test Description | Category | Priority |
|---|-----------|------------------|----------|----------|

**Sheet 2: Use Cases**
| Use Case | Description | Actors | Preconditions | Main Flow | Expected Results |
|----------|-------------|--------|---------------|-----------|------------------|

**Sheet 3: Configuration Validation**
| Config Parameter | Test Scenario | Input/Condition | Expected Behavior | Type |
|------------------|---------------|-----------------|-------------------|------|

**Sheet 4: Unit Tests (Negative Flows)**
| # | Scenario | Input | Expected Output | Developer Test Name | Pass/Fail/NA |
|---|----------|-------|-----------------|---------------------|--------------|

**Sheet 5: Dependencies & Notes**
| Type | Description | Impact | Owner |
|------|-------------|--------|-------|

**Document Generation Script:**
Create a Python script to generate the .docx, .pdf, and .xlsx files. The script should:
- Accept structured content as input (JSON or data structures)
- Generate properly formatted documents
- Handle errors gracefully
- Report success/failure for each format

**Required Python libraries:**
- `python-docx` for Word documents
- `docx2pdf` or `pypandoc` for PDF conversion
- `openpyxl` for Excel workbooks

If libraries are missing, attempt to install them (with user permission) or inform the user.

### Step 10: Confirm Completion

After generating all files:
- List all four files created with their full paths
- Confirm file sizes to ensure they were created successfully
- Offer to make adjustments or regenerate if needed
- Provide a summary of what was included in the test plan

## Important Guidelines

**Traceability:**
- Every test scenario maps back to specific requirements
- Reference requirement IDs, acceptance criteria, or spec sections
- Maintain clear links between tests and sources

**Thoroughness:**
- Don't skip negative scenarios - they're as important as positive ones
- Include edge cases that might seem obvious but need explicit validation
- Configuration validation must be exhaustive for every parameter in the spec

**Clarity:**
- Test scenarios should be clear but high-level
- Focus on what to test and why, not detailed step-by-step instructions
- Use consistent terminology from the requirements

**Backend Focus:**
- All scenarios validate backend behavior, APIs, services, data flows
- Explicitly exclude frontend/UI concerns
- Mention API endpoints, service names, database tables where relevant

## Error Handling and Permissions

**Missing Requirements Source:**
- If user doesn't provide a source, prompt them with the four options (Jira/Confluence/Document/Text)
- Don't proceed without requirements

**Access Issues:**
- If Jira/Confluence access is denied, explain what you need and offer alternatives
- If document reading is denied, ask to paste content or grant permission
- Always explain the value: "I need to fetch X to understand Y for test planning"

**Missing Dependencies:**
- If Python libraries are missing, list them and ask permission to install
- Provide pip install commands if user prefers manual installation
- If installation fails, generate what you can and inform user of limitations

**Clarification Needed:**
- If requirements are ambiguous, always ask rather than assume
- Document assumptions if user confirms them
- Flag any gaps in requirements that might affect test coverage

**Permission Strategy:**
- Be specific about what you're accessing and why
- Offer alternatives when permissions are denied
- Batch permission requests when possible to reduce interruptions

## Example Invocation

**User:** "Create a test plan for Jira ticket PROJ-12345"

**Assistant should:**
1. Fetch the Jira ticket using MCP tools (or ask for permission/content)
2. Read and analyze all requirements
3. Ask clarifying questions about ambiguities
4. Draft comprehensive scenario list (positive, negative, edge cases, config validation)
5. Present scenario list and get approval
6. Enter interactive loop for any changes user wants to make
7. Get final approval
8. Generate complete test plan with all sections
9. Create all four output files (.md, .docx, .pdf, .xlsx)
10. Report file locations and completion

