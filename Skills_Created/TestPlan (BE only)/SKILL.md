---
name: generate-stp
description: >
  Generate a comprehensive Software Test Plan (STP) as a formatted Excel workbook AND a published
  Confluence page from any product or feature specification. Use this skill whenever the user says
  "generate STP", "create test plan", "write STP for", "build a test plan from", or provides a spec and
  asks for QA coverage, test scenarios, or a test plan document. Triggers on any combination of:
  Confluence URL, Jira ticket number, uploaded PDF, uploaded Word doc, or pasted specification text.
  Output is always three artifacts: a multi-sheet Excel (.xlsx) workbook with all sections in tabular
  format, a companion task-performed Markdown log, and a Confluence page published to a space/parent the
  user specifies — never plain text or markdown in place of the workbook. Always use this skill even if
  the user just pastes a spec and says "make a test plan".
argument-hint: "[confluence-url | jira-ticket | file-path | 'paste spec text']"
allowed-tools: mcp__atlassian__getJiraIssue, mcp__atlassian__getAccessibleAtlassianResources, mcp__atlassian__getConfluencePage, mcp__atlassian__createConfluencePage, mcp__atlassian__search, Read, Glob, Bash, Write, Edit, AskUserQuestion
---

## Goal

Generate a comprehensive, backend-focused Software Test Plan (STP) as a professional multi-sheet Excel
workbook, **and** publish a matching Confluence page in the space/location the user specifies. The plan
covers: Introduction, Test Items, Use Cases, Test Scenarios (tabular), Configuration Validation
(tabular), and a Unit Test Negative Flows table.

**Scope constraint:** This STP covers **microservice / backend logic, APIs, and data flows ONLY**.
Do NOT generate frontend, UI, or cache-layer scenarios under any circumstances.

**Three output artifacts, every run:**
1. Excel workbook (`STP_<FeatureName>.xlsx`)
2. Task-performed log (`STP_TaskPerformed_<FeatureName>_<Timestamp>.md`)
3. A published Confluence page titled `<FeatureName> - STP`, whose URL is written back into both of the
   files above and reported to the user.

---

## Step 0: Collect the Specification

Ask the user for their specification source using `AskUserQuestion`:

> "To generate the STP, I need the feature or product specification. How would you like to provide it?"

Options:
- **Confluence URL** – paste the page URL
- **Jira Ticket** – provide the ticket number (e.g., `MTP-1234`)
- **PDF or Word file** – upload the document
- **Paste text** – paste the spec directly into the chat

Wait for the user's response before proceeding to Step 0b.

---

## Step 0b: Collect the Confluence Publish Destination

Ask the user, via a second `AskUserQuestion` (or combined into the same one if the interface allows
multiple questions in a single call):

> "Where should I publish the STP Confluence page? Please paste the URL of the target Confluence space
> (e.g. `https://<domain>/wiki/spaces/<SPACE>/overview`) or a parent page under which the new page should
> be created (e.g. `https://<domain>/wiki/spaces/<SPACE>/pages/<PAGE_ID>/<title>`)."

Parse from the provided URL:
- `space_key` — always required; parse from `/spaces/<SPACE>/`.
- `parent_page_id` — optional; present only if the URL points at a specific page rather than the space overview. If present, the new STP page is created as a child of that page.

**If the user has no specific parent page in mind:** the page is created directly under the space (no parent).

**If the URL cannot be parsed:**
> "I couldn't parse a space or page from that URL. Could you paste the Confluence space URL again, or just tell me the space key (e.g. `VIMB`)?"
Wait for a valid response before proceeding.

Store `space_key` and `parent_page_id` (if any) — they are needed in Step 4c.

---

## Step 1: Extract the Specification Content

Based on the user's input type from Step 0, extract the full specification text using the appropriate method below.

---

### Input Type A: Confluence URL

1. Parse the `pageId` from the URL:
   - Standard format: `https://<domain>/wiki/spaces/<SPACE>/pages/<PAGE_ID>/<title>`
   - Or short form: `https://<domain>/wiki/x/<SHORT_ID>`
2. Call `mcp__atlassian__getAccessibleAtlassianResources` to obtain the `cloudId`.
3. Call `mcp__atlassian__getConfluencePage` with the resolved `pageId` and `cloudId`.
4. Extract the full page body as the specification text.

**If the MCP is unavailable or returns an error:**
> "The Confluence MCP is not reachable. Please paste the specification text directly into the chat and I'll proceed from there."
Wait for pasted input, then treat it as Input Type D.

---

### Input Type B: Jira Ticket

1. Call `mcp__atlassian__getAccessibleAtlassianResources` to obtain the `cloudId`.
2. Call `mcp__atlassian__getJiraIssue` with `fields: ["summary", "description", "comment", "attachment"]`.
3. Extract: summary, description, acceptance criteria, and all comment bodies (oldest → newest — later comments may override earlier ones).
4. Concatenate all extracted text into a single specification block.

**If the MCP is unavailable or returns an error:**
> "The Jira MCP is not reachable. Please paste the ticket description directly into the chat and I'll proceed from there."
Wait for pasted input, then treat it as Input Type D.

---

### Input Type C: Uploaded File (PDF or Word)

Identify the file at `/mnt/user-data/uploads/<filename>` and route by extension:

**PDF (`.pdf`):**
```bash
pdfinfo /mnt/user-data/uploads/<filename>.pdf
pdffonts /mnt/user-data/uploads/<filename>.pdf
```
- If fonts are listed → extract text:
  ```bash
  pdftotext /mnt/user-data/uploads/<filename>.pdf -
  ```
- If no fonts (scanned) → inform the user:
  > "This PDF appears to be a scanned image without extractable text. Please paste the specification text directly and I'll proceed."
  Then treat as Input Type D.

**Word (`.docx`):**
```bash
extract-text /mnt/user-data/uploads/<filename>.docx
```
Use the full extracted markdown output as the specification text.

**Legacy `.doc`:**
```bash
libreoffice --headless --convert-to docx /mnt/user-data/uploads/<filename>.doc --outdir /tmp/
extract-text /tmp/<filename>.docx
```

---

### Input Type D: Pasted Text

Use the pasted text directly as the specification. No additional extraction needed.

---

## Step 2: Validate Specification Completeness

Before generating any content, scan the extracted specification for the following. If **any** are entirely absent, ask the user in a single `AskUserQuestion` listing everything that is missing:

- **Feature name / system name** — what is being tested
- **Key functional flows** — at least one end-to-end flow described
- **Actors or callers** — who/what triggers the feature (user, service, scheduler, etc.)
- **Success / failure criteria** — what constitutes a pass or fail

If one or more are missing:
> "Before I can generate the STP, I need a bit more detail. Could you clarify:
> - [list only the missing items]"

Wait for the user's response, then incorporate it into the specification before proceeding to Step 3.

---

## Step 3: Analyse and Plan the STP

Carefully read the full specification and derive the following. This is internal analysis — do NOT present it to the user as a plan; proceed directly to Excel generation in Step 4.

### 3a: Introduction Block
- **Purpose:** One paragraph explaining why this STP exists and what it validates.
- **Scope:** System name, components covered (MS, APIs, DB, integrations). Explicitly state: "Frontend, UI, and caching layers are out of scope."
- **References:** Any document names, URLs, Jira/Confluence links mentioned in the spec.

### 3b: Test Items
Scan the spec and list:
- **In scope:** Every functional capability, API endpoint, business rule, data transformation, integration point, or configuration parameter mentioned.
- **Out of scope:** UI, frontend logic, caching, third-party internals, anything explicitly excluded in the spec.

### 3c: Use Cases
For each distinct end-to-end flow in the specification, define:
- `UC-ID`: Sequential ID (UC-01, UC-02 …)
- `Title`: Short, descriptive name
- `Description`: What this use case represents in business terms
- `Actors`: Who/what initiates (user role, service, scheduler)
- `Preconditions`: System state required before the flow begins
- `Main Flow`: Numbered steps (backend only)
- `Alternate Flows`: At least one deviation or error path if applicable
- `Postconditions / Expected Result`: What the system state should be after
- `Notes / Assumptions`: Any caveats

### 3d: Test Scenarios
For each UC, generate **at minimum** the following scenario types:
- **Positive/Happy path** — all inputs valid, expected success
- **Negative — invalid input** — malformed, missing, or out-of-range data
- **Negative — business logic failure** — threshold not met, missing config, wrong status
- **Edge case** — boundary values, empty collections, concurrent calls
- **Technical failure** — DB error, downstream service unavailable, retry exhaustion

Each scenario must include:
- `Scenario ID`: `<UC-ID>-SC-<N>` (e.g., `UC-01-SC-03`)
- `Scenario Title`
- `Type`: Positive | Negative | Edge Case
- `Given`: System/data precondition
- `When`: Action or trigger
- `Then`: Expected system behaviour
- `Priority`: High | Medium | Low
- `Notes`

**Filtering/Threshold Rule Coverage:** For every filtering rule, exclusion criterion, threshold, or eligibility condition in the spec, there MUST be:
- One scenario where the rule IS satisfied (item included)
- One scenario where the rule is NOT satisfied (item excluded)

### 3e: Configuration Validation Scenarios
Scan the entire spec (including DMS/config sections) for every parameter, flag, toggle, threshold, limit, default value, or environment variable. For each, generate:
- **Positive path** — correct/expected value set
- **Missing/unset** — default or fallback behaviour
- **Invalid value** — out-of-range, wrong type, unsupported value
- **Edge case** — min, max, null, empty string, special characters

Every scenario description MUST explicitly name the configuration parameter being tested.

### 3f: Unit Test Negative Flows Table
Generate one row per negative-path unit test covering:
- Malformed or missing inputs to the service/component
- Business logic rejection conditions
- Error response validation

Columns: `#`, `Scenario`, `Input`, `Expected Output`, `Developer Test Name`, `Pass/Fail/NA`

---

## Step 4: Generate the Excel Workbook

Use Python with `openpyxl` to build a multi-sheet `.xlsx` file and save it to the user's cross-platform
output directory: `~/.claude/outputs/STP_<FeatureName>.xlsx` — this resolves to
`C:\Users\<USERNAME>\.claude\outputs` on Windows and `~/.claude/outputs` on macOS/Linux.

Replace spaces in `<FeatureName>` with underscores. Derive the feature name from the specification title or summary.

**Cross-platform output path (Windows / macOS / Linux):** Resolve the output directory with Python's
`os.path` APIs — never hard-code a POSIX or Windows-style path.

**Before generating any script file:** check whether the output directory exists — if it exists, use
it (modifying it if needed); if it does not exist, create it.

```python
import os

output_dir = os.path.join(os.path.expanduser("~"), ".claude", "outputs")
os.makedirs(output_dir, exist_ok=True)

output_path = os.path.join(output_dir, f"STP_{feature_name}.xlsx")
wb.save(output_path)
```

**Every file this skill produces** — the STP workbook AND the task-performed log described in
Step 5b — is written to this same `output_dir`. Never write skill output to any other location.

### Sheet Structure

| Sheet # | Sheet Name | Content |
|---------|------------|---------|
| 1 | `Introduction` | Purpose, Scope, References as labelled rows |
| 2 | `Test Items` | Two-column table: In Scope / Out of Scope |
| 3 | `Use Cases` | One row per UC with all UC fields |
| 4 | `Test Scenarios` | One row per scenario across all UCs |
| 5 | `Config Validation` | One row per config parameter × scenario type |
| 6 | `Unit Tests - Negative` | Negative flow unit test table |

---

### Styling Rules (apply to ALL sheets)

```python
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, GradientFill
)
from openpyxl.utils import get_column_letter

HEADER_FILL   = PatternFill("solid", fgColor="1F3864")   # Dark navy
HEADER_FONT   = Font(name="Arial", bold=True, color="FFFFFF", size=10)
ALT_ROW_FILL  = PatternFill("solid", fgColor="DCE6F1")   # Light blue
WHITE_FILL    = PatternFill("solid", fgColor="FFFFFF")
BODY_FONT     = Font(name="Arial", size=10)
WRAP_ALIGN    = Alignment(wrap_text=True, vertical="top")
CENTER_ALIGN  = Alignment(horizontal="center", vertical="top", wrap_text=True)
THIN_BORDER   = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"),  bottom=Side(style="thin")
)

def style_header_row(ws, row_num, num_cols):
    for col in range(1, num_cols + 1):
        cell = ws.cell(row=row_num, column=col)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = CENTER_ALIGN
        cell.border = THIN_BORDER

def style_data_row(ws, row_num, num_cols, alt=False):
    fill = ALT_ROW_FILL if alt else WHITE_FILL
    for col in range(1, num_cols + 1):
        cell = ws.cell(row=row_num, column=col)
        cell.fill = fill
        cell.font = BODY_FONT
        cell.alignment = WRAP_ALIGN
        cell.border = THIN_BORDER

def auto_col_width(ws, min_w=12, max_w=60):
    for col in ws.columns:
        length = max((len(str(c.value or "")) for c in col), default=0)
        ws.column_dimensions[get_column_letter(col[0].column)].width = min(max(length + 2, min_w), max_w)

def freeze_header(ws):
    ws.freeze_panes = "A2"
```

Apply alternating row fills (white / light blue) to all data rows. Freeze the header row on every sheet.

---

### Sheet 1 — Introduction

```
Columns: Section | Detail
```

Rows:
- `Purpose` | [purpose text]
- `Scope — In` | [in-scope systems and components]
- `Scope — Out` | Frontend, UI, caching layers (always present)
- `References` | [document/URL list, one per row if multiple]
- `Generated On` | [today's date: YYYY-MM-DD]
- `Spec Source` | [Confluence URL / Jira ticket / filename / "Pasted text"]
- `Confluence STP Page` | [full URL returned in Step 4c, or "Not published" if publishing failed]

Set column A width to 22, column B width to 80. Wrap text in column B.

---

### Sheet 2 — Test Items

```
Columns: # | Category | Feature / Component | Notes
```

- Category values: `In Scope` or `Out of Scope`
- Colour-code Category column: green fill (`C6EFCE`, dark green font `006100`) for In Scope; red fill (`FFC7CE`, dark red font `9C0006`) for Out of Scope.
- Number rows sequentially within each category group.

---

### Sheet 3 — Use Cases

```
Columns: UC ID | Title | Description | Actors | Preconditions | Main Flow | Alternate Flows | Postconditions / Expected Result | Notes / Assumptions
```

- One row per use case.
- `Main Flow` and `Alternate Flows` cells: use numbered steps separated by line breaks (`\n`).
- Set row height to `auto` by setting `ws.row_dimensions[row].height = None` (openpyxl default).
- UC ID column: centre-aligned, bold, width 10.

---

### Sheet 4 — Test Scenarios

```
Columns: Scenario ID | UC ID | Scenario Title | Type | Given | When | Then | Priority | Notes
```

- `Type` column colour coding:
  - `Positive` → green fill `E2EFDA`
  - `Negative` → red fill `FCE4D6`
  - `Edge Case` → yellow fill `FFF2CC`
- `Priority` column colour coding:
  - `High` → red font `FF0000`, bold
  - `Medium` → orange font `FF7200`
  - `Low` → black font
- Auto-filter on all columns: `ws.auto_filter.ref = ws.dimensions`
- Freeze pane at `A2`.

---

### Sheet 5 — Config Validation

```
Columns: # | Config Parameter | Parameter Type | Scenario Type | Test Description | Input / Value | Expected Behaviour | Priority | Notes
```

- `Parameter Type`: Flag | Toggle | Threshold | Limit | Default | Environment Variable | Other
- `Scenario Type`: Positive | Missing/Unset | Invalid | Edge Case | Cross-parameter
- Apply same type colour coding as Sheet 4 (`Scenario Type` column):
  - Positive → green `E2EFDA`
  - Missing/Unset → orange `FCE4D6`
  - Invalid → red `FFC7CE`
  - Edge Case → yellow `FFF2CC`
  - Cross-parameter → purple fill `EAD1DC`

---

### Sheet 6 — Unit Tests (Negative Flows)

```
Columns: # | Scenario | Input | Expected Output | Developer Test Name | Pass/Fail/NA
```

- `Pass/Fail/NA` column: leave blank (for human fill-in). Width 15, centre-aligned.
- `Developer Test Name`: use camelCase naming convention derived from the scenario (e.g., `shouldReturnErrorWhenMandatoryFieldIsMissing`).
- Bold the column headers; freeze row 1.
- Add data validation dropdown to `Pass/Fail/NA` column:
  ```python
  from openpyxl.worksheet.datavalidation import DataValidation
  dv = DataValidation(type="list", formula1='"Pass,Fail,NA,Blocked"', allow_blank=True)
  ws.add_data_validation(dv)
  dv.sqref = f"F2:F{last_row}"
  ```

---

### Title Tab Styling

Set each sheet tab colour:
```python
tab_colors = {
    "Introduction":          "1F3864",
    "Test Items":            "2E75B6",
    "Use Cases":             "70AD47",
    "Test Scenarios":        "ED7D31",
    "Config Validation":     "7030A0",
    "Unit Tests - Negative": "C00000",
}
for name, color in tab_colors.items():
    wb[name].sheet_properties.tabColor = color
```

---

### Save and Validate

```bash
python /path/to/script.py
python /mnt/skills/public/xlsx/scripts/recalc.py "<output_path>"
```

Where `<output_path>` is the same cross-platform path computed above
(`os.path.join(os.path.expanduser("~"), ".claude", "outputs", f"STP_{feature_name}.xlsx")`).

Check the recalc output JSON:
- If `status` is `errors_found` → fix the identified cells and re-run.
- If `status` is `success` → proceed to Step 5.

---

## Step 4c: Build and Publish the Confluence STP Page

After the Excel workbook is generated (Step 4 complete), build a Confluence page that mirrors the
following layout and publish it to the `space_key` / `parent_page_id` captured in Step 0b. This reuses
the same derived data (Introduction, Use Cases, Test Scenarios, Config Validation, Unit Tests) — do not
re-derive anything.

### Page title

```
<FeatureName> - STP
```

Use the same `feature_name` value used for the Excel filename (spaces restored, not underscored).

### Page body sections, in order

1. **Introduction (Purpose):** one paragraph, same content as Sheet 1 `Purpose`.
2. **Business requirements:** one short paragraph summarising the business need (derive from the spec's
   opening/summary — this is usually a one-line restatement of the feature's purpose from the caller's
   perspective).
3. **Related tickets table** — columns `Ticket | Description | Status`. Populate rows only if ticket
   references (Jira keys, links) were found in the spec source; otherwise leave a single placeholder row
   with `Ticket = "TBD"` and a note that links should be added once available. Never invent ticket IDs.
4. **Spec link:** a single line linking to the spec source captured in Step 5 (Confluence URL / Jira
   ticket / uploaded filename / "User-provided text (pasted)").
5. **Use Cases to be tested table** — this is the **non-unit-test** scenario table. See "Non-Unit-Test
   Table Format" below.
6. **Unit testing to be filled by developer table** — see "Unit Test Table Format" below.
7. **STD link (test-management tool):** placeholder line, e.g. `TBD — add STD/test-management link once created.`
8. **Dependencies table** — columns `Dependency | Action item | Responsibility`. Leave blank/placeholder rows unless the spec names explicit dependencies.
9. **Estimations:** placeholder value, e.g. `TBD`.
10. **Professional team table** — columns `Title | Name`, rows for `QA | PM | SA | Integration | PS Development | Core Development`. Leave `Name` blank/`TBD` unless the user has supplied names.
11. **Developed/changed components table** — columns `Component | Release notes link`. Leave blank unless derivable from the spec.
12. **Automation ticket:** placeholder line, e.g. `TBD`.
13. **Important notes:** numbered list, empty placeholder (`1.`) unless there are caveats worth flagging from Step 3 analysis.

Sections 3, 7–9, 11–13 are administrative/tracking fields the specification does not contain — always
render them as clearly marked placeholders (`TBD`) rather than fabricating values. Never invent ticket
numbers, names, or links.

### Non-Unit-Test Table Format (mirrors `Non_unit_test.PNG`)

Columns: `Title | Description | Comment`

- One row per Test Scenario / Config Validation scenario that is **not** already represented in the
  Unit Tests (Sheet 6) table — i.e., partition the full scenario set derived in Step 3d/3e: scenarios
  that map onto a Sheet 6 unit-test row are excluded here and appear only in the Unit Test table instead.
- **Title column:** do NOT use the bare scenario title. Prefix it with the UC number:
  `"<UC-ID>: <Scenario Title>"` (e.g. `"UC-01: Valid accessToken Login Triggers PreSignIn"`).
- **Description column:** a single sentence starting with "Verify..." that states the expected
  behaviour (this is the same content style as the `Then` field of the scenario, phrased as a
  verification statement — matching Sheet 4's Given/When/Then collapsed into one sentence).
- **Comment column:** leave blank for QA annotations, unless Step 3 analysis flagged an open question
  for that scenario (e.g. "to be confirmed with SA").
- Number rows sequentially starting at 1.

### Unit Test Table Format (mirrors `unit_test.PNG`)

Columns: `Use Case | Input | Expected Results | Dev Test name (PASS / FAIL / NA)`

- One row per entry in the Excel Sheet 6 (Unit Tests - Negative) table — same content, renamed columns:
  - `Use Case` = Sheet 6 `Scenario`
  - `Input` = Sheet 6 `Input`
  - `Expected Results` = Sheet 6 `Expected Output`
  - `Dev Test name (PASS / FAIL / NA)` = leave blank for developer fill-in (do not pre-fill with
    `Developer Test Name` camelCase value here — that stays in the Excel workbook only).
- Number rows sequentially starting at 1.
- In the rendered Confluence storage-format XHTML, colour the literal words `PASS` (green), `FAIL`
  (red), and `NA` (default/grey) inside the header cell text, matching the reference image.

### Publishing the page

1. If not already resolved, call `mcp__atlassian__getAccessibleAtlassianResources` to obtain the `cloudId`.
2. Build the page body as Confluence storage-format XHTML (tables as `<table><tbody><tr><th>/<td>`, bold
   section headers as `<h2>`/`<strong>`, placeholder text as plain `TBD`).
3. Call `mcp__atlassian__createConfluencePage` with:
   - `cloudId`
   - `spaceKey` = `space_key` from Step 0b
   - `parentId` = `parent_page_id` from Step 0b (omit if none)
   - `title` = `f"{feature_name} - STP"`
   - `body` = the storage-format XHTML built above
4. Capture the full page URL returned by the tool response (`confluence_url`). This is required by
   Steps 5, 5b, and 6.

**If the MCP is unavailable, returns an error, or the space/parent cannot be found:**
> "I generated the STP content but couldn't publish it to Confluence — [error reason]. Here's the page
> content so you can paste it in manually, or let me know if you'd like to retry."
Provide the built XHTML/plain-text content inline, set `confluence_url = "Not published — see note above"`,
and continue to Steps 5–6 with the Excel workbook and log still being produced normally.

---

## Step 5: Confirm Spec Source and Confluence URL in the File

Before presenting the file, write the following metadata to Sheet 1:
- `Spec Source` row:
  - Confluence URL → the full URL
  - Jira ticket → the ticket number and summary
  - File upload → the original filename
  - Pasted text → `"User-provided text (pasted)"`
- `Confluence STP Page` row: the `confluence_url` captured in Step 4c.

---

## Step 5b: Generate the Task-Performed Log

After the Excel workbook is saved and validated (recalc status `success`), write a companion Markdown
log file to the **same** `output_dir` documenting what was done.

**Filename:** `STP_TaskPerformed_<FeatureName>_<Timestamp>.md`
- `<FeatureName>`: same value used for the Excel file (spaces replaced with underscores)
- `<Timestamp>`: `YYYYMMDD_HHMMSS`, generated at write time

Apply the same pre-flight check as Step 4: if the output directory already exists, reuse it; only create
it if missing. Never overwrite a previous run's task log — each run gets its own timestamped file.

```python
from datetime import datetime

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
log_path = os.path.join(output_dir, f"STP_TaskPerformed_{feature_name}_{timestamp}.md")

with open(log_path, "w") as f:
    f.write(f"""# STP Task Log — {feature_name}

**Generated on:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Spec source:** {spec_source}
**Output workbook:** STP_{feature_name}.xlsx
**Confluence STP page:** {confluence_url}

## Tasks Performed
- Collected and extracted the specification ({spec_source})
- Validated specification completeness (missing items requested from user, if any: {missing_items_summary})
- Derived Introduction block (purpose, scope, references)
- Derived Test Items — {in_scope_count} in-scope, {out_scope_count} out-of-scope
- Derived {uc_count} Use Cases
- Derived {scenario_count} Test Scenarios (positive / negative / edge / technical failure)
- Derived {config_count} Configuration Validation scenarios
- Derived {unit_test_count} Unit Test negative-flow rows
- Generated multi-sheet Excel workbook with styling, tab colours, auto-filter, and freeze panes
- Validated workbook via recalc.py — status: {recalc_status}
- Partitioned scenarios into {non_unit_scenario_count} non-unit-test rows and {unit_test_count} unit-test rows for the Confluence page
- Built and published the Confluence STP page to space `{space_key}`{parent_note} — {confluence_url}
""")
```

Populate every `{placeholder}` with the actual values computed during Steps 3–4. Do not leave any
placeholder unfilled or generic.

---

## Step 6: Present the Output

Call `present_files` with the paths to the **two local files** (the Confluence page is a live URL, not
a local file, so it is reported as a link rather than passed to `present_files`):
- `~/.claude/outputs/STP_<FeatureName>.xlsx`
- `~/.claude/outputs/STP_TaskPerformed_<FeatureName>_<Timestamp>.md`

(both resolved per-OS as described in Step 4).

Then tell the user:

> "Your STP has been generated as three artifacts:
>
> **1. Confluence page:** [`<FeatureName> - STP`](<confluence_url>) — published to the space/parent you provided, containing the Introduction, Business requirements, Related tickets, Spec link, the Use Cases to be tested table, the Unit testing table, and the remaining tracking sections (STD link, Dependencies, Estimations, Professional team, Developed/changed components, Automation ticket, Important notes) marked `TBD` where the spec doesn't supply them.
>
> **2. `STP_<FeatureName>.xlsx`** with 6 sheets:
> - **Introduction** — purpose, scope, references, spec source, and the Confluence page link
> - **Test Items** — in-scope and out-of-scope feature list
> - **Use Cases** — end-to-end flows with actors, preconditions, and expected results
> - **Test Scenarios** — all test cases in tabular Given/When/Then format (positive, negative, edge cases)
> - **Config Validation** — every configuration parameter tested across all scenario types
> - **Unit Tests – Negative** — negative-flow unit test table ready for developer handoff
>
> The `Pass/Fail/NA` column in the last sheet has a dropdown (Pass / Fail / NA / Blocked) for execution tracking.
>
> **3. `STP_TaskPerformed_<FeatureName>_<Timestamp>.md`** — a task log summarising exactly what was
> generated and confirming the Confluence page URL, saved in the same output folder (`~/.claude/outputs`).
>
> Let me know if you'd like to add more use cases, adjust priorities, or regenerate with a different scope."

If Confluence publishing failed in Step 4c, replace point 1 above with the failure note and the inline
content, and adjust the closing summary accordingly — do not claim a page was published if it wasn't.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Jira / Confluence MCP unreachable | Inform user and ask to paste the spec text |
| Uploaded PDF is scanned / no text layer | Inform user and ask to paste the spec text |
| Spec too vague (no flows, no actors) | Run Step 2 clarification before generating |
| `recalc.py` reports formula errors | Fix the formula(s) and re-run before presenting |
| Feature name cannot be derived from spec | Ask: "What should I name the STP file? (used as the filename)" |
| openpyxl write fails (permissions, disk) | Report the error verbatim; do not silently skip |
| Output directory already exists | Use it as-is (modify if needed); only create it if missing |
| Confluence space/parent URL cannot be parsed | Ask the user to re-paste the URL or provide the space key directly |
| Confluence page creation fails (permissions, MCP error, duplicate title) | Report the error verbatim, provide the built page content inline, still deliver the Excel + log with `confluence_url = "Not published"` |

---

## Quality Checklist (verify before presenting)

- [ ] Every UC has at least one Positive, one Negative, and one Edge Case scenario
- [ ] Every filtering/threshold rule in the spec has both a "rule satisfied" and "rule not satisfied" scenario
- [ ] Every config parameter found in the spec appears in Sheet 5
- [ ] Every Sheet 5 config parameter has at least: Positive, Missing/Unset, Invalid scenarios
- [ ] Every scenario description in Sheet 5 explicitly names the config parameter
- [ ] No frontend, UI, or caching scenarios appear anywhere
- [ ] Unit test developer names follow camelCase
- [ ] `Pass/Fail/NA` dropdown is applied to Sheet 6
- [ ] `recalc.py` exits with `"status": "success"`
- [ ] All six sheets are present and tab-coloured
- [ ] Output directory was checked before generating the script file (used if present, created if missing)
- [ ] `STP_TaskPerformed_<FeatureName>_<Timestamp>.md` was generated in the same output directory
- [ ] Both the workbook and the task log were passed to `present_files`
- [ ] Confluence page titled `<FeatureName> - STP` was created in the space/parent provided in Step 0b (or a clear failure note was given)
- [ ] Non-unit-test table on the Confluence page uses `"<UC-ID>: <Title>"` as the Title column, not the bare title
- [ ] Every scenario appears in exactly one of the two Confluence tables (non-unit-test or unit-test), never both
- [ ] Confluence page URL was written into Sheet 1 of the Excel workbook and into the task log
- [ ] Confluence page URL was reported to the user in the final summary
