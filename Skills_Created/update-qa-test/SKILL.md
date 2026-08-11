---
name: update-qa-test
description: Automate updating or fine-tuning a test for manual QA from a Jira ticket. Use this when the user says "update test for MTP-XXXX", "automate ticket MTP-XXXX", or provides a Jira ticket number to implement.
argument-hint: [jira-ticket-number]
disable-model-invocation: true
allowed-tools: mcp__atlassian__getJiraIssue, mcp__atlassian__getAccessibleAtlassianResources, mcp__atlassian__search, mcp__atlassian__addCommentToJiraIssue, mcp__atlassian__getConfluencePage, mcp__atlassian__getTransitionsForJiraIssue, mcp__atlassian__transitionJiraIssue, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_wait_for, mcp__playwright__browser_close, mcp__github__get_pull_request, mcp__github__get_pull_request_comments, mcp__github__get_pull_request_reviews, Read, Glob, Grep, Bash, Write, Edit, Task, AskUserQuestion, Skill
---

## Goal
Automate the full workflow for updating or fine-tuning a Java test based on a Jira ticket.
If a Postman collection is provided instead of (or alongside) a Jira ticket, delegate to the `postman-to-code` skill.

---

## Pre-Step: Set Up the Ticket Worktree

This runs before everything else, every time.

### Sub-Step A: Derive Ticket ID and Worktree Path

From `$ARGUMENTS`, determine `<TICKET_ID>` and `<WORKTREE_PATH>`:

- `MTP-{number}` (e.g., `MTP-7141`) → `<TICKET_ID>` = `MTP-{number}`, `<WORKTREE_PATH>` = `../worktrees/MTP-{number}`
- Argument already contains `_BEO-` (e.g., `11_4_0_BEO-17234`) → use as-is for `<TICKET_ID>`, `<WORKTREE_PATH>` = `../worktrees/<TICKET_ID>`
- Bare `BEO-{number}` with no version prefix → ask via `AskUserQuestion`:
  > "This is a BEO ticket. What version prefix should I use? (e.g., for branch `11_4_0_BEO-17234`, the prefix is `11_4_0`)"
  Then compose `<TICKET_ID>` = `{prefix}_BEO-{number}`, `<WORKTREE_PATH>` = `../worktrees/<TICKET_ID>`.

Store `<TICKET_ID>` and `<WORKTREE_PATH>` — these are used throughout the entire workflow.

---

### Sub-Step B: Check for Existing Worktree (Resume Detection)

Run: `git worktree list`

From the output:
- The **first line** is always the main repo worktree. Extract its path and store it as `<MAIN_REPO_PATH>` (e.g., `C:/Users/yehudit.nadav/IdeaProjects/BE-Automation-PS`). This is used in Sub-Steps C and D.
- Scan all lines for one whose path matches `<WORKTREE_PATH>` or whose branch indicator shows `[<TICKET_ID>]`.

**Case 1 — Worktree found:**
- Inform the user:
  > "Found existing worktree for `<TICKET_ID>` at `<WORKTREE_PATH>`. Resuming from where we left off.
  >
  > Tip: type `/rename <TICKET_ID>` in this chat to label this session — handy if you're juggling multiple tickets."
- Skip Sub-Steps C and D entirely.
- All subsequent Bash commands must be run from inside `<WORKTREE_PATH>`.
- Proceed directly to Step 0.

**Case 2 — No worktree found:**
- Proceed to Sub-Step C.

---

### Sub-Step C: Pull Latest Master and Create the Worktree (fresh start only)

All commands in this sub-step must use `git -C <MAIN_REPO_PATH>` (the path extracted in Sub-Step B). **Never run `git checkout master` from the current working directory** — the skill may be running inside a secondary worktree where `master` is already locked, and git will reject the checkout.

1. Fetch latest master via the main repo (do NOT use `pull` — the main repo may be on a non-master branch and a pull would merge master into it):
   ```bash
   git -C <MAIN_REPO_PATH> fetch origin master
   ```
   If the fetch fails: stop and show the error to the user. Do not proceed.

2. Create the worktree and branch together, branching from `origin/master`:
   ```bash
   git -C <MAIN_REPO_PATH> worktree add -b <TICKET_ID> ../worktrees/<TICKET_ID> origin/master
   ```
   **If this fails because `<TICKET_ID>` already exists as a local branch** (but has no worktree):
   ```bash
   git -C <MAIN_REPO_PATH> worktree add ../worktrees/<TICKET_ID> <TICKET_ID>
   ```
   (omit `-b` and `origin/master` when the branch already exists; use both only for a new branch)

3. Inform the user:
   > "Worktree created at `<WORKTREE_PATH>`. You can open this directory as a separate IntelliJ project window to keep this ticket isolated from other in-progress work.
   >
   > Tip: type `/rename <TICKET_ID>` in this chat to label this session — handy if you're juggling multiple tickets."

4. All subsequent Bash commands must be run from inside `<WORKTREE_PATH>`.

---

### Sub-Step D: Self-Update Check (fresh start only — skip on resume)

Run via the main repo (not the current working directory):
```bash
git -C <MAIN_REPO_PATH> diff HEAD@{1} HEAD -- .claude/skills/update-qa-test/SKILL.md
```

- **If this file changed** (diff output is non-empty):
  - Inform the user:
    > "Note: the `update-qa-test` skill was updated in the latest pull on master. The current session is already running the version from this branch — no restart needed."
  - Proceed to Step 0.

- **If this file did NOT change**: proceed to Step 0.

---

## Working Directory Rule (applies to ALL steps after Pre-Step)

From Step 0 onward, every Bash command — file reads/edits, Maven builds, git commits, git push — must run from inside `<WORKTREE_PATH>`. Use `cd <WORKTREE_PATH> && <command>` for each command, or prepend the absolute path explicitly.

---

## Step 0: Detect Postman Collection (runs before everything else)

Before touching Jira or the codebase, check whether a Postman collection file was provided directly.

**Case A — `$ARGUMENTS` looks like a file path (ends with `.json`):**
1. Verify the file exists
2. Confirm with the user via `AskUserQuestion`:
    - Question: "I see you provided a Postman collection file: `[filename]`. Should I convert it to a Java TestNG test?"
    - Options: "Yes, convert it" / "No, treat the argument as a Jira ticket number instead"
3. If confirmed → invoke the `postman-to-code` skill: `Skill("postman-to-code", args="[full/path/to/file.postman_collection.json]")`
4. **Stop here.**

**Case B — `$ARGUMENTS` looks like a Jira ticket number:**
- Proceed to Step 1. After reading the ticket, Step 1 will check for Postman collection references and ask the user if needed (see Step 1b below).

**Do NOT scan the working directory or guess — always use an explicit path provided by the user.**

---

## Step 1: Retrieve the Jira Ticket

1. Call `mcp__atlassian__getAccessibleAtlassianResources` to get the cloudId
2. Call `mcp__atlassian__getJiraIssue` with issueIdOrKey = `$ARGUMENTS` and `fields: ["summary", "description", "comment", "attachment", "status", "reporter"]` to retrieve the ticket including all comments
3. Extract: summary, description, acceptance criteria, any URLs/links, and all comment bodies (sorted oldest to newest — later comments may override earlier ones)
4. Extract the reporter's email from `fields.reporter.emailAddress` and store it as `<QA_OWNER_EMAIL>`. This is used in Step 11a to tag the PR description for GitHook notifications.

### Step 1a: Check Ticket Status

Immediately after retrieving the ticket, check its status:

- **If the status is "Closed", "Done", or any terminal state** (statusCategory `done`):
  - Inform the user:
    > "This ticket (`$ARGUMENTS`) is already **Closed**. No implementation is needed. Cleaning up the worktree now."
  - Remove the worktree and branch that were created in the Pre-Step:
    ```bash
    git -C <MAIN_REPO_PATH> worktree remove ../worktrees/<TICKET_ID>
    git -C <MAIN_REPO_PATH> branch -d <TICKET_ID>
    ```
  - **Stop here.** Do not proceed to Step 1b or beyond.

- **If the status is Open, In Progress, or any non-terminal state** → proceed to Step 1b.

### Step 1b: Check for Postman Collection Reference in the Ticket

After reading the ticket, scan the description, comments, and attachments for any mention of:
- "Postman", "collection", ".postman_collection", or a Confluence page link that likely contains a collection

**If any such reference is found:**
- Use `AskUserQuestion` to present this message and wait for the user's input:
  > "This ticket references a Postman collection (likely on a Confluence page). Since I can't download it automatically, please:
  > 1. Open the Confluence page linked in the ticket
  > 2. Download the `.postman_collection.json` file from it
  > 3. Provide the full local path to the downloaded file (e.g., `/Users/you/Downloads/MyCollection.postman_collection.json`)"
- Once the user provides the path → invoke the `postman-to-code` skill: `Skill("postman-to-code", args="[user-provided path]")`
- **Stop here** — do not proceed to Step 2.

**If no Postman collection reference is found → proceed to Step 2.**

**If the Jira MCP is unavailable or returns an error (tool not found, connection refused, auth failure, etc.):**
- Stop immediately — do NOT proceed with assumptions
- Inform the user clearly:
  > "The Jira MCP is not reachable. Please either:
  > 1. Fix or re-add the Atlassian MCP in your Claude Code settings (`/mcp` or `~/.claude/settings.json`), then re-run `/update-qa-test $ARGUMENTS`
  > 2. Or paste the ticket title and full description here manually so I can proceed without Jira access."
- Wait for the user's response before continuing

---

## Step 2: Find the Test Class

Search in this priority order:

**A) Ticket contains an explicit class name**
- Look for fully qualified Java class pattern: `com.kaltura.auto.*Tests` or `com.kaltura.auto.*Test`
- If found, use it directly → skip to Step 3

**B) Ticket contains a Difido report URL**
- Look for links containing "difido", "report", or "test-report" in the ticket
- Attempt to use Playwright to navigate to the URL and extract the class

  **If Playwright MCP is unavailable or returns an error:**
    - Do NOT stop the workflow — fall through to the manual prompt below
    - Inform the user:
      > "Playwright MCP is not available, so I can't open the Difido report automatically.
      > Please open the report manually, find the relevant test, click **Test Properties**, and copy the value of the **Class** field (e.g., `com.kaltura.auto.customer.SomeTests`).
      > Paste it here and I'll continue."
    - Wait for the user to provide the class name, then proceed to Step 3

  **If Playwright is available:**
    - Take a snapshot to find the relevant test entry
    - Click "Test Properties" on the matching test
    - Extract the "Class" field value
    - **Immediately close the browser**: call `mcp__playwright__browser_close`
    - If found → proceed to Step 3

**C) Class not found by any method above**
- Ask the user via AskUserQuestion:
  > "Could not automatically find the test class. Please provide the fully qualified class name (e.g., `com.kaltura.auto.customer.SomeTests`)"

---

## Step 3: Confirm the Test Class with User

The user is **not a developer** — avoid showing raw class names. Instead, derive a human-readable test suite name from the class name (e.g., `BouyguesVodSftpParallelIngestTests` → "Bouygues VOD SFTP Parallel Ingest Tests").

Use AskUserQuestion to confirm:
- Question: "I found the test suite **[Human-Readable Name]** for `$ARGUMENTS`. Is this the correct one?"
- Options: Yes (proceed) / No (let user describe the correct test or provide the class name)
- If user provides a different class, use their input

---

## Step 4: Validate Ticket Completeness — Sample Data for Format-Dependent Assertions

Before entering plan mode, scan the ticket requirements for any assertion that depends on the **format or structure of external data** — log entries, notification payloads, API response bodies, event structures.

**Trigger signals to look for:**
- "validate that log contains…" / "assert field X in the log/response equals…"
- "check format of…" / "should match…"
- Any reference to a log system (Coralogix, Elasticsearch, Kibana, Splunk, etc.)
- Any payload field reference (e.g., a nested field name that appears nowhere in existing code)

**For each such requirement, resolve the format in this priority order:**

1. **Ticket has an explicit sample** (log line, JSON snippet, response body excerpt) → use it; proceed to Step 5
2. **Existing code in the test class already parses this format** → infer the format from that implementation; proceed to Step 5
3. **Similar validation exists elsewhere in the codebase** (search for the field name or log keyword) → infer from that; proceed to Step 5
4. **CLAUDE.md or PROJECT_RULES.md documents the format** → use it; proceed to Step 5
5. **None of the above — format is genuinely unknown** → stop and ask the user (in plain language):

   > "Before I write the validation code, I need to see a real example of this log or response format.
   >
   > The ticket asks to validate **[describe the requirement in plain English]**, but I couldn't find an existing example of this format in the codebase or ticket. If I guess the structure, I risk generating code that will never match real logs.
   >
   > Could you:
   > 1. Add a sample log line or response body to the Jira ticket description, then paste it here — OR
   > 2. Paste the sample here directly"

   Wait for the sample before continuing to Step 5.

---

## Step 5: Read & Plan Implementation

1. Locate the Java file using Glob: search for `**/<ClassName>.java`
2. Read the file thoroughly to understand all existing test methods and the overall test flow
3. **Analyze existing patterns** — before planning anything, look for reusable patterns in the class:
    - Shared setup helpers (e.g., a method like `insertAll`, `prepareAsset`, `setupIngest` used by multiple tests)
    - Parameterized or data-provider patterns used across test methods
    - Common assertion chains or validation helpers
    - Any utility/builder method invoked by more than one test

   **If a suitable pattern exists:**
    - The new test MUST follow and reuse it — do not reinvent it
    - Describe the pattern in the plan in plain English (e.g., "Each test calls `insertAll` to prepare the test data — the new test will do the same")

   **If the new test requirement is fundamentally different and cannot follow any existing pattern:**
    - Do NOT silently proceed with a custom approach
    - Use AskUserQuestion to inform the user:
      > "The existing tests in this suite all follow [describe pattern simply, e.g., 'a shared setup step that prepares test data in bulk']. The new scenario from the ticket appears to require a different approach because [plain English reason]. Would you like me to:
      > 1. Proceed with a custom implementation for this test (it will stand alone)
      > 2. Adapt the existing pattern to cover this case (may require minor changes to shared code)
      > 3. Reconsider — you tell me how you want to approach it"
    - Wait for approval before continuing

4. Enter plan mode (use EnterPlanMode) to design the implementation

### CRITICAL — Plan Presentation Rules (non-developer audience)

The user reviewing the plan is a **QA analyst or product person, NOT a developer**. The plan MUST be written entirely in functional and business logic terms. Follow these rules strictly:

**DO:**
- Describe each test scenario in plain English (e.g., "Verify that ingesting an episode with no files and the 'no files' flag set to false is rejected")
- Present the test flow as numbered steps mirroring what a manual tester would do (e.g., "1. Prepare a valid ADIL file for a movie asset", "2. Upload it via SFTP", "3. Wait for the ingest to complete", "4. Verify the asset appears in the catalog with the correct metadata")
- Describe what the expected outcome is in business terms (e.g., "The system should return an error indicating the mandatory field is missing")
- Mention which existing tests are being modified and what changes in their behavior (e.g., "The test `ingestMovieWithNonMandatoryFields` currently checks X — it will now also verify Y")
- Mention any new test scenarios being added and what business case they cover

**DO NOT:**
- Mention Java, classes, methods, annotations, or any code syntax
- Reference framework internals (e.g., `@Test`, `assertion.verify`, `report.log`, builder patterns)
- Use technical jargon like "autowired", "request builder", "TestNG suite XML", "Velocity template"
- Show code snippets of any kind in the plan

5. Wait for user approval via ExitPlanMode before writing any code

---

## Step 6: Implement

After plan approval, implement following CLAUDE.md patterns:
- Extend `AbstractKalturaTest`, use `@Test` annotation
- Use `authorization.getAdminKs().getValue()` — NEVER run admin login directly
- Use `report.log()`, `report.success()`, `report.fail()` for logging
- Use `assertion.verify(new AssertResponseBodyField(...), false)` for assertions
- Use builder pattern for API requests via `phoenix.*` or `tvpApi.*`
- Add test to the appropriate TestNG suite XML in `src/test/resources/testng/`

---

## Step 7: Build Validation

**MANDATORY — do not skip.** After every implementation change, run a local Maven compilation to catch any errors before committing.

Run:
```bash
mvn test-compile -q
```

**If the build succeeds (exit code 0):**
- Inform the user: "Build passed — no compilation errors."
- Proceed to Step 8.

**If the build fails:**
- Before attempting any code fix, check whether the failure could be a caching or environment issue (e.g., stale class files, incremental build inconsistency). If so, retry once with:
  ```bash
  mvn clean test-compile -q
  ```
  If this retry succeeds, inform the user and proceed to Step 8. If it also fails, treat it as a genuine compilation error and continue below.
- Show the compiler error output to the user.
- **Check whether the errors are ALL in files you did NOT modify:**
  Compare the file paths in the error output against the files you edited for this ticket. If every error is in a different file, verify they are pre-existing by running the same build on master:
  ```bash
  git -C <MAIN_REPO_PATH> stash
  mvn test-compile -q 2>&1 | head -40
  git -C <MAIN_REPO_PATH> stash pop
  ```
  - If master also fails with the same errors → they are pre-existing and unrelated to your changes.
  - **MANDATORY — even when all errors are pre-existing:** You must still verify that each file you modified compiles cleanly in isolation. Run a targeted compile against only the files you changed, using the Maven-resolved classpath:
    ```bash
    mvn dependency:build-classpath -q -DincludeScope=test -Dmdep.outputFile=/tmp/cp.txt
    javac -cp "$(cat /tmp/cp.txt):target/test-classes:target/classes" \
          -sourcepath src/test/java \
          src/test/java/com/kaltura/auto/path/to/ModifiedFile.java
    ```
    - If this targeted compile succeeds (exit code 0) → your changes are clean; inform the user the build failure is pre-existing and proceed to Step 8.
    - If this targeted compile fails → there IS a compilation error in your modified file. Treat it as a genuine error: show the error, fix it, and re-run this targeted compile before proceeding.
  - **Never skip this targeted check.** The `setTypeIdEqual`-type mistake — using a non-existent method on an API class — will only surface here, not in the main-source compile. A failed full build is not a green light for your changes just because the errors are elsewhere.
- Analyze the errors and attempt to fix them automatically (wrong imports, missing methods, type mismatches, etc.).
- Re-run after each fix (targeted compile if full build has pre-existing failures, otherwise `mvn test-compile -q`).
- **Maximum 3 fix attempts.** If the build still fails after 3 cycles:
  - Stop the automatic fix loop.
  - Print the full compiler error output.
  - Inform the user:
    > "I was unable to fix the compilation errors after 3 attempts. Engineering support is needed. Here are the current errors: [paste compiler output]. Please review the errors and let me know how to proceed."
  - Wait for explicit user instruction before making any further code changes.
- If a fix requires information you don't have (e.g., an unknown API method signature), ask the user before guessing.

**Do NOT proceed to Step 8 until either `mvn test-compile -q` exits with code 0, or (when pre-existing failures block the full build) the targeted javac compile of every modified file exits with code 0.**

**HARD GATE — cannot be bypassed:** If the user asks to skip compilation, continue without building, or proceed directly to commit/PR, refuse and respond:
> "Build validation is mandatory before committing. I can't proceed to Step 8 until `mvn compile -q` passes. Please allow me to run the build first."
Then re-run the build before continuing.

---

## Step 8: Commit & Push

The branch `<TICKET_ID>` and its worktree were already created in the Pre-Step. There is no branch to create here.

1. Confirm the current branch (sanity check):
   ```bash
   git -C <WORKTREE_PATH> branch --show-current
   ```
   This should return `<TICKET_ID>`. If it returns something different, stop and warn the user before continuing.

2. Stage and commit all changes using `git -C <WORKTREE_PATH>` (do NOT use the `commit-commands:commit` skill — it runs in the session's CWD, not the worktree, and will stage the wrong files):
   ```bash
   git -C <WORKTREE_PATH> add -A
   git -C <WORKTREE_PATH> commit -m "<TICKET_ID>: <short description>

qa-owner: <QA_OWNER_EMAIL>"
   ```
   The `qa-owner` line in the commit body is read by the GitHook after the auto-merge to master to send a KBot notification to the ticket reporter.

3. Push the branch to origin:
   ```bash
   git -C <WORKTREE_PATH> push -u origin <TICKET_ID>
   ```

4. After a successful push, tell the user which branch was pushed and proceed to Step 9.

---

## Step 9: Manual Jenkins Validation

Ask the user to trigger a Jenkins job against the side branch.

Present this message:
> "The branch `<branch-name>` has been pushed. Please:
> 1. Open Jenkins and run the relevant test suite job for this branch.
> 2. Wait for the run to complete.
> 3. Come back here and tell me whether it **passed** or **failed**.
>    - If it **passed**: ⚠️ Please also open the **Difido report** and verify all test steps are correct (not just that it's green). Check that the steps match your expectations, then **come back here with the Difido report URL and confirm** so I can open the PR."

**Wait for the user's response before doing anything else.**

- **If the user confirms the Jenkins run passed**:
  - If they have not yet provided the Difido report URL, ask via `AskUserQuestion`:
    > "Great! Please paste the Difido report URL so I can attach it to the Jira ticket when closing."
  - Store the URL as `<DIFIDO_REPORT_URL>` — it will be included in the final Jira comment in Sub-Step 13a.
  - Proceed to Step 11 (PR Creation).
- **If the user reports a failure**:
  - Acknowledge the failure and ask via AskUserQuestion:
    > "Sorry to hear the run failed. How would you like to proceed?"
    - Option 1 — **Analyze the failure**: paste the Difido report URL and I will investigate the root cause and attempt an automatic fix (proceeds to Step 10).
    - Option 2 — **Explain the existing code**: I will provide a full explanation covering:
      1. **Background** — what the test class does, what scenarios it covers, and how it fits into the overall test suite; and how each test works in plain terms — what steps it performs, what it checks, and what conditions cause it to behave differently (e.g. per environment or configuration)
      2. **Before the change** — what the relevant test(s) looked like and what they verified prior to this ticket
      3. **After the change** — what was added or modified, and what new scenario is now being tested

---

## Step 10: Automatic Failure Analysis & Recovery

This step is entered only when Jenkins or the test run reports a failure.

### 10a: Analyze the Failure

The user will have provided a Difido report URL.

**If a Difido report URL is provided:**
- Use Playwright to navigate to the URL.
- Take a snapshot and locate the failing test(s).
- Click "Test Properties" on each failing test to extract the class name and failure details.
- Navigate to the test log view and extract error messages, stack traces, and assertion failures.
- Close the browser after extracting the needed information.

### 10b: Understand the Root Cause

Categorize the failure before touching any code:
- **Compilation error** (should have been caught in Step 7 — re-run Step 7 fix loop)
- **Test logic error** — assertion mismatch, wrong field name, wrong expected value
- **Test data error** — missing or invalid test data setup
- **Environment/config error** — wrong environment, missing config, network timeout
- **Framework error** — Spring context failure, injection issue

For **environment/config errors**: inform the user that these are not fixable in code. Describe what is misconfigured and what they need to check. Wait for user action.

### 10c: Attempt Automatic Fix

For code-fixable failures (test logic, compilation, data setup):
1. Read the relevant source files to understand the current state.
2. Apply the minimal fix needed to address the root cause.
3. Explain to the user in plain English what was wrong and what was changed (no technical jargon — e.g., "The test was checking for the wrong expected value — the field returns 'ACTIVE' but the test expected 'active'").

### 10d: Re-run Build Validation

After applying the fix, re-run the mandatory build check from Step 7:
```bash
mvn test-compile -q
```

If this fails and the error looks like a caching or environment issue, retry once with `mvn clean test-compile -q` before counting it as a failed attempt.

- If the build passes, inform the user.
- If it fails, apply a fix and retry — up to a **maximum of 3 fix attempts total across Step 10c + Step 10d**.
  If the build still fails after 3 attempts:
  - Stop the automatic fix loop.
  - Print the full compiler error output.
  - Inform the user:
    > "I was unable to fix the compilation errors after 3 attempts. Engineering support is needed. Here are the current errors: [paste compiler output]. Please review and let me know how to proceed."
  - Wait for explicit user instruction before continuing.

### 10e: Re-push and Re-validate

After the build passes:
1. Commit the fix to the same side branch and push.
2. Return to Step 9: ask the user to re-run the Jenkins job on the updated branch.
3. Repeat Steps 9 → 10 until Jenkins passes.

**Do NOT proceed to Step 11 until Jenkins reports a successful run.**

### 10f: CLAUDE.md Retrospective (runs once, after Jenkins finally passes)

Only reached when Jenkins passes after one or more failed attempts through Step 10.

Evaluate whether the failures revealed a pattern worth adding to `CLAUDE.md` as reusable guidance for future runs of this skill.

**Add to CLAUDE.md only if the new guidance is:**
- Broadly reusable across tickets and test classes (not specific to this ticket)
- Clear and actionable — a future reader can apply it without ambiguity
- Deterministic — it produces consistent results, not situational advice
- Concise — one principle per entry
- Not already covered by existing instructions in `CLAUDE.md`

**Good candidates to add:**
- General principles that prevented or caused the failure
- Deterministic workflow steps that should always be followed
- Reusable validation steps that apply across many tests
- Stable debugging patterns that helped identify the root cause
- Preventative best practices that would have avoided the failure

**Do NOT add:**
- Ticket-specific details or references to this ticket number
- Temporary fixes or one-off workarounds
- Business-context-specific logic tied to a single customer or feature
- Highly specific implementation details that won't generalize
- Redundant instructions already expressed elsewhere in `CLAUDE.md`

If no broadly reusable pattern was identified, skip this step silently and proceed to Step 11.

---

## Step 11: PR Creation

Only reached after **all** of the following are true:
- Build validation passed (Step 7 / Step 10d)
- Jenkins validation passed (Step 9)
- Difido report URL collected (Step 9)

### 11a: Compose the PR Description

Before opening the PR, construct the description body as follows:

**First line (always):**
```
> 🤖 This code was generated by the `update-qa-test` skill.
```

**Then append a change summary** written in plain English (no technical jargon). The summary must cover:
- What ticket this implements (ticket number + one-sentence ticket summary)
- What test scenario(s) were added or modified, described as a tester would describe them (e.g., "Added a test that verifies ingesting an episode without mandatory files is rejected with an error")
- Any existing tests that were modified and how their behaviour changed
- Any supporting changes (e.g., "Updated the TestNG suite XML to include the new test")

Keep the summary concise — 3 to 8 bullet points is ideal.

**Example PR description:**
```
> 🤖 This code was generated by the `update-qa-test` skill.

## Summary

- Implements MTP-7141: Verify that VOD ingest rejects episodes missing mandatory file references
- Added test: ingest attempt with no files and `noFiles` flag set to false → system returns an ingest error
- Added test: ingest attempt with `noFiles` flag set to true → system accepts the asset and marks it as file-less
- Updated the Bouygues VOD SFTP suite XML to include both new tests
```

### 11b: Look Up Today's Reviewer

Before opening the PR, determine who is on code-review duty today:

1. Get today's day of the week using Bash: `date +%A`
   This returns the full English day name (e.g., `Wednesday`). Match it case-insensitively against the rotation table rows.
2. Call `mcp__atlassian__getConfluencePage` with:
   - `cloudId`: `9cebaf06-de33-468b-b9eb-8c450353db6b`
   - `pageId`: `6414467619`
3. Parse the rotation table from the page body and find the row matching today's day.
4. Map the reviewer name to their GitHub username and Kaltura email using this table:

| Name | GitHub username | Kaltura email |
|---|---|---|
| Yehudit Nadav | `yehuditnadav` | `yehudit.nadav@kaltura.com` |
| Tovi Birenzweig | `ToviBirenzweig` | `tovi.birenzweig@kaltura.com` |
| Chen Levy | `ChensGH` | `chen.levy@kaltura.com` |
| Evgeny Verner | `evgenyverner` | `evgeny.verner@kaltura.com` |
| TBD / unknown | *(skip reviewer assignment)* | *(skip notification)* |

5. If a valid reviewer is found, include `--reviewer <github-username>` in the `gh pr create` command.
   If today's slot is TBD or the name cannot be mapped, open the PR without a reviewer and inform the user:
   > "No reviewer is assigned for today in the rotation. The PR was opened without a reviewer — please assign one manually."

### 11c: Open the PR

Use `gh pr create` directly with the composed description and the reviewer from 11b:
```bash
gh pr create --base develop --title "<ticket-number>: <short description>" --reviewer <github-username> --body "<composed description>"
```

- The PR must target the `develop` branch (NOT master)
- PR title must include the ticket number

**If `gh` is unavailable:**
- Inform the user:
  > "The `gh` CLI is not available. Please run the following command manually:
  > ```bash
  > gh pr create --base develop --title "<ticket-number>: <short description>" --reviewer <github-username> --body "..."
  > ```"
  > Copy the description above into the `--body` argument.
- Stop and wait — do NOT attempt to run git/push commands autonomously

### 11d: Send KBot Notification to Reviewer

Only run this step if a valid reviewer with a known Kaltura email was found in 11b.

Read the API token from the project's constants file, then send the notification:

```bash
curl -s -X POST "https://ci.rnd.ott.kaltura.com/ps/notify" \
  -H "x-access-token: $(sed -n 's/.*RND_TOKEN = \"\([^\"]*\)\".*/\1/p' src/main/java/com/kaltura/auto/api/constants/APIActionConstants.java)" \
  -H "Content-Type: application/json" \
  -d "{\"env\": \"vibe_coding_for_qa_teams\", \"owner\": \"<reviewer-kaltura-email>\", \"message\": \"<b>[Code Review]</b> Please review PR for <ticket-number>: <pr-url>\"}"
```

- Replace `<reviewer-kaltura-email>` with the email from the table in 11b
- Replace `<ticket-number>` with the Jira ticket (e.g., `MTP-17137`)
- Replace `<pr-url>` with the PR URL returned by `gh pr create`

**If the curl call fails or returns a non-2xx response:**
- Inform the user: "KBot notification could not be sent. Please notify the reviewer manually."
- Do not treat this as a failure of the overall workflow.

---

## Step 12: (skipped — Jira comment is posted in Sub-Step 13a when closing)

---

## Step 13: Confirm Merge and Close Out (success path only)

Only reached after Step 11 completes (PR opened).

Ask the user via `AskUserQuestion`:
> "Has the PR been approved and successfully merged into master?"
- Option 1: **Yes, it's merged** → proceed to Sub-Step 13a (full cleanup)
- Option 2: **Not yet / there are review comments to fix** → proceed to Sub-Step 13c (address review feedback)
- Option 3: **Waiting for review** → proceed to Sub-Step 13b (preserve everything)

---

### Sub-Step 13a: Merged — Full Cleanup and Closure

All git commands must use `git -C <MAIN_REPO_PATH>` to avoid the locked-branch issue.

1. Remove the worktree:
   ```bash
   git -C <MAIN_REPO_PATH> worktree remove ../worktrees/<TICKET_ID>
   ```
   If this fails due to uncommitted changes: warn the user before adding `--force`. Only run `git -C <MAIN_REPO_PATH> worktree remove --force ../worktrees/<TICKET_ID>` after explicit user confirmation.

2. Delete the local branch:
   ```bash
   git -C <MAIN_REPO_PATH> branch -d <TICKET_ID>
   ```

3. Close the Jira ticket:
   - Call `mcp__atlassian__getTransitionsForJiraIssue` (using the `cloudId` and `issueIdOrKey` from Step 1) to fetch available transitions.
   - Find the transition named "Done" or "Closed" (match case-insensitively).
   - Call `mcp__atlassian__transitionJiraIssue` with that transition ID **and** include `fields: {"resolution": {"name": "Done"}}` — the Closed transition requires a resolution or it will return a 400 error.
   - If no "Done"/"Closed" transition is found, inform the user:
     > "Could not find a 'Done' or 'Closed' transition for this ticket. Please close it manually in Jira."

4. Post the single Jira comment (this is the only comment posted on the ticket):
   Call `mcp__atlassian__addCommentToJiraIssue` with:
   - `cloudId`: value from Step 1
   - `issueIdOrKey`: `$ARGUMENTS`
   - `contentFormat`: `"markdown"`
   - `commentBody`:
     ```
     ## ✅ Completed

     [Plain-English summary of what was implemented — same content as the Step 5 plan, written for a non-developer audience. No Java, no class names, no framework jargon.]

     - **PR**: [PR URL from Step 11]
     - **Difido report**: [[Difido report](<DIFIDO_REPORT_URL>) — omit this line if not provided]
     - **Status**: PR merged into master ✓
     ```

5. Inform the user:
   > "All done! Worktree removed, branch deleted, and Jira ticket closed. The `<TICKET_ID>` ticket is fully complete."

---

### a

Only reached when the user reports the PR has review feedback that needs to be addressed.

#### 13c-1: Fetch the PR Review Comments

First, attempt to read the comments directly from GitHub using the PR URL from Step 11.

Extract the PR number from the URL (e.g., `https://github.com/kaltura/BE-Automation-PS/pull/1234` → `1234`).

Call both tools in parallel:
- `mcp__github__get_pull_request_reviews` with `owner: "kaltura"`, `repo: "BE-Automation-PS"`, `pull_number: <pr-number>`
- `mcp__github__get_pull_request_comments` with `owner: "kaltura"`, `repo: "BE-Automation-PS"`, `pull_number: <pr-number>`

**If both calls succeed and return comments:**
- Present the comments to the user in plain English — group by file if multiple files are mentioned, and summarize each comment in a single sentence (no raw JSON).
- Then ask via `AskUserQuestion`:
  > "I found the following review comments on the PR. Shall I address them now?"
  - Option 1: **Yes, fix them** → proceed to 13c-2
  - Option 2: **No, I'll handle them manually** → proceed to Sub-Step 13b

**If the GitHub MCP calls fail or return no comments:**
- Inform the user:
  > "I couldn't fetch the PR comments automatically (GitHub MCP unavailable or no comments found). You can either:
  > 1. Paste the review comments directly here and I'll address them
  > 2. Or handle them manually"
- If the user pastes comments → proceed to 13c-2 using the pasted text
- If the user chooses to handle manually → proceed to Sub-Step 13b

#### 13c-2: Address the Review Comments

For each comment or group of related comments:
1. Read the relevant source file(s).
2. Apply the minimal change needed to address the feedback.
3. Explain to the user in plain English what was changed and why (no technical jargon).

After all comments are addressed, run the mandatory build check:
```bash
mvn test-compile -q
```
Follow the same retry and max-3-attempts rules as Step 7.

#### 13c-3: Commit and Push the Fix

Once the build passes:
```bash
git -C <WORKTREE_PATH> add -A
git -C <WORKTREE_PATH> commit -m "<TICKET_ID>: address PR review comments"
git -C <WORKTREE_PATH> push
```

Inform the user:
> "Review comments addressed and pushed. The PR has been updated — please ask the reviewer to take another look."

#### 13c-3a: CLAUDE.md Retrospective (after review fix — same rules as Step 10f)

Evaluate whether the review comments revealed a pattern worth adding to `CLAUDE.md`. Apply the **exact same criteria as Step 10f** — only add guidance that is:
- Broadly reusable across tickets and test classes (not specific to this ticket)
- Clear and actionable
- Deterministic
- Concise — one principle per entry
- Not already covered in `CLAUDE.md`

**Good candidates from review feedback:**
- A preferred assertion class or pattern that should always be used for a given scenario (e.g., "use `AssertResponseError` to verify no API error, not `AssertNull`")
- A coding convention the reviewer enforced that generalizes to future tests

**Do NOT add:**
- Feedback specific to this ticket's logic or data
- Reviewer preferences that won't apply broadly
- Anything already documented in `CLAUDE.md`

If no broadly reusable pattern was identified, skip silently.

Send a KBot notification to the reviewer (same as Step 11d — use the reviewer email resolved in Step 11b):

```bash
curl -s -X POST "https://ci.rnd.ott.kaltura.com/ps/notify" \
  -H "x-access-token: $(sed -n 's/.*RND_TOKEN = \"\([^\"]*\)\".*/\1/p' src/main/java/com/kaltura/auto/api/constants/APIActionConstants.java)" \
  -H "Content-Type: application/json" \
  -d "{\"env\": \"vibe_coding_for_qa_teams\", \"owner\": \"<reviewer-kaltura-email>\", \"message\": \"<b>[Code Review]</b> PR updated for <ticket-number> — review comments addressed, please take another look: <pr-url>\"}"
```

If the curl call fails or returns a non-2xx response, inform the user: "KBot notification could not be sent. Please notify the reviewer manually." Do not treat this as a failure.

#### 13c-4: Wait for Re-approval

Ask via `AskUserQuestion`:
> "Has the reviewer approved the PR after your latest push?"
- Option 1: **Yes, now it's approved and merged** → proceed to Sub-Step 13a
- Option 2: **Not yet / more comments** → loop back to 13c-1 (fetch the latest comments and repeat)
- Option 3: **Waiting** → proceed to Sub-Step 13b

---

### Sub-Step 13b: Not Yet Merged — Preserve Everything

Inform the user:
> "No problem — the worktree at `<WORKTREE_PATH>` and branch `<TICKET_ID>` are preserved. Run `/update-qa-test <TICKET_ID>` again after the PR is merged to complete the cleanup and close the Jira ticket."

Do NOT delete the worktree or branch.
Do NOT modify the Jira ticket status.
Do NOT run `git checkout master`.

---

**Do NOT run this step if the workflow ended early due to a failure, a user abort, or an unresolved error in any previous step. The worktree and branch remain intact for the next session.**
