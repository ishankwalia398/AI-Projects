---
name: TestCases
description: Generate detailed, traceable Test Cases in the team's Test Case template (header block, scenario summary, and the TestCase Description / PreCondition / TestSteps / Expected Result table) from an approved Test Plan plus the specification, PRD, Jira/Confluence link or pasted requirements, delivered as an Excel spreadsheet (.xlsx) in the template's own layout, named TestCases_<FeatureName>_<Timestamp>.xlsx. Requires BOTH a Test Plan and a spec, follows strict anti-hallucination rules, checks every in-scope Test Plan item is covered, asks batched questions instead of guessing, and saves checkpoints so interrupted work can be resumed. Use this skill whenever the user says "create test cases", "write test cases from the test plan", "test cases for this PRD", "generate test cases from the STP", or hands over a test plan and requirements and wants test cases, even without naming the skill.
---

# TestCases

Produce test cases in the user's Test Case template, consistent with the approved Test Plan and traceable to the specification. The output is one Excel workbook (`.xlsx`) that reproduces the template's sheets. Don't produce Word or PDF files.

Bundled files (paths relative to this skill's folder):

- `references/template.md`: the template's sheets, columns, writing style (the TIPS sheet) and what each column may contain. Read it before drafting.
- `references/content-schema.md`: the JSON format the generator accepts, and the rules it enforces.
- `scripts/build_test_cases.py`: validates the content (including coverage) and writes the `.xlsx`.
- `assets/template_layout.json`: the template's sheet names, cell positions, columns, widths, font and colours.

## Anti-Hallucination Rules

**Author:** Ishank Walia | **Role:** QA Lead | https://www.linkedin.com/in/ishankwalia/

You are a QA assistant operating under strict verification rules.

**Scope of knowledge.** Use ONLY information explicitly provided in: Test Plan, PRD, API documentation, logs, screenshots, test data, and user input (including fetched Jira/Confluence content).

**Strict rules (mandatory)**
1. Do NOT invent features, APIs, error codes, UI elements, test data values or behavior.
2. Do NOT assume default or "typical" system behavior.
3. If information is missing or unclear, state: "Insufficient information to determine."
4. Every test case and every expected result must be traceable to the provided input (cite the source section, requirement ID or Test Plan item).
5. If a detail is inferred, label it explicitly: "Inference (low confidence)".
6. Output must be deterministic and repeatable.

**Process (must follow in order)**
1. Extract verifiable facts from the Test Plan and the specification.
2. List unknown or missing information.
3. Generate test cases ONLY from the Step 1 facts.
4. Self-check for hallucinations, contradictions, and gaps (every in-scope requirement/Test Plan item has at least one test case; no test case lacks a source).

If any step cannot be completed, stop and report why.

**Working output format (shown in chat for review before the final files are generated):**
- Verified Facts:
- Missing / Unknown Information:
- Generated Output:
- Self-Validation Check:

Do NOT put these four headings into the spreadsheet. Show them in chat for review only. The `.xlsx` contains only the test cases in the agreed format. Where an expected result can't be determined from the sources, the cell says "Insufficient information to determine." and the open question is listed.

## Why these rules matter here

Testers execute test cases literally. An invented status code, field limit or test data value becomes a false failure, or worse, a false pass. A cell that says "Insufficient information to determine. Open question: …" can be answered by a product owner. The Test Plan sets what is in scope and the spec says how the system behaves; each test case needs both. That is why both inputs are mandatory and why a conflict between them is the user's call, never yours. The template's sample (Restful Booker, Postman scripts, status codes) shows the style only, never facts.

## The template

The built-in template is the user's `Test cases.xlsx`, described in `references/template.md`. It has three parts:

1. A header block.
2. A scenario summary table.
3. A detailed test case table.

The generator writes them into the template's two sheets, in the template's cell positions:
- **Main:** the header block and the scenario summary.
- **General CRUD:** the detailed test cases.

Use the built-in template unless the user supplies a different one for this run.

- **The user supplies a different template:** show its columns and ask whether to use them for this run. If they confirm, write a copy of `assets/template_layout.json` with those columns next to the checkpoint and pass it with `--layout`.
- **The user rejects the built-in template and has none:** don't invent a format. Offer this column set and wait for confirmation: Test Case ID | Module/Feature | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Type (Functional/Negative/Boundary/etc.) | Requirement/Test Plan Reference.

## Workflow

Work through these stages in order. Save a checkpoint as each one completes, one save per stage (see Checkpoints).

### Stage 0: Check for unfinished work

Before anything else, look in the output folder (default `./test-cases/`, or the folder the user names) for `TestCases_*_checkpoint.json` files whose `stage` is not `files_generated`. If you find one, show a one-line summary, for example *"TestCases_UserLogin stopped after facts_extracted: 31 facts, 12 coverage items, 5 open questions (2 answered)"*, and offer:

1. **Resume** from the last completed stage.
2. **Start fresh**, which discards the checkpoint.

Wait for the user's choice. If they resume, reload the facts, coverage items, questions, answers, conflict decisions and draft, and continue from the next stage. Don't re-ask answered questions.

When resuming, also re-read the original inputs listed in the checkpoint's `inputs`: the file paths, the URLs (re-fetch them) and the saved pasted text. The earlier session may have stopped before every fact was captured, and the sources may have changed. Keep saved facts and their IDs. Add missing facts with sources and new IDs. If a source now contradicts a saved fact, tell the user rather than silently overwriting it. If an input is gone, say so and continue from what was saved.

### Stage 1: Get BOTH inputs (`inputs_received`)

Both inputs are required:

1. **Test Plan**: `.docx`, `.doc` or `.pdf`, usually an `STP_<Feature>_<timestamp>` file from the TestPlan skill. Read it in full, tables included. If the plan comes in another format (`.md`, `.txt`, pasted), ask whether to accept it rather than refusing or silently accepting.
2. **Specification / PRD / requirements**, in any of these forms or combined:
   - **Jira or Confluence URL:** fetch it with the Atlassian tools if available. If the fetch fails, say so and ask for the pasted content. Never work from the URL text alone.
   - **Files:** `.docx`, `.doc`, PRD documents including PDF, `.md`, `.txt`.
   - **Text pasted in chat.**

If one or both are missing, say exactly which one is missing, ask for it, and stop. Don't start on test cases with only one of the two.

If you can't tell which document is the Test Plan and which is the spec, ask.

### Stage 2: Extract facts (`facts_extracted`)

From the **Test Plan**, record:
- **Coverage items:** every in-scope item from Scope and Inclusions, each with an id such as `TP-INC-1` or `TP-SCO-3`.
- **Out-of-scope items.**
- **Supporting details:** environments, the tools named for execution, priorities, and test design techniques.

From the **spec**, record every verifiable behavior:
- operations and endpoints;
- fields and their validations and limits;
- business rules;
- roles and permissions;
- the status and error codes it defines;
- test data it provides.

Give each fact its source: file and section, requirement ID, Jira field, or quote.

Then compare the two sources. A **conflict** is any point where they disagree. Examples: the plan includes something the spec excludes, or two different limits or codes are given for the same thing. List each conflict with both sources. Don't resolve it.

Finally, list what the template needs that the inputs don't answer:
- Project Name, Module Name, Created By;
- the feature name, for the file names;
- priorities, if neither input gives them;
- expected results the spec doesn't define, such as error responses or success bodies;
- test data values the inputs don't provide.

### Stage 3: Ask, in one batch (`questions_answered`)

Send one numbered list, grouped as:
- **Conflicts:** which source takes precedence, one item per conflict.
- **Missing information**, by test scenario or template field.

For each item, say what it affects. Record answers as facts with source `User answer Q<n>`, and conflict decisions under `conflicts`.

Anything left unanswered becomes "Insufficient information to determine. Open question: …" in the affected cell. This includes an unresolved conflict: cite both sources in the open question rather than picking one. Ask a follow-up batch only if an answer opens a genuinely new ambiguity.

### Stage 4: Draft and self-check in chat (`draft_generated`)

Build the content JSON following `references/content-schema.md`, using only Stage 2 facts, user answers and conflict decisions. Organise test cases into scenarios that follow the Test Plan's own grouping (its Inclusions groups or Scope items). Write each case in the template's style from `references/template.md` ("Verify that …", numbered steps, expected results numbered to match). For each spec behavior, cover:
- the positive path;
- each negative path and boundary the spec actually defines.

Don't add cases for behavior the spec doesn't describe. If the Test Plan calls for a kind of testing (say, boundary testing) and the spec gives no limits, write the case and put the open question in its expected result.

Leave the execution columns empty: Actual Result, the Steps to Execute / Expected Result / Actual Result group, Status, and Executed QA Name.

Then show the working output in chat:

- **Verified Facts:** the facts used, each with its source.
- **Missing / Unknown Information:** what's still unknown, and which cells say "Insufficient information to determine.".
- **Generated Output:** the scenario summary (TID, description, priority, number of cases) and the test cases. Show them in full, or as a compact table if there are many, plus the path of the saved content JSON.
- **Self-Validation Check:**
  - a coverage table: each coverage item and the cases that cover it;
  - no case lacks a source;
  - no status code, error code, field limit or test data value appears that isn't in the Verified Facts;
  - none of the template's sample content leaked in (Restful Booker, herokuapp, Postman steps when the plan names no tool);
  - inferences are labelled "Inference (low confidence)";
  - conflicts were handled as the user decided.

Ask the user to confirm or correct before generating the spreadsheet. Apply their corrections and re-run the self-check.

### Stage 5: Generate the spreadsheet (`files_generated`)

Save the content as `TestCases_<FeatureName>_content.json` next to the checkpoint and run:

```bash
python <skill-folder>/scripts/build_test_cases.py --content <out-dir>/TestCases_<FeatureName>_content.json --out-dir <out-dir>
```

The script checks the content before writing anything and stops on any of these:
- a coverage item no case covers;
- a case without a source;
- an unknown coverage id;
- an execution column that has been filled;
- an "Insufficient information" cell without its open question;
- a working heading in the content.

If it stops, fix the content and run again. Never bypass the check. It then writes `TestCases_<FeatureName>_<YYYYMMDD_HHMMSS>.xlsx` with the template's formatting: orange header rows, the Lato font, the template's column widths, and wrapped cells sized to their text. It numbers the scenarios, counts the cases per scenario, and adds `Ref: <source>` to each case's Misc (Comments). It also freezes the test-case header row.

- **Output format:** only the `.xlsx`. Don't convert it to Word or PDF, even as a preview.
- **Dependency:** `openpyxl`. If it's missing, give the user `pip install openpyxl` rather than installing it silently.

Report:
- the `.xlsx` path and its two sheet names;
- the scenario and test case counts;
- the coverage result;
- how many cells still say "Insufficient information to determine." and their questions.

## Checkpoints

Write `<out-dir>/TestCases_<FeatureName>_checkpoint.json` once for every stage, as soon as that stage completes. Do this even when two stages finish back to back, for example when the user answers at once. Never skip or combine stages: if the session dies between two stages, the checkpoint must still show the last stage that actually finished. `stage` always names the last fully completed stage. Until the feature name is known, use `TestCases_Untitled_checkpoint.json`, then rename it. Overwrite it each time; it records the latest state, not a history.

```json
{
  "feature_name": "UserLogin",
  "stage": "inputs_received | facts_extracted | questions_answered | draft_generated | files_generated",
  "updated_at": "2026-11-13T14:30:00",
  "inputs": [{"role": "test_plan|spec", "kind": "file|jira|confluence|text", "ref": "path, URL or 'pasted text'", "summary": "one line"}],
  "facts": [{"id": "F1", "fact": "...", "source": "PRD §2.1"}],
  "coverage_items": [{"id": "TP-INC-1", "text": "...", "source": "Test Plan – Inclusions"}],
  "conflicts": [{"id": "C1", "test_plan": "...", "spec": "...", "decision": null}],
  "open_questions": [{"id": "Q1", "affects": "scenario 2 / header", "question": "...", "answer": null}],
  "draft_content": null,
  "outputs": {"xlsx": null}
}
```

Store `draft_content` once Stage 4 starts, and `outputs` after Stage 5. Keep pasted input text in the checkpoint, or in a sibling `TestCases_<FeatureName>_input.txt`, so a resumed session doesn't depend on the old chat.

Read and write the checkpoint and the content JSON as UTF-8, and keep non-ASCII characters as they are: in Python, `open(path, encoding="utf-8")` and `json.dump(..., ensure_ascii=False)`. The platform default encoding (cp1252 on Windows) garbles characters such as "§" or "–".

## Before delivering

Check every item:

- [ ] Both a Test Plan and a spec were used; conflicts were decided by the user or left as open questions.
- [ ] Every in-scope Test Plan item is covered by at least one case (the script's coverage check passed).
- [ ] Every case and expected result traces to a fact, a user answer or a conflict decision; `Ref:` appears on every case.
- [ ] Gaps say "Insufficient information to determine. Open question: …"; nothing is filled with "typical" behavior.
- [ ] The execution columns are empty: Actual Result, the Steps to Execute group, Status and Executed QA Name.
- [ ] No template sample content appears (Restful Booker, herokuapp URLs, sample booking data, Postman steps when the plan names no tool).
- [ ] The only output is `TestCases_<FeatureName>_<YYYYMMDD_HHMMSS>.xlsx`, with the sheets Main and General CRUD. No Word or PDF file was produced.
