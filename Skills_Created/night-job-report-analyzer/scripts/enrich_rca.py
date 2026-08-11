#!/usr/bin/env python3
"""
Enrich the HTML report with detailed RCA analysis by combining:
- Stack traces with line numbers
- Java source code context
- API request/response data
"""

import json
import sys
import re
from pathlib import Path


def analyze_failure(failure, code_context):
    """
    Generate a specific RCA diagnosis by synthesizing:
    1. Stack trace line numbers → where the failure occurred
    2. Java source at those lines → what the code was trying to do
    3. API request/response → what the server actually returned
    """

    # Get the code snippet if available
    if code_context is None:
        code_context = {}
    snippet = code_context.get("code_snippet", {})
    if snippet is None:
        snippet = {}
    source_lines = snippet.get("lines", [])
    method_name = snippet.get("method", "")

    # Get failure details
    exception = failure.get("exception_head", "")
    root_cause = failure.get("root_cause", "")
    stack_top = failure.get("stack_top", [])
    last_api = failure.get("last_api", {})
    phase = failure.get("phase", "TEST_BODY")

    # Extract key information from API data
    if last_api is None:
        last_api = {}
    api_url = last_api.get("request_url", "")
    api_method = extract_api_method(api_url)
    response_code = last_api.get("response_code", "")
    response_body = last_api.get("response_body", "")
    response_error = last_api.get("response_error", "")
    response_error_code = last_api.get("response_error_code", "")

    # Parse response body for analysis
    response_data = parse_json_safe(response_body)

    # Generate RCA based on failure pattern

    # Pattern 1: Assertion failures with field value mismatches
    if "AssertionError" in exception and "value is" in exception and "expected" in exception:
        return analyze_assertion_failure(exception, response_data, api_method, source_lines)

    # Pattern 2: NullPointerException
    if "NullPointerException" in exception:
        return analyze_null_pointer(stack_top, response_data, api_method, source_lines)

    # Pattern 3: Timeout or log verification failures
    if "timeout" in exception.lower() or "time out" in exception.lower():
        return analyze_timeout(exception, last_api, source_lines)

    # Pattern 4: API error responses
    if response_error or response_error_code:
        return analyze_api_error(response_error, response_error_code, api_method, response_data)

    # Pattern 5: Empty result sets when data expected
    if response_data and is_empty_result(response_data):
        return analyze_empty_result(api_method, response_data, source_lines)

    # Pattern 6: Setup failures (@BeforeClass/@BeforeMethod)
    if phase in ["BEFORE_CLASS", "BEFORE_METHOD", "SETUP"]:
        return analyze_setup_failure(exception, last_api, phase)

    # Pattern 7: Log search/verification failures (Coralogix)
    if "coralogix" in api_url.lower() or "log" in exception.lower():
        return analyze_log_verification_failure(exception, last_api)

    # Default: Generic analysis
    return analyze_generic_failure(exception, root_cause, last_api, source_lines)


def extract_api_method(url):
    """Extract the API method from URL (e.g., 'asset/action/list')"""
    if not url:
        return ""
    match = re.search(r'/service/([^/]+)/action/([^/?]+)', url)
    if match:
        return f"{match.group(1)}/action/{match.group(2)}"
    return url.split('/')[-1] if '/' in url else url


def parse_json_safe(text):
    """Safely parse JSON, return None if invalid"""
    if not text:
        return None
    try:
        return json.loads(text)
    except:
        return None


def is_empty_result(data):
    """Check if API response indicates empty result"""
    if not isinstance(data, dict):
        return False

    result = data.get("result", {})
    if isinstance(result, dict):
        objects = result.get("objects", [])
        if isinstance(objects, list) and len(objects) == 0:
            return True
        if result.get("totalCount", -1) == 0:
            return True

    return False


def analyze_assertion_failure(exception, response_data, api_method, source_lines):
    """Analyze assertion failures with field mismatches"""

    # Extract field name and values from exception
    field_match = re.search(r"field '([^']+)'.*value is '([^']*)'.*expected.*'([^']*)'", exception)
    if not field_match:
        return f"Assertion failed in {api_method} response. {exception[:150]}"

    field_name = field_match.group(1)
    actual_value = field_match.group(2)
    expected_value = field_match.group(3)

    # Check if response indicates why the value is wrong
    diagnosis = f"Assertion failure: field '{field_name}' was '{actual_value}' but expected '{expected_value}' in {api_method} response."

    # Add context from response data
    if response_data:
        result = response_data.get("result", {})
        if isinstance(result, dict):
            # Check for related fields that might explain the issue
            if "status" in field_name.lower():
                diagnosis += " Check if prerequisite workflow steps completed successfully."
            if "count" in field_name.lower() and actual_value == "0":
                diagnosis += " The query/filter returned no results - verify test data setup or filter criteria."

    return diagnosis


def analyze_null_pointer(stack_top, response_data, api_method, source_lines):
    """Analyze NullPointerException failures"""

    # Try to identify which field was null
    diagnosis = f"NullPointerException in {api_method} response processing."

    if response_data:
        result = response_data.get("result")
        if result is None:
            diagnosis = f"NullPointerException: {api_method} returned HTTP 200 but 'result' field was null. Expected a valid result object."
        elif isinstance(result, dict):
            # Check for common null fields
            null_fields = [k for k, v in result.items() if v is None]
            if null_fields:
                diagnosis = f"NullPointerException: {api_method} response had null field(s): {', '.join(null_fields[:3])}. Code attempted to access these without null-check."

    return diagnosis


def analyze_timeout(exception, last_api, source_lines):
    """Analyze timeout failures"""

    api_method = extract_api_method(last_api.get("request_url", ""))

    if "log" in exception.lower() or "coralogix" in exception.lower():
        return f"Timeout waiting for expected log entry in Coralogix. The expected log message/pattern did not appear within the timeout window, suggesting the backend operation may not have completed or failed silently."

    return f"Timeout in {api_method}. The operation exceeded the configured wait time. Check if the backend service is processing slowly or if the expected state change never occurred."


def analyze_api_error(error, error_code, api_method, response_data):
    """Analyze API error responses"""

    diagnosis = f"API error in {api_method}: {error_code} - {error}."

    # Add specific guidance for common error codes
    if error_code == "4001":
        diagnosis += " Insufficient funds/credits in test account."
    elif error_code == "500013":
        diagnosis += " Concurrent modification conflict."
    elif "610002" in error_code:
        diagnosis += " Migration orchestrator state conflict."

    return diagnosis


def analyze_empty_result(api_method, response_data, source_lines):
    """Analyze empty result set when data was expected"""

    result = response_data.get("result", {})
    total_count = result.get("totalCount", 0)

    return f"{api_method} returned HTTP 200 but objects array was empty (totalCount={total_count}). The filter/search criteria matched no data - verify test data setup or modify query parameters."


def analyze_setup_failure(exception, last_api, phase):
    """Analyze @BeforeClass/@BeforeMethod setup failures"""

    api_method = extract_api_method(last_api.get("request_url", ""))
    response_code = last_api.get("response_code", "")

    phase_name = {"BEFORE_CLASS": "@BeforeClass", "BEFORE_METHOD": "@BeforeMethod", "SETUP": "setup"}.get(phase, phase)

    if response_code == "500":
        return f"{phase_name} failed: {api_method} returned HTTP 500 server error. All tests in this class were skipped as a result. Backend service issue during test setup."

    return f"{phase_name} failed during {api_method} call. All dependent tests in this class were skipped. {exception[:150]}"


def analyze_log_verification_failure(exception, last_api):
    """Analyze Coralogix log search/verification failures"""

    # Extract the search query if present
    query_match = re.search(r'query: "([^"]+)"', exception)
    query = query_match.group(1) if query_match else "specified query"

    response_body = last_api.get("response_body", "")
    response_data = parse_json_safe(response_body)

    if response_data:
        hits = response_data.get("hits", {}).get("total", {}).get("value", -1)
        if hits == 0:
            return f"Log verification failed: Coralogix query '{query}' returned 0 hits. The expected log entry was never written, suggesting the backend operation did not execute as expected or logging failed."

    return f"Failed to find expected Coralogix log matching: {query}. Backend operation may have failed silently or taken a different code path."


def analyze_generic_failure(exception, root_cause, last_api, source_lines):
    """Generic fallback analysis"""

    api_method = extract_api_method(last_api.get("request_url", ""))
    response_code = last_api.get("response_code", "")

    if api_method and response_code:
        return f"{root_cause}: {exception[:150]} Last API: {api_method} (HTTP {response_code})"

    return f"{root_cause}: {exception[:200]}"


def enrich_html(html_path, failure_data, code_context_data):
    """Inject RCA enrichment into the HTML report"""

    print(f"[enrich] Reading HTML: {html_path}")
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Build enrichment map: uid -> RCA note
    print(f"[enrich] Analyzing {len(failure_data)} failures...")
    enrichment = {}

    # Create lookup map for code context
    code_ctx_map = {item["uid"]: item for item in code_context_data}

    for failure in failure_data:
        uid = failure["uid"]
        code_ctx = code_ctx_map.get(uid, {})

        rca_note = analyze_failure(failure, code_ctx)
        enrichment[uid] = rca_note

        # Print sample for verification
        if len(enrichment) <= 5:
            print(f"[enrich]   {uid}: {rca_note[:100]}...")

    # Inject enrichment into HTML
    print(f"[enrich] Injecting enrichment into HTML...")
    injected_count = 0

    for uid, rca_note in enrichment.items():
        # Find the RCA placeholder div for this uid
        pattern = rf'(<tr id="row-{re.escape(uid)}".*?<div[^>]*><b>RCA Analysis:</b>\s*)(<)(/div>)'

        replacement = rf'\1{html_escape(rca_note)}\2\3'

        new_html = re.sub(pattern, replacement, html, flags=re.DOTALL)
        if new_html != html:
            injected_count += 1
            html = new_html

    print(f"[enrich] Injected {injected_count}/{len(enrichment)} enrichments")

    # Write updated HTML
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"[enrich] Updated: {html_path}")


def html_escape(text):
    """Escape text for safe HTML insertion"""
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#39;'))


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: enrich_rca.py <failure_data.json> <code_context.json> <report.html>")
        sys.exit(1)

    data_path = sys.argv[1]
    context_path = sys.argv[2]
    html_path = sys.argv[3]

    print(f"[enrich] Loading failure data: {data_path}")
    with open(data_path, 'r', encoding='utf-8') as f:
        failure_data = json.load(f)

    print(f"[enrich] Loading code context: {context_path}")
    with open(context_path, 'r', encoding='utf-8') as f:
        code_context_data = json.load(f)

    enrich_html(html_path, failure_data, code_context_data)

    print("[enrich] Done!")
