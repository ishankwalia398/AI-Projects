---
name: TestCase
description: Create detailed test cases from Software Test Plans (STP) in Jira and Practitest formats. Use when the user wants to convert test plans, test scenarios, or requirements into detailed test cases with steps, or when they mention creating test cases, test case templates, Jira test cases, Practitest test cases, or converting a test plan into executable test cases. Also trigger when user provides a test plan document, Confluence page, Jira ticket, or Excel file and asks to generate test cases from it.
---

# TestCase Skill

Create detailed, step-by-step test cases from Software Test Plans (STP) or test scenarios. Generate test cases in both Jira and Practitest formats with outputs in PDF, Excel, and CSV.

## Core Principles

**Test Case Conversion Philosophy:**
- Convert each test scenario from the test plan into a detailed, executable test case
- Each test case includes numbered steps with clear actions and expected results
- Generate both Jira-format and Practitest-format test cases
- All test cases must be reviewable and editable before file generation

**Output Formats:**
- Excel workbook with separate sheets for categories
- CSV files (one for Jira, one for Practitest)
- PDF document with formatted tables

## Workflow

### Step 1: Gather Test Plan Source

Ask the user to provide the Software Test Plan (STP) from one of the following sources:

1. **Confluence URL** - Link to Confluence page with test plan/scenarios
2. **Jira ID** - Jira ticket key containing test scenarios or test plan
3. **Document** - File path to test plan (PDF, Word, Excel, MD, etc.)
4. **Text** - Test plan content provided directly in the conversation

**MCP Tool Access:**
- If Jira/Confluence MCP tools are available, use them to fetch content directly
- If access is denied or tools unavailable, ask the user to either:
  - Grant permission to access Atlassian tools
  - Provide connection details (site URL, credentials if needed)
  - Provide the test plan content manually (copy-paste or document upload)

**Example prompt for missing access:**
> "I need to access Jira/Confluence to read the test plan. Please either grant permission to the Atlassian MCP tools, or provide the test plan content manually."

### Step 2: Read and Analyze the Test Plan

Based on the source type, fetch and thoroughly read the test plan:

**For Jira tickets:**
- Use `mcp__atlassian__getJiraIssue` to fetch ticket details
- Extract: test scenarios, acceptance criteria, use cases, test descriptions
- Check for linked tickets or attachments with additional test details

**For Confluence URLs:**
- Use `mcp__atlassian__getConfluencePage` to fetch page content
- Parse test scenarios, use cases, test requirements

**For Documents:**
- Use `Read` tool to access the file
- Extract test scenarios, use cases, test plan sections

**For Text:**
- Test plan content is already in the conversation
- Parse and structure the test scenarios

**Analysis Focus:**
Extract from the test plan:
- Test scenario names and descriptions
- Use cases with main flows and alternate flows
- Preconditions for each scenario
- Expected behaviors and results
- Test data requirements
- Priority levels (if specified)
- Test categories or groupings

### Step 3: Ask Clarifying Questions

**CRITICAL: Do NOT assume or hallucinate anything.**

Before proceeding, review what you've read and ask the user any questions about:

**Test Case Details:**
- Missing preconditions for any scenario
- Ambiguous expected results
- Unclear test steps or flows
- Missing priority information
- Environment specifications (if not in the test plan)
- Test data requirements
- Any assumptions needed for test execution

**Categorization:**
- How should test cases be grouped/categorized? (by feature, by use case, by priority, etc.)
- Should negative and positive test cases be in separate categories?

**Numbering/Naming:**
- What format for Test Case IDs? (e.g., TC001, TEST-001, sequential numbers)
- Should test case names follow any specific convention?

**Status Field:**
- What should be the default status? (e.g., "Draft", "Ready for Review", "Not Started")

Present your questions clearly and wait for user responses before moving forward.

### Step 4: Generate Test Cases

Convert each test scenario from the test plan into detailed test cases.

**Test Case Generation Rules:**

**A. One Test Case Per Scenario:**
- Each test scenario becomes one test case (unless scenario is very complex)
- For complex scenarios with multiple flows, create separate test cases for each flow

**B. Test Case Structure - Jira Format:**
```
Test Case ID: [Sequential or user-defined format]
Test Case Name: [Clear, descriptive name from scenario]
Description: [What this test case validates]
Preconditions: [Setup required before execution]
Priority: [High/Medium/Low based on scenario]
Status: [Default status as agreed]
Environment: [Test environment - e.g., Staging, QA, Production]

Steps:
Step #1
  Step Name: [Action to perform]
  Expected Result: [What should happen]
  Actual Result: [Leave blank for execution]
  
Step #2
  Step Name: [Next action]
  Expected Result: [What should happen]
  Actual Result: [Leave blank for execution]
  
[Continue for all steps...]
```

**C. Test Case Structure - Practitest Format:**
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
  
[Continue for all steps...]
```

**D. Writing Test Steps:**

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

**E. Handling Different Scenario Types:**

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

### Step 5: Present Test Cases for Review

After generating all test cases, present them in a **clear tabular format** for user review.

**Summary Table Format:**

| Test Case ID | Test Case Name | Category | Priority | # of Steps | Status |
|--------------|----------------|----------|----------|------------|--------|
| TC001 | Valid user login with correct credentials | Authentication | High | 5 | Draft |
| TC002 | Invalid login with wrong password | Authentication | High | 4 | Draft |
| TC003 | ... | ... | ... | ... | ... |

Below the summary, show the **full detailed test cases** with all steps for each test case.

**Format for detailed view:**
```
═══════════════════════════════════════════════════════════════
TEST CASE ID: TC001
═══════════════════════════════════════════════════════════════
Name: Valid user login with correct credentials
Description: Verify that a user can successfully log in using valid credentials
Preconditions: 
  - User account exists with username "testuser@example.com" and password "Test123!"
  - Application is accessible at https://app.example.com
Priority: High
Status: Draft
Environment: QA

STEPS:
───────────────────────────────────────────────────────────────
Step #1
  Step Name: Navigate to login page
  Expected Result: Login page displays with username and password fields
  Actual Result: [Blank]
───────────────────────────────────────────────────────────────
Step #2
  Step Name: Enter username "testuser@example.com"
  Expected Result: Username field accepts input
  Actual Result: [Blank]
───────────────────────────────────────────────────────────────
[Continue for all steps...]
```

### Step 6: Get User Approval and Iterate

Ask the user: **"Do you approve this test case list? (Yes / No)"**

Provide clear options for the user.

**A. If user approves (says "Yes"):** Continue to Step 7

**B. If user does not approve (says "No"):** Enter interactive change loop

### Step 6.1: Interactive Change Loop

Ask the user: **"What would you like to do? (Add / Update / Delete / Done)"**

**Option 1: Add**
1. Ask: "What is the Test Case Name or Test Case ID you'd like to add?"
2. User provides the identifier
3. Ask all necessary details:
   - Test Case Name (if only ID provided)
   - Description: "What should this test case validate?"
   - Preconditions: "What setup is required before executing this test?"
   - Priority: "What is the priority? (High / Medium / Low)"
   - Category: "What category does this belong to?"
   - Steps: "Please provide the test steps. You can provide them as:
     - Numbered list of actions
     - Detailed steps with expected results
     - I can also generate steps based on a description of what to test"
4. After receiving information, create the test case and add it to the list
5. Show the newly added test case in the same detailed format
6. Return to "What would you like to do?" question

**Option 2: Update**
1. Ask: "Which Test Case ID or Test Case Name would you like to update?"
2. User provides the identifier
3. Ask: "What would you like to update?"
   - Option A: "Test Case Name only"
   - Option B: "Description"
   - Option C: "Preconditions"
   - Option D: "Priority"
   - Option E: "Steps" (add/modify/delete specific steps)
   - Option F: "Multiple fields"
4. Based on selection, ask for the specific updates
5. Update the test case
6. Show the updated test case in full detail
7. Return to "What would you like to do?" question

**Option 3: Delete**
1. Ask: "Which Test Case ID or Test Case Name would you like to delete?"
2. User provides the identifier
3. Confirm: "Are you sure you want to delete [Test Case Name]? (Yes / No)"
4. If Yes, delete the test case from the list
5. Show updated summary table
6. Return to "What would you like to do?" question

**Option 4: Done**
- Exit the change loop
- Show the final updated summary table
- Continue to Step 7 (Final Approval)

**Important:** Allow multiple changes in one session. The loop continues until the user selects "Done".

### Step 7: Final Approval

Show the updated test case list in both summary table and detailed format.

Ask: **"Is this final test case list approved? (Yes / No)"**

- **If Yes:** Continue to Step 8 (Generate Output Files)
- **If No:** Go back to Step 6.1 (Interactive Change Loop)

### Step 8: Generate Output Files

Create test case files in **THREE** formats: Excel, CSV, and PDF.

Create output directory: `./test-cases/`

#### 8.1 Excel Workbook (`<project-name>-test-cases.xlsx`)

Generate an Excel workbook with separate sheets for categories.

**Sheet Structure:**

**Master Sheet: "All Test Cases - Jira Format"**
| Test Case ID | Name | Description | Preconditions | Step # | Step Name | Expected Result | Actual Result | Priority | Status | Environment |
|--------------|------|-------------|---------------|--------|-----------|-----------------|---------------|----------|--------|-------------|

**Master Sheet: "All Test Cases - Practitest Format"**
| Name | Description | Preconditions | Step # | Step Name | Expected Result | Status |
|------|-------------|---------------|--------|-----------|-----------------|--------|

**Category Sheets (one per category):**
- Each category gets its own sheet (e.g., "Authentication", "API Tests", "Integration")
- Same column structure as master sheet
- Contains only test cases for that category

**Excel Formatting:**
- Header row with bold text and colored background
- Borders on all cells
- Auto-fit column widths
- Freeze top row for scrolling
- Merged cells for Test Case ID, Name, Description, etc. (one value per test case, spans multiple step rows)

**Python Implementation:**
Use `openpyxl` library:
- Create workbook with multiple sheets
- Apply cell styles (Font, PatternFill, Alignment, Border)
- Merge cells for test case-level fields
- Set column widths appropriately

#### 8.2 CSV Files

Generate **TWO** CSV files:

**File 1: `<project-name>-test-cases-jira.csv`**
- Jira format with all fields
- Headers: Test Case ID, Name, Description, Preconditions, Step #, Step Name, Expected Result, Actual Result, Priority, Status, Environment
- One row per step (test case fields repeated for each step row)

**File 2: `<project-name>-test-cases-practitest.csv`**
- Practitest format with subset of fields
- Headers: Name, Description, Preconditions, Step #, Step Name, Expected Result, Status
- One row per step (test case fields repeated for each step row)

**CSV Format:**
- UTF-8 encoding
- Comma delimiter
- Quoted fields to handle commas in content
- No blank rows between test cases

**Python Implementation:**
Use built-in `csv` module:
```python
import csv

with open(filepath, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(headers)
    writer.writerows(data)
```

#### 8.3 PDF Document (`<project-name>-test-cases.pdf`)

Generate a formal PDF document with formatted tables.

**PDF Structure:**

**Cover Page:**
- Title: "[Project Name] - Test Cases"
- Subtitle: "Generated from Software Test Plan"
- Date: [Current date]
- Summary: Total number of test cases, categories, priority breakdown

**Table of Contents:**
- List of all test cases with page numbers
- Grouped by category

**Test Case Details (one per page or section):**
Each test case presented in a formatted layout:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Case ID: TC001                    Priority: High
Name: Valid user login with correct credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Description:
Verify that a user can successfully log in using valid credentials

Preconditions:
• User account exists with username "testuser@example.com"
• Application is accessible at https://app.example.com

Environment: QA                        Status: Draft

Test Steps:
┌─────┬──────────────────────────────────────────────────────┐
│ #   │ Step Name & Expected Result                          │
├─────┼──────────────────────────────────────────────────────┤
│  1  │ Step: Navigate to login page                         │
│     │ Expected: Login page displays                        │
├─────┼──────────────────────────────────────────────────────┤
│  2  │ Step: Enter username "testuser@example.com"          │
│     │ Expected: Username field accepts input               │
└─────┴──────────────────────────────────────────────────────┘

Actual Results: _________________________________________
```

**Python Implementation:**
Use `reportlab` library:
- Create PDF canvas
- Add title, headers, tables
- Format with borders and styling
- Page breaks between test cases or sections

#### 8.4 Document Generation Script

Create a Python script `generate_test_case_docs.py` that:
- Accepts test case data as structured input (JSON or Python data structures)
- Generates all three formats (Excel, CSV, PDF)
- Handles errors gracefully
- Reports success/failure for each format

**Required Python libraries:**
- `openpyxl` for Excel
- `csv` (built-in) for CSV
- `reportlab` for PDF

**Script Execution:**
```python
python generate_test_case_docs.py
```

**If libraries are missing:**
- Attempt to install them with user permission: `pip install openpyxl reportlab`
- If installation fails, inform user and generate what's possible
- Provide pip install commands for manual installation

### Step 9: Confirm Completion

After generating all files:

**File Summary:**
```
═══════════════════════════════════════════════════════════════
Test Cases Generation Complete
═══════════════════════════════════════════════════════════════

Generated Files:
  ✓ Excel (Jira & Practitest): <path>/test-cases.xlsx (XX,XXX bytes)
  ✓ CSV Jira Format: <path>/test-cases-jira.csv (X,XXX bytes)
  ✓ CSV Practitest Format: <path>/test-cases-practitest.csv (X,XXX bytes)
  ✓ PDF Document: <path>/test-cases.pdf (XXX,XXX bytes)

Summary:
  • Total Test Cases: XX
  • Categories: [List categories]
  • Priority Breakdown: X High, X Medium, X Low
  
All files are ready for import into Jira and Practitest!
═══════════════════════════════════════════════════════════════
```

**Offer Next Steps:**
- "Would you like me to make any adjustments to the test cases?"
- "Would you like me to regenerate any specific format?"
- "Do you need help importing these into Jira or Practitest?"

## Important Guidelines

### Test Case Quality

**Completeness:**
- Every test case must have a clear name, description, and preconditions
- All steps must have expected results
- No placeholder text like "TBD" or "TODO" in final output

**Clarity:**
- Test steps should be unambiguous and executable by any QA engineer
- Use specific values, not generic placeholders
- Reference exact UI elements, API endpoints, or data values

**Traceability:**
- Each test case maps back to a specific scenario or requirement in the test plan
- Test Case ID should follow consistent numbering scheme
- Category/grouping should be logical and consistent

**Executability:**
- Steps are in logical sequence
- Prerequisites are clearly stated
- Expected results are observable and verifiable
- Environment is specified

### Format Consistency

**Jira vs Practitest:**
- Jira format includes: Test Case ID, Actual Result, Priority, Environment
- Practitest format excludes: Test Case ID, Actual Result, Priority, Environment
- All other fields are present in both formats

**Step Numbering:**
- Steps are numbered sequentially starting from 1
- Step numbers are consistent across all formats
- Each step has both Step Name (action) and Expected Result

**Data Integrity:**
- Same test case content in Excel, CSV, and PDF
- No data loss between formats
- Special characters handled correctly (escaped in CSV, rendered in PDF)

### Error Handling and Permissions

**Missing Test Plan Source:**
- If user doesn't provide a source, prompt them with the four options (Jira/Confluence/Document/Text)
- Don't proceed without a test plan

**Access Issues:**
- If Jira/Confluence access is denied, explain what you need and offer alternatives
- If document reading is denied, ask to paste content or grant permission
- Always explain the value: "I need to fetch X to extract test scenarios"

**Missing Dependencies:**
- If Python libraries are missing, list them and ask permission to install
- Provide pip install commands if user prefers manual installation
- If installation fails, generate what you can and inform user of limitations

**Clarification Needed:**
- If test scenarios are ambiguous, always ask rather than assume
- Document assumptions if user confirms them
- Flag any gaps in the test plan that might affect test case quality

**Permission Strategy:**
- Be specific about what you're accessing and why
- Offer alternatives when permissions are denied
- Batch permission requests when possible to reduce interruptions

## Example Invocation

**User:** "Create test cases from this test plan: [Confluence URL]"

**Assistant should:**
1. Fetch the test plan from Confluence using MCP tools (or ask for permission/content)
2. Read and analyze all test scenarios
3. Ask clarifying questions about ambiguities or missing details
4. Generate detailed test cases for each scenario with steps and expected results
5. Present test cases in summary table + detailed format
6. Get user approval or enter change loop
7. Get final approval
8. Generate all output files (Excel with category sheets, 2 CSV files, PDF)
9. Report file locations and summary statistics

## Advanced Features

### Handling Large Test Plans

**For test plans with 50+ scenarios:**
- Generate test cases in batches (e.g., 10-20 at a time by category)
- Show progress after each batch
- Allow user to approve each batch before proceeding to next
- This prevents overwhelming the user with hundreds of test cases at once

### Test Case Optimization

**Identifying Redundant Test Cases:**
- If multiple scenarios test very similar functionality, suggest combining them
- Flag potential duplicate test cases for user review
- Ask: "TC005 and TC012 seem to test the same flow. Should they be combined?"

**Step Reuse:**
- If common steps appear in multiple test cases (e.g., "Login"), offer to create a reference
- Suggest: "Many test cases start with login steps. Would you like me to reference a 'Common Login Steps' precondition instead?"

### Integration Hints

**Jira Import:**
- CSV can be imported via Jira's bulk import feature
- Excel can be copy-pasted into Jira test case fields
- Mention: "To import into Jira, use the CSV file with Jira's bulk import tool"

**Practitest Import:**
- Practitest supports CSV import with specific column mapping
- Mention: "To import into Practitest, use the Practitest CSV file and map columns during import"

## Troubleshooting

**If test plan has no clear scenarios:**
- Ask user: "The test plan seems to contain only requirements, not test scenarios. Would you like me to generate test scenarios first, or work directly from requirements?"

**If test steps are too high-level:**
- Break down each step into smaller sub-steps
- Example: "Verify login" → 3 steps: Navigate, Enter credentials, Click login, Verify success

**If expected results are missing:**
- Ask user for expected behavior
- Don't guess or hallucinate expected results

**If categories are unclear:**
- Propose categorization based on test plan structure
- Ask user to confirm or provide their own categories

## Tips for Users

**Best Practices:**
- Provide detailed test plans with clear scenarios and expected behaviors
- Specify priority and environment information in the test plan
- Review test cases carefully in the approval step
- Use the Excel sheets for test execution tracking (fill in Actual Results column)

**Common Workflows:**
- **From test plan to execution:** Generate test cases → Review → Generate files → Import to Jira/Practitest → Execute
- **Iterative refinement:** Generate initial test cases → Review → Update specific cases → Re-generate files
- **Category-based generation:** Large test plan → Generate by category → Review each category → Combine all

---

**End of TestCase Skill**
