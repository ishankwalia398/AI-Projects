# `generate-stp` Skill — Usage Guide

## What it does

Generates a comprehensive, **backend-only** Software Test Plan (STP) from any product or feature
specification, and produces **three artifacts** in a single run:

1. **A published Confluence page** — titled `<FeatureName> - STP`, containing the Introduction,
   Business requirements, Related tickets, Spec link, a "Use Cases to be tested" table, a "Unit
   testing" table, and the remaining tracking sections (STD link, Dependencies, Estimations,
   Professional team, Developed/changed components, Automation ticket, Important notes).
2. **A multi-sheet Excel workbook** (`STP_<FeatureName>.xlsx`) with 6 tabs: Introduction, Test Items,
   Use Cases, Test Scenarios, Config Validation, and Unit Tests – Negative.
3. **A task-performed log** (`STP_TaskPerformed_<FeatureName>_<Timestamp>.md`) summarising exactly
   what was generated.

**Scope constraint:** covers microservice/backend logic, APIs, and data flows only. It will never
generate frontend, UI, or caching-layer scenarios.

---

## How to trigger it

Just ask naturally — any of these will invoke the skill:
- "Generate an STP for \<feature\>"
- "Create a test plan from this spec"
- "Write STP for MTP-1234"
- "Build a test plan from this Confluence page"
- Or simply paste a spec and say "make a test plan"

---

## What it needs from you

The skill will ask two questions up front before generating anything:

### 1. The specification source (pick one)
| Type | What to provide |
|---|---|
| Confluence URL | Paste the page URL |
| Jira ticket | Provide the ticket number (e.g. `MTP-1234`) |
| PDF or Word file | Upload the document |
| Pasted text | Paste the spec directly into the chat |

If the spec is missing key details (feature name, at least one end-to-end flow, actors/callers, or
pass/fail criteria), it will ask you to fill in the gaps before continuing.

### 2. The Confluence publish destination
Paste the URL of the target Confluence space or a parent page, e.g.:
- Space: `https://<domain>/wiki/spaces/<SPACE>/overview`
- Parent page: `https://<domain>/wiki/spaces/<SPACE>/pages/<PAGE_ID>/<title>`

If you give a space only, the new page is created directly under that space. If you give a specific
page, the new STP page is created as a child of it.

> Note: fields like related tickets, STD link, estimations, professional team names, and automation
> ticket are administrative/tracking data the spec typically doesn't contain. The skill will never
> invent these — it marks them `TBD` on the Confluence page for you to fill in later, unless you've
> already supplied them.

---

## What you get back

### 1. Confluence page — `<FeatureName> - STP`
- **Use Cases to be tested table** (`Title | Description | Comment`): one row per scenario that is
  *not* covered by a unit test. Title is formatted as `"<UC-ID>: <Scenario Title>"` so you always know
  which use case it belongs to.
- **Unit testing table** (`Use Case | Input | Expected Results | Dev Test name (PASS/FAIL/NA)`): one
  row per negative-path unit test, ready for a developer to fill in the pass/fail column.
- Every scenario appears in exactly one of the two tables — never both.
- All other sections (Related tickets, STD link, Dependencies, Estimations, Professional team,
  Developed/changed components, Automation ticket, Important notes) are pre-built with placeholders
  where the spec doesn't supply real values.

### 2. Excel workbook — `STP_<FeatureName>.xlsx`
| Sheet | Content |
|---|---|
| Introduction | Purpose, scope (in/out), references, spec source, generated date, **Confluence page link** |
| Test Items | In-scope vs. out-of-scope features/components |
| Use Cases | End-to-end flows: actors, preconditions, main/alternate flows, expected results |
| Test Scenarios | Given/When/Then rows — positive, negative, edge case, technical failure |
| Config Validation | Every config parameter × scenario type (positive/missing/invalid/edge) |
| Unit Tests – Negative | Negative-flow unit tests with a `Pass/Fail/NA/Blocked` dropdown |

### 3. Task log — `STP_TaskPerformed_<FeatureName>_<Timestamp>.md`
A plain-text summary of what was derived (counts of use cases, scenarios, config checks, unit tests),
the spec source used, and the Confluence page URL — useful as an audit trail per run.

---

## If something goes wrong

| Situation | What happens |
|---|---|
| Jira/Confluence MCP unreachable | You're asked to paste the spec text directly |
| Uploaded PDF has no extractable text (scanned) | You're asked to paste the spec text directly |
| Confluence space/parent URL can't be parsed | You're asked to re-paste it or give just the space key |
| Confluence page creation fails (permissions, MCP error, duplicate title) | The Excel workbook and log are still generated; you get the page content inline to paste in manually, and the Excel/log record `confluence_url = "Not published"` |

---

## Output locations

- Excel workbook and task log: `~/.claude/outputs/` (cross-platform — resolves correctly on
  Windows, macOS, and Linux)
- Confluence page: published live to the space/parent you specified; its URL is included in the
  chat response, the Excel Introduction sheet, and the task log
