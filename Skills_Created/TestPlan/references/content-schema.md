# Plan content JSON (input to build_test_plan.py)

```json
{
  "feature_name": "UserLogin",
  "author": "optional, goes into document properties",
  "sections": {
    "objective":                  { "blocks": [ ... ] },
    "scope":                      { "blocks": [ ... ] },
    "inclusions":                 { "blocks": [ ... ] },
    "test_environments":          { "blocks": [ ... ] },
    "defect_reporting_procedure": { "blocks": [ ... ] },
    "test_strategy":              { "blocks": [ ... ] },
    "test_schedule":              { "blocks": [ ... ] },
    "test_deliverables":          { "blocks": [ ... ] },
    "entry_and_exit_criteria":    { "blocks": [ ... ], "entry_criteria": [ ... ], "exit_criteria": [ ... ] },
    "test_execution":             { "entry_criteria": [ ... ], "exit_criteria": [ ... ] },
    "test_closure":               { "entry_criteria": [ ... ], "exit_criteria": [ ... ] },
    "tools":                      { "blocks": [ ... ] },
    "risks_and_mitigations":      { "blocks": [ ... ] },
    "approvals":                  { "blocks": [ ... ] }
  }
}
```

All 14 section ids are required, and no other ids are allowed. `feature_name` must be letters and digits only (PascalCase, e.g. `UserLogin`), because it goes into the file names.

## Blocks

Every block except `insufficient` needs a `source`: where the content came from, e.g. `"PRD §3.2"`, `"Jira PROJ-12 description"`, `"User answer Q4"`, `"Template – standard practice"`. Sources are not printed in the files. The script rejects blocks without one, so that unsourced content can't reach the output.

| type | fields | renders as |
|---|---|---|
| `paragraph` | `text`, optional `indent` (inches) | plain paragraph |
| `label` | `text` | bold lead-in line, e.g. "Create (POST) Operations:" |
| `bullets` | `items`: strings or `{ "text", "children": [...] }` | `•` list with `o` sub-items |
| `numbered` | `items` (same shape) | `1.` list with `o` sub-items (used by Scope) |
| `table` | `headers`, `rows` (each row the same length as `headers`) | bordered table, bold header row |
| `image` | `path` (absolute, or relative to the JSON file), optional `caption` | picture, 6 inches wide; only for images the user supplied |
| `insufficient` | `question` | **Insufficient information to determine.** + "Open question: …" |

Inside any text, `**bold**` makes a bold run. Write inferred statements with the label `Inference (low confidence):` in the text itself, so the reader sees it.

The working headings (Verified Facts, Missing / Unknown Information, Generated Output, Self-Validation Check) are rejected if they appear in any block. They belong in chat only.

## Example (excerpt)

```json
"inclusions": { "blocks": [
  { "type": "label", "text": "Create (POST) Operations:", "source": "API doc – CreateBooking" },
  { "type": "bullets", "source": "API doc – CreateBooking", "items": [
      "Test the API's ability to create new bookings using valid input data.",
      "Verify that appropriate error responses are returned for invalid or missing data." ] }
] },
"test_schedule": { "blocks": [
  { "type": "paragraph", "text": "Following is the test schedule planned for the project –", "source": "Template – standard practice" },
  { "type": "table", "source": "Template – standard practice", "headers": ["Task", "Dates"], "rows": [
      ["Creating Test Plan", "Insufficient information to determine."],
      ["Test Case Creation", "Insufficient information to determine."] ] },
  { "type": "insufficient", "question": "What are the planned dates and the overall test duration (e.g. number of sprints)?" }
] }
```
