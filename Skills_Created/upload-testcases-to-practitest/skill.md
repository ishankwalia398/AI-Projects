---
name: upload-testcases-to-practitest
description: Upload test cases to PractiTest from CSV, Excel, PDF, Word, or Markdown files with idempotency, state tracking, validation, and rollback. CI/CD ready. Triggers on "upload to practitest", "import test cases", "push to PT", or file + PractiTest mention.
compatibility:
  tools:
    - mcp__plugin_practitest_practitest__*
  dependencies:
    - pandas
    - openpyxl
version: 2.0.0
changelog:
  - 2.0.0 (2026-08-05): Added idempotency, state tracking, validation, logging, rate limiting, rollback capability
  - 1.0.0: Initial version
---

# Upload Test Cases to PractiTest (CI/CD Ready)

This skill takes test cases from a user-supplied file and uploads them to PractiTest using the PractiTest MCP connector. 

**Version 2.0 Features:**
- ✅ **Idempotency**: Prevents duplicate uploads - safe to run multiple times
- ✅ **State Tracking**: Resume from checkpoint after failures
- ✅ **Validation**: Pre-validates all data against PractiTest constraints
- ✅ **Logging**: Full audit trail with structured logs
- ✅ **Rate Limiting**: Respects API limits with exponential backoff
- ✅ **Rollback**: Clean up failed uploads
- ✅ **Dry-run Mode**: Validate without uploading

**Anti-hallucination guarantee**: Never invents, assumes, or fills in test case content, field mappings, or PractiTest targets that weren't explicitly provided or confirmed by the user.

## Accepted file formats

- CSV (.csv)
- Excel (.xlsx)
- PDF (.pdf)
- Word (.docx)
- Markdown (.md)

## Workflow

### Step 0: Initialize Utilities and Check Environment

Before starting, initialize the upload utilities and verify environment:

1. **Check and Install PractiTest Plugin** (NEW):
   ```python
   # Check if PractiTest MCP tools are available
   try:
       # Try to call a PractiTest MCP function
       from tools import list_available_tools
       pt_tools = [t for t in list_available_tools() if 'practitest' in t.lower()]
       
       if not pt_tools or len(pt_tools) == 0:
           raise Exception("PractiTest plugin not found")
           
       print(f"✅ PractiTest plugin detected ({len(pt_tools)} tools available)")
       
   except Exception as e:
       print("⚠️  PractiTest plugin not installed")
       print("Installing PractiTest plugin...")
       
       # Install the plugin
       import subprocess
       result = subprocess.run(
           ["claude", "plugin", "install", "practitest@kalt-ai-plugins"],
           capture_output=True,
           text=True
       )
       
       if result.returncode == 0:
           print("✅ PractiTest plugin installed successfully")
           print("Please restart Claude Code and try again")
           print("\nAlternatively, you can run manually:")
           print("  /plugin install practitest@kalt-ai-plugins")
           return
       else:
           print("❌ Failed to install PractiTest plugin automatically")
           print("\nPlease install manually by running:")
           print("  /plugin install practitest@kalt-ai-plugins")
           print("\nThen restart Claude Code and try again")
           return
   ```

   **Important**: If the plugin was just installed, the user must restart Claude Code for the plugin to become available. The skill will exit and prompt the user to restart.

2. **Import utilities**:
   ```python
   import sys
   import os
   from pathlib import Path
   
   # Add utils to path
   skill_dir = Path(__file__).parent
   sys.path.insert(0, str(skill_dir / "utils"))
   
   from state_manager import UploadStateManager
   from validator import TestCaseValidator
   from logger import UploadLogger
   from rate_limiter import RateLimiter
   ```

3. **Check for existing uploads**:
   ```python
   active_uploads = UploadStateManager.list_active_uploads()
   if active_uploads:
       print(f"Found {len(active_uploads)} active upload(s):")
       for batch_id in active_uploads:
           state = UploadStateManager.load_by_batch_id(batch_id)
           progress = state.get_progress()
           print(f"  - {batch_id}: {progress['uploaded']}/{progress['total']} uploaded")
       
       # Ask user if they want to resume
       print("\nWould you like to:")
       print("1. Resume an existing upload")
       print("2. Start a new upload")
       # Wait for user choice
   ```

4. **Verify PractiTest MCP Connection**:
   ```python
   try:
       # Try calling list_projects to verify connection
       projects = mcp__plugin_practitest_practitest__list_projects()
       print(f"✅ Connected to PractiTest ({len(projects)} projects accessible)")
   except Exception as e:
       print("❌ PractiTest MCP connection failed")
       print(f"   Error: {str(e)}")
       print("\nTroubleshooting:")
       print("1. Ensure you have run: /plugin install practitest@kalt-ai-plugins")
       print("2. Restart Claude Code after installing the plugin")
       print("3. Check that your PractiTest API credentials are configured")
       print("4. Run /mcp to view connected servers and check status")
       return
   ```

5. **Check mode**: Ask user if they want to run in:
   - **Normal mode**: Full upload
   - **Dry-run mode**: Validate only, no upload
   - **Resume mode**: Continue existing upload

This early setup ensures safe, resumable uploads.

### Step 1: Ingest the file

First, detect the file type and extract the raw content:

**CSV/Excel**: Use pandas to read the file. For Excel files, if multiple sheets exist, ask which sheet contains the test cases (or list sheets and let the user choose).

**Important**: First check that pandas is installed. If not, provide clear instructions:

```python
try:
    import pandas as pd
except ImportError:
    print("Error: pandas is not installed.")
    print("Please install it by running: pip install pandas openpyxl")
    print("(openpyxl is needed for Excel file support)")
    exit(1)

df = pd.read_csv('file.csv')  # or pd.read_excel('file.xlsx')
```

**PDF**: Use pdftotext or PyPDF2 to extract text. Be aware that table structures in PDFs may require special handling.

**Word (.docx)**: Use python-docx to extract paragraphs and tables:

```python
from docx import Document
doc = Document('file.docx')
# Extract paragraphs and tables
```

**Markdown**: Read directly as text and parse the structure (often test cases are in tables or bullet lists).

Store the extracted content as a structured representation. If the file contains tabular data, keep it as a DataFrame or list of dictionaries. If it's unstructured text, preserve it for parsing in Step 2.

### Step 2: Parse into structured test cases

Attempt to identify the following fields for each test case:

- **Title/Name** (required by PractiTest)
- **Description** (optional)
- **Preconditions** (optional)
- **Steps** (may be a single block or numbered steps)
- **Expected Result/Expected Results** (optional)
- **Priority** (optional)
- **Status** (optional, e.g., Draft, Ready)
- **Custom fields** (any additional columns/fields present in the source)

**Important**: Do NOT infer or guess field values. If a field is not explicitly labeled or present in the source, leave it blank and flag it in the "Missing / Unknown Information" section (see Anti-Hallucination Rules below).

**Common patterns**:
- Excel/CSV files often have columns like `TC_Name`, `TC_Description`, `Step_Name`, `Step_Description`, `Expected_Result`, `Preconditions`, `Priority`.
- Some files have one row per test case; others have one row per step (with test case info repeated or on the first step row only).
- If the file has a `Step#` column or similar, the test cases are likely in "one row per step" format — you'll need to group rows by test case ID/name.

**Grouping multi-row test cases**:
If the file has one row per step, group by the test case identifier (e.g., `TC_ID` or `TC_Name`). Example logic:

```python
# Group by TC_ID
grouped = df.groupby('TC_ID')
for tc_id, group in grouped:
    test_case = {
        'name': group.iloc[0]['TC_Name'],
        'description': group.iloc[0]['TC_Description'],
        'steps': []
    }
    for _, row in group.iterrows():
        test_case['steps'].append({
            'name': row['Step_Name'],
            'description': row['Step_Description'],
            'expected_results': row['Expected_Result']
        })
```

**Do not assume column meanings**. If a column is called "Step_Name" but you're not sure if it maps to PractiTest's step name or description, flag it and ask the user (see Step 3).

### Step 3: Confirm PractiTest target and field mapping

Before calling the PractiTest MCP, confirm the following with the user (only ask for what's genuinely missing — if they already specified it earlier in the conversation, don't re-ask):

1. **Project ID / Project name**: Which PractiTest project should the test cases be uploaded to?
   
   **If the user already specified the project** (e.g., "upload to project 12345" or "upload to Kaltura Backend QA"), use that.
   
   **If the user has NOT specified a project**, call `list_projects` to retrieve available projects and present them to the user:
   
   ```
   I found these PractiTest projects you have access to:
   
   1. Kaltura Backend QA (ID: 891023)
   2. Mobile App Testing (ID: 238471)
   3. API Integration Tests (ID: 445612)
   4. Web Portal QA (ID: 556789)
   
   Which project should I upload the test cases to? (You can specify by name or ID)
   ```
   
   Wait for the user to select a project before proceeding.

2. **Check mandatory fields**: Once the project is confirmed, call `get_custom_fields` for that project to retrieve the list of custom fields and identify which ones are mandatory.
   
   **If mandatory custom fields exist**, check whether the source file contains columns that can map to these fields:
   - If a mandatory field is missing from the source file, ask the user: "PractiTest project 'X' requires the custom field 'Y' (ID: ---f-12345) for all test cases. Your file doesn't have a column for this. Should I:
     1. Skip uploading and let you add the column to the file first
     2. Use a default value (please specify)
     3. Ask you for the value for each test case during upload"
   
   **Example**:
   ```
   PractiTest project "Kaltura Backend QA" has these mandatory custom fields:
   - Test Type (---f-12345): Required for all test cases
   - Component (---f-67890): Required for all test cases
   
   Your file has a "Type" column which I can map to "Test Type". However, I don't see a "Component" column. What value should I use for "Component"? (Or should I skip upload until you add this to the file?)
   ```

3. **Module / Test Set** (optional): Should the test cases be added to a specific module or test set? If the user doesn't specify, you can create tests without assigning them to a module (they'll go into the project root).

4. **Field mapping**: If the source file column names don't obviously match PractiTest field names, ask for confirmation:
   - "I see columns `TC_Name`, `TC_Description`, `Step_Name`, `Step_Description`, and `Expected_Result`. Should I map these as follows:
     - `TC_Name` → PractiTest test name
     - `TC_Description` → PractiTest description
     - `Step_Name` → PractiTest step name
     - `Step_Description` → PractiTest step description
     - `Expected_Result` → PractiTest step expected results
   - If correct, I'll proceed. If not, please specify the correct mapping."

**If custom fields are present in the source file**: Check the list of custom fields from `get_custom_fields` and suggest mappings. For any source columns that don't match standard PractiTest fields (name, description, steps), propose mapping them to custom fields:

```
I see these additional columns in your file:
- "Priority" → Should this map to PractiTest's built-in Priority field?
- "API_Endpoint" → I found a custom field "API Endpoint" (---f-89234) in the project. Should I map to this?
- "Owner" → Not sure where this should go. Options: PractiTest Assignee, or a custom field?
```

Wait for the user to confirm the mappings before proceeding to Step 4.

### Step 4: Run Comprehensive Validation

Before uploading, run comprehensive validation using the new validator:

```python
# Initialize validator
validator = TestCaseValidator(strict_mode=True)
logger.info(f"Validating {len(test_cases)} test cases")

# Validate all test cases
validation_results = validator.validate_batch(test_cases)

# Log validation report
report = validator.generate_validation_report(validation_results)
logger.info(report)
print(report)

# Check if validation passed
if not validation_results['valid']:
    print(f"\n❌ Validation failed for {validation_results['failed']} test cases")
    print("\nOptions:")
    print("1. Fix issues and retry")
    print("2. Skip invalid test cases and upload only valid ones")
    print("3. Abort upload")
    # Wait for user choice
    
    if user_choice == "skip":
        # Remove invalid test cases
        valid_tc_ids = [tc['tc_id'] for tc in test_cases 
                       if tc['tc_id'] not in validation_results['test_case_errors']]
        test_cases = [tc for tc in test_cases if tc['tc_id'] in valid_tc_ids]
        logger.info(f"Proceeding with {len(test_cases)} valid test cases")
```

**Anti-Hallucination Check** (always run):

1. **Verified Facts**: List the facts extracted from the source file.
2. **Missing / Unknown Information**: List any required fields that are missing or ambiguous.
3. **Generated Output**: The structured test cases ready for upload (derived ONLY from verified facts + explicit user confirmations).
4. **Self-Validation Check**: Confirm that no information was invented or assumed.

**If "Missing / Unknown Information" is non-empty for any required field**, STOP and ask the user. Do not guess, do not skip, do not upload partial data.

Only proceed to Step 5 after validation passes or user explicitly chooses to skip invalid test cases.

### Step 5: Upload with State Tracking and Rate Limiting

Once validation passes, upload with full state tracking and rate limiting:

```python
import time
from datetime import datetime

# Initialize components
state_mgr = UploadStateManager(project_id, source_file)
logger = UploadLogger(state_mgr.batch_id)
rate_limiter = RateLimiter()

# Initialize state
state_mgr.initialize(
    total_test_cases=len(test_cases),
    custom_fields=custom_fields,
    field_mapping=field_mapping,
    metadata={"user": "...", "source_file": source_file}
)

logger.upload_started(project_id, len(test_cases), source_file)

# Check for dry-run mode
if dry_run:
    print("\n🔍 DRY-RUN MODE: Validation complete, no upload performed")
    print(f"Would upload {len(test_cases)} test cases to project {project_id}")
    return

# Upload with state tracking
start_time = time.time()
uploaded_count = 0
failed_count = 0

for i, tc in enumerate(test_cases):
    tc_id = tc['tc_id']
    
    # Skip if already uploaded (idempotency)
    if state_mgr.is_uploaded(tc_id):
        logger.info(f"Skipping {tc_id} - already uploaded")
        uploaded_count += 1
        continue
    
    # Skip if previously failed with max retries
    if state_mgr.is_failed(tc_id):
        fail_info = state_mgr.state['failed'][tc_id]
        if fail_info['attempts'] >= 3:
            logger.warning(f"Skipping {tc_id} - max retries exceeded")
            continue
    
    try:
        # Rate-limited upload with retries
        result = rate_limiter.execute_with_rate_limit(
            mcp__plugin_practitest_practitest__create_test,
            project_id=project_id,
            name=tc['tc_name'],
            description=tc.get('tc_description'),
            steps=[
                {
                    "name": step['step_name'],
                    "description": step['step_description'],
                    "expected_results": step.get('expected_result', '')
                }
                for step in tc['steps']
            ],
            custom_fields=custom_fields,
            priority=tc.get('priority'),
            status=tc.get('status', 'Draft'),
            max_retries=3
        )
        
        # Extract test ID
        pt_test_id = result['data']['id']
        display_id = result['data'].get('display_id', pt_test_id)
        
        # Mark as uploaded
        state_mgr.mark_uploaded(tc_id, pt_test_id, display_id)
        logger.test_case_created(tc_id, pt_test_id, display_id)
        uploaded_count += 1
        
        # Progress update every 10 tests
        if (i + 1) % 10 == 0:
            elapsed = time.time() - start_time
            logger.progress_update(uploaded_count, len(test_cases), elapsed)
        
    except Exception as e:
        # Mark as failed
        state_mgr.mark_failed(tc_id, str(e))
        logger.test_case_failed(tc_id, str(e))
        failed_count += 1
        
        # Continue with next test case
        continue

# Mark upload complete
duration = time.time() - start_time
state_mgr.mark_completed()
logger.upload_completed(
    uploaded_count,
    failed_count,
    state_mgr.get_skipped_count(),
    duration
)
```

**Key Features**:
- ✅ **Idempotency**: Skips already-uploaded tests
- ✅ **State tracking**: Saves progress after each test
- ✅ **Rate limiting**: Respects API limits with backoff
- ✅ **Retry logic**: Automatically retries failed uploads (max 3 attempts)
- ✅ **Progress reporting**: Updates every 10 tests
- ✅ **Resume capability**: Can continue from checkpoint if interrupted

### Step 6: Report results

After all uploads are complete (or attempted), provide a clear summary:

**Success case**:
```
Uploaded 47 test cases successfully to PractiTest project "Kaltura VOD" (ID: 12345):
- TC_0001: "Validate asset creation" (Test #1001)
- TC_0002: "Validate ADI ingestion" (Test #1002)
... (show first 5, then summarize "and 42 more")

All test cases are now in the project root. You can view them at [PractiTest link if available].
```

**Partial success case**:
```
Uploaded 45 of 47 test cases to PractiTest project "Kaltura VOD" (ID: 12345).

Skipped 2 test cases due to missing information:
- Row 23: Missing test case name (TC_Name column was empty)
- Row 24: Missing test case name (TC_Name column was empty)

Would you like me to retry these after you provide the missing names?
```

**Complete failure case**:
```
Upload failed: PractiTest MCP connection error. Please check your MCP setup with `/mcp` and ensure the PractiTest server is connected.
```

**Do not summarize in a way that implies more was uploaded than actually was**. If 5 test cases were created, say "5 test cases", not "test cases uploaded successfully" (which sounds vague and could be any number).

---

## Anti-Hallucination Rules

**ROLE**: You are a QA assistant operating under strict verification rules.

**SCOPE OF KNOWLEDGE**: You may ONLY use information explicitly provided in:
- The uploaded test case file
- Explicit user clarifications given in this conversation
- PractiTest field/project/module info returned by the MCP tools themselves

**STRICT RULES (MANDATORY)**:
1. **DO NOT** invent test steps, expected results, field mappings, project/module names, or PractiTest behavior.
2. **DO NOT** assume default or "typical" mappings. For example, don't assume a column is "Expected Result" just because of its position — only if it's labeled as such or the user confirms it.
3. **If information is missing or unclear**, respond with: "Insufficient information to determine." Then ask the user directly rather than proceeding with a guess.
4. **Every test case field uploaded must be traceable** to the source file or an explicit user answer. If you can't point to the source, don't upload it.
5. **If you infer something** (e.g., inferring column meaning from a very similar but not identical header like "Expected" → "Expected Result"), label it explicitly as "Inference (low confidence)" and confirm with the user before using it.
6. **Output and upload behavior must be deterministic and repeatable**: same input file + same confirmed mapping = same PractiTest result. No randomness, no "creative interpretation".

**PROCESS TO FOLLOW** (run before any PractiTest write call):

**Step 1**: Extract verifiable facts from the input file.
- Example: "File contains 47 rows. Columns: TC_ID, TC_Name, TC_Description, Step#, Step_Name, Step_Description, Expected_Result. TC_ID ranges from TC_0001 to TC_0047."

**Step 2**: List unknown or missing information (per test case, per field).
- Example: "Test cases TC_0005, TC_0012: TC_Name column is empty. Test cases TC_0023, TC_0031: Expected_Result column is empty."

**Step 3**: Generate the structured output ONLY from Step 1 facts (+ explicit user answers).
- Example: "Parsed 45 test cases with complete information. 2 test cases skipped due to missing TC_Name."

**Step 4**: Perform a self-check for hallucinations or contradictions before uploading.
- Example: "Self-check: All test case names are from the TC_Name column. All steps are from rows with matching TC_ID. No field values were invented. No mappings were assumed without confirmation. Ready to upload."

**OUTPUT FORMAT** (used internally before upload, and shown to user if issues are found):

```
Verified Facts:
- [List all facts extracted from the file]

Missing / Unknown Information:
- [List any fields that are missing or ambiguous]

Generated Output:
- [The structured test cases, showing exactly what will be uploaded]

Self-Validation Check:
- [Confirm no hallucinations; trace each field back to source or user confirmation]
```

**If a step cannot be completed**, stop and report exactly why. Do not proceed to upload with gaps.

---

## Error Handling

| Situation | Action |
|---|---|
| **PractiTest MCP unavailable / auth error** | Stop immediately. Tell the user: "PractiTest MCP connection failed. Please run `/mcp` to check the server status and reconnect if needed." Do not attempt to proceed without a working connection. |
| **MCP timeout / slow response** | If list_projects or create_test takes >30s, warn user about slow connection and offer to cancel/retry. Don't let calls hang indefinitely. Use reasonable timeouts for all MCP calls. |
| **File has no clear test case structure** | Ask the user to clarify. Example: "I see a table with columns A, B, C, D, but I'm not sure which column contains the test case names. Can you point out the structure, or describe how the test cases are organized in this file?" |
| **Ambiguous field mapping** | Ask the user explicitly. Example: "I see a column called 'Steps'. Should this map to PractiTest's step description, or is it the step name?" Never guess. |
| **PractiTest project not specified** | Call `list_projects` and present the list to the user. Ask them to select by name or ID. Do not assume a default project. |
| **Mandatory custom fields missing** | Call `get_custom_fields` to check for mandatory fields. If the source file is missing columns for mandatory fields, stop and ask the user what value to use, or suggest they add the column to the file first. Do not proceed with upload until all mandatory fields can be populated. |
| **Partial upload failure** | Report exactly which test cases succeeded and which failed, with reasons. Example: "Uploaded 40 of 42 test cases. Failed: TC_0023 (API error: invalid step format), TC_0031 (API error: missing required field 'name')." |
| **Missing required fields** (e.g., test case name) | Stop and ask the user. Do not upload test cases without required fields. Do not invent placeholder names like "Test Case 1", "Test Case 2". |
| **API validation error (e.g., mandatory field missing)** | If `create_test` returns a validation error about a missing mandatory field, stop the batch upload, report which field is missing, call `get_custom_fields` to show the user what's required, and ask how to proceed. Do not retry with guessed values. |

---

## Output

**No file is generated by this skill**. The deliverable is the PractiTest upload itself, plus a clear summary in the chat of what was created and what was skipped (if anything).

Example summary format:
```
✅ Uploaded 47 test cases to PractiTest project "Kaltura VOD" (ID: 12345)

Sample created tests:
- TC_0001: "Validate asset creation in KBE" → PractiTest Test #1001
- TC_0002: "Validate ADI file movement to success folder" → PractiTest Test #1002
- TC_0003: "Validate error report is not generated" → PractiTest Test #1003
(and 44 more)

All test cases are in the project root (no module assigned).
View them at: [PractiTest project URL if available from MCP]
```

If the user wants to link the uploaded tests to a test set or module after upload, guide them to use the PractiTest UI or ask if they want you to update the tests programmatically (though this would require additional MCP calls and is out of scope for the initial upload).

---

## Notes for the model using this skill

- **ALWAYS start with Step 0**: 
  1. First, check if PractiTest plugin is installed using the plugin checker utility
  2. If not installed, attempt automatic installation or provide manual instructions
  3. If installation was just completed, inform user to restart Claude Code
  4. Only after plugin is confirmed available, verify MCP connection by calling `list_projects`
  5. If MCP connection fails, guide user to check credentials and configuration
  
  This two-step verification (plugin installation → MCP connection) prevents confusing errors later.

- **ALWAYS call `list_projects` if the user hasn't specified a project**. Present the list in a clear, numbered format and wait for the user to choose. Do not proceed without a confirmed project.

- **ALWAYS call `get_custom_fields` once the project is confirmed**. Check for mandatory custom fields BEFORE starting the upload. If mandatory fields exist and the source file doesn't have matching columns, stop and ask the user what values to use. Do not proceed with upload until all mandatory fields can be populated.

- **Check dependencies early**: Before parsing files, verify pandas is installed. If not, provide clear installation instructions rather than proceeding with an import error.

- **Prioritize clarity over brevity** when asking the user for missing information. It's better to ask one clear question than to make an assumption and upload incorrect data.

- **Show the user a preview of the parsed test cases** before uploading (at least the first 3-5 test cases), so they can confirm the parsing and mapping is correct. Example:
  ```
  I've parsed 47 test cases from the file. Here are the first 3:
  1. TC_0001: "Validate asset creation in KBE"
     - Steps: 2 steps (Precondition, Execute)
     - Expected result: "Operation completes successfully with expected response"
  2. TC_0002: "Validate ADI file movement"
     - Steps: 3 steps (Precondition, Execute, Verify)
     - Expected result: "File moved to /vodIngest/success"
  ... and 44 more.
  
  Does this look correct? If so, I'll upload them to PractiTest project [project name/ID].
  ```

- **Use the helper script** (see `scripts/parse_testcases.py`) to parse common file formats. The script handles CSV, Excel (including multi-row-per-test-case formats), and returns a structured list of test cases ready for upload. This reduces the chance of parsing errors.

- **If the user explicitly specifies a project** (by name or ID) in their message, use that — don't call `list_projects` again. But still call `get_custom_fields` to check for mandatory fields.

- **Batch your MCP calls** where possible. If you need to upload 50 test cases, don't call them one by one in 50 separate turns — call them in parallel within a single turn (if the harness supports it), or at least batch them into groups of 5-10 per turn to speed things up.

- **When presenting custom field mappings**, show both the field name and the ID (e.g., "API Endpoint (---f-89234)") so the user can verify the mapping is correct if they're familiar with the PractiTest UI.

---

## Example interaction

**User**: "Upload these test cases to PractiTest" [provides TVOD_PPV_Change_Management_Backend_TestCases.xlsx]

**Assistant**:
1. Reads the file → identifies 47 test cases in "one row per step" format, grouped by TC_ID.
2. Parses the structure → extracts test case names, descriptions, steps, and expected results.
3. Calls `list_projects` → retrieves available projects.
4. Asks: "I see 47 test cases from TC_0001 to TC_0047. I found these PractiTest projects:
   1. Kaltura Backend QA (ID: 891023)
   2. Mobile App Testing (ID: 238471)
   3. API Integration Tests (ID: 445612)
   
   Which project should I upload the test cases to?"
5. User: "Kaltura Backend QA"
6. Assistant: Calls `get_custom_fields` for project 891023 → finds 2 mandatory fields: "Test Type" (---f-12345) and "Component" (---f-67890).
7. Assistant: "The project 'Kaltura Backend QA' requires two mandatory custom fields:
   - Test Type (---f-12345)
   - Component (---f-67890)
   
   Your file doesn't have columns for these. What values should I use? (Or should I skip upload until you add these columns to the file?)"
8. User: "Use 'Backend' for Test Type and 'VOD' for Component for all test cases."
9. Assistant: "Got it. I'll map the columns as follows:
   - TC_Name → test name
   - TC_Description → description
   - Step_Name → step name
   - Step_Description → step description
   - Expected_Result → step expected results
   - Custom field 'Test Type' → 'Backend' (all tests)
   - Custom field 'Component' → 'VOD' (all tests)
   Does this look correct?"
10. User: "Yes."
11. Assistant: Runs anti-hallucination validation → all fields present, no missing data.
12. Assistant: Calls `create_test` for each of the 47 test cases with custom_fields={"---f-12345": "Backend", "---f-67890": "VOD"} (in parallel or batched).
13. Assistant: Reports: "Uploaded 47 test cases successfully to PractiTest project 'Kaltura Backend QA' (ID: 891023). Sample: TC_0001 → Test #1001, TC_0002 → Test #1002, ..."

**User**: "Wait, test #1005 has the wrong description."

**Assistant**: "I uploaded the description from the file's TC_Description column for that test case. The file says: [shows original description]. If that's incorrect, I can update it — just let me know what the correct description should be, or we can fix it in PractiTest directly using the `update_test` tool."

(This demonstrates that the assistant traces every field back to the source and doesn't invent anything.)

---

## Example interaction 2: User already specified project

**User**: "Upload test_scenarios.csv to PractiTest project 238471. The file has Priority and API_Endpoint columns."

**Assistant**:
1. Reads the file → identifies 15 test cases.
2. Calls `get_custom_fields` for project 238471 → finds custom field "API Endpoint" (---f-89234) and no mandatory fields.
3. Assistant: "I see 15 test cases. I found these mappings:
   - TC_Name → test name
   - Description → description
   - Steps → test steps (parsed)
   - Priority → PractiTest Priority field
   - API_Endpoint → Custom field 'API Endpoint' (---f-89234)
   
   Does this look correct?"
4. User: "Yes."
5. Assistant: Validates and uploads all 15 test cases with priority and custom_fields mappings.
6. Assistant: Reports success with test IDs.
