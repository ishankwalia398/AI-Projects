#!/usr/bin/env python3
"""
Generate an HTML analysis report from a Difido execution.

Two modes:
  1. Direct fetch (requires network access to Difido):
       generate_report.py <difido_base_url>

  2. From pre-fetched data file (use when Difido is only reachable via browser):
       generate_report.py --from-file <path_to_fetched_data.json>

     The JSON file must be produced by the fetch_data.js browser script:
       { "base_url": "...", "execution_js": "var execution = {...};",
         "test_details": { "<uid>": "var test = {...};" , ... } }

Outputs (both modes):
    Writes  night_job_report_<exec_id>.html  to the current directory.
    Also writes  night_job_report_<exec_id>_data.json  (enrichment input for Claude).
    Prints both absolute paths to stdout (one per line).
    Progress messages go to stderr.

Exit codes:
    0  success
    1  usage error / network failure
"""

import json
import os
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def normalise_base(raw_url):
    """Strip trailing /index.html or trailing slash, return clean base URL."""
    url = raw_url.strip().rstrip("/")
    if url.endswith("/index.html"):
        url = url[: -len("/index.html")]
    return url


def exec_id_from_url(base_url):
    m = re.search(r"exec_(\d+)", base_url)
    return m.group(1) if m else "unknown"


def fetch_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "night-job-analyzer/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_js_json(url, var_prefix):
    """Fetch a Difido .js file and parse the embedded JSON object."""
    text = fetch_text(url)
    json_str = text.strip()
    if json_str.startswith(var_prefix):
        json_str = json_str[len(var_prefix):]
    json_str = json_str.rstrip().rstrip(";")
    return json.loads(json_str)


def parse_js_json(text, var_prefix):
    """Parse a Difido .js string (already fetched) into a JSON object."""
    json_str = text.strip()
    if json_str.startswith(var_prefix):
        json_str = json_str[len(var_prefix):]
    json_str = json_str.rstrip().rstrip(";")
    return json.loads(json_str)


# ---------------------------------------------------------------------------
# Execution tree walking
# ---------------------------------------------------------------------------

def iter_tests(execution):
    """Yield (suite_name, test_node) for every leaf test in the execution tree."""
    machines = execution.get("machines") or []
    for machine in machines:
        for suite_scenario in machine.get("children") or []:
            suite_name = suite_scenario.get("name", "")
            _walk(suite_scenario.get("children") or [], suite_name, suite_name)
            for result in _collect_tests(suite_scenario, suite_name):
                yield result


def _collect_tests(node, suite_name):
    if node.get("type") == "test":
        yield suite_name, node
        return
    children = node.get("children") or []
    # If this is the top scenario, its name is the suite; deeper ones are class scenarios
    current_suite = node.get("name", suite_name) if node.get("type") == "scenario" else suite_name
    # Use the outermost (first-level) scenario name as suite
    effective_suite = suite_name
    for child in children:
        yield from _collect_tests(child, effective_suite)


def _walk(children, suite_name, parent_suite):
    pass  # unused helper kept for clarity


def collect_all_tests(execution):
    """
    Returns list of dicts: uid, name, className, status, duration, suite, date, timestamp.
    Also returns suite_summary list and execution properties dict.
    """
    tests = []
    suite_summaries = []
    props = {}

    machines = execution.get("machines") or []
    for machine in machines:
        for suite_node in machine.get("children") or []:
            if suite_node.get("type") != "scenario":
                continue
            suite_name = suite_node.get("name", "")
            # Execution properties live on the first suite's scenarioProperties
            if not props and suite_node.get("scenarioProperties"):
                props = suite_node["scenarioProperties"]

            counts = {"success": 0, "failure": 0, "error": 0, "warning": 0}
            total_duration = 0

            for class_node in suite_node.get("children") or []:
                for test_node in class_node.get("children") or []:
                    if test_node.get("type") != "test":
                        continue
                    st = (test_node.get("status") or "").lower()
                    dur = test_node.get("duration") or 0
                    if st in counts:
                        counts[st] += 1
                    elif st == "success":
                        counts["success"] += 1
                    total_duration += dur

                    tests.append({
                        "uid": test_node.get("uid", ""),
                        "name": test_node.get("name", ""),
                        "className": test_node.get("className", ""),
                        "status": st,
                        "duration_ms": dur,
                        "suite": suite_name,
                        "date": test_node.get("date", ""),
                        "timestamp": test_node.get("timestamp", ""),
                        "index": test_node.get("index", 0),
                    })

            total = sum(counts.values())
            pass_rate = round(counts["success"] / total * 100) if total else 0
            suite_summaries.append({
                "suite": suite_name,
                "total": total,
                "success": counts["success"],
                "error": counts["error"],
                "failure": counts["failure"],
                "warning": counts["warning"],
                "pass_rate": pass_rate,
                "duration_ms": total_duration,
            })

    return tests, suite_summaries, props


# ---------------------------------------------------------------------------
# HTML helpers
# ---------------------------------------------------------------------------

def strip_html(text):
    return re.sub(r"<[^>]+>", "", text or "").strip()


API_HEADERS = [
    "Request URL:", "Request Method:", "Request Headers:", "Request Body:",
    "Response Headers:", "Response Code:", "Response Body:",
    "Response Error:", "Response Error Code:",
]


def extract_section(text, header):
    if not text:
        return ""
    idx = text.find(header)
    if idx < 0:
        return ""
    start = idx + len(header)
    end = len(text)
    for h in API_HEADERS:
        if h == header:
            continue
        pos = text.find(h, start)
        if 0 < pos < end:
            end = pos
    return text[start:end].strip()


# ---------------------------------------------------------------------------
# Failure extraction (mirrors extract_failure.py logic)
# ---------------------------------------------------------------------------

def find_failure(elements):
    """Walk the report elements and extract the best failure context.

    Strategy:
    - Collect ALL failure/error elements (skipping level markers).
    - Prefer the element that has a non-empty message (stack trace / exception).
    - If none have a message, use the first one that has a meaningful title.
    - Track the last successful API call seen before the chosen failure element.
    """
    bad = {"failure", "error", "warning"}
    level_stack = []
    last_api_msg = None
    last_api_title = None
    # Track API history to detect finally-block cleanup calls.
    # A finally-block API is one whose title/action was already seen earlier as a success —
    # e.g. "asset/action/update" appearing a second time right before the failure
    # after "asset/action/getPlaybackContext" is a cleanup, not the cause.
    api_title_history = []  # list of (title, msg) in order
    pre_finally_api_msg = None   # last API before a suspected finally cleanup
    pre_finally_api_title = None
    failure_candidates = []

    for i, s in enumerate(elements):
        stype = s.get("type", "")
        status = (s.get("status") or "").lower()
        title = strip_html(s.get("title", ""))
        message = strip_html(s.get("message", ""))

        # Level markers: always push/pop regardless of status
        if stype == "startLevel":
            level_stack.append(title or "")
            continue
        if stype == "stopLevel":
            if level_stack:
                level_stack.pop()
            continue

        is_api = "API Call:" in title
        if status == "success" and is_api:
            action_short = title.split("API Call:")[-1].strip() if "API Call:" in title else title
            # Detect finally-block cleanup pattern:
            # The same API appears again BUT the immediately preceding API was DIFFERENT.
            # This means the sequence was: [test_api] → [some_other_api] → [test_api again = cleanup]
            # Only trigger when:
            #   1. This action was seen before
            #   2. The last recorded API is a DIFFERENT action
            #   3. The one before THAT was the SAME action as this one
            # i.e., the pattern is: update(test) → getPlaybackContext → update(cleanup)
            if (len(api_title_history) >= 2
                    and action_short in api_title_history[-2][0]   # same as 2 back
                    and action_short not in api_title_history[-1][0]):  # different from last
                pre_finally_api_msg   = last_api_msg
                pre_finally_api_title = last_api_title
            api_title_history.append((action_short, message))
            last_api_msg = message
            last_api_title = title
            continue

        if status in bad:
            failure_candidates.append((
                i,
                " > ".join(level_stack) if level_stack else "",
                title,
                message,
                is_api,
                last_api_msg,
                last_api_title,
            ))

    if not failure_candidates:
        return None

    # Pick the best candidate:
    # 1. First with non-empty message (has stack trace / exception text)
    # 2. First with non-empty title
    # 3. First overall
    chosen = None
    for candidate in failure_candidates:
        _, _, _, msg, _, _, _ = candidate
        if msg:
            chosen = candidate
            break
    if chosen is None:
        for candidate in failure_candidates:
            _, _, ttl, _, _, _, _ = candidate
            if ttl:
                chosen = candidate
                break
    if chosen is None:
        chosen = failure_candidates[0]

    idx, level, title, message, is_api, api_msg, api_title = chosen

    # Collect titles from all failure elements for a richer fail_title
    all_titles = [strip_html(c[2]) for c in failure_candidates if c[2]]
    # Use the first meaningful title
    display_title = title
    if not display_title and message:
        first_msg_line = message.split("\n", 1)[0].strip()
        # Only use message as title if it looks like an exception (not a bracket-wrapped frame list)
        if not first_msg_line.startswith("["):
            display_title = first_msg_line[:200]
    if not display_title and all_titles:
        display_title = all_titles[0]
    # Replace display_title with api_title only if the title looks like a plain stack frame,
    # NOT if it starts with '[' (Difido warning format) — those need code-context analysis
    if display_title.startswith("com.") and api_title:
        display_title = api_title
    # If still empty (warning with no title), use the level or a generic placeholder
    if not display_title:
        display_title = level.split(" > ")[-1] if level else "Warning in test setup"

    # Stack trace and exception head from message
    stack = []
    exception_head = ""
    if message:
        for line in message.splitlines():
            line = line.strip()
            # Skip bracket-wrapped stack list header (warning format: "[frame, frame, ...]")
            if not exception_head and line and not line.startswith("["):
                exception_head = line[:300]
            # Extract frames — they appear as "com.kaltura..." inside the bracket list
            # or as "at com.kaltura..." in normal format
            if line.startswith("at "):
                stack.append(line[3:])
            elif line.startswith("com.kaltura.") or line.startswith("com.google."):
                # Inside a bracket-wrapped list, frames have no "at " prefix
                # Split on comma to get individual frames
                pass
            if len(stack) >= 8:
                break
        # If message is a bracket-wrapped frame list "[frame1, frame2, ...]"
        # extract the frames from it and set exception_head to first kaltura frame
        if message.startswith("[") and message.endswith("]"):
            frame_list = message[1:-1]
            for frame in frame_list.split(","):
                frame = frame.strip()
                if "(" in frame and ":" in frame:
                    if not stack:
                        # Use the first frame as exception_head (no exception class available)
                        exception_head = frame[:300]
                    stack.append(frame)
                    if len(stack) >= 8:
                        break

    # If no exception in chosen message, look for one in all candidates
    # Skip candidates whose message looks like an API call body (starts with "Request URL:")
    if not exception_head:
        for candidate in failure_candidates:
            _, _, _, msg, _, _, _ = candidate
            if msg:
                lines = strip_html(msg).splitlines()
                first_line = next((l.strip() for l in lines if l.strip()), "")
                # Skip API call message content — it's not an exception
                if first_line.startswith("Request URL:") or first_line.startswith("Request Method:"):
                    continue
                exception_head = first_line[:300]
                for line in lines:
                    line = line.strip()
                    if line.startswith("at "):
                        stack.append(line[3:])
                        if len(stack) >= 8:
                            break
                break

    def _build_api_dict(api_msg, api_title):
        if not api_msg:
            return None
        return {
            "title": (api_title or "")[:200],
            "request_url": extract_section(api_msg, "Request URL:"),
            "request_method": extract_section(api_msg, "Request Method:"),
            "request_body": extract_section(api_msg, "Request Body:")[:2000],
            "response_code": extract_section(api_msg, "Response Code:"),
            "response_error": extract_section(api_msg, "Response Error:"),
            "response_error_code": extract_section(api_msg, "Response Error Code:"),
            "response_body": extract_section(api_msg, "Response Body:")[:2000],
        }

    # Build last_api — but if it looks like a finally-block cleanup, use pre_finally instead
    effective_api_msg = message if is_api else api_msg
    effective_api_title = title if is_api else api_title
    last_api = _build_api_dict(effective_api_msg, effective_api_title)

    # pre_finally_api: the API that was active before a detected cleanup call
    pre_finally_api = _build_api_dict(pre_finally_api_msg, pre_finally_api_title) \
                      if pre_finally_api_msg else None

    # Collect the last 10 meaningful steps before the first failure
    # These tell the story of what happened leading up to the failure
    first_fail_idx = failure_candidates[0][0]
    recent_steps = []
    SKIP_TYPES = {"startLevel", "stopLevel"}
    SKIP_TITLES = {"download xml file", "host:", "username:", "pk.txt"}
    # Patterns that identify debug/data-dump lines, not real test steps:
    # - "Media ID:..., Dash File ID:..." — report.log() debug prints from loops
    # - "Full response body (open link..." — attachment links
    # - "Adding run property" — framework metadata
    # - Lines that start with data values (ID:, File ID:, Total count of)
    SKIP_PREFIXES = (
        "media id:", "dash file id:", "full response body",
        "adding run property", "total count of",
        "response body field",  # individual assertion success lines
    )
    for j in range(max(0, first_fail_idx - 200), first_fail_idx):
        el = elements[j]
        if el.get("type") in SKIP_TYPES:
            continue
        t_raw = strip_html(el.get("title", "") or "")
        if not t_raw:
            continue
        t_lower = t_raw.lower()
        # Skip very low-level noise steps
        if any(noise in t_lower for noise in SKIP_TITLES):
            continue
        # Skip debug/data-dump lines
        if any(t_lower.startswith(p) for p in SKIP_PREFIXES):
            continue
        # Skip lines that look like pure data (e.g. "Media ID:2072141, Dash File ID: ...")
        if re.match(r'^(media\s*id|file\s*id|asset\s*id|household\s*id|subscription\s*id)\s*:', t_lower):
            continue
        is_api_step = "API Call:" in t_raw
        st = (el.get("status") or "").lower()
        recent_steps.append({
            "title": t_raw[:200],
            "status": st,
            "is_api": is_api_step,
        })
    # Keep last 10
    recent_steps = recent_steps[-10:]

    return {
        "step_index": idx,
        "level": level,
        "fail_title": display_title[:300],
        "exception_head": exception_head,
        "stack_top": stack,
        "last_api": last_api,
        "pre_finally_api": pre_finally_api,
        "all_fail_titles": all_titles[:5],
        "recent_steps": recent_steps,
    }


def classify_phase(level):
    l = (level or "").lower()
    if "setupbeforeclass" in l or ("setup" in l and "@beforeclass" in l):
        return "BEFORE_CLASS"
    if "setupbeforesuite" in l or "@beforesuite" in l:
        return "BEFORE_SUITE"
    if "setupbeforetest" in l or "@beforetest" in l:
        return "BEFORE_TEST"
    if "@beforemethod" in l or "setupbeforemethod" in l:
        return "BEFORE_METHOD"
    if "teardown" in l or "@after" in l:
        return "TEARDOWN"
    if "setup" in l:
        return "SETUP"
    return "TEST_BODY"


def classify_root_cause(ctx):
    if ctx is None:
        return "Unknown"
    eh = (ctx.get("exception_head") or "").lower()
    ft = (ctx.get("fail_title") or "").lower()
    phase = ctx.get("phase", "TEST_BODY")
    api = ctx.get("last_api") or {}
    rc = str(api.get("response_code", ""))
    re_err = (api.get("response_error") or "").lower()
    re_code = (api.get("response_error_code") or "").lower()
    rb = (api.get("response_body") or "").lower()

    if phase in ("BEFORE_CLASS", "BEFORE_METHOD", "BEFORE_SUITE", "BEFORE_TEST", "SETUP"):
        return "Setup Failure"

    # No data at all — failure step had no message/title/api captured
    if not eh and not ft and not api:
        return "No Diagnostic Data"

    # Timeout patterns
    if any(x in eh for x in ("timeout", "sockettimeout", "connecttimeout", "read timed out",
                              "conditiontimeoutexception", "awaitilityexception")):
        return "Timeout"
    if "timed out" in ft or "was not moved to target folder" in ft:
        return "Timeout"

    # NPE
    if "nullpointerexception" in eh:
        return "NullPointerException"

    # Auth
    if "401" in rc or "403" in rc or "authorizationexception" in eh or "unauthorized" in re_err:
        return "Auth Failure"

    # HTTP-level errors (non-200 response code)
    if "500" in rc or "internalservererror" in eh:
        return "Server Error (500)"
    if rc.startswith("4") and len(rc) == 3:
        return f"HTTP {rc}"
    if rc.startswith("5") and len(rc) == 3:
        return f"HTTP {rc}"

    # API error in response body (HTTP 200 but error inside JSON)
    if '"kalturaapiexception"' in rb or '"error"' in rb and '"code"' in rb:
        return "API Error"
    if "apiexception" in eh or "kalturaapiexception" in eh or re_code:
        return "API Error"
    if "api call failed" in ft or "response error message" in ft:
        return "API Error"
    if "api call: fail" in ft or "phoenix api call: fail" in ft:
        return "API Error"

    # Assertion / data mismatch
    if any(x in eh for x in ("assertionerror", "assertionexception")):
        return "Assertion Failure"
    if any(x in ft for x in ("value is", "assertion failed", "no results for path",
                              "expected to be", "failed in deleting", "does not contain",
                              "is not as expected", "list is '", "assetids")):
        return "Assertion Failure"
    if "failed to find coralogix log" in ft:
        return "Coralogix Log Not Found"
    if "failed to find" in ft or "failed to get" in ft:
        return "Test Setup / Data Error"

    # Specific exception types
    if "classcastexception" in eh:
        return "ClassCastException"
    if "indexoutofboundsexception" in eh or "arrayindexoutofbounds" in eh:
        return "IndexOutOfBoundsException"
    if "numberformatexception" in eh:
        return "NumberFormatException"
    if "illegalargumentexception" in eh:
        return "IllegalArgumentException"
    if "illegalstateexception" in eh:
        return "IllegalStateException"
    if "filenotfoundexception" in eh:
        return "File Not Found"
    if "java.lang.exception" in eh or "java.io.exception" in eh:
        return "Test Setup / Data Error"
    if "org.testng.testexception" in eh:
        return "Assertion Failure"

    # Unexpected exception with no other signal
    if "unexpected exception" in ft:
        return "Unexpected Exception"

    if phase == "TEARDOWN":
        return "Teardown Failure"
    return "Unknown"


# ---------------------------------------------------------------------------
# Fetch one failed test's details
# ---------------------------------------------------------------------------

def fetch_test_detail(base_url, test):
    uid = test["uid"]
    url = f"{base_url}/tests/test_{uid}/test.js"
    try:
        data = fetch_js_json(url, "var test = ")
    except Exception as e:
        return test["uid"], {"error": str(e)}

    elements = data.get("reportElements") or []
    ctx = find_failure(elements)
    if ctx is None:
        return uid, {"verdict": "no_failure_found"}

    ctx["phase"] = classify_phase(ctx["level"])
    ctx["root_cause"] = classify_root_cause(ctx)
    ctx["total_steps"] = len(elements)
    return uid, ctx


# ---------------------------------------------------------------------------
# Duration formatting
# ---------------------------------------------------------------------------

def fmt_duration(ms):
    s = ms // 1000
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h:
        return f"{h}h{m:02d}m{sec:02d}s"
    if m:
        return f"{m}m{sec:02d}s"
    return f"{sec}s"


# ---------------------------------------------------------------------------
# HTML generation
# ---------------------------------------------------------------------------


ROOT_CAUSE_COLORS = {
    "NullPointerException":     "#e74c3c",
    "Timeout":                  "#e67e22",
    "Setup Failure":            "#9b59b6",
    "Auth Failure":             "#c0392b",
    "Assertion Failure":        "#2980b9",
    "API Error":                "#16a085",
    "Server Error (500)":       "#8e44ad",
    "Teardown Failure":         "#7f8c8d",
    "ClassCastException":       "#d35400",
    "IndexOutOfBoundsException":"#27ae60",
    "NumberFormatException":    "#f39c12",
    "IllegalArgumentException": "#f39c12",
    "File Not Found":           "#c0392b",
    "Test Setup / Data Error":  "#8e44ad",
    "Unexpected Exception":     "#7f8c8d",
    "No Diagnostic Data":       "#bdc3c7",
    "Coralogix Log Not Found":  "#1abc9c",
    "IllegalStateException":    "#e67e22",
    "Unknown":                  "#95a5a6",
}

PHASE_BADGE = {
    "TEST_BODY":    ("#2ecc71", "TEST"),
    "BEFORE_CLASS": ("#9b59b6", "SETUP"),
    "BEFORE_METHOD":("#8e44ad", "BEFORE METHOD"),
    "BEFORE_SUITE": ("#6c3483", "BEFORE SUITE"),
    "BEFORE_TEST":  ("#7d3c98", "BEFORE TEST"),
    "TEARDOWN":     ("#7f8c8d", "TEARDOWN"),
    "SETUP":        ("#9b59b6", "SETUP"),
    "UNKNOWN":      ("#bdc3c7", "UNKNOWN"),
}


def build_concise_description(ctx, test):
    """One-line human description of the failure, shown in the table."""
    rc = ctx.get("root_cause", "Unknown")
    ft = ctx.get("fail_title") or ""
    eh = ctx.get("exception_head") or ""
    api = ctx.get("last_api") or {}
    rb = api.get("response_body") or ""
    re_err = api.get("response_error") or ""
    re_code = api.get("response_error_code") or ""
    resp_code = api.get("response_code") or ""
    req_url = api.get("request_url") or ""

    if rc == "No Diagnostic Data":
        return "No diagnostic data captured — test crashed before Difido hook ran"

    if rc == "Coralogix Log Not Found":
        return f"Expected Coralogix log not found: {ft[:120]}"

    if rc == "Timeout":
        return ft[:150] or "Operation timed out"

    if rc == "API Error":
        # Try to extract error code from response body
        import re as _re
        code_match = _re.search(r'"code"\s*:\s*"([^"]+)"', rb)
        msg_match  = _re.search(r'"message"\s*:\s*"([^"]+)"', rb)
        code = code_match.group(1) if code_match else (re_code or "?")
        msg  = msg_match.group(1)  if msg_match  else (re_err  or "API error")
        action = req_url.split("/action/")[-1] if "/action/" in req_url else req_url.rsplit("/", 1)[-1]
        return f"{action}: error {code} — {msg}"[:160]

    if rc == "Assertion Failure":
        if ft:
            return ft[:160]
        return eh[:160] or "Assertion failed"

    if rc == "ClassCastException":
        return f"ClassCastException — {eh[eh.find(':')+1:].strip()[:120] if ':' in eh else 'type mismatch in response parsing'}"

    if rc in ("NullPointerException", "NumberFormatException", "IllegalStateException",
              "IllegalArgumentException", "IndexOutOfBoundsException"):
        short = eh.split(":", 1)[-1].strip()[:120] if ":" in eh else ""
        return f"{rc}{': ' + short if short else ''}"

    if rc == "File Not Found":
        return eh[:160] or "File not found"

    if rc == "Test Setup / Data Error":
        return ft[:160] or eh[:160] or "Setup/data error"

    if rc == "Unexpected Exception":
        return ft[:160] or "Unexpected exception thrown"

    # Fallback: use fail_title > exception_head > generic
    return (ft or eh or "Failure details unavailable")[:160]


def rc_color(rc):
    return ROOT_CAUSE_COLORS.get(rc, "#95a5a6")


def phase_badge_html(phase):
    color, label = PHASE_BADGE.get(phase, ("#bdc3c7", phase))
    return f'<span style="background:{color};color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;display:inline-block">{label}</span>'


def rc_badge_html(rc):
    color = rc_color(rc)
    return f'<span class="rc-badge" style="background:{color};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;display:inline-block;cursor:default">{rc}</span>'


def js_str(s):
    """Escape a Python string for embedding in a JS string literal."""
    return json.dumps(str(s))


def build_html(exec_id, base_url, props, suite_summaries, tests, details):
    """
    tests: list of test dicts from collect_all_tests
    details: dict uid -> failure context dict
    """
    failed_tests = [t for t in tests if t["status"] in ("failure", "error", "warning")]
    total    = len(tests)
    passed   = sum(1 for t in tests if t["status"] == "success")
    n_error  = sum(1 for t in failed_tests if t["status"] == "error")
    n_fail   = sum(1 for t in failed_tests if t["status"] == "failure")
    warned   = sum(1 for t in failed_tests if t["status"] == "warning")
    non_pass = len(failed_tests)
    pass_rate = round(passed / total * 100) if total else 0

    # RCA table excludes Assertion Failures (informational, not actionable individually)
    def _get_rc(t):
        return (details.get(t["uid"]) or {}).get("root_cause", "Unknown")
    EXCLUDED_RCS = {"No Diagnostic Data"}
    rca_tests = [t for t in failed_tests if _get_rc(t) not in EXCLUDED_RCS]
    excluded_count = len(failed_tests) - len(rca_tests)

    env = props.get("Environment", "")
    srv = props.get("Server Version", "")
    branch = props.get("GitHub Branch", "")
    run_date = tests[0]["date"] if tests else ""

    # ---- root cause distribution data (RCA tests only) ----
    rc_counts = {}
    for t in rca_tests:
        rc = _get_rc(t)
        rc_counts[rc] = rc_counts.get(rc, 0) + 1
    # ---- RCA table rows ----
    rca_rows_html = ""
    unique_suites = sorted({t["suite"] for t in rca_tests})
    unique_rcs = sorted(rc_counts.keys())

    for t in sorted(rca_tests, key=lambda x: x["suite"]):
        ctx = details.get(t["uid"]) or {}
        rc = ctx.get("root_cause", "Unknown")
        phase = ctx.get("phase", "UNKNOWN")
        eh = ctx.get("exception_head", "") or ""
        fail_title = ctx.get("fail_title", "") or ""
        stack = ctx.get("stack_top") or []
        api = ctx.get("last_api") or {}
        rca_note = ctx.get("rca_note", "")  # enriched by Claude post-processing

        short_class = t["className"].rsplit(".", 1)[-1] if t["className"] else t["className"]
        test_url = f"{base_url}/tests/test_{t['uid']}/test.html"
        status_badge = (
            '<span style="background:#e67e22;color:#fff;padding:1px 7px;border-radius:3px;font-size:11px">WARNING</span>'
            if t["status"] == "warning" else
            '<span style="background:#e74c3c;color:#fff;padding:1px 7px;border-radius:3px;font-size:11px">FAIL</span>'
        )

        # Concise description for the table cell
        concise = build_concise_description(ctx, t)
        summary_short = concise[:180] + ("…" if len(concise) > 180 else "")

        # Detail panel content
        stack_html = ""
        if stack:
            stack_html = "<b>Stack trace:</b><pre style='font-size:11px;margin:4px 0'>" + "\n".join(stack) + "</pre>"

        api_html = ""
        if api:
            api_html = f"""
            <b>Last API call:</b>
            <pre style='font-size:11px;margin:4px 0;white-space:pre-wrap'><b>{api.get('title','')}</b>
URL: {api.get('request_url','')}
Method: {api.get('request_method','')}
Response Code: {api.get('response_code','')}
Response Error: {api.get('response_error','')} {api.get('response_error_code','')}
Response Body:
{api.get('response_body','')[:1000]}
</pre>"""

        rca_note_html = f"<div class='rca-analysis' style='background:#fffbe6;border-left:3px solid #f39c12;padding:8px 12px;margin-bottom:8px;font-size:12px'><b>RCA Analysis:</b> {rca_note}</div>"

        row_id = f"row-{t['uid']}"
        rca_rows_html += f"""
        <tr class="rca-row" data-rc="{rc}" data-suite="{t['suite']}" data-phase="{phase}" data-status="{t['status']}"
            onclick="toggleDetail('{row_id}')">
          <td><a href="{test_url}" target="_blank" onclick="event.stopPropagation()">{t['name']}</a><br>
              <span style="color:#888;font-size:11px">{short_class}</span></td>
          <td style="font-size:11px">{t['suite']}</td>
          <td>{status_badge}</td>
          <td>{phase_badge_html(phase)}</td>
          <td>{rc_badge_html(rc)}</td>
          <td style="font-size:11px;color:#555;word-break:break-all">{api.get('request_url','')[:100]}</td>
          <td style="font-size:11px">{api.get('response_code','')}</td>
          <td style="font-size:12px;color:#333">{summary_short}</td>
        </tr>
        <tr id="{row_id}" class="detail-row" style="display:none">
          <td colspan="8" style="background:#f8f9fa;padding:12px 20px">
            {rca_note_html}
            {stack_html}
            {api_html}
          </td>
        </tr>"""

    # ---- filter dropdowns ----
    suite_options = "".join(f'<option value="{s}">{s}</option>' for s in unique_suites)
    rc_options = "".join(f'<option value="{r}">{r}</option>' for r in unique_rcs)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Night Job Report — exec_{exec_id}</title>

<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #f0f2f5; color: #2c3e50; }}
  .header {{ background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
             color: #fff; padding: 24px 32px; }}
  .header h1 {{ font-size: 22px; font-weight: 600; }}
  .header .meta {{ font-size: 13px; color: #aab; margin-top: 6px; display: flex; gap: 24px; flex-wrap: wrap; }}
  .header .meta span {{ display: flex; align-items: center; gap: 6px; }}
  .content {{ max-width: 1400px; margin: 0 auto; padding: 24px 20px; }}
  .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr));
                 gap: 16px; margin-bottom: 24px; }}
  .stat-card {{ background: #fff; border-radius: 10px; padding: 20px; text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,.07); }}
  .stat-card .val {{ font-size: 36px; font-weight: 700; }}
  .stat-card .lbl {{ font-size: 12px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: .5px; }}
  .stat-card.pass .val {{ color: #27ae60; }}
  .stat-card.fail .val {{ color: #e74c3c; }}
  .stat-card.warn .val {{ color: #e67e22; }}
  .card {{ background: #fff; border-radius: 10px; padding: 20px 24px;
           box-shadow: 0 2px 8px rgba(0,0,0,.07); margin-bottom: 24px; }}
  .card h2 {{ font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #34495e; }}
  table {{ width: 100%; border-collapse: collapse; table-layout: fixed; }}
  th {{ background: #f8f9fa; font-size: 12px; font-weight: 600; text-transform: uppercase;
        letter-spacing: .4px; padding: 10px 12px; text-align: left; color: #7f8c8d;
        border-bottom: 2px solid #e9ecef; overflow: hidden; }}
  td {{ padding: 9px 12px; border-bottom: 1px solid #f0f2f5; vertical-align: top;
        overflow: hidden; word-break: break-word; }}
  td.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  td.pass {{ color: #27ae60; font-weight: 600; }}
  td.err  {{ color: #c0392b; font-weight: 600; }}
  td.fail {{ color: #e74c3c; font-weight: 600; }}
  td.warn {{ color: #e67e22; font-weight: 600; }}
  tr:last-child td {{ border-bottom: none; }}
  /* Column widths for the RCA table: Test, Suite, Status, Phase, RootCause, LastAPI, HTTP, Details */
  #rcaTable th:nth-child(1), #rcaTable td:nth-child(1) {{ width: 16%; }}
  #rcaTable th:nth-child(2), #rcaTable td:nth-child(2) {{ width: 14%; }}
  #rcaTable th:nth-child(3), #rcaTable td:nth-child(3) {{ width: 6%; }}
  #rcaTable th:nth-child(4), #rcaTable td:nth-child(4) {{ width: 7%; }}
  #rcaTable th:nth-child(5), #rcaTable td:nth-child(5) {{ width: 11%; }}
  #rcaTable th:nth-child(6), #rcaTable td:nth-child(6) {{ width: 14%; }}
  #rcaTable th:nth-child(7), #rcaTable td:nth-child(7) {{ width: 5%; }}
  #rcaTable th:nth-child(8), #rcaTable td:nth-child(8) {{ width: 27%; }}
  .rca-row {{ cursor: pointer; transition: background .15s; }}
  .rca-row:hover {{ background: #f8f9fa; }}
  .filter-bar {{ display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }}
  .filter-bar select, .filter-bar input {{
    padding: 7px 10px; border: 1px solid #ddd; border-radius: 6px;
    font-size: 13px; background: #fff; }}
  .filter-bar button {{
    padding: 7px 14px; background: #3498db; color: #fff; border: none;
    border-radius: 6px; cursor: pointer; font-size: 13px; }}
  .filter-bar button:hover {{ background: #2980b9; }}
  .export-btn {{
    padding: 7px 16px; background: #27ae60; color: #fff; border: none;
    border-radius: 6px; cursor: pointer; font-size: 13px; margin-left: auto; }}
  .export-btn:hover {{ background: #229954; }}
  a {{ color: #2980b9; text-decoration: none; }}
  a:hover {{ text-decoration: underline; }}
  .detail-row td {{ padding: 0; }}
  .count-badge {{ display: inline-block; background: #e74c3c; color: #fff;
                  border-radius: 12px; font-size: 11px; padding: 1px 7px; margin-left: 6px; }}
</style>
</head>
<body>

<div class="header">
  <h1>Night Job Report &mdash; exec_{exec_id}</h1>
  <div class="meta">
    <span>📅 {run_date}</span>
    <span>🌐 Environment: <b>{env}</b></span>
    <span>🔧 Server: <b>{srv}</b></span>
    <span>🌿 Branch: <b>{branch}</b></span>
    <span><a href="{base_url}/index.html" target="_blank" style="color:#7ec8f7">View Difido Report ↗</a></span>
  </div>
</div>

<div class="content">

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card"><div class="val">{total}</div><div class="lbl">Total Tests</div></div>
    <div class="stat-card pass"><div class="val">{passed}</div><div class="lbl">Passed</div></div>
    <div class="stat-card fail"><div class="val">{n_error}</div><div class="lbl">Error</div></div>
    <div class="stat-card fail" style="opacity:.85"><div class="val">{n_fail}</div><div class="lbl">Failure</div></div>
    <div class="stat-card warn"><div class="val">{warned}</div><div class="lbl">Warning</div></div>
    <div class="stat-card {'pass' if pass_rate>=80 else ('warn' if pass_rate>=60 else 'fail')}">
      <div class="val">{pass_rate}%</div><div class="lbl">Pass Rate</div></div>
  </div>
  <p style="font-size:12px;color:#888;margin:-16px 0 16px 4px">
    {excluded_count} tests excluded from the RCA table: No Diagnostic Data (setup crash with no captured details).</p>

  <!-- RCA Table -->
  <div class="card">
    <h2>Root Cause Analysis
      <span class="count-badge">{len(rca_tests)} issues</span>
    </h2>

    <div class="filter-bar">
      <input id="searchBox" placeholder="🔍 Search test name…" oninput="applyFilters()" style="min-width:200px">
      <select id="rcFilter" onchange="applyFilters()">
        <option value="">All Root Causes</option>
        {rc_options}
      </select>
      <select id="suiteFilter" onchange="applyFilters()">
        <option value="">All Suites</option>
        {suite_options}
      </select>
      <select id="phaseFilter" onchange="applyFilters()">
        <option value="">All Phases</option>
        <option value="TEST_BODY">Test Body</option>
        <option value="BEFORE_CLASS">Before Class</option>
        <option value="BEFORE_METHOD">Before Method</option>
        <option value="TEARDOWN">Teardown</option>
        <option value="SETUP">Setup</option>
      </select>
      <select id="statusFilter" onchange="applyFilters()">
        <option value="">All Statuses</option>
        <option value="failure">Failure</option>
        <option value="error">Error</option>
        <option value="warning">Warning</option>
      </select>
      <button onclick="resetFilters()">Reset</button>
      <button class="export-btn" onclick="exportCSV()">⬇ Export CSV</button>
    </div>

    <div id="noResults" style="display:none;padding:20px;text-align:center;color:#888">
      No tests match the current filter.
    </div>

    <div style="overflow-x:auto">
    <table id="rcaTable">
      <thead><tr>
        <th>Test</th><th>Suite</th><th style="width:6%">Status</th><th>Phase</th><th>Root Cause</th>
        <th>Last API</th><th>HTTP</th><th>Details</th>
      </tr></thead>
      <tbody id="rcaBody">{rca_rows_html}</tbody>
    </table>
    </div>
  </div>

</div><!-- /content -->

<script>

// ---- Row expand ----
function toggleDetail(id) {{
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
}}

// ---- Filters ----
function applyFilters() {{
  const search = document.getElementById('searchBox').value.toLowerCase();
  const rc     = document.getElementById('rcFilter').value;
  const suite  = document.getElementById('suiteFilter').value;
  const phase  = document.getElementById('phaseFilter').value;
  const status = document.getElementById('statusFilter').value;
  let visible = 0;
  document.querySelectorAll('#rcaBody .rca-row').forEach(row => {{
    const matchRc     = !rc     || row.dataset.rc     === rc;
    const matchSuite  = !suite  || row.dataset.suite  === suite;
    const matchPhase  = !phase  || row.dataset.phase  === phase;
    const matchStatus = !status || row.dataset.status === status;
    const matchSearch = !search || row.textContent.toLowerCase().includes(search);
    const show = matchRc && matchSuite && matchPhase && matchStatus && matchSearch;
    row.style.display = show ? '' : 'none';
    const nextRow = row.nextElementSibling;
    if (nextRow && nextRow.classList.contains('detail-row')) {{
      if (!show) nextRow.style.display = 'none';
    }}
    if (show) visible++;
  }});
  document.getElementById('noResults').style.display = visible === 0 ? 'block' : 'none';
}}

function resetFilters() {{
  document.getElementById('searchBox').value = '';
  document.getElementById('rcFilter').value = '';
  document.getElementById('suiteFilter').value = '';
  document.getElementById('phaseFilter').value = '';
  document.getElementById('statusFilter').value = '';
  applyFilters();
}}

// ---- CSV export ----
function exportCSV() {{
  const rows = [['Test','Class','Suite','Status','Phase','Root Cause','API URL','HTTP Code','Summary']];
  document.querySelectorAll('#rcaBody .rca-row').forEach(row => {{
    if (row.style.display === 'none') return;
    const cells = row.querySelectorAll('td');
    const testCell = cells[0];
    const name = testCell.querySelector('a') ? testCell.querySelector('a').textContent.trim() : '';
    const cls  = testCell.querySelector('span') ? testCell.querySelector('span').textContent.trim() : '';
    const suite   = cells[1].textContent.trim();
    const status  = row.dataset.status;
    const phase   = row.dataset.phase;
    const rc      = row.dataset.rc;
    const apiUrl  = cells[5].textContent.trim();
    const http    = cells[6].textContent.trim();
    const detail  = cells[7].textContent.trim().replace(/,/g,' ');
    rows.push([name, cls, suite, status, phase, rc, apiUrl, http, detail]);
  }});
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'rca_exec_{exec_id}.csv';
  a.click();
}}
</script>
</body>
</html>"""
    return html


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    # --from-file mode: data already fetched by browser, no network needed
    if sys.argv[1] == "--from-file":
        if len(sys.argv) < 3:
            print("ERROR: --from-file requires a path argument", file=sys.stderr)
            sys.exit(1)
        fetched_path = sys.argv[2]
        print(f"[analyzer] Loading pre-fetched data from {fetched_path} ...", file=sys.stderr)
        with open(fetched_path, encoding="utf-8") as f:
            fetched = json.load(f)

        base_url = normalise_base(fetched["base_url"])
        exec_id = exec_id_from_url(base_url)

        try:
            execution = parse_js_json(fetched["execution_js"], "var execution = ")
        except Exception as e:
            print(f"ERROR: Could not parse execution_js: {e}", file=sys.stderr)
            sys.exit(1)

        tests, suite_summaries, props = collect_all_tests(execution)
        failed_tests = [t for t in tests if t["status"] in ("failure", "error", "warning")]
        print(f"[analyzer] Total tests: {len(tests)}  |  Failed: {len(failed_tests)}", file=sys.stderr)

        # Parse pre-fetched test details
        details = {}
        prefetched_test_data = fetched.get("test_details", {})
        for t in failed_tests:
            uid = t["uid"]
            raw = prefetched_test_data.get(uid)
            if not raw:
                # No test.js on server — test crashed before Difido hook ran
                details[uid] = {
                    "phase": "TEST_BODY", "level": "",
                    "fail_title": "", "exception_head": "",
                    "stack_top": [], "last_api": None,
                    "root_cause": "No Diagnostic Data", "total_steps": 0,
                }
                continue
            try:
                data = parse_js_json(raw, "var test = ")
                elements = data.get("reportElements") or []
                ctx = find_failure(elements)
                if ctx is None:
                    details[uid] = {
                        "phase": "TEST_BODY", "level": "",
                        "fail_title": "", "exception_head": "",
                        "stack_top": [], "last_api": None,
                        "root_cause": "No Diagnostic Data", "total_steps": len(elements),
                    }
                else:
                    ctx["phase"] = classify_phase(ctx["level"])
                    ctx["root_cause"] = classify_root_cause(ctx)
                    ctx["total_steps"] = len(elements)
                    details[uid] = ctx
            except Exception as e:
                details[uid] = {
                    "phase": "TEST_BODY", "level": "",
                    "fail_title": f"Parse error: {e}", "exception_head": "",
                    "stack_top": [], "last_api": None,
                    "root_cause": "No Diagnostic Data", "total_steps": 0,
                }

    else:
        # Direct network fetch mode
        base_url = normalise_base(sys.argv[1])
        exec_id = exec_id_from_url(base_url)
        print(f"[analyzer] Fetching execution data from {base_url} ...", file=sys.stderr)

        try:
            execution = fetch_js_json(f"{base_url}/execution.js", "var execution = ")
        except Exception as e:
            print(f"ERROR: Could not fetch execution.js: {e}", file=sys.stderr)
            sys.exit(1)

        tests, suite_summaries, props = collect_all_tests(execution)
        failed_tests = [t for t in tests if t["status"] in ("failure", "error", "warning")]

        print(f"[analyzer] Total tests: {len(tests)}  |  Failed: {len(failed_tests)}", file=sys.stderr)

        # Fetch all failed test details in parallel
        details = {}
        max_workers = min(20, len(failed_tests) or 1)
        print(f"[analyzer] Fetching {len(failed_tests)} failed test details (workers={max_workers}) ...", file=sys.stderr)

        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {pool.submit(fetch_test_detail, base_url, t): t for t in failed_tests}
            done = 0
            for future in as_completed(futures):
                uid, ctx = future.result()
                details[uid] = ctx
                done += 1
                if done % 50 == 0 or done == len(failed_tests):
                    print(f"[analyzer]   {done}/{len(failed_tests)} done", file=sys.stderr)

    # Emit a JSON data file for Claude to use when doing Java source enrichment
    data_for_enrichment = []
    for t in failed_tests:
        ctx = details.get(t["uid"]) or {}
        if ctx.get("verdict") == "no_failure_found":
            continue
        data_for_enrichment.append({
            "uid": t["uid"],
            "name": t["name"],
            "className": t["className"],
            "suite": t["suite"],
            "phase": ctx.get("phase", "TEST_BODY"),
            "root_cause": ctx.get("root_cause", "Unknown"),
            "exception_head": ctx.get("exception_head", ""),
            "fail_title": ctx.get("fail_title", ""),
            "all_fail_titles": ctx.get("all_fail_titles", []),
            "stack_top": ctx.get("stack_top", []),
            "last_api": ctx.get("last_api"),
            "pre_finally_api": ctx.get("pre_finally_api"),
            "recent_steps": ctx.get("recent_steps", []),
            "test_url": f"{base_url}/tests/test_{t['uid']}/test.html",
        })

    # Write enrichment data JSON
    json_path = os.path.abspath(f"night_job_report_{exec_id}_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data_for_enrichment, f, indent=2, ensure_ascii=False)
    print(f"[analyzer] Enrichment data → {json_path}", file=sys.stderr)

    # Generate HTML
    html = build_html(exec_id, base_url, props, suite_summaries, tests, details)
    out_path = os.path.abspath(f"night_job_report_{exec_id}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"[analyzer] HTML report → {out_path}", file=sys.stderr)
    # Print paths for the skill to consume
    print(out_path)
    print(json_path)


if __name__ == "__main__":
    main()
