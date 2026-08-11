#!/usr/bin/env python3
"""
Generate a short code-vs-response explanation for every failing test.

Reads the code_context.json produced by extract_code_context.py and writes
a uid->explanation map to <html_path>.explanations.json.

Then patches the HTML: for each row-{uid}, it fills the explanation into
the RCA Analysis div.

Usage:
    explain_failures.py <code_context_json> <html_path>

Exit codes:
    0  success
    1  error
"""

import json
import os
import re
import sys


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_in_finally_block(src_path, api_call_keyword):
    """
    Return True if the given API call keyword (e.g. 'asset/action/update' or
    'updateAssetProviderId') appears exclusively inside a finally{} block
    in the source file — i.e., it is a cleanup call, not the cause of failure.

    Strategy: scan the source for every occurrence of the keyword and check
    whether it is nested inside a `} finally {` scope. We track brace depth
    relative to the last `finally {` opener.
    """
    if not src_path or not api_call_keyword or not os.path.isfile(src_path):
        return False
    try:
        with open(src_path, encoding="utf-8", errors="replace") as f:
            content = f.read()
        lines = content.splitlines()

        # Find all line indices where the keyword appears
        keyword_lines = [i for i, l in enumerate(lines) if api_call_keyword in l]
        if not keyword_lines:
            return False

        # For each occurrence, determine if it is inside a finally block
        # by scanning backward for the enclosing control structure
        for kline in keyword_lines:
            brace_depth = 0
            in_finally = False
            for i in range(kline, -1, -1):
                l = lines[i]
                # Count braces in reverse
                brace_depth += l.count('}') - l.count('{')
                if brace_depth > 0:
                    # We've exited the current block upward
                    # Check if this line opens a finally block
                    stripped = l.strip()
                    if stripped.startswith('} finally') or '} finally {' in l or 'finally {' in l:
                        in_finally = True
                    break
            if not in_finally:
                return False  # At least one occurrence is NOT in finally
        return True  # All occurrences are in finally blocks
    except Exception:
        return False


def _resolve_api_for_rca(t):
    """
    Return the API dict that represents the *cause* of the failure,
    skipping any finally-block cleanup calls.

    Strategy (in order of priority):
    1. If pre_finally_api is set AND the last_api action is confirmed to be in a
       finally block in the source → use pre_finally_api
    2. If pre_finally_api is set AND the last_api is the same action as one that
       appeared earlier (Difido heuristic), AND source confirms it is a finally call
       → use pre_finally_api
    3. Falls back to last_api
    """
    last_api    = t.get("last_api") or {}
    pre_finally = t.get("pre_finally_api")
    snippet     = t.get("code_snippet")
    src_path    = snippet.get("file") if snippet else None

    if not last_api:
        return {}

    # If no pre_finally candidate, nothing to do
    if not pre_finally:
        return last_api

    # Only proceed with the swap if the two APIs are actually different endpoints
    last_url = last_api.get("request_url", "")
    pre_url  = pre_finally.get("request_url", "")
    if not last_url or not pre_url or last_url == pre_url:
        return last_api

    # Source-code verification ONLY — don't rely on Difido heuristic alone.
    # Check if the last_api's action name appears *inside a finally block* in source.
    # The finally block must come before the pre_finally_api's action in the same method.
    if src_path:
        last_action = last_url.split("/action/")[-1].split("?")[0] if "/action/" in last_url else ""
        pre_action  = pre_url.split("/action/")[-1].split("?")[0]  if "/action/" in pre_url  else ""
        if not last_action or not pre_action:
            return last_api
        try:
            with open(src_path, encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
            import re as _re
            # Look for the specific pattern:
            # } finally {
            #   <method containing last_action>    <- cleanup
            # and earlier in the same method:
            #   <method containing pre_action>     <- test body
            for i, line in enumerate(lines):
                if _re.search(r'\}\s*finally\s*\{', line):
                    # Next 5 lines: does last_action appear here?
                    finally_window = "".join(lines[i:min(i+6, len(lines))])
                    if last_action not in finally_window:
                        continue
                    # Before this finally: does pre_action appear in the try block?
                    # Scan back up to 30 lines for the matching try block
                    try_window = "".join(lines[max(0, i-30):i])
                    if pre_action in try_window:
                        return pre_finally  # confirmed: last_api is cleanup, pre_finally is cause
        except Exception:
            pass

    return last_api


def _extract_accessed_field(failing_line):
    """
    From a failing code line, extract what field/array the code was trying to access.
    Covers patterns like:
      .getAsJsonArray("sources").get(0)          -> 'sources[0]'
      .getAsJsonObject().get("status")           -> 'result.status'
      .getAsJsonArray("messages").get(0)         -> 'messages[0]'
      .getAsJsonObject().getAsJsonArray("objects") -> 'objects'
      getValueByJsonPath(resp, "$.field")        -> '$.field'
      JsonUtils.getValueByJsonPath(r, "$.x.y")  -> '$.x.y'
      new AssertResponseBodyField("fieldName",   -> 'fieldName'
      assertion.verify(... "fieldName" ...)      -> 'fieldName'
    Returns a human-readable string, or None.
    """
    if not failing_line:
        return None
    line = failing_line.strip()

    # JsonPath access: getValueByJsonPath(x, "$...") or "$..objects[?(...)]"
    jp = re.search(r'getValueByJsonPath\([^,]+,\s*"(\$[^"]+)"', line)
    if jp:
        return f'JsonPath `{jp.group(1)[:80]}`'

    # Chain: .getAsJsonArray("name").get(N)
    arr_idx = re.search(r'getAsJsonArray\("([^"]+)"\)\.get\((\d+)\)', line)
    if arr_idx:
        return f'`{arr_idx.group(1)}[{arr_idx.group(2)}]`'

    # Chain: .getAsJsonArray("name") without .get()
    arr_only = re.search(r'getAsJsonArray\("([^"]+)"\)', line)
    if arr_only:
        return f'`{arr_only.group(1)}` array'

    # Chain: .getAsJsonObject().get("name")
    obj_field = re.search(r'getAsJsonObject\(\)\.get\("([^"]+)"\)', line)
    if obj_field:
        return f'`{obj_field.group(1)}`'

    # Chain: .get("fieldName")
    get_field = re.search(r'\.get\("([^"]+)"\)', line)
    if get_field:
        return f'`{get_field.group(1)}`'

    # AssertResponseBodyField("fieldName", ...)
    assert_field = re.search(r'Assert\w+\("([^"]+)"', line)
    if assert_field:
        return f'field `{assert_field.group(1)}`'

    # .get(N) without named key
    get_idx = re.search(r'\.get\((\d+)\)', line)
    if get_idx:
        return f'element at index {get_idx.group(1)}'

    return None


def _what_response_has(response_body, accessed_field):
    """
    Given what the code was trying to access, describe what the response
    actually contained — either an error, or the top-level keys present,
    or 'null'/'empty'.
    Returns a string like 'response had error code 1' or
    'response contained: {result, executionTime}' or 'field was null/missing'.
    """
    if not response_body or "too large" in response_body.lower():
        return None
    rb = response_body.strip()

    # Error in response
    err_code_m = re.search(r'"code"\s*:\s*"([^"]+)"', rb)
    err_msg_m  = re.search(r'"message"\s*:\s*"([^"]+)"', rb)
    if err_code_m:
        code = err_code_m.group(1)
        msg  = err_msg_m.group(1) if err_msg_m else "error"
        return f'response contained error `{code}` ("{_truncate(msg, 60)}")'

    # Parse top-level keys of the result object
    try:
        parsed = json.loads(rb)
        result = parsed.get("result", parsed)
        if isinstance(result, list) and result:
            result = result[0]  # multirequest: check first sub-result
        if isinstance(result, dict):
            keys = list(result.keys())[:6]
            # Check if the specific field the code wanted is present
            if accessed_field:
                # Extract bare field name from 'sources[0]' -> 'sources'
                bare = re.sub(r'\[.*\]', '', accessed_field.strip('`').split('.')[-1])
                if bare and bare not in result:
                    present = ", ".join(f"`{k}`" for k in keys)
                    return f'`{bare}` was absent — response had: {present}'
                elif bare and result.get(bare) is None:
                    return f'`{bare}` was null'
            # totalCount = 0 is meaningful
            if result.get("totalCount") == 0:
                return "response returned `totalCount: 0` (empty list)"
            if result.get("totalCount") is not None:
                tc = result["totalCount"]
                return f"response returned `totalCount: {tc}`"
    except Exception:
        pass

    # Fallback: check for explicit null or empty
    if rb in ("null", '{"result":null}', '{"executionTime":0.0,"result":null}'):
        return "response was `null`"

    return None


def _extract_json_error(response_body):
    """Pull (code, message) out of Kaltura error JSON in a response body."""
    if not response_body:
        return None, None
    code_m = re.search(r'"code"\s*:\s*"([^"]+)"', response_body)
    msg_m  = re.search(r'"message"\s*:\s*"([^"]+)"', response_body)
    return (code_m.group(1) if code_m else None,
            msg_m.group(1)  if msg_m  else None)


def _api_action(url):
    """Return 'service/action/name' from a Kaltura API URL.

    e.g. https://api.host/api_v3/service/asset/action/list -> 'asset/action/list'
         https://api.host/api_v3/service/recording/action/add -> 'recording/action/add'
    Falls back to the last path segment when the URL doesn't follow that pattern.
    """
    if not url:
        return "API"
    # Strip query string
    path = url.split("?")[0].rstrip("/")
    if "/action/" in path:
        # Find 'service/<svc>/action/<act>' in the path
        m = re.search(r'/service/([^/]+)/action/([^/]+)$', path)
        if m:
            return f"{m.group(1)}/action/{m.group(2)}"
        # Fallback: grab 'something/action/something'
        idx = path.find("/action/")
        segment = path[max(0, path.rfind("/", 0, idx)+1):]
        return segment
    return path.rsplit("/", 1)[-1]


def _truncate(s, n):
    s = (s or "").strip()
    return s[:n] + ("…" if len(s) > n else "")


def _code_line(snippet, target_line=None):
    """Return a single highlighted line from the snippet."""
    if not snippet:
        return None
    line_no = target_line or snippet.get("line")
    if not line_no:
        return None
    for row in snippet.get("context", "").splitlines():
        if f">>> {line_no:4d}:" in row:
            return row.replace(">>> ", "").strip()
    return None


# ---------------------------------------------------------------------------
# Asset/program "not found" deep diagnosis
# ---------------------------------------------------------------------------

def _extract_total_count(response_body):
    """Return totalCount from a Kaltura list response body, or None."""
    m = re.search(r'"totalCount"\s*:\s*(\d+)', response_body or "")
    return int(m.group(1)) if m else None


def _extract_filter_conditions(code_context):
    """
    Scan the code snippet context lines and surrounding method for conditions
    that filter assets. Returns a list of human-readable condition strings.
    """
    if not code_context:
        return []
    conditions = []
    ctx_lines = code_context.get("context", "")
    method = code_context.get("method", "")

    # Special-case: findProgramAsset in BouyguesAccurateEpgTests
    if "findProgramAsset" in method or "findProgramAsset" in ctx_lines:
        return [
            "asset must have `accurateEPGProviderId` meta",
            "asset must have `enableStartOver = true`",
            "asset name must not contain 'CS' or 'LoadTest'",
            "asset must have at least 1 media file",
            "there must be a currently-airing EPG program on the channel (start_date <= now < end_date)",
        ]

    # General patterns
    filter_patterns = [
        (r'enableStartOver\s*[!=]=\s*true',   'enableStartOver=true required'),
        (r'getMediaFiles\(\)\.size\(\)\s*[>!]=?\s*0', 'non-empty mediaFiles required'),
        (r'getMediaFiles\(\)\.isEmpty\(\)',    'non-empty mediaFiles required'),
        (r'accurateEPGProviderId',             'accurateEPGProviderId meta required'),
        (r'getMetas\(\)\.get\(',               'specific meta field must be non-null'),
        (r'getTags\(\)',                        'specific tag required'),
        (r'getName\(\)\.contains\(',           'asset name filter applied'),
        (r'getName\(\).*LoadTest',             'assets named "LoadTest" excluded'),
        (r'getName\(\).*["\']CS["\']',         'assets named "CS" excluded'),
        (r'start_date.*end_date',              'EPG program must be currently airing (start_date/end_date filter)'),
        (r'kSql',                              'kSql filter applied in request'),
        (r'setTypeIn|setKSql',                 'asset type/kSql filter in request'),
        (r'externalId',                        'externalId filter applied'),
        (r'isSVOD',                            'isSVOD=1 filter required'),
        (r'asset_type',                        'specific asset_type filter required'),
    ]
    for pattern, description in filter_patterns:
        if re.search(pattern, ctx_lines) and description not in conditions:
            conditions.append(description)
    return conditions


def _explain_number_format_exception(t):
    """
    Diagnose NumberFormatException by reading the failing line and tracing
    which variable was null and where it came from (which JsonPath/API call).
    """
    snippet  = t.get("code_snippet")
    api      = t.get("last_api") or {}
    url      = api.get("request_url") or ""
    rb       = api.get("response_body") or ""
    resp_code = api.get("response_code") or ""
    action   = _api_action(url)
    failing_line = _code_line(snippet) if snippet else None
    line_no  = snippet["line"] if snippet else None

    # Read the broader code context to find the variable assignment
    var_name = None
    jsonpath_expr = None
    source_api = None
    assignment_line_no = None

    if snippet:
        ctx = snippet.get("context", "")
        ctx_lines = ctx.splitlines()

        # Find the variable being parsed on the failing line
        # Pattern: Integer.parseInt(varName) or Long.parseLong(varName)
        if failing_line:
            parse_match = re.search(r'(?:Integer|Long)\.parse(?:Int|Long)\(([^)]+)\)', failing_line)
            if parse_match:
                var_name = parse_match.group(1).strip()

        # Read more source lines around the failing line to find the assignment
        src_path = snippet.get("file")
        if src_path and var_name and os.path.isfile(src_path):
            try:
                with open(src_path, encoding="utf-8", errors="replace") as f:
                    all_lines = f.readlines()

                # Search backwards from failing line for the variable assignment
                search_start = max(0, (line_no or 1) - 80)
                search_end   = (line_no or 1)
                for i in range(search_end - 1, search_start, -1):
                    line = all_lines[i].strip()
                    if not (var_name and var_name in line and "JsonUtils.getValueByJsonPath" in line):
                        continue
                    # Check this line and 2 lines above for assertion patterns
                    # (multi-line assertions open on the line above)
                    window = " ".join(l.strip() for l in all_lines[max(0,i-2):i+1])
                    is_assertion = any(p in window for p in (
                        "assertion.verify", "AssertResponseBody", "new Assert",
                    ))
                    # Require the line to look like a variable assignment
                    is_assignment = "=" in line and not line.startswith("//")
                    if not is_assertion and is_assignment:
                        assignment_line_no = i + 1
                        # Extract JsonPath expression
                        # Match JsonPath expression in quotes — may span a string concat
                        jp_match = re.search(r'getValueByJsonPath\([^,]+,\s*"([^"]{8,})"', line)
                        if jp_match:
                            jsonpath_expr = jp_match.group(1)
                        # Extract API response variable to find which API was called
                        resp_var = re.search(r'getValueByJsonPath\((\w+),', line)
                        if resp_var:
                            resp_var_name = resp_var.group(1)
                            # Now find that response variable's API call
                            for j in range(i - 1, max(0, i - 30), -1):
                                prev = all_lines[j].strip()
                                if resp_var_name in prev and ("apiExecutor.run" in prev or "phoenixApiExecutor.run" in prev):
                                    # Extract service from the run() call
                                    svc_match = re.search(r'phoenix\.\w+\(\)\.\w+|phoenix\.\w+\(\)|\.build\w+Request', prev)
                                    if svc_match:
                                        source_api = prev[:120]
                                    break
                        break
            except Exception:
                pass

    # Build the explanation
    parts = []

    if failing_line and line_no:
        parts.append(f"Line {line_no}: `{_truncate(failing_line, 130)}`")
        parts.append(f"— `{var_name or 'the parsed value'}` is `null`.")
    else:
        parts.append(f"`{var_name or 'a value'}` is `null`.")

    if jsonpath_expr and assignment_line_no:
        parts.append(
            f"It was populated at line {assignment_line_no} via JsonPath "
            f"`{_truncate(jsonpath_expr, 120)}` — this JsonPath returned no match, "
            f"so `JsonUtils.getValueByJsonPath` returned `null`."
        )
    elif jsonpath_expr:
        parts.append(
            f"It was populated via JsonPath `{_truncate(jsonpath_expr, 120)}` "
            f"which returned no match."
        )

    # What did the last API return?
    if url and "too large" in rb.lower():
        parts.append(
            f"The preceding `{action}` call (HTTP {resp_code}) returned a large response — "
            f"the JsonPath filter found no object matching its conditions in that response, "
            f"leaving the variable null."
        )
    elif url and rb:
        total = _extract_total_count(rb)
        err_code, err_msg = _extract_json_error(rb)
        if err_code:
            parts.append(
                f"The preceding `{action}` call returned error `{err_code}` (\"{err_msg}\"), "
                f"so the response had no result field to parse."
            )
        elif total == 0:
            parts.append(
                f"The preceding `{action}` call returned `totalCount: 0` — "
                f"no objects matched, so the JsonPath returned null."
            )
        else:
            parts.append(
                f"Last API: `{action}` (HTTP {resp_code}). "
                f"Response: `{_truncate(rb, 100)}`."
            )
    elif not url:
        parts.append(
            "No API call was recorded before the exception — "
            "the variable was likely never assigned because a prior step failed silently."
        )

    return " ".join(parts)


def _explain_not_found(t):
    """
    Produce a detailed explanation when code threw 'Failed to find X'.
    Distinguishes between:
      A) totalCount=0  → API returned no assets at all (query/filter too narrow)
      B) totalCount>0  → assets returned but loop rejected all (condition mismatch)
    """
    eh     = (t.get("exception_head") or "").strip()
    api    = t.get("last_api") or {}
    rb     = api.get("response_body") or ""
    url    = api.get("request_url") or ""
    rb_req = api.get("request_body") or ""
    snippet = t.get("code_snippet")
    action  = _api_action(url)

    # What was not found?
    not_found_what = re.sub(r"java\.lang\.Exception:\s*", "", eh).strip()
    if not not_found_what:
        not_found_what = "required asset/program"

    total_count = _extract_total_count(rb)
    conditions  = _extract_filter_conditions(snippet)

    # Extract kSql or filter params from request body if present
    ksql_match = re.search(r'"value"\s*:\s*"([^"]{10,120})"', rb_req)
    ksql_hint  = f"kSql filter: `{ksql_match.group(1)}`" if ksql_match else ""

    if total_count == 0:
        # API returned nothing at all
        parts = [
            f"`{action}` returned `totalCount: 0` — no assets matched the query.",
        ]
        if ksql_hint:
            parts.append(ksql_hint + ".")
        parts.append(
            "The environment has no assets satisfying the request filter. "
            "Possible causes: test data not set up, assets deleted, or wrong environment."
        )
        return " ".join(parts)

    elif total_count is not None and total_count > 0:
        # Assets were returned but the code loop rejected all of them
        cond_str = "; ".join(conditions) if conditions else "unknown filter condition in the loop"
        parts = [
            f"`{action}` returned `totalCount: {total_count}` assets, "
            f"but the code loop rejected all of them.",
            f"Filter conditions in the loop: {cond_str}.",
            f"None of the {total_count} returned assets met all conditions — "
            "likely a data mismatch (e.g. all assets have enableStartOver=false, "
            "or empty mediaFiles, or missing required meta)."
        ]
        return " ".join(parts)

    else:
        # totalCount not readable — could be truncated large response or response too large warning
        too_large = "too large" in rb.lower() or "WARNING" in rb
        if too_large:
            # API returned many assets (response was truncated), but loop rejected all
            cond_str = "; ".join(conditions) if conditions else "unknown loop conditions"
            return (
                f"`{action}` returned a large response (body truncated in report) — "
                f"many assets were fetched but the code loop rejected all of them. "
                f"Loop requires: {cond_str}. "
                "Check whether any asset in the environment satisfies all conditions simultaneously."
            )
        cond_str = "; ".join(conditions) if conditions else ""
        msg = f"{not_found_what} — `{action}` was called but no matching asset was found."
        if cond_str:
            msg += f" Code requires: {cond_str}."
        return msg


# ---------------------------------------------------------------------------
# Recent steps narrative
# ---------------------------------------------------------------------------

def _steps_narrative(recent_steps, max_steps=6):
    """Build a short narrative from the last N Difido steps before failure.
    Returns a string like: 'Uploaded X.xml → waited for harvester → [FAILED] file not moved'
    Deduplicates consecutive identical/near-identical steps (e.g. parallel wait threads).
    """
    if not recent_steps:
        return ""
    steps = recent_steps[-max_steps:]

    # Deduplicate based on is_api from original steps dict
    # Rebuild as list of (title, status, is_api, count)
    deduped_full = []
    for s in steps:
        title  = s.get("title", "")
        st     = s.get("status", "")
        is_api = s.get("is_api", False)
        norm   = re.sub(r'[…\.]+$', '', title).strip()
        if deduped_full and re.sub(r'[…\.]+$', '', deduped_full[-1][0]).strip() == norm:
            old = deduped_full[-1]
            deduped_full[-1] = (title, old[1] or st, is_api, old[3] + 1)
        else:
            deduped_full.append((title, st, is_api, 1))

    parts = []
    for title, st, is_api, count in deduped_full:
        # Skip pure API-call success steps (they're in last_api)
        if is_api and st == "success":
            continue
        if not title:
            continue
        marker = "[FAILED] " if st in ("failure", "error") else ""
        suffix = f" (×{count})" if count > 1 else ""
        parts.append(f"{marker}{_truncate(title, 80)}{suffix}")
    return " → ".join(parts) if parts else ""


def _last_success_api(recent_steps):
    """Return the last successful API step title from recent steps."""
    for s in reversed(recent_steps or []):
        if s.get("is_api") and s.get("status") == "success":
            return s.get("title", "")
    return ""


# ---------------------------------------------------------------------------
# Per-root-cause explanation builders
# ---------------------------------------------------------------------------

def explain(t):
    rc    = t.get("root_cause", "Unknown")
    eh    = (t.get("exception_head") or "").strip()
    ft    = (t.get("fail_title") or "").strip()
    stack = t.get("stack_top") or []
    # Use the causally-relevant API (skips finally-block cleanup calls)
    api   = _resolve_api_for_rca(t)
    rb    = api.get("response_body") or ""
    url   = api.get("request_url") or ""
    resp_code = api.get("response_code") or ""
    snippet   = t.get("code_snippet")
    recent_steps = t.get("recent_steps") or []
    err_code, err_msg = _extract_json_error(rb)

    action = _api_action(url)
    failing_line = _code_line(snippet)
    line_no = snippet["line"] if snippet else None

    # -----------------------------------------------------------------------
    # Shared building-blocks used by every root cause below
    # -----------------------------------------------------------------------
    GENERIC_TITLES = {
        "the test ended with the following exception:",
        "unexpected exception was thrown, probably last api response is not as expected",
        "unexpected exception was thrown",
    }
    # Clean exception_head: strip java.lang.XxxException prefix for inline use
    eh_clean = eh.replace("java.lang.AssertionError: ", "").strip()

    # Code reference: "Line N: `...`" or empty
    code_ref = (f"Line {line_no}: `{_truncate(failing_line, 110)}`"
                if failing_line and line_no else "")

    # What field/array the code was trying to access
    accessed_field = _extract_accessed_field(failing_line)
    # What the response actually had at that field
    response_has = _what_response_has(rb, accessed_field) if accessed_field else None

    # API reference: what the last call returned
    if url and err_code:
        api_ref = f"`{action}` returned error `{err_code}` (\"{_truncate(err_msg, 80)}\")"
    elif url and rb:
        total = _extract_total_count(rb)
        if total == 0:
            api_ref = f"`{action}` returned `totalCount: 0` (empty list)"
        elif total is not None:
            api_ref = f"`{action}` returned {total} objects (HTTP {resp_code})"
        elif "too large" in rb.lower() or "WARNING" in rb:
            api_ref = f"`{action}` returned a large response (HTTP {resp_code})"
        else:
            api_ref = f"`{action}` (HTTP {resp_code or '?'})"
    elif url:
        api_ref = f"`{action}` (HTTP {resp_code or 'n/a'})"
    else:
        api_ref = ""


    # ---- No Diagnostic Data ------------------------------------------------
    if rc == "No Diagnostic Data":
        base = ("Test crashed before Difido captured any details "
                "(no exception, no API call, no step messages). "
                "Likely a silent @BeforeClass or @BeforeMethod failure — "
                "check the class-level setup in the Difido report.")
        return base

    # ---- Coralogix Log Not Found -------------------------------------------
    if rc == "Coralogix Log Not Found":
        query_m = re.search(r'"([^"]{8,})"', ft)
        q = _truncate(query_m.group(1), 100) if query_m else _truncate(ft, 120)
        parts = [f"Coralogix search for `{q}` returned no results."]
        parts.append("The expected service event was not indexed within the search window — "
                     "possible Coralogix delay or the backend action did not fire.")
        return " ".join(parts)

    # ---- Timeout -----------------------------------------------------------
    if rc == "Timeout":
        poll_calls    = [s for s in recent_steps if s.get("is_api")]
        non_api_steps = [s for s in recent_steps if not s.get("is_api") and s.get("title")]

        # --- SFTP/FTP harvester timeout (SftpClient in stack) ---
        stack_frames = t.get("stack_top") or []
        is_sftp_timeout = any("SftpClient" in f or "waitForHarvester" in f or "IngestClientSftp" in f
                              for f in stack_frames)
        if is_sftp_timeout:
            # Count how many "Waiting for ingested XML" steps there were (= parallel threads)
            wait_steps = [s for s in recent_steps
                          if "waiting for ingested" in s.get("title", "").lower()
                          or "ftp directory" in s.get("title", "").lower()]
            # Extract the folder from the step title (path may include filename — strip it)
            folder_match = re.search(r"'([^']+)'", wait_steps[0]["title"]) if wait_steps else None
            if folder_match:
                raw_path = folder_match.group(1)
                # Strip trailing filename if present (e.g. './vodIngest/success/file.xml' -> './vodIngest/success/')
                folder = re.sub(r'[^/]+\.[^/]+$', '', raw_path).rstrip('/') or raw_path
                if not folder:
                    folder = raw_path
            else:
                folder = "FTP success/fail directory"
            # Count unique filenames — multiple steps for the same file are polling retries
            unique_files = set()
            for s in wait_steps:
                m = re.search(r"([\w.\-]+\.xml)", s.get("title", ""))
                if m:
                    unique_files.add(m.group(1))
            n_files = len(unique_files) if unique_files else len(wait_steps)
            file_desc = (f"`{next(iter(unique_files))}`" if n_files == 1
                         else f"{n_files} XML files")
            timeout_mins = 4  # hardcoded in waitForHarvesterToMoveFile: 4 * 60 * 1000 ms

            parts = [
                f"The SFTP harvester did not move {file_desc} to `{folder}` "
                f"within the {timeout_mins}-minute timeout (`waitForHarvesterToMoveFile`).",
                "The XML files were uploaded successfully via SFTP but the harvester service "
                "did not pick them up — likely a harvester processing backlog, connectivity issue, "
                "or the ingested content was rejected silently."
            ]
            return " ".join(parts)

        # --- API polling timeout ---
        snippet_is_test_class = (
            snippet and t.get("className") and snippet.get("file") and
            t["className"].rsplit(".", 1)[-1] in snippet["file"]
        )
        if poll_calls and url:
            poll_story = (f"The test polled `{action}` {len(poll_calls)}+ times "
                          f"(all HTTP {resp_code or '200'}) — the expected condition was never met.")
        elif url:
            poll_story = f"Last API: {api_ref}."
        else:
            poll_story = "No API call recorded before timeout."

        if snippet_is_test_class and code_ref:
            code_part = f"{code_ref} timed out. "
        elif eh and "ConditionTimeoutException" in eh:
            m = re.search(r'in ([\w.]+): (.+?)(?:\s+within|\s+but was|\Z)', eh)
            if m:
                where = m.group(1).rsplit(".", 1)[-1]
                what  = _truncate(m.group(2), 100)
                code_part = f"Awaiting condition in `{where}`: {what}. "
            else:
                code_part = "Timeout: "
        else:
            code_part = "Timeout: "

        return f"{code_part}{poll_story}"

    # ---- NullPointerException ----------------------------------------------
    if rc == "NullPointerException":
        chain = re.findall(r'\.(\w+\([^)]*\))', failing_line or "")
        chain_str = " → ".join(chain[:4]) if chain else ""
        cond_str = "; ".join(_extract_filter_conditions(snippet)) if snippet else ""
        total = _extract_total_count(rb)

        parts = []
        if code_ref:
            parts.append(f"{code_ref}:")
        # What field was accessed
        if accessed_field:
            parts.append(f"code tried to access {accessed_field},")
        if err_code:
            parts.append(f"but {api_ref} — the error response has no data fields.")
            if chain_str:
                parts.append(f"Call chain: `{chain_str}`.")
        elif response_has:
            parts.append(f"but {response_has}.")
            if cond_str:
                parts.append(f"Loop filter requires: {cond_str}.")
        elif total == 0:
            parts.append(f"but {api_ref}, so the list was empty and `.get(0)` threw NPE.")
            if cond_str:
                parts.append(f"Loop filter requires: {cond_str}.")
        elif total is not None:
            parts.append(f"but the field was null in the response ({api_ref}).")
            if cond_str:
                parts.append(f"Conditions: {cond_str}.")
        else:
            parts.append(f"but {api_ref or 'the response'} had a null/missing field.")
        return " ".join(parts) if parts else f"NullPointerException in `{t.get('name')}`."

    # ---- IndexOutOfBoundsException -----------------------------------------
    if rc == "IndexOutOfBoundsException":
        idx_m = re.search(r'\.get\((\d+)\)', failing_line or "")
        idx_val = f"`.get({idx_m.group(1)})`" if idx_m else "an index"
        total = _extract_total_count(rb)
        cond_str = "; ".join(_extract_filter_conditions(snippet)) if snippet else ""
        parts = []
        if code_ref:
            parts.append(f"{code_ref}:")
        if accessed_field:
            parts.append(f"code tried to access {accessed_field},")
        if response_has:
            parts.append(f"but {response_has}.")
        elif total == 0:
            parts.append(f"but {api_ref} — the list is empty so {idx_val} is out of bounds.")
            if cond_str:
                parts.append(f"Loop filter requires: {cond_str}.")
        else:
            total_str = f"only {total} object(s)" if total else "fewer objects than expected"
            parts.append(f"but {api_ref} returned {total_str}, "
                         f"so {idx_val} is out of bounds.")
        return " ".join(parts) if parts else f"IndexOutOfBoundsException accessing list from `{action}`."

    # ---- ClassCastException ------------------------------------------------
    if rc == "ClassCastException":
        cast_m = re.search(r'getAs(\w+)\(\)', failing_line or "")
        cast_type = f"`getAs{cast_m.group(1)}()`" if cast_m else "a type cast"
        parts = []
        if code_ref:
            parts.append(f"{code_ref}:")
        # Always name what the code was trying to access
        field_desc = f"code tried to read {accessed_field} as a JSON object/array," if accessed_field \
                     else f"code called {cast_type},"
        parts.append(field_desc)
        if err_code:
            parts.append(f"but {api_ref} — the response contained an error element "
                         f"instead of the expected data, and it cannot be cast to the expected type.")
        elif response_has:
            parts.append(f"but {response_has} — the element cannot be cast.")
        else:
            parts.append(f"but {cast_type} failed — the element has a different type. "
                         f"{api_ref}.")
        return " ".join(parts)

    # ---- API Error ---------------------------------------------------------
    if rc == "API Error":
        parts = []
        if err_code and err_msg:
            parts.append(f"{api_ref}.")
        elif "api call: fail" in ft.lower() or "phoenix api call: fail" in ft.lower():
            action_title = ft.split(":")[-1].strip() if ":" in ft else action
            parts.append(f"`{_truncate(action_title, 80)}` API call failed "
                         f"(HTTP {resp_code or 'n/a'}, no response body).")
        else:
            parts.append(f"{api_ref} returned an API error.")
        # If the code was navigating into the response when it hit the error,
        # say which field it was trying to access
        if accessed_field and code_ref:
            parts.append(f"Code tried to access {accessed_field} at {code_ref}, "
                         f"but got the error response instead.")
        elif code_ref:
            parts.append(f"Code: {code_ref}.")
        # Only include step context when it adds something not already in API error
        relevant_steps = [s for s in recent_steps
                          if not s.get("is_api")
                          and s.get("title")
                          and s.get("status") not in ("success", "")
                          or (s.get("is_api") and s.get("status") not in ("success", ""))]
        relevant_story = _steps_narrative(relevant_steps) if relevant_steps else ""
        if relevant_story:
            parts.append(f"Steps: {relevant_story}.")
        return " ".join(parts)

    # ---- Assertion Failure -------------------------------------------------
    if rc == "Assertion Failure":
        is_method_sig = (snippet and failing_line and
                         any(kw in failing_line for kw in
                             ("public void ", "public ", "private ", "@Test")))
        assertion_msg = eh_clean if (eh and "AssertionError" in eh) else ""
        val_match  = re.search(
            r"value is ['\"]?(.+?)['\"]?,.*?expected.*?['\"]?(.+?)['\"]?$",
            assertion_msg or ft, re.I)
        path_match = re.search(r"No results for path '([^']+)'", assertion_msg or ft)

        parts = []
        if path_match:
            path = _truncate(path_match.group(1), 100)
            parts.append(f"{api_ref} response: JsonPath `{path}` matched nothing — "
                         "the expected record was not found.")
            if code_ref and not is_method_sig:
                parts.append(f"Code: {code_ref}.")
        elif val_match:
            actual, expected = val_match.group(1), val_match.group(2)
            parts.append(f"Got `{_truncate(actual, 80)}`, expected `{_truncate(expected, 80)}` "
                         f"from {api_ref}.")
            if code_ref and not is_method_sig:
                parts.append(f"Code: {code_ref}.")
        else:
            msg = assertion_msg or ft or eh
            if msg and ft.lower() not in GENERIC_TITLES:
                parts.append(_truncate(msg, 180))
            elif assertion_msg:
                parts.append(_truncate(assertion_msg, 180))
            if api_ref and api_ref not in " ".join(parts):
                parts.append(f"[{api_ref}]")
            if code_ref and not is_method_sig:
                parts.append(f"Code: {code_ref}.")

        # Only include steps that are directly informative: non-trivial non-API steps,
        # or steps that show what was being measured (e.g. ingest waits, recording status checks)
        INFORMATIVE_KEYWORDS = (
            "waiting", "uploading", "ingest", "file", "poll", "harvester",
            "not moved", "status", "migration", "sync", "coralogix", "log"
        )
        NOISE_KEYWORDS = (
            "login", "jwt", "register user", "add device", "create household",
            "response body field", "generate jwt"
        )
        informative_steps = [
            s for s in recent_steps
            if s.get("title") and not s.get("is_api")
            and any(kw in s["title"].lower() for kw in INFORMATIVE_KEYWORDS)
            and not any(nk in s["title"].lower() for nk in NOISE_KEYWORDS)
        ]
        if informative_steps:
            parts.append(f"Steps: {_steps_narrative(informative_steps)}.")
        return " ".join(parts) if parts else "Assertion failed."

    # ---- NumberFormatException ---------------------------------------------
    if rc == "NumberFormatException":
        result = _explain_number_format_exception(t)
        return result

    # ---- IllegalStateException ---------------------------------------------
    if rc == "IllegalStateException":
        detail = eh.split(":", 1)[-1].strip() if ":" in eh else eh
        parts = []
        if code_ref:
            parts.append(f"{code_ref}:")
        if accessed_field:
            parts.append(f"code tried to read {accessed_field},")
        if response_has:
            parts.append(f"but {response_has} — {_truncate(detail, 120)}.")
        else:
            parts.append(_truncate(detail or ft, 160) + ".")
            if api_ref:
                parts.append(f"Last API: {api_ref}.")
        return " ".join(parts)

    # ---- File Not Found ----------------------------------------------------
    if rc == "File Not Found":
        fname_m = re.search(r'([\w.\-]+\.xml)', eh or ft)
        fname = fname_m.group(1) if fname_m else None
        parts = []
        if fname:
            parts.append(f"File `{fname}` not found on disk.")
        else:
            parts.append(_truncate(eh or ft, 160) + ".")
        parts.append("A previous ingest/update step failed and the temp XML was never created or was deleted.")
        return " ".join(parts)

    # ---- Unexpected Exception ----------------------------------------------
    if rc == "Unexpected Exception":
        parts = []
        if code_ref:
            parts.append(f"Unexpected exception at {code_ref}.")
        if accessed_field:
            parts.append(f"Code tried to access {accessed_field}.")
        if response_has:
            parts.append(f"But {response_has}.")
        elif api_ref:
            parts.append(f"Last API: {api_ref}.")
        if not parts:
            parts.append(f"Unexpected exception in `{t.get('name')}`.")
        return " ".join(parts)

    # ---- Setup Failure (BEFORE_CLASS / BEFORE_METHOD / SETUP phase) --------
    if rc == "Setup Failure":
        parts = []
        # The code snippet tells us exactly which line crashed in setup
        if code_ref:
            parts.append(f"{code_ref}:")
        if accessed_field:
            # Most common setup failure: getMetas().get("field") returned null
            parts.append(f"code tried to access {accessed_field}")
            if response_has:
                parts.append(f"but {response_has}.")
            else:
                # No last API for setup failures — the field was null in a class-level object
                # Use stack frame to name the specific setup method if available
                setup_method = ""
                for frame in (t.get("stack_top") or []):
                    m = re.search(r'\.(\w+)\(', frame)
                    if m and any(kw in m.group(1).lower() for kw in
                                 ("setup", "before", "init", "prepare")):
                        setup_method = m.group(1)
                        break
                phase_label = f"`{setup_method}()`" if setup_method else \
                              f"`@{t.get('phase','SETUP').replace('_',' ').title()}`"
                parts.append(
                    f"but the value was null or missing in the test setup data "
                    f"({phase_label} runs before the test body — "
                    f"the asset config may be missing this meta key in this environment)."
                )
        elif ft and ft.lower() not in GENERIC_TITLES and not ft.startswith("["):
            parts.append(_truncate(ft, 160) + ".")
        elif eh and not eh.startswith("["):
            parts.append(_truncate(eh, 160) + ".")
        else:
            # Exception head is a stack frame list — use code_ref alone
            phase_desc = t.get("phase", "SETUP").replace("_", " ").title()
            parts.append(
                f"exception thrown in `@{phase_desc}` method — "
                "check the test's @BeforeClass/@BeforeMethod setup."
            )
        # Mention that downstream tests will be skipped
        if t.get("phase") in ("BEFORE_CLASS", "SETUP"):
            parts.append("All tests in this class were skipped as a result.")
        return " ".join(parts)

    # ---- Test Setup / Data Error -------------------------------------------
    if rc == "Test Setup / Data Error":
        if any(x in eh.lower() for x in ("failed to find", "failed to get")):
            result = _explain_not_found(t)
            return result
        # Use exception_head over generic fail_title
        msg = eh if (eh and ft.lower() in GENERIC_TITLES) else (ft or eh)
        parts = [_truncate(msg, 200)]
        if api_ref and action not in msg:
            parts.append(f"Last API: {api_ref}.")
        return " ".join(parts)

    # ---- Fallback ----------------------------------------------------------
    best = eh_clean if (eh and ft.lower() in GENERIC_TITLES) else (ft or eh_clean)
    parts = []
    if best:
        parts.append(_truncate(best, 200))
    if api_ref:
        parts.append(f"Last API: {api_ref}.")
    return " ".join(parts) if parts else "Failure — no diagnostic data available."


# ---------------------------------------------------------------------------
# HTML formatting for explanations
# ---------------------------------------------------------------------------

def _fmt(text):
    """
    Convert a plain-text explanation into formatted HTML.

    Rules:
    - Backtick-wrapped tokens -> <code>token</code>
    - "Line N:" at start -> bold line reference on its own line
    - Sentence boundaries (". ") -> line break between sentences
    - "Steps:" prefix -> italic label + indented step list
    - "But ...", "Code tried...", "Loop filter..." -> each on its own line
    - Escape raw & < > that aren't already HTML tags
    """
    if not text:
        return ""

    # First escape any raw HTML special chars that are NOT already tags
    # (the text may contain < > from code snippets but not actual HTML)
    safe = (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;"))

    # Backtick tokens -> <code>
    safe = re.sub(r'`([^`]+)`', r'<code>\1</code>', safe)

    # Split into logical sentences / clauses
    # Break on ". " followed by capital or "but/code/loop/steps/last"
    # Also break on explicit sentence starters
    BREAKERS = (
        r'(?<=\.) (But |Code tried|Loop |Steps:|Last API:|The test polled|All tests|Possible causes|Check )',
        r'(?<=\.) (It was populated|No API|The variable|Code: Line)',
    )
    for pat in BREAKERS:
        safe = re.sub(pat, r'<br>\1', safe)

    # "Line N: <code>...</code>:" -> bold line ref on first line
    safe = re.sub(
        r'^(Line \d+: <code>[^<]*</code>):',
        r'<b>\1:</b>',
        safe
    )

    # "Steps: X → Y → Z" -> italic label + items
    def _fmt_steps(m):
        label = m.group(1)
        items = [s.strip() for s in m.group(2).split('→') if s.strip()]
        li = "".join(f'<li style="margin:1px 0">{i}</li>' for i in items)
        return f'<br><span style="color:#666;font-style:italic">{label}:</span><ul style="margin:2px 0 4px 16px;padding:0">{li}</ul>'
    # Match "Steps:" up to end-of-sentence marker (" ." or end) but not inside filenames
    safe = re.sub(r'(Steps(?:\s+before\s+\w+)?): (.+)', _fmt_steps, safe, flags=re.DOTALL)

    # "Call chain: X → Y → Z" -> monospace list
    def _fmt_chain(m):
        items = [s.strip() for s in m.group(1).split('→') if s.strip()]
        li = "".join(f'<li><code>{i}</code></li>' for i in items)
        return f'<br><em>Call chain:</em><ul style="margin:2px 0 2px 16px;padding:0">{li}</ul>'
    safe = re.sub(r'Call chain: `([^`]+)`\.?', _fmt_chain, safe)

    # "Loop filter requires: A; B; C" -> bullet list
    def _fmt_conditions(m):
        items = [s.strip() for s in m.group(1).split(';') if s.strip()]
        li = "".join(f'<li>{i}</li>' for i in items)
        return f'<br><em>Loop requires:</em><ul style="margin:2px 0 2px 16px;padding:0">{li}</ul>'
    safe = re.sub(r'Loop (?:filter )?requires?: ([^.]+)\.?', _fmt_conditions, safe)

    # "JsonPath `X`" — already in code tags, just ensure it wraps nicely
    # Wrap long <code> blocks so they don't overflow
    safe = re.sub(
        r'(<code>[^<]{80,}</code>)',
        r'<span style="word-break:break-all">\1</span>',
        safe
    )

    # Clean up double line breaks
    safe = re.sub(r"(<br>){2,}", "<br>", safe)

    return safe.strip()


# ---------------------------------------------------------------------------
# HTML injection
# ---------------------------------------------------------------------------

def inject_html(html, uid_to_explanation):
    """Replace the empty RCA Analysis div placeholder for each uid."""
    placeholder = '<b>RCA Analysis:</b> </div>'
    injected = 0
    for uid, note in uid_to_explanation.items():
        row_anchor = f'id="row-{uid}"'
        pos = html.find(row_anchor)
        if pos < 0:
            continue
        rca_pos = html.find(placeholder, pos)
        if rca_pos < 0 or rca_pos > pos + 30000:
            continue
        # Format explanation as HTML (handles its own escaping)
        formatted = _fmt(note)
        replacement = f'<b>RCA Analysis:</b> {formatted}</div>'
        html = html[:rca_pos] + replacement + html[rca_pos + len(placeholder):]
        injected += 1
    return html, injected


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    ctx_path  = sys.argv[1]
    html_path = sys.argv[2]

    with open(ctx_path, encoding="utf-8") as f:
        tests = json.load(f)

    print(f"[explain] Generating explanations for {len(tests)} tests …", file=sys.stderr)

    uid_to_exp = {}
    for t in tests:
        uid_to_exp[t["uid"]] = explain(t)

    # Write explanations JSON
    exp_path = html_path + ".explanations.json"
    with open(exp_path, "w", encoding="utf-8") as f:
        json.dump([{"uid": uid, "explanation": exp} for uid, exp in uid_to_exp.items()],
                  f, indent=2, ensure_ascii=False)
    print(f"[explain] Explanations written: {exp_path}", file=sys.stderr)

    # Inject into HTML
    with open(html_path, encoding="utf-8") as f:
        html = f.read()

    html, injected = inject_html(html, uid_to_exp)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"[explain] Injected {injected}/{len(uid_to_exp)} explanations into HTML", file=sys.stderr)
    print(html_path)


if __name__ == "__main__":
    main()
