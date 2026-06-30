# TestPlan Skill - Creation Prompts and Discussion

This document contains all the prompts and discussions used during the creation of the TestPlan skill.

## Initial Creation Prompt

**User Request:**
Create a skill that generates comprehensive Software Test Plans (STP) from requirements in multiple formats (Jira tickets, Confluence pages, documents, or text). The skill should:
- Read requirements from various sources (Jira, Confluence, documents, or text)
- Focus on backend/microservice testing
- Generate comprehensive test scenarios including positive, negative, edge-case, and configuration validation scenarios
- Create output in multiple formats: .md, .docx, .pdf, and .xlsx
- Include interactive approval process for test scenarios

## Key Requirements Discussed

### 1. Requirement Sources
- Support multiple input sources: Jira tickets, Confluence URLs, document files, and direct text
- Use MCP tools for Atlassian integration
- Handle permission issues gracefully with alternatives
- Extract all relevant details from requirements

### 2. Backend/Microservice Focus
- All test scenarios must focus on backend logic, APIs, and data flows
- Explicitly exclude frontend (FE) or UI logic
- Cover service interactions, database operations, and API endpoints

### 3. Comprehensive Scenario Coverage
- **Positive Scenarios**: Happy path with valid inputs and expected behavior
- **Negative Scenarios**: Invalid inputs, missing fields, unauthorized access
- **Technical Failure Scenarios**: Database failures, service unavailability, network errors
- **Business Logic Failure Scenarios**: Thresholds not met, missing configuration, validation failures
- **Filtering & Exclusion Logic**: Validate inclusion/exclusion criteria
- **Threshold & Limit Validation**: Test boundary values and edge cases
- **Configuration Validation**: Test every configuration parameter with valid, invalid, and edge cases

### 4. Interactive Approval Process
The skill implements a multi-step approval workflow:

**Step 1**: Present initial scenario list in tabular format
- Ask user: "Do you approve this scenario list, or would you like to add/update/delete any scenarios?"

**Step 2**: If changes needed, enter interactive loop with options:
- **Add**: Add new test scenarios with name and optional description
- **Update**: Modify existing scenario name and/or description
- **Delete**: Remove scenarios from the list
- **Done**: Exit the loop and continue

**Step 3**: Final approval before document generation
- Show updated scenario list
- Ask: "Is this final scenario list approved? (Yes / No)"

### 5. Document Generation
Generate test plan in four formats:

**Markdown (.md):**
- Standard Markdown formatting with tables and headings

**Word Document (.docx):**
- Use python-docx library
- Apply proper heading styles and formatting
- Include tables with borders

**PDF (.pdf):**
- Convert from docx using docx2pdf or pypandoc
- Formatted and professional layout

**Excel Workbook (.xlsx):**
- Multiple sheets: Test Scenarios, Use Cases, Configuration Validation, Unit Tests, Dependencies
- Structured data in tables
- Use openpyxl library

### 6. Test Plan Structure
The generated test plan includes:

1. **Introduction**: Purpose, scope, references
2. **Test Items**: Features to be tested and not tested
3. **Use Cases and Test Scenarios**: 
   - Use case title, description, actors, preconditions
   - Main flow and alternate flows
   - Postconditions/expected results
   - Notes/assumptions
   - Test scenarios (minimum 2-3 per use case)
4. **Configuration Validation**: Detailed table for each config parameter
5. **Unit Test Table**: Focused on negative flows
6. **Dependencies**: External systems, test data, environment requirements
7. **Team/Responsibilities**: QA, Dev, PM/SA roles
8. **Estimations**: Time estimates for test execution
9. **Important Notes**: Special considerations, risks, assumptions

### 7. Configuration Validation Emphasis
For EVERY configuration parameter mentioned or implied in the specification:
- Test correct/expected values (positive path)
- Test missing or unset values (default/fallback behavior)
- Test invalid, out-of-range, or unsupported values (negative path)
- Test edge cases (min/max, empty, null, special characters)
- Test cross-parameter dependencies

### 8. No Assumptions or Hallucination
**CRITICAL RULE**: Before proceeding with scenario generation, the skill must:
- Review what was read from requirements
- Ask clarifying questions about:
  - Ambiguous requirements
  - Missing technical details
  - Unclear business logic
  - Configuration parameters needing clarification
  - Expected error handling behavior
  - Edge cases not explicitly covered
- Wait for user responses before moving forward
- **NEVER assume or hallucinate details not in the requirements**

### 9. Error Handling and Permissions
- Handle missing requirement sources appropriately
- Offer alternatives when MCP tool access is denied
- Check for missing Python libraries and ask permission to install
- Batch permission requests to reduce interruptions
- Always explain why specific permissions are needed

## Design Philosophy

### Traceability
- Every test scenario maps back to specific requirements
- Reference requirement IDs, acceptance criteria, or spec sections
- Maintain clear links between tests and sources

### Thoroughness
- Don't skip negative scenarios - they're as important as positive ones
- Include edge cases that might seem obvious but need explicit validation
- Configuration validation must be exhaustive for every parameter in the spec

### Clarity
- Test scenarios should be clear but high-level
- Focus on what to test and why, not detailed step-by-step instructions
- Use consistent terminology from the requirements

### Backend Focus
- All scenarios validate backend behavior, APIs, services, data flows
- Explicitly exclude frontend/UI concerns
- Mention API endpoints, service names, database tables where relevant

## Technical Implementation

### Python Libraries Required
- `python-docx`: For Word document generation
- `docx2pdf` or `pypandoc`: For PDF conversion
- `openpyxl`: For Excel workbook generation

### MCP Tools Used
- `mcp__atlassian__getJiraIssue`: Fetch Jira ticket details
- `mcp__atlassian__getConfluencePage`: Fetch Confluence page content

### Output Directory
- All files created in `./test-plans/` directory
- File naming: `<project-name>-test-plan.[md|docx|pdf|xlsx]`

## Example Invocation Flow

**User**: "Create a test plan for Jira ticket PROJ-12345"

**Skill Flow**:
1. Fetch the Jira ticket using MCP tools (or ask for permission/content)
2. Read and analyze all requirements
3. Ask clarifying questions about ambiguities
4. Draft comprehensive scenario list (positive, negative, edge cases, config validation)
5. Present scenario list in table format and get approval
6. Enter interactive loop for any changes user wants to make
7. Get final approval
8. Generate complete test plan with all sections
9. Create all four output files (.md, .docx, .pdf, .xlsx)
10. Report file locations and completion

## Iterative Improvements During Creation

### Enhancement 1: Configuration Validation Section
Added dedicated section for configuration validation with explicit table format showing:
- Config parameter name
- Test scenario type
- Input/condition
- Expected behavior
- Scenario type (Positive/Negative/Edge)

### Enhancement 2: Interactive Change Loop
Refined the approval workflow to include:
- Add scenarios with optional auto-generated descriptions
- Update scenarios with options to change name only or both name and description
- Delete scenarios with confirmation
- Multiple changes in one session before proceeding

### Enhancement 3: Filtering Logic Validation
Added specific guidance for testing filtering and exclusion logic:
- Items correctly included based on criteria
- Items correctly excluded based on criteria
- Behavior when all items are excluded
- Behavior when no items match filters
- Combination of multiple filter conditions

### Enhancement 4: Threshold Validation
Added specific scenarios for testing thresholds and limits:
- Behavior when threshold is met
- Behavior when threshold is not met
- Minimum and maximum boundary values
- Edge cases around thresholds (just below, exactly at, just above)

## Key Skill Characteristics

**Skill Name**: TestPlan

**Description**: Create comprehensive Software Test Plans (STP) from requirements in any format - Jira tickets, Confluence URLs, documents (PDF, Word, MD), or text - and output in .md, .docx, .pdf, and .xlsx formats. ALWAYS use this skill when the user mentions test plans, STP, test planning, QA planning, testing strategy, test documentation, test design, or asks to create/generate tests from requirements, PRDs, specifications, user stories, or acceptance criteria.

**Primary Triggers**:
- User mentions: "test plan", "STP", "test planning", "QA planning", "testing strategy"
- User provides requirements and asks to create tests
- User provides Jira ticket/Confluence page and wants testing documentation
- User asks to convert requirements into test cases
- User needs QA documentation or wants to structure test scenarios

**Core Strengths**:
- Multi-source requirement ingestion
- Comprehensive scenario coverage (positive, negative, technical failures, business logic failures)
- Configuration and threshold validation focus
- Interactive approval workflow
- Multi-format output generation
- Backend/microservice testing specialization

---

**End of TestPlan Skill Creation Documentation**
