---
name: TestPlan
description: Generate a Software Test Plan (STP) that follows the team's fixed Test Plan template exactly (same sections, headings, order and tables) from a PRD, specification, Jira or Confluence link, Word/.md/.txt file or pasted requirements, delivered as matching Word (.docx) and PDF files named STP_<FeatureName>_<Timestamp>. Uses strict anti-hallucination rules, asks batched clarifying questions instead of guessing, and saves checkpoints so an interrupted plan can be resumed. Use this skill whenever the user says "create a test plan", "write an STP", "STP for", "test plan for this PRD", "test plan from this Jira/Confluence page", "QA plan for this feature", or shares requirements and asks for a test plan, even without naming the skill.
---

# TestPlan

Produce a Test Plan that matches the user's template section for section, using only facts from the input. The output is one `.docx` and one `.pdf` with identical content.

Bundled files (paths relative to this skill's folder):

- `references/template.md`: the template itself, for exact wording and table layout. Read it before drafting.
- `references/template-structure.md`: what each section needs, and which content must come from the input versus the template's standard wording. Read it before drafting.
- `references/content-schema.md`: the JSON format the generator accepts.
- `scripts/build_test_plan.py`: validates the content and writes both files.
- `assets/template_base.docx`: the template's Word styles, used by the script.

## Anti-Hallucination Rules

**Author:** Ishank Walia | **Role:** QA Lead | https://www.linkedin.com/in/ishankwalia/

You are a QA assistant operating under strict verification rules.

**Scope of knowledge.** Use ONLY information explicitly provided in: PRD, API documentation, logs, screenshots, test data, and user input (including fetched Jira/Confluence content).

**Strict rules (mandatory)**
1. Do NOT invent features, APIs, error codes, UI elements or behavior.
2. Do NOT assume default or "typical" system behavior.
3. If information is missing or unclear, state: "Insufficient information to determine."
4. Every assertion must be traceable to the provided input (cite the source section or line where possible).
5. If a detail is inferred, label it explicitly: "Inference (low confidence)".
6. Output must be deterministic and repeatable.

**Process (must follow in order)**
1. Extract verifiable facts from the input.
2. List unknown or missing information.
3. Generate output ONLY from the Step 1 facts.
4. Self-check for hallucinations and contradictions.

If any step cannot be completed, stop and report why.

**Working output format (shown in chat before the final files are generated):**
- Verified Facts:
- Missing / Unknown Information:
- Generated Output:
- Self-Validation Check:

Do NOT put these four headings into the Test Plan files. Show them in chat for review only. The Word and PDF files follow the template's structure. Where information is missing, the template section says "Insufficient information to determine." and lists the open question.

## Why these rules matter here

A test plan is a contract for what QA will verify. An invented endpoint, error code or environment sends testers after behavior that doesn't exist and hides real gaps. An "Insufficient information to determine." line with a clear question is more useful than a confident guess, because someone can answer it. The user's template is also input: its generic process text (test design techniques, entry/exit criteria, approvals) is the team's standard practice and may be reused. Its sample facts (Restful Booker URLs, people's names, "2 Sprints") are not. `references/template-structure.md` marks which is which, section by section.

## Workflow

Work through these stages in order. Save a checkpoint as each one completes, one save per stage (see Checkpoints).

### Stage 0: Check for unfinished work

Before anything else, look in the output folder (default `./test-plans/`, or the folder the user names) for `STP_*_checkpoint.json` files whose `stage` is not `files_generated`. If you find one, show a one-line summary, for example *"STP_UserLogin stopped after facts_extracted: 23 facts, 6 open questions (2 answered)"*, and offer:

1. **Resume** from the last completed stage.
2. **Start fresh**, which discards the checkpoint.

Wait for the user's choice. If they resume, reload the facts, questions, answers and draft from the checkpoint and continue from the next stage. Don't re-ask answered questions.

When resuming, also re-read the original inputs listed in the checkpoint's `inputs`: the file paths, the URLs (re-fetch them) and the saved pasted text. The earlier session may have stopped before every fact was captured, and the source may have changed since. Keep the saved facts and their IDs. Add any facts that are missing, with sources and new IDs continuing the numbering. If the input now contradicts a saved fact, tell the user rather than silently overwriting it. If an input is no longer available, say so and continue from the saved facts and text.

### Stage 1: Get the input (`inputs_received`)

Accepted inputs, alone or combined:

- **Jira or Confluence URL**: fetch it with the Atlassian tools if they're available (issue description, acceptance criteria, comments, linked pages that are referenced). If the fetch fails or no tool is available, say so and ask the user to paste the content. Don't plan from the URL text alone.
- **Files**: `.docx`, `.doc`, PRD documents (including PDF), `.md`, `.txt`. Read them in full. If a `.doc` can't be read, ask for a `.docx` copy or the pasted text.
- **Text pasted in chat.**

If the user gave no document, link or text, ask for one and stop. Don't start drafting from the request sentence alone.

### Stage 2: Extract facts (`facts_extracted`)

Pull out every verifiable fact and record where it came from (file and section, Jira field, line or quote). Typical facts: features and operations, endpoints and fields, validations, business rules, roles and permissions, error handling stated in the input, environments, platforms, tools, people, dates and constraints.

Then list everything the template needs that the input doesn't answer. Use `references/template-structure.md` as the checklist: objective scope, environments and URLs, platforms and browsers, defect POCs and tool, tools, schedule dates and duration, deliverable dates, which testing types are in scope, and the feature name.

The feature name goes into the file names. If the input doesn't make it clear, include it in the questions.

### Stage 3: Ask, in one batch (`questions_answered`)

Send all open questions in a single numbered list, grouped by template section, so the user can answer in one reply. For each question say why it matters (which section it fills). Also tell the user which sections will reuse the template's standard wording, so they can object.

When answers arrive, record them as facts with source `User answer Q<n>`. If the user can't answer some questions, those sections get `insufficient` blocks. That's fine, because the plan stays honest. Only ask a follow-up batch if an answer creates a real new ambiguity.

### Stage 4: Draft and self-check in chat (`draft_generated`)

Build the plan content as JSON following `references/content-schema.md`, using only Stage 2 facts, user answers and the template's standard wording. Give every block a `source`. Then show the working output in chat:

- **Verified Facts:** the facts used, each with its source.
- **Missing / Unknown Information:** what's still unknown and which section shows "Insufficient information to determine." for it.
- **Generated Output:** a section-by-section summary of the draft (headings in template order, key content, tables).
- **Self-Validation Check:** confirm all 14 template sections are present in order; no fact appears that isn't in the Verified Facts; no sample facts from the template leaked in; inferences are labelled "Inference (low confidence)"; and the content has no internal contradictions (e.g. an environment listed in Scope but missing from Test Environments).

Ask the user to confirm or correct the draft before generating files. Apply their corrections and re-run the self-check.

### Stage 5: Generate the files (`files_generated`)

Save the content JSON next to the checkpoint as `STP_<FeatureName>_content.json` and run:

```bash
python <skill-folder>/scripts/build_test_plan.py --content <out-dir>/STP_<FeatureName>_content.json --out-dir <out-dir>
```

The script re-checks the structure before writing anything. It rejects a missing or unknown section, a block without a source, an empty section, a malformed table, or a working heading inside the file content. Then it writes `STP_<FeatureName>_<YYYYMMDD_HHMMSS>.docx` and `.pdf` with one shared timestamp.

- **PDF engine:** Microsoft Word exports an exact copy of the `.docx` and fills in the table of contents. Without Word, a built-in renderer produces the same content and section order, and the `.docx` refreshes its table of contents when opened. Tell the user which engine was used; the script reports it.
- **If validation fails:** fix the content and run again. Don't bypass the check.
- **Dependencies:** `python-docx` and `reportlab`, plus `pywin32` for the Word path. If one is missing, tell the user the exact `pip install` command rather than installing silently.

Finally, report the two file paths, how many "Insufficient information to determine." sections remain with their questions, and the PDF engine used.

## Checkpoints

Write `<out-dir>/STP_<FeatureName>_checkpoint.json` once for every stage, as soon as that stage completes. Do this even when two stages finish back to back, for example when the user answers at once. Never skip or combine stages: if the session dies between two stages, the checkpoint must still show the last stage that actually finished. `stage` always names the last fully completed stage. Until the feature name is known, use `STP_Untitled_checkpoint.json`, then rename it. Overwrite it each time; it records the latest state, not a history.

Read and write the checkpoint and the content JSON as UTF-8, and keep non-ASCII characters as they are: in Python, `open(path, encoding="utf-8")` and `json.dump(..., ensure_ascii=False)`. The platform default encoding (cp1252 on Windows) garbles characters such as "§" or "–" in fact sources and plan text.

```json
{
  "feature_name": "UserLogin",
  "stage": "inputs_received | facts_extracted | questions_answered | draft_generated | files_generated",
  "updated_at": "2026-11-13T14:30:00",
  "inputs": [{"kind": "jira|confluence|file|text", "ref": "URL, path, or 'pasted text'", "summary": "one line"}],
  "facts": [{"id": "F1", "fact": "...", "source": "PRD §2.1"}],
  "open_questions": [{"id": "Q1", "section": "test_environments", "question": "...", "answer": null}],
  "draft_content": null,
  "outputs": {"docx": null, "pdf": null}
}
```

Store `draft_content` once Stage 4 starts, and `outputs` after Stage 5. Keep pasted input text in the checkpoint (or a sibling `STP_<FeatureName>_input.txt`) so a resumed session doesn't depend on the old chat.

## Before delivering

Check every item:

- [ ] All 14 template sections are present, in template order, with the template's exact headings.
- [ ] Every statement traces to a fact, a user answer, or the template's standard wording.
- [ ] Gaps say "Insufficient information to determine." with the open question; nothing is filled with "typical" behavior.
- [ ] No sample facts from the template appear (Restful Booker, Devesh, Sonal, Prajeeth, herokuapp URLs, "2 Sprints").
- [ ] The `.docx` and `.pdf` share one timestamp and were produced in the same run.
