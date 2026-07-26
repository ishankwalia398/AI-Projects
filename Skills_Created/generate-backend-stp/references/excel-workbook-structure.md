# Excel Workbook Structure and Styling

This document contains the detailed implementation specifications for generating the STP Excel workbook.

## Output Directory

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

**Every file this skill produces** — the STP workbook AND the task-performed log — is written to this same `output_dir`. Never write skill output to any other location.

## Sheet Structure

| Sheet # | Sheet Name | Content |
|---------|------------|---------|
| 1 | `Introduction` | Purpose, Scope, References as labelled rows |
| 2 | `Test Items` | Two-column table: In Scope / Out of Scope |
| 3 | `Use Cases` | One row per UC with all UC fields |
| 4 | `Test Scenarios` | One row per scenario across all UCs |
| 5 | `Config Validation` | One row per config parameter × scenario type |
| 6 | `Unit Tests - Negative` | Negative flow unit test table |

---

## Styling Rules (apply to ALL sheets)

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

## Sheet 1 — Introduction

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

## Sheet 2 — Test Items

```
Columns: # | Category | Feature / Component | Notes
```

- Category values: `In Scope` or `Out of Scope`
- Colour-code Category column: green fill (`C6EFCE`, dark green font `006100`) for In Scope; red fill (`FFC7CE`, dark red font `9C0006`) for Out of Scope.
- Number rows sequentially within each category group.

---

## Sheet 3 — Use Cases

```
Columns: UC ID | Title | Description | Actors | Preconditions | Main Flow | Alternate Flows | Postconditions / Expected Result | Notes / Assumptions
```

- One row per use case.
- `Main Flow` and `Alternate Flows` cells: use numbered steps separated by line breaks (`\n`).
- Set row height to `auto` by setting `ws.row_dimensions[row].height = None` (openpyxl default).
- UC ID column: centre-aligned, bold, width 10.

---

## Sheet 4 — Test Scenarios

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

## Sheet 5 — Config Validation

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

## Sheet 6 — Unit Tests (Negative Flows)

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

## Title Tab Styling

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

## Save and Validate

```bash
python /path/to/script.py
```

After generating the workbook, open it in Excel or LibreOffice to verify:
- All sheets are present and properly formatted
- Tab colors are correct
- Data is populated in all expected cells
- Merged cells display correctly
- Auto-filter and freeze panes are active

Where `<output_path>` is the same cross-platform path computed above
(`os.path.join(os.path.expanduser("~"), ".claude", "outputs", f"STP_{feature_name}.xlsx")`).

**Note:** The workbook uses static values only (no formulas), so no formula validation is needed.
