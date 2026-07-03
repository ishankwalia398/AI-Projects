# `generate-backend-testcases` Skill — Usage Guide

## What it does

Generates detailed, traceable, **backend-only** test cases from two source documents: a **Test Plan**
(the scenarios to cover) and a **Product/Feature Specification** (the source of truth for business
logic, APIs, and flows). Every test case is broken into numbered steps, preconditions are labelled
explicitly, and nothing is generated unless it can be traced back to the specification.

Output is a **single two-sheet Excel workbook** plus a companion task log — never plain text or
markdown.

**Scope constraints:**
- Covers backend logic, microservices, REST/GraphQL APIs, databases, event flows, integrations, and
  business rules only. It will never generate frontend, UI, browser, or caching test cases.
- **Unit Test scenarios are always silently excluded.** They're filtered out before generation and
  never appear anywhere in the output or in the completion message.

---

## How to trigger it

Just ask naturally — any of these will invoke the skill:
- "Generate test cases from this STP"
- "Create test cases from STP"
- "Write test cases for \<feature\>"
- "Generate backend test cases"
- Or provide a Test Plan and ask for test case coverage

---

## What it needs from you

The skill asks for two documents, in this order:

### 1. The Test Plan (the scenarios to cover)
| Type | What to provide |
|---|---|
| Excel / CSV | Upload the `.xlsx` or `.csv` file |
| Confluence URL | Paste the page URL |
| PDF | Upload the document |
| Word (`.docx`) | Upload the document |
| Pasted text | Paste the content directly — you'll also be asked what to name the output file |

From the Test Plan, every scenario is extracted with its original name, numbering, and hierarchy
preserved exactly (never renamed or reordered). **Unit Test scenarios are then silently discarded** —
anything labelled "Unit Test"/"UT", testing a single function/class in isolation, or validating
internal implementation rather than an API contract or business flow. If it's ever unclear whether a
scenario is a unit test, you'll be asked before it's excluded.

### 2. The Product/Feature Specification (the source of truth)
| Type | What to provide |
|---|---|
| Confluence URL | Paste the page URL |
| Jira ticket | Provide the ticket number (e.g. `MTP-1234`) |
| PDF | Upload the document |
| Word (`.docx`) | Upload the document |
| Pasted text | Paste the content directly |

If the specification is missing business flows, API contracts, business rules, or error-handling
detail, you'll be asked to fill in the gaps before test cases are generated. If any eligible scenario
references a flow, API, or rule that isn't documented anywhere in the spec, the skill stops and asks
rather than inventing behavior.

---

## What you get back

### 1. Excel workbook — `<TestPlanName>_Backend_TestCases.xlsx`

| Sheet | Content |
|---|---|
| Backend Test Cases | Every eligible scenario broken into `TC_0001`, `TC_0002`, … test cases, one row per step, with `Scenario_Name`, `TC_Name`, `TC_Description`, `Step_Name`, `Step_Description`, and `Expected_Result`. Precondition steps are highlighted yellow; each test case's first row is highlighted light green and its TC-level columns are merged vertically for easy reading. |
| Coverage Summary | Test Plan and Specification sources, total scenarios found, Unit Test scenarios excluded (count only — never listed), eligible scenarios processed, total test cases and steps generated, per-scenario TC counts, and any documentation gaps/assumptions flagged during generation. |

For every eligible scenario, at minimum a **positive**, an **invalid-input negative**, a **business-rule-failure negative**, and an **integration/dependency-failure** test case are generated — plus additional cases for anything in the spec covering auth, retries, event/message flows, data transformation, boundary values, concurrency, or logging/auditing.

### 2. Task log — `TestCases_TaskPerformed_<TestPlanName>_<Timestamp>.md`
A plain-text summary of what was done: sources used, scenario filtering counts (total → excluded →
eligible), test case/step counts, and confirmation that the workbook passed validation — useful as an
audit trail per run.

---

## If something goes wrong

| Situation | What happens |
|---|---|
| Jira/Confluence MCP unreachable | You're asked to paste the content directly |
| Uploaded PDF has no extractable text (scanned) | You're asked to paste the content directly |
| Excel/CSV file can't be parsed | You're asked to paste the scenarios as text instead |
| A scenario references an undocumented API or flow | The skill stops and asks for clarification — it never invents behavior |
| It's unclear whether a scenario is a Unit Test | You're asked before it's excluded |
| Output file name can't be derived | You're asked what to name the output file |

---

## Output location

Both the Excel workbook and the task log are saved to `~/.claude/outputs/` (cross-platform — resolves
correctly on Windows, macOS, and Linux) and delivered to you at the end of the run.
