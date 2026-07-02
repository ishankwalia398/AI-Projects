---
name: generate-backend-testcases
description: >
  Generate detailed backend test cases from a Test Plan and a Product/Feature Specification. Use this
  skill whenever the user says "generate test cases", "create test cases from STP", "write test cases
  for", "generate backend test cases", or provides a Test Plan and asks for test case coverage. Accepts
  the Test Plan as: Excel (.xlsx), CSV (.csv), Confluence URL, PDF, Word (.docx), or pasted text. Accepts
  the specification as: Confluence URL, Jira ticket, PDF, Word (.docx), or pasted text. Output is always
  a two-sheet Excel (.xlsx) file: one sheet with all test cases in step-by-step tabular format, one sheet
  with a coverage summary. Never plain text or markdown. Unit Test scenarios are always silently excluded.
argument-hint: "[test-plan-file | confluence-url | jira-ticket | 'paste test plan text']"
allowed-tools: mcp__atlassian__getJiraIssue, mcp__atlassian__getAccessibleAtlassianResources, mcp__atlassian__getConfluencePage, mcp__atlassian__search, Read, Glob, Bash, Write, Edit, AskUserQuestion
---

## Goal

Generate detailed, traceable, backend-only test cases from two inputs: a **Test Plan** (containing
scenarios) and a **Product/Feature Specification** (the source of truth for business logic, APIs, and
flows). Output is a professional Excel workbook with every eligible test case broken into numbered steps,
preconditions labelled explicitly, and a coverage summary on a second sheet.

**Scope constraint:** Backend logic, microservices, REST/GraphQL APIs, databases, event flows,
integrations, and business rules ONLY. Never generate frontend, UI, browser, or caching test cases.
Unit Test scenarios are always excluded silently — they do not appear anywhere in the output.

---

## Step 0: Collect the Test Plan

Ask the user for their Test Plan using `AskUserQuestion`:

> "To generate backend test cases, I need two documents. Let's start with the **Test Plan**. How would
> you like to provide it?"

Options:
- **Excel file (.xlsx / .csv)** – upload the file
- **Confluence URL** – paste the page URL
- **PDF document** – upload the file
- **Word document (.docx)** – upload the file
- **Paste text** – paste the content directly into the chat

Wait for the user's response before proceeding to Step 1.

---

## Step 1: Extract the Test Plan Content

Based on the user's input type from Step 0, extract the full test plan using the appropriate method below.

---

### Input Type A: Excel File (.xlsx or .csv)

Identify the file at `/mnt/user-data/uploads/<filename>` and extract all content:

```bash
pip install openpyxl pandas --break-system-packages -q
python3 - <<'EOF'
import pandas as pd, sys, json

path = "/mnt/user-data/uploads/<filename>"
if path.endswith(".csv"):
    df = pd.read_csv(path)
else:
    xf = pd.ExcelFile(path)
    frames = {s: xf.parse(s) for s in xf.sheet_names}
    df = pd.concat(frames.values(), ignore_index=True)

print(df.to_string())
EOF
```

Store the raw output as `<TEST_PLAN_RAW>` and store the original filename (without extension) as
`<TEST_PLAN_NAME>` — this becomes the output file name prefix.

---

### Input Type B: Confluence URL (Test Plan)

1. Parse the `pageId` from the URL:
   - Standard: `https://<domain>/wiki/spaces/<SPACE>/pages/<PAGE_ID>/<title>`
   - Short form: `https://<domain>/wiki/x/<SHORT_ID>`
2. Call `mcp__atlassian__getAccessibleAtlassianResources` to obtain the `cloudId`.
3. Call `mcp__atlassian__getConfluencePage` with the resolved `pageId` and `cloudId`.
4. Extract the full page body as `<TEST_PLAN_RAW>`.
5. Derive `<TEST_PLAN_NAME>` from the page title.

**If the MCP is unavailable or returns an error:**
> "The Confluence MCP is not reachable. Please paste the Test Plan content directly into the chat and I'll proceed."
Wait for pasted input, then treat as Input Type E.

---

### Input Type C: PDF (Test Plan)

Identify the file at `/mnt/user-data/uploads/<filename>.pdf`:

```bash
pdfinfo /mnt/user-data/uploads/<filename>.pdf
pdffonts /mnt/user-data/uploads/<filename>.pdf
```

- If fonts are listed → extract text:
  ```bash
  pdftotext /mnt/user-data/uploads/<filename>.pdf -
  ```
- If no fonts (scanned image) → inform the user:
  > "This PDF appears to be a scanned image without extractable text. Please paste the Test Plan content
  > directly and I'll proceed."
  Then treat as Input Type E.

Derive `<TEST_PLAN_NAME>` from the filename (without extension).

---

### Input Type D: Word Document (Test Plan)

Identify the file at `/mnt/user-data/uploads/<filename>.docx`:

```bash
pip install python-docx --break-system-packages -q
python3 - <<'EOF'
from docx import Document
doc = Document("/mnt/user-data/uploads/<filename>.docx")
for para in doc.paragraphs:
    print(para.text)
for table in doc.tables:
    for row in table.rows:
        print("\t".join(cell.text for cell in row.cells))
EOF
```

For legacy `.doc` files, convert first:
```bash
libreoffice --headless --convert-to docx /mnt/user-data/uploads/<filename>.doc --outdir /tmp/
```
Then extract from `/tmp/<filename>.docx`.

Derive `<TEST_PLAN_NAME>` from the filename (without extension).

---

### Input Type E: Pasted Text (Test Plan)

Use the pasted text directly as `<TEST_PLAN_RAW>`. Ask the user:
> "What should I name the output file? (e.g., `MyFeature_STP`)"
Store the answer as `<TEST_PLAN_NAME>`.

---

## Step 2: Identify and Filter Scenarios

Parse `<TEST_PLAN_RAW>` and extract every scenario, preserving names, numbering, and hierarchy exactly
as documented. Do not rename, reorder, or modify scenario names.

### Unit Test Exclusion (Mandatory — runs silently)

Before doing anything else with the scenarios, identify and permanently discard any scenario that is
clearly a Unit Test. A scenario is a Unit Test if it:
- Tests a single function, method, or class in isolation with mocked dependencies
- Is labelled "Unit Test", "UT", or clearly belongs to a unit test suite
- Validates internal implementation details rather than an API contract or business flow

**Silent exclusion rules:**
- Do NOT generate test cases for excluded scenarios
- Do NOT include them in the Excel output
- Do NOT count them in coverage calculations or the summary
- Do NOT mention them anywhere in the final output or completion message
- If it is unclear whether a scenario is a Unit Test, ask the user for clarification before proceeding

Store the filtered list as `<ELIGIBLE_SCENARIOS>`. Only these proceed to Step 6.

**Eligible scenario types (proceed with these only):**
- Backend Testing
- API Testing
- Microservices Testing
- Integration Testing
- Business Flow Validation
- Data Validation

---

## Step 3: Collect the Product / Feature Specification

Ask the user for the specification using `AskUserQuestion`:

> "Got the Test Plan. Now I need the **Product or Feature Specification** — the document that describes
> the business logic, APIs, and flows. How would you like to provide it?"

Options:
- **Confluence URL** – paste the page URL
- **Jira Ticket** – provide the ticket number (e.g., `MTP-1234`)
- **PDF document** – upload the file
- **Word document (.docx)** – upload the file
- **Paste text** – paste the content directly into the chat

Wait for the user's response before proceeding to Step 4.

---

## Step 4: Extract the Specification Content

Based on the user's input type from Step 3, extract the full specification text using the appropriate
method below.

---

### Input Type A: Confluence URL (Specification)

1. Parse the `pageId` from the URL (same logic as Step 1 Input Type B).
2. Call `mcp__atlassian__getAccessibleAtlassianResources` to obtain the `cloudId`.
3. Call `mcp__atlassian__getConfluencePage` with the resolved `pageId` and `cloudId`.
4. Extract the full page body as `<SPEC_RAW>`.

**If the MCP is unavailable or returns an error:**
> "The Confluence MCP is not reachable. Please paste the specification text directly and I'll proceed."
Wait for pasted input, then treat as Input Type E.

---

### Input Type B: Jira Ticket (Specification)

1. Call `mcp__atlassian__getAccessibleAtlassianResources` to obtain the `cloudId`.
2. Call `mcp__atlassian__getJiraIssue` with `fields: ["summary", "description", "comment", "attachment"]`.
3. Extract: summary, description, acceptance criteria, and all comment bodies (oldest → newest —
   later comments may override earlier ones).
4. Concatenate into a single block stored as `<SPEC_RAW>`.

**If the MCP is unavailable or returns an error:**
> "The Jira MCP is not reachable. Please paste the ticket description directly and I'll proceed."
Wait for pasted input, then treat as Input Type E.

---

### Input Type C: PDF (Specification)

Same extraction logic as Step 1 Input Type C. Store result as `<SPEC_RAW>`.

---

### Input Type D: Word Document (Specification)

Same extraction logic as Step 1 Input Type D. Store result as `<SPEC_RAW>`.

---

### Input Type E: Pasted Text (Specification)

Use the pasted text directly as `<SPEC_RAW>`. No additional extraction needed.

---

## Step 5: Validate Specification Completeness

Before generating any test cases, scan `<SPEC_RAW>` for the following. If **any** are entirely absent,
ask the user in a single `AskUserQuestion` listing only the missing items:

- **Business flows** — at least one documented end-to-end backend flow
- **API contracts or service interactions** — endpoints, request/response structure, or service calls
- **Business rules or validation logic** — conditions that determine success or failure
- **Error handling** — how the system responds to invalid inputs or failures

If anything is missing:
> "Before I can generate accurate test cases, I need more detail. Could you clarify:
> - [list only the missing items from the spec]"

Wait for the user's response and incorporate it into `<SPEC_RAW>` before proceeding to Step 6.

If any scenario in `<ELIGIBLE_SCENARIOS>` references a flow, API, or business rule that cannot be found
anywhere in `<SPEC_RAW>`, stop and ask the user for clarification rather than inventing the behaviour.

---

## Step 6: Generate Test Cases

This is internal analysis — do NOT present it to the user as a plan. Proceed directly to Excel generation
in Step 7.

For each scenario in `<ELIGIBLE_SCENARIOS>`, generate one or more test cases derived strictly from
`<SPEC_RAW>`. Follow all rules below:

### Test Case ID Format

Assign sequential IDs in the format: `TC_0001`, `TC_0002`, `TC_0003` …
IDs must be globally unique across all scenarios.

### Coverage Rules (apply to every eligible scenario)

Generate at minimum:
- **Positive test case** — valid inputs, expected successful backend response
- **Negative test case — invalid input** — malformed, missing, or out-of-range data
- **Negative test case — business rule failure** — condition not met, wrong state, missing config
- **Integration/dependency failure** — downstream service unavailable, DB error, timeout

Generate additional test cases for any of the following that appear in `<SPEC_RAW>`:
- Authentication and authorisation logic
- Retry or compensation mechanisms
- Event/message publishing or consumption (Kafka, queues)
- Data transformation or enrichment
- Boundary values and threshold conditions
- Concurrent or race-condition-prone flows (if documented)
- Logging or auditing requirements (if specified)

### Precondition Handling

If `<SPEC_RAW>` defines preconditions for a flow:
- Add them as the **first step(s)** of the test case
- Set `Step_Name` = `Precondition` for each precondition step
- Include all required system state, test data, or configuration in `Step_Description`
- Capture the expected pre-state in `Expected_Result`

### Traceability Rules

Every test case and every step must be directly traceable to either:
- A scenario name in the Test Plan, OR
- A documented flow, business rule, API contract, or validation in `<SPEC_RAW>`

Never generate test cases for undocumented behaviour. If a required detail is missing, stop and ask.

### Hallucination Prevention (Critical)

- Never assume undocumented API responses or fields
- Never invent business rules not present in `<SPEC_RAW>`
- Never create endpoints, payloads, or validations that are not explicitly documented
- Never fabricate expected results — every expected result must cite the source in `<SPEC_RAW>`
- If a flow or validation is ambiguous, stop and ask the user before proceeding

---

## Step 7: Generate the Excel Workbook

Use Python with `openpyxl` to build a two-sheet `.xlsx` file and save it to the user's cross-platform
output directory:

```
~/.claude/outputs/<TEST_PLAN_NAME>_Backend_TestCases.xlsx
```

This resolves to `C:\Users\<USERNAME>\.claude\outputs` on Windows and `~/.claude/outputs` on
macOS/Linux — resolve it with Python's `os.path` APIs, never a hard-coded POSIX or Windows-style path.

Replace spaces in `<TEST_PLAN_NAME>` with underscores.

**Before generating any script file:** check whether the output directory exists — if it exists, use
it (modifying it if needed); if it does not exist, create it.

```python
import os

output_dir = os.path.join(os.path.expanduser("~"), ".claude", "outputs")
os.makedirs(output_dir, exist_ok=True)

output_path = os.path.join(output_dir, f"{test_plan_name}_Backend_TestCases.xlsx")
wb.save(output_path)
```

**Every file this skill produces** — the Backend Test Cases workbook AND the task-performed log
described in Step 7b — is written to this same `output_dir`. Never write skill output to any other
location.

---

### Sheet Structure

| Sheet # | Tab Name | Content |
|---------|----------|---------|
| 1 | `Backend Test Cases` | All test cases, one row per step |
| 2 | `Coverage Summary` | Scenario count, TC count, coverage gaps |

---

### Styling Constants (apply to both sheets)

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

HEADER_FILL      = PatternFill("solid", fgColor="1F3864")   # Dark navy
HEADER_FONT      = Font(name="Arial", bold=True, color="FFFFFF", size=10)
ALT_ROW_FILL     = PatternFill("solid", fgColor="DCE6F1")   # Light blue alternating
WHITE_FILL       = PatternFill("solid", fgColor="FFFFFF")
PRECOND_FILL     = PatternFill("solid", fgColor="FFF2CC")   # Yellow for Precondition rows
TC_LABEL_FILL    = PatternFill("solid", fgColor="E2EFDA")   # Light green for first step of each TC
BODY_FONT        = Font(name="Arial", size=10)
BOLD_FONT        = Font(name="Arial", size=10, bold=True)
WRAP_ALIGN       = Alignment(wrap_text=True, vertical="top")
CENTER_ALIGN     = Alignment(horizontal="center", vertical="top", wrap_text=True)
THIN_BORDER      = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"),  bottom=Side(style="thin")
)
MEDIUM_BORDER    = Border(
    left=Side(style="medium"), right=Side(style="medium"),
    top=Side(style="medium"),  bottom=Side(style="medium")
)

def style_header_row(ws, row_num, num_cols):
    for col in range(1, num_cols + 1):
        cell = ws.cell(row=row_num, column=col)
        cell.fill   = HEADER_FILL
        cell.font   = HEADER_FONT
        cell.alignment = CENTER_ALIGN
        cell.border = THIN_BORDER

def style_data_row(ws, row_num, num_cols, fill):
    for col in range(1, num_cols + 1):
        cell = ws.cell(row=row_num, column=col)
        cell.fill   = fill
        cell.font   = BODY_FONT
        cell.alignment = WRAP_ALIGN
        cell.border = THIN_BORDER

def auto_col_width(ws, min_w=12, max_w=55):
    for col in ws.columns:
        length = max((len(str(c.value or "")) for c in col), default=0)
        ws.column_dimensions[get_column_letter(col[0].column)].width = \
            min(max(length + 2, min_w), max_w)

def freeze_header(ws):
    ws.freeze_panes = "A2"
```

---

### Sheet 1 — Backend Test Cases

**Columns (9 total):**

```
S.No. | TC_ID | Scenario_Name | TC_Name | TC_Description | Step# | Step_Name | Step_Description | Expected_Result
```

**Column widths:**

| Column | Header | Width |
|--------|--------|-------|
| A | S.No. | 7 |
| B | TC_ID | 12 |
| C | Scenario_Name | 30 |
| D | TC_Name | 28 |
| E | TC_Description | 40 |
| F | Step# | 8 |
| G | Step_Name | 18 |
| H | Step_Description | 45 |
| I | Expected_Result | 45 |

**Row layout — one Excel row per step:**

Each test case spans multiple rows (one per step). For the columns `S.No.`, `TC_ID`, `Scenario_Name`,
`TC_Name`, `TC_Description` — write the value only in the **first step row** of each test case, and
merge those cells vertically across all rows belonging to that test case:

```python
# After writing all step rows for a TC, merge TC-level columns vertically
if step_count > 1:
    for col_letter in ["A", "B", "C", "D", "E"]:
        ws.merge_cells(f"{col_letter}{first_row}:{col_letter}{last_row}")
        merged = ws[f"{col_letter}{first_row}"]
        merged.alignment = Alignment(wrap_text=True, vertical="top",
                                     horizontal="center" if col_letter in ["A","B","F"] else "left")
```

**Row fill rules:**

- `Step_Name == "Precondition"` → `PRECOND_FILL` (yellow `FFF2CC`)
- First step row of each TC group (non-Precondition) → `TC_LABEL_FILL` (light green `E2EFDA`)
- All other step rows within the same TC → alternate between `WHITE_FILL` and `ALT_ROW_FILL`
  based on TC group index (odd TC groups = white, even TC groups = light blue)

**TC_ID column (B):** bold, centre-aligned.

**Step_Name == "Precondition":** bold font in column G.

**Auto-filter on all 9 columns:**
```python
ws.auto_filter.ref = ws.dimensions
```

**Freeze pane at `B2`** (freeze both S.No. and header):
```python
ws.freeze_panes = "B2"
```

---

### Sheet 2 — Coverage Summary

**Columns:**

```
Metric | Value
```

Column A width: 38, Column B width: 25.

**Rows (write in this exact order):**

| Metric | Value |
|--------|-------|
| Generated On | [YYYY-MM-DD] |
| Test Plan Source | [filename / Confluence URL / Jira ticket / "Pasted text"] |
| Specification Source | [filename / Confluence URL / Jira ticket / "Pasted text"] |
| Total Scenarios in Test Plan | [count before filtering] |
| Unit Test Scenarios Excluded | [count of silently excluded scenarios] |
| Eligible Scenarios Processed | [count of scenarios that passed the filter] |
| Total Test Cases Generated | [TC count] |
| Total Test Steps Generated | [step row count] |
| Average Steps per Test Case | [mean, 1 decimal place] |
| *(blank separator row)* | |
| **Coverage by Scenario** | *(section label — merged across both columns, bold)* |
| [Scenario_Name 1] | [TC count for this scenario] |
| [Scenario_Name 2] | [TC count for this scenario] |
| … | … |
| *(blank separator row)* | |
| **Missing Information / Assumptions** | *(section label — merged, bold)* |
| [item 1 — only if any gaps were found] | |
| None — all test cases are fully traceable | *(if no gaps)* |

**Styling:**
- Header row: `HEADER_FILL` + `HEADER_FONT`
- Section label rows ("Coverage by Scenario", "Missing Information"): `PatternFill("solid", fgColor="2E75B6")` + white bold font, merged A:B
- Metric rows: alternate `WHITE_FILL` / `ALT_ROW_FILL`
- Value column (B): bold, centre-aligned

---

### Tab Colours

```python
tab_colors = {
    "Backend Test Cases": "1F3864",   # Dark navy
    "Coverage Summary":   "70AD47",   # Green
}
for name, color in tab_colors.items():
    wb[name].sheet_properties.tabColor = color
```

---

### Save and Validate

Write the script to `/tmp/gen_testcases.py` and run it:

```bash
pip install openpyxl --break-system-packages -q
python3 /tmp/gen_testcases.py
python3 /mnt/skills/public/xlsx/scripts/recalc.py "<output_path>"
```

Where `<output_path>` is the same cross-platform path computed above
(`os.path.join(os.path.expanduser("~"), ".claude", "outputs", f"{test_plan_name}_Backend_TestCases.xlsx")`).

Check the recalc output JSON:
- If `status` is `errors_found` → fix the identified cells and re-run before continuing.
- If `status` is `success` → proceed to Step 7b.

---

## Step 7b: Generate the Task-Performed Log

After the Excel workbook is saved and validated (recalc status `success`), write a companion Markdown
log file to the **same** `output_dir` documenting what was done.

**Filename:** `TestCases_TaskPerformed_<TEST_PLAN_NAME>_<Timestamp>.md`
- `<TEST_PLAN_NAME>`: same value used for the Excel file (spaces replaced with underscores)
- `<Timestamp>`: `YYYYMMDD_HHMMSS`, generated at write time

Apply the same pre-flight check as Step 7: if the output directory already exists, reuse it; only
create it if missing. Never overwrite a previous run's task log — each run gets its own timestamped file.

```python
from datetime import datetime

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
log_path = os.path.join(output_dir, f"TestCases_TaskPerformed_{test_plan_name}_{timestamp}.md")

with open(log_path, "w") as f:
    f.write(f"""# Backend Test Cases — Task Log — {test_plan_name}

**Generated on:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Test Plan source:** {test_plan_source}
**Specification source:** {spec_source}
**Output workbook:** {test_plan_name}_Backend_TestCases.xlsx

## Tasks Performed
- Collected and extracted the Test Plan ({test_plan_source})
- Filtered scenarios — {total_scenarios} total, {unit_test_excluded_count} Unit Test scenarios silently excluded, {eligible_count} eligible
- Collected and extracted the Specification ({spec_source})
- Validated specification completeness (missing items requested from user, if any: {missing_items_summary})
- Generated {tc_count} test cases across {step_count} test steps ({avg_steps} average steps per test case)
- Applied precondition handling, traceability checks, and hallucination-prevention rules
- Generated two-sheet Excel workbook (Backend Test Cases, Coverage Summary) with styling, merged TC cells, auto-filter, freeze pane
- Validated workbook via recalc.py — status: {recalc_status}
""")
```

Populate every `{placeholder}` with the actual values computed during Steps 2–7. Do not leave any
placeholder unfilled or generic.

---

## Step 8: Present the Output

Call `present_files` with the paths to **both** generated files:
- `~/.claude/outputs/<TEST_PLAN_NAME>_Backend_TestCases.xlsx`
- `~/.claude/outputs/TestCases_TaskPerformed_<TEST_PLAN_NAME>_<Timestamp>.md`

(both resolved per-OS as described in Step 7 — `C:\Users\<USERNAME>\.claude\outputs` on Windows).

Then deliver this message:

> "✅ **TestCases completed**
>
> **File:** `<TEST_PLAN_NAME>_Backend_TestCases.xlsx`
> **Location:** `~/.claude/outputs/` (`C:\Users\<USERNAME>\.claude\outputs` on Windows)
> **Total Test Cases Generated:** [count]
>
> The workbook contains two sheets:
> - **Backend Test Cases** — [step-row count] rows covering [TC count] test cases across
>   [eligible scenario count] scenarios. Precondition steps are highlighted in yellow; each test case
>   group is visually separated for easy reading.
> - **Coverage Summary** — full traceability report with per-scenario TC counts and any
>   documentation gaps identified during generation.
>
> Unit Test scenarios were automatically excluded and do not appear anywhere in the output.
>
> I've also saved a task log — `TestCases_TaskPerformed_<TEST_PLAN_NAME>_<Timestamp>.md` — summarising
> exactly what was generated, in the same output folder.
>
> Let me know if you'd like to add scenarios, expand coverage for a specific area, or adjust the
> step detail level."

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Jira / Confluence MCP unreachable | Inform user, ask to paste the content directly |
| Uploaded PDF is scanned / no text layer | Inform user, ask to paste the content directly |
| Excel / CSV file cannot be parsed | Report the error; ask user to paste the scenarios as text |
| Scenario references an undocumented API or flow | Stop and ask for clarification — do not invent |
| It is unclear whether a scenario is a Unit Test | Ask the user before excluding |
| `recalc.py` reports formula errors | Fix the formula(s) and re-run before presenting |
| `<TEST_PLAN_NAME>` cannot be derived | Ask: "What should I name the output file?" |
| openpyxl write fails (permissions, disk full) | Report the error verbatim; do not silently skip |
| Spec too vague to generate traceable expected results | Run Step 5 clarification — do not assume |
| Output directory already exists | Use it as-is (modify if needed); only create it if missing |

---

## Quality Checklist (verify before presenting)

- [ ] Every scenario in `<ELIGIBLE_SCENARIOS>` has at least one Positive and one Negative test case
- [ ] Every test case has at least one step (no empty TC rows)
- [ ] Precondition steps are the first step(s) in any TC that has preconditions, labelled "Precondition"
- [ ] TC_IDs are globally unique and follow `TC_0001` format with no gaps
- [ ] `Scenario_Name` matches the Test Plan exactly — no renaming or paraphrasing
- [ ] Every `Expected_Result` is directly supported by `<SPEC_RAW>` — no invented outcomes
- [ ] No frontend, UI, or caching test cases appear anywhere in Sheet 1
- [ ] No Unit Test scenarios appear anywhere in Sheet 1 or Sheet 2
- [ ] TC-level cells (A–E) are merged vertically across all step rows for that TC
- [ ] Auto-filter is applied to Sheet 1
- [ ] Freeze pane is set at `B2` on Sheet 1
- [ ] Coverage Summary accurately reflects the final TC and step counts
- [ ] `recalc.py` exits with `"status": "success"`
- [ ] Both sheets are present and tab-coloured
- [ ] Output directory was checked before generating the script file (used if present, created if missing)
- [ ] `TestCases_TaskPerformed_<TEST_PLAN_NAME>_<Timestamp>.md` was generated in the same output directory
- [ ] Both the workbook and the task log were passed to `present_files`
