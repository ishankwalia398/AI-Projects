---
name: night-job-report-analyzer
description: >
  Analyze a Kaltura Difido nightly automated test report and generate a
  polished, self-contained HTML report with statistics and deep root cause
  analysis (RCA) for all failures. Use this skill whenever the user provides
  a Difido report URL, mentions nightly run results, wants to understand what
  failed in an execution, or asks for phrases like: "analyze the report",
  "what failed last night", "generate RCA report", "summarize test results",
  "night job results", "execution analysis", "review the difido report".
  The skill fetches all data through the browser (so internal network URLs
  work), enriches every failure with Java source analysis, and produces an
  interactive HTML file ready to share.
---

# Night Job Report Analyzer

## Overview

This skill:
1. Uses Playwright to fetch the Difido execution data through the browser (works even when Python/curl can't resolve the internal DNS)
2. Runs a local Python script to parse the data, classify failures, and generate an HTML scaffold
3. Enriches **every failure** with Java source analysis — cross-referencing stack traces, test code, and API request/response data — to produce specific, actionable root cause diagnoses
4. Opens the final polished HTML report in the browser

---

## Step 1 — Normalise the Difido base URL

From the user's message, extract the base URL of the execution. Strip any trailing `/index.html`.

Examples:
- `http://ps-difido.kaltura-ott.eu.sdm.network/reports/exec_479382/index.html`
  → base: `http://ps-difido.kaltura-ott.eu.sdm.network/reports/exec_479382`
- `http://host/reports/exec_12345`
  → use as-is

---

## Step 2 — Fetch execution.js through the browser

Navigate to `{base_url}/execution.js` and extract the full content:

```python
mcp__playwright__browser_navigate(url="{base_url}/execution.js")
execution_js_text = mcp__playwright__browser_evaluate(function="() => document.body.innerText")
```

---

## Step 3 — Identify all failed tests

Evaluate JavaScript in the browser to parse `execution.js` and extract every failed test's `uid`:

```javascript
() => {
  const text = document.body.innerText;
  const json = JSON.parse(text.replace(/^var execution = /, '').replace(/;$/, ''));
  const failed = [];
  function walk(node, suite) {
    if (node.type === 'test') {
      if (node.status === 'failure' || node.status === 'error') {
        failed.push({ uid: node.uid, name: node.name, className: node.className,
                      status: node.status, suite: suite, duration: node.duration || 0,
                      date: node.date || '', timestamp: node.timestamp || '' });
      }
      return;
    }
    const children = node.children || [];
    const suiteName = node.type === 'scenario' ? (node.name || suite) : suite;
    // Only use the outermost scenario name as the suite label
    const effectiveSuite = (node.type === 'scenario' && suite === '') ? (node.name || '') : suite;
    children.forEach(c => walk(c, effectiveSuite || suiteName));
  }
  (json.machines || []).forEach(m => (m.children || []).forEach(c => walk(c, '')));
  return JSON.stringify(failed);
}
```

This gives you the list of failed tests. Also extract total counts and suite summaries while you have the page open:

```javascript
() => {
  const text = document.body.innerText;
  const json = JSON.parse(text.replace(/^var execution = /, '').replace(/;$/, ''));
  // Return the full execution JSON for the Python script to process
  return text;
}
```

---

## Step 4 — Fetch each failed test's test.js through the browser

For each failed test `uid`, fetch its detail page. Because there can be hundreds of failures, **batch this with JavaScript fetch() calls** to avoid navigating to hundreds of pages:

Navigate once to any page on the same origin, then run a batched fetch script. Process in batches of 50 to avoid memory issues:

```javascript
// Run this via mcp__playwright__browser_evaluate for each batch of UIDs
async (uids) => {
  const results = {};
  await Promise.all(uids.map(async uid => {
    try {
      const url = `{base_url}/tests/test_${uid}/test.js`;
      const resp = await fetch(url);
      results[uid] = await resp.text();
    } catch(e) {
      results[uid] = null;
    }
  }));
  return JSON.stringify(results);
}
```

Collect all `{ uid: "var test = {...};" }` results across batches.

---

## Step 5 — Write fetched data to a local file

Write a JSON file containing everything the Python script needs:

```python
import json, os
fetched_data = {
    "base_url": base_url,
    "execution_js": execution_js_text,   # the raw "var execution = {...};" string
    "test_details": {                    # uid -> "var test = {...};" string
        uid1: raw_test_js_1,
        uid2: raw_test_js_2,
        ...
    }
}
fetched_path = os.path.abspath("difido_fetched_data.json")
with open(fetched_path, "w", encoding="utf-8") as f:
    json.dump(fetched_data, f, ensure_ascii=False)
```

---

## Step 6 — Run the Python report generator

```bash
python .claude/skills/night-job-report-analyzer/scripts/generate_report.py --from-file difido_fetched_data.json
```

Read stdout to get two paths printed (one per line):
- `night_job_report_{exec_id}.html` — the HTML report scaffold (empty RCA placeholders)
- `night_job_report_{exec_id}_data.json` — structured failure data

Then immediately run the code-context extractor (must run after generate, before explain):

```bash
python .claude/skills/night-job-report-analyzer/scripts/extract_code_context.py night_job_report_{exec_id}_data.json
```

This produces `night_job_report_{exec_id}_data.json.code_context.json` used by the explain step.

---

## Step 7 — Java source enrichment (the most important step)

The script provides preliminary root cause labels. Now enrich **every failure** by reading the actual test code and cross-referencing it with the API data. Do this for all exception types.

### 7a — Group failures by class

Read `night_job_report_{exec_id}_data.json`. It is a JSON array; each entry has:
- `uid`, `name`, `className`, `suite`, `phase`
- `root_cause` (preliminary label)
- `exception_head` (first line of the exception or failure message)
- `stack_top` (up to 8 stack frames with line numbers, format: `pkg.Class.method(File.java:LINE)`)
- `last_api` (url, request_method, request_body, response_code, response_error, response_error_code, response_body)
- `test_url` (link to the Difido test page)

Group all entries by `className` to avoid reading the same `.java` file more than once.

### 7b — Resolve and read each class

For each unique `className` that has at least one failure:

```bash
python .claude/skills/debug-ebug-test/scripts/find_source.py <className>
```

This prints the absolute path to the `.java` file. Read that file.

Focus your reading on:
- The specific test method(s) that failed (`name` field from the data)
- Any `@BeforeClass` / `@BeforeMethod` setup methods when `phase` is `BEFORE_CLASS`, `BEFORE_METHOD`, or `SETUP`
- The exact lines referenced in `stack_top` — each frame is `pkg.Class.method(File.java:LINE)`, use the line number to locate the relevant code

### 7c — Produce a specific RCA note for each failure

For each failing test, synthesise three sources simultaneously:

| Source | What it tells you |
|--------|-------------------|
| `stack_top` line numbers | *Where* the failure occurred in the code |
| Java source at those lines | *What* the code was trying to do |
| `last_api` request + response | *What the server actually returned* |

Write a **one-to-three sentence** human-readable diagnosis. Be specific — name the field, the line, the value. Avoid generic labels. Examples:

- *"Line 134: `response.getResult().getObjects().get(0)` — the `asset/action/list` API returned HTTP 200 but `objects` was empty (0 items). The filter used `externalId=XYZ` which matched no content. Likely a data setup issue or stale test data."*
- *"Line 89 assertion failure: expected entitlement status `ENTITLED` but got `NOT_ENTITLED`. The preceding purchase call returned API error code 4001 (insufficient funds). The test account balance may have been depleted."*
- *"@BeforeClass setup failed at line 45: `createHousehold()` returned HTTP 500 with no body. All 14 tests in this class were skipped as a result."*
- *"Timeout at line 67: the polling loop waited 30s for ingest status `DONE` but the job never completed. The ingest API returned job ID 99812 successfully; the job may have stalled."*
- *"Line 201: `household.getDevices().size()` — `household/action/get` returned a null `devices` field despite the device-add call succeeding (HTTP 200). Possible eventual-consistency issue."*

If multiple tests in the same class fail at the same line with the same exception, one note covers them all.

### 7d — Build the enrichment map

Collect your notes as: `{ uid: "rca_note text" }`

---

## Step 8 — Inject enrichment into the HTML

Open `night_job_report_{exec_id}.html` and read it. For each `uid` that has an enrichment note, find its detail row. Each detail row contains:

```html
<div style="background:#fffbe6;border-left:3px solid #f39c12;padding:8px 12px;margin-bottom:8px;font-size:12px"><b>RCA Analysis:</b> </div>
```

The row is preceded by `<tr id="row-{uid}"`. Find the detail row for that uid and fill in your diagnosis text after `<b>RCA Analysis:</b> `.

Write the updated HTML back to the same file.

---

## Step 9 — Open the report in the browser

Playwright blocks `file://` URLs, so serve the report via a temporary local HTTP server:

```bash
python -m http.server 7842 --directory "." --bind 127.0.0.1
```

Run this in the background (use `run_in_background: true`), then navigate Playwright to it:

```python
mcp__playwright__browser_navigate(url="http://127.0.0.1:7842/night_job_report_{exec_id}.html")
```

Take a screenshot so the user can see the report rendered:

```python
mcp__playwright__browser_take_screenshot(type="png", scale="css")
```

After the screenshot, stop the server (it is only needed for viewing).

---

## Step 10 — Report a brief summary to the user

Reply with:
- Total tests / passed / failed / pass rate
- Top 3–5 root causes by count (e.g., "127 × Setup Failure, 89 × NullPointerException, 45 × Timeout")
- Any notable patterns (e.g., "All 14 failures in BouyguesAccurateEpgTests share the same @BeforeClass error")
- The HTML file path so the user can share/download it

---

## Implementation notes

- **Batch size for fetching test details**: Use batches of 50 UIDs per `browser_evaluate` call to avoid timeouts. Wait for each batch to complete before starting the next.
- `generate_report.py` uses only Python standard library — no pip installs needed.
- If `find_source.py` returns exit code 1 (class not found), skip Java enrichment for that class and keep the preliminary label.
- The generated HTML is fully self-contained (CSS/JS inline, Chart.js from CDN). Interactive: search, filter by root cause/suite/phase, expandable detail rows, CSV export.
- Clean up `difido_fetched_data.json` after the report is generated if desired.
