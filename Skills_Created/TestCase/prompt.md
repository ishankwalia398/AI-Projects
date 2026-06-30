# TestCase Skill - Creation Prompts and Discussion

This document contains all the prompts and discussions used during the creation of the TestCase skill.

## Initial Creation Prompt

**User Request:**
Create a skill that converts Software Test Plans (STP) into detailed test cases with step-by-step execution instructions. The skill should:
- Read test plans from various sources (Confluence, Jira, documents, or text)
- Convert each test scenario into detailed, executable test cases
- Generate test cases in both Jira and Practitest formats
- Create outputs in Excel, CSV (2 files), and PDF formats
- Include interactive approval process for test cases

## Key Requirements Discussed

### 1. Test Plan Sources
- Support multiple input sources: Confluence URLs, Jira tickets, document files, and direct text
- Use MCP tools for Atlassian integration
- Handle permission issues gracefully with alternatives
- Extract test scenarios, use cases, and test requirements

### 2. Test Case Conversion Philosophy
- **One Test Case Per Scenario**: Each test scenario becomes one test case (unless very complex)
- **Detailed Steps**: Convert high-level scenarios into step-by-step executable instructions
- **Two Format Support**: Generate for both Jira and Practitest platforms
- **Reviewable and Editable**: All test cases must be reviewed and approved before file generation

### 3. Test Case Structure

**Jira Format:**
```
Test Case ID: [Sequential or user-defined format]
Test Case Name: [Clear, descriptive name]
Description: [What this test case validates]
Preconditions: [Setup required before execution]
Priority: [High/Medium/Low]
Status: [Default status as agreed]
Environment: [Test environment - Staging, QA, Production]

Steps:
Step #1
  Step Name: [Action to perform]
  Expected Result: [What should happen]
  Actual Result: [Leave blank for execution]
  
Step #2
  Step Name: [Next action]
  Expected Result: [What should happen]
  Actual Result: [Leave blank for execution]
```

**Practitest Format:**
```
Name: [Test case name]
Description: [What this test validates]
Preconditions: [Setup required]
Status: [Default status]

Steps:
Step #1
  Step Name: [Action to perform]
  Expected Result: [What should happen]
  
Step #2
  Step Name: [Next action]
  Expected Result: [What should happen]
```

### 4. Writing Quality Test Steps
Each step should be:
- **Actionable**: Clear instruction on what to do
- **Specific**: Include specific values, fields, buttons, navigation
- **Sequential**: Steps build on previous steps logically
- **Verifiable**: Expected result is observable and measurable

**Example of good test steps:**
```
Step #1
  Step Name: Navigate to login page at https://app.example.com/login
  Expected Result: Login page displays with username, password fields and "Sign In" button

Step #2
  Step Name: Enter username "testuser@example.com" in the username field
  Expected Result: Username field accepts input and displays entered email

Step #3
  Step Name: Enter password "Test123!" in the password field
  Expected Result: Password field accepts input and displays masked characters

Step #4
  Step Name: Click the "Sign In" button
  Expected Result: User is authenticated and redirected to dashboard page with welcome message "Welcome, Test User"
```

### 5. Interactive Approval Process
The skill implements a comprehensive approval workflow:

**Step 1**: Generate test cases from test plan scenarios

**Step 2**: Present test cases in two formats:
- **Summary Table**: Overview with Test Case ID, Name, Category, Priority, # of Steps, Status
- **Detailed View**: Full test cases with all steps, formatted clearly

**Step 3**: Ask user: "Do you approve this test case list? (Yes / No)"

**Step 4**: If changes needed, enter interactive loop with options:
- **Add**: Add new test cases by providing name, description, preconditions, priority, category, and steps
- **Update**: Modify specific fields (name, description, preconditions, priority, steps)
- **Delete**: Remove test cases with confirmation
- **Done**: Exit the loop and continue

**Step 5**: Final approval before file generation
- Show updated test case list
- Ask: "Is this final test case list approved? (Yes / No)"

### 6. Output File Generation
Generate test cases in **THREE** formats in the `./test-cases/` directory:

**Excel Workbook (.xlsx):**
- **Master Sheet - Jira Format**: All test cases with Jira-specific fields
  - Columns: Test Case ID, Name, Description, Preconditions, Step #, Step Name, Expected Result, Actual Result, Priority, Status, Environment
- **Master Sheet - Practitest Format**: All test cases with Practitest-specific fields
  - Columns: Name, Description, Preconditions, Step #, Step Name, Expected Result, Status
- **Category Sheets**: Separate sheet for each category
- **Excel Formatting**:
  - Header row with bold text and colored background
  - Borders on all cells
  - Auto-fit column widths
  - Freeze top row
  - Merged cells for test case-level fields

**CSV Files (2 files):**
- **File 1**: `<project-name>-test-cases-jira.csv` (Jira format)
- **File 2**: `<project-name>-test-cases-practitest.csv` (Practitest format)
- UTF-8 encoding, comma delimiter, quoted fields

**PDF Document (.pdf):**
- **Cover Page**: Title, date, summary statistics
- **Table of Contents**: List of test cases grouped by category
- **Test Case Details**: Each test case formatted with:
  - Header with ID, name, priority
  - Description and preconditions
  - Environment and status
  - Test steps in formatted table

### 7. Handling Different Scenario Types

**Positive Scenarios:**
- Steps follow the happy path
- Expected results show successful outcomes
- Focus on correct functionality

**Negative Scenarios:**
- Steps include invalid inputs or incorrect actions
- Expected results show appropriate error messages or rejections
- Include specific error codes/messages if known

**Edge Cases:**
- Steps test boundary conditions
- Expected results cover edge behavior
- Include maximum/minimum values

### 8. No Assumptions or Hallucination
**CRITICAL RULE**: Before generating test cases, the skill must:
- Review test plan content
- Ask clarifying questions about:
  - Missing preconditions for any scenario
  - Ambiguous expected results
  - Unclear test steps or flows
  - Missing priority information
  - Environment specifications
  - Test data requirements
  - Any assumptions needed for test execution
- Ask about categorization preferences
- Ask about Test Case ID format
- Ask about default status field value
- **NEVER assume or hallucinate details not in the test plan**

### 9. Test Case Quality Guidelines

**Completeness:**
- Every test case must have: clear name, description, preconditions
- All steps must have expected results
- No placeholder text like "TBD" or "TODO" in final output

**Clarity:**
- Test steps should be unambiguous and executable by any QA engineer
- Use specific values, not generic placeholders
- Reference exact UI elements, API endpoints, or data values

**Traceability:**
- Each test case maps back to a specific scenario in the test plan
- Test Case ID follows consistent numbering scheme
- Category/grouping is logical and consistent

**Executability:**
- Steps are in logical sequence
- Prerequisites are clearly stated
- Expected results are observable and verifiable
- Environment is specified

### 10. Format Consistency

**Jira vs Practitest:**
- **Jira includes**: Test Case ID, Actual Result, Priority, Environment
- **Practitest excludes**: Test Case ID, Actual Result, Priority, Environment
- All other fields are present in both formats

**Step Numbering:**
- Steps numbered sequentially starting from 1
- Step numbers consistent across all formats
- Each step has both Step Name (action) and Expected Result

**Data Integrity:**
- Same test case content in Excel, CSV, and PDF
- No data loss between formats
- Special characters handled correctly (escaped in CSV, rendered in PDF)

## Technical Implementation

### Python Libraries Required
- `openpyxl`: For Excel workbook generation
- `csv` (built-in): For CSV file generation
- `reportlab`: For PDF document generation

### MCP Tools Used
- `mcp__atlassian__getJiraIssue`: Fetch Jira ticket with test scenarios
- `mcp__atlassian__getConfluencePage`: Fetch Confluence page with test plan

### Output Directory
- All files created in `./test-cases/` directory
- File naming:
  - `<project-name>-test-cases.xlsx`
  - `<project-name>-test-cases-jira.csv`
  - `<project-name>-test-cases-practitest.csv`
  - `<project-name>-test-cases.pdf`

## Example Invocation Flow

**User**: "Create test cases from this test plan: [Confluence URL]"

**Skill Flow**:
1. Fetch the test plan from Confluence using MCP tools (or ask for permission/content)
2. Read and analyze all test scenarios
3. Ask clarifying questions about ambiguities or missing details
4. Generate detailed test cases for each scenario with steps and expected results
5. Present test cases in summary table + detailed format
6. Get user approval or enter change loop
7. Get final approval
8. Generate all output files (Excel with category sheets, 2 CSV files, PDF)
9. Report file locations and summary statistics

## Iterative Improvements During Creation

### Enhancement 1: Dual Format Support
Added support for both Jira and Practitest formats with:
- Separate master sheets in Excel
- Two CSV files (one per format)
- Format-specific field requirements

### Enhancement 2: Interactive Update Options
Enhanced update functionality to allow:
- Update test case name only
- Update description only
- Update preconditions only
- Update priority only
- Update/add/delete specific steps
- Update multiple fields at once

### Enhancement 3: Detailed Test Case Presentation
Improved presentation format with:
- Clear separators between test cases
- Formatted headers and sections
- Professional layout for review
- Line breaks and visual structure

### Enhancement 4: Category-Based Organization
Added category support:
- Separate Excel sheets per category
- Grouped presentation in PDF
- Category field in all formats
- User-defined categorization

### Enhancement 5: Test Step Quality Focus
Added guidelines for writing quality test steps:
- Actionable, specific, sequential, verifiable
- Include exact values and UI elements
- Clear expected results
- Example templates

## Advanced Features

### Handling Large Test Plans
For test plans with 50+ scenarios:
- Generate test cases in batches (10-20 at a time by category)
- Show progress after each batch
- Allow user to approve each batch before proceeding
- Prevents overwhelming the user with hundreds of test cases

### Test Case Optimization
- Identify and flag potentially redundant test cases
- Suggest combining similar test cases
- Offer step reuse for common operations (e.g., login steps)

### Integration Hints
**Jira Import:**
- CSV can be imported via Jira's bulk import feature
- Excel can be copy-pasted into Jira test case fields
- Guidance: "Use the CSV file with Jira's bulk import tool"

**Practitest Import:**
- Practitest supports CSV import with column mapping
- Guidance: "Use the Practitest CSV file and map columns during import"

## Troubleshooting

**If test plan has no clear scenarios:**
- Ask: "The test plan seems to contain only requirements, not test scenarios. Would you like me to generate test scenarios first, or work directly from requirements?"

**If test steps are too high-level:**
- Break down each step into smaller sub-steps
- Example: "Verify login" → 3 steps: Navigate, Enter credentials, Click login, Verify success

**If expected results are missing:**
- Ask user for expected behavior
- Don't guess or hallucinate expected results

**If categories are unclear:**
- Propose categorization based on test plan structure
- Ask user to confirm or provide their own categories

## Key Skill Characteristics

**Skill Name**: TestCase

**Description**: Create detailed test cases from Software Test Plans (STP) in Jira and Practitest formats. Use when the user wants to convert test plans, test scenarios, or requirements into detailed test cases with steps, or when they mention creating test cases, test case templates, Jira test cases, Practitest test cases, or converting a test plan into executable test cases.

**Primary Triggers**:
- User mentions: "test cases", "test case templates", "Jira test cases", "Practitest test cases"
- User asks to convert test plan into executable test cases
- User provides test plan document/Confluence page/Jira ticket and asks to generate test cases
- User mentions "test case creation" or "detailed test steps"

**Core Strengths**:
- Multi-source test plan ingestion
- Dual format support (Jira and Practitest)
- Detailed step-by-step test case generation
- Interactive approval workflow with granular update options
- Multi-format output (Excel with categories, 2 CSV files, PDF)
- Test case quality focus (actionable, specific, sequential, verifiable steps)
- Batch processing for large test plans
- Category-based organization

**Complementary Skill**: Works seamlessly with TestPlan skill:
- TestPlan generates the Software Test Plan
- TestCase converts that test plan into detailed executable test cases

---

**End of TestCase Skill Creation Documentation**
