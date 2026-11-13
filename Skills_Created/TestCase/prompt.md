# Task: Create a Claude skill named "TestCases"

## Step 1: Learn the inputs and format
Read any attached Test Case Template, if provided, and treat its columns, headings and order as the fixed structure for every output. If no template is attached, do NOT invent a format. Ask the user to supply one, or to confirm this default column set:
Test Case ID | Module/Feature | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Priority | Type (Functional/Negative/Boundary/etc.) | Requirement/Test Plan Reference

## Step 2: Build the skill
Create a skill named `TestCases` with the behavior below.

### 2.1 Purpose
Generate detailed Test Cases that are consistent with the approved Test Plan and traceable to the specification, PRD or requirements.

### 2.2 Required inputs (BOTH are mandatory)
1. **Test Plan**: Word (.doc/.docx) or PDF, typically the output of the "TestPlan" skill.
2. **Specification / PRD / Requirement document**, in any of these forms:
   - Jira or Confluence URL
   - Files: Word (.doc/.docx), PRD, .md, .txt
   - Text pasted directly in chat
   - Any combination of the above

### 2.3 Missing input
If the Test Plan, the specification, or both are missing, tell the user exactly which one is missing and ask for it BEFORE starting. Do not begin writing test cases with only one of the two.

### 2.4 Unclear or missing information
Never guess, assume or fill gaps with "typical" behavior. Ask the user to clarify, and batch all open questions into one list. If the Test Plan and the specification conflict, don't resolve it yourself. Flag the conflict and ask the user which source takes precedence. Apply the Anti-Hallucination Rules below throughout.

### 2.5 Anti-Hallucination Rules (embed verbatim in the skill)

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

Do NOT put these four headings into the Word/PDF files. Show them in chat for review only. The files contain only the test cases in the agreed format. Where an expected result can't be determined from the sources, the cell says "Insufficient information to determine." and the open question is listed.

### 2.6 Final output
1. Produce the Test Cases in the agreed template/column format.
2. Deliver BOTH a Word file (.docx) and a PDF (.pdf), with identical content.
3. File names: `TestCases_<FeatureName>_<Timestamp>` where `<Timestamp>` is `YYYYMMDD_HHMMSS`. Example: `TestCases_UserLogin_20261113_143000.docx` and `.pdf`.
4. If the feature name can't be determined from the inputs, ask the user.
5. Before delivering, confirm that every in-scope Test Plan item is covered and every test case has a source reference.

### 2.7 Interruption and resume
- After each major stage (inputs received, facts extracted, open questions answered, draft generated, files generated), save progress to a checkpoint file (`TestCases_<FeatureName>_checkpoint.json`) recording the stage reached, extracted facts, open questions with the user's answers, and the draft so far.
- If the session is interrupted, or the user comes back to unfinished test cases, offer two options:
  1. **Resume** from the last completed stage (show a one-line summary of where it stopped).
  2. **Start fresh** (discard the checkpoint).
- Don't continue until the user chooses.

## Step 3: Deliver the skill
Show me the SKILL.md (name, description, instructions) for review before finalizing it. Include a short description that makes the skill trigger on phrases like "create test cases", "write test cases from the test plan", and "test cases for this PRD".