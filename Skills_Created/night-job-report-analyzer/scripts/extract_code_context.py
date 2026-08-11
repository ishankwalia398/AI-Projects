#!/usr/bin/env python3
"""
For every failing test in _data.json, locate the Java source file and extract
the code lines around the failing stack frame.

Usage:
    extract_code_context.py <data_json_path>

Output:
    Writes  <data_json_path>.code_context.json  — an array of objects:
    {
      "uid": "...",
      "name": "...",
      "className": "...",
      "suite": "...",
      "root_cause": "...",
      "exception_head": "...",
      "fail_title": "...",
      "stack_top": [...],
      "last_api": {...},
      "code_snippet": {
        "file": "relative/path/To.java",
        "method": "methodName",
        "line": 134,
        "context": "line 130: ...\nline 131: ...\n>>> line 134: ...\n..."
      },
      "test_url": "..."
    }

    Prints progress to stderr.
    Prints output path to stdout.

Exit codes:
    0  success
    1  error
"""

import json
import os
import subprocess
import sys
from collections import defaultdict

CONTEXT_LINES = 8  # lines to show before/after the failing line


def find_source(class_name):
    """Run find_source.py and return the absolute path, or None."""
    script = os.path.join(
        os.path.dirname(__file__),
        "..", "..", "debug-ebug-test", "scripts", "find_source.py"
    )
    script = os.path.normpath(script)
    try:
        result = subprocess.run(
            [sys.executable, script, class_name],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            path = result.stdout.strip()
            if os.path.isfile(path):
                return path
        return None
    except Exception:
        return None


def read_lines(path):
    """Return list of file lines (1-indexed by position)."""
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.readlines()


def extract_frame_line(frame):
    """
    Parse a stack frame like:
      com.kaltura.auto.BouyguesFoo.someMethod(BouyguesFoo.java:134)
      com.kaltura.auto.BouyguesFoo.lambda$someMethod$9(BouyguesFoo.java:806)
    Returns (method_name, line_number) or (None, None).
    """
    import re
    # Match any method name including lambda frames like lambda$name$N
    m = re.search(r'\.([\w$]+)\([^:)]+:(\d+)\)$', frame)
    if m:
        method = m.group(1)
        # Unwrap lambda: lambda$getSubscriptionIdForHhLimitId$9 -> getSubscriptionIdForHhLimitId
        lambda_m = re.match(r'lambda\$(\w+)\$\d+', method)
        if lambda_m:
            method = lambda_m.group(1)
        return method, int(m.group(2))
    return None, None


def build_context(lines, target_line, context=CONTEXT_LINES):
    """Build a human-readable code snippet centred on target_line (1-based)."""
    start = max(1, target_line - context)
    end   = min(len(lines), target_line + context)
    result = []
    for i in range(start, end + 1):
        prefix = ">>>" if i == target_line else "   "
        result.append(f"{prefix} {i:4d}: {lines[i-1].rstrip()}")
    return "\n".join(result)


def main():
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    data_path = sys.argv[1]
    with open(data_path, encoding="utf-8") as f:
        failures = json.load(f)

    print(f"[code-ctx] {len(failures)} failures to process", file=sys.stderr)

    # Group by className to avoid reading the same file multiple times
    by_class = defaultdict(list)
    for t in failures:
        by_class[t["className"]].append(t)

    # Cache: className -> (source_path, lines)
    source_cache = {}

    output = []
    for cls, tests in sorted(by_class.items(), key=lambda x: -len(x[1])):
        short = cls.rsplit(".", 1)[-1]

        if cls not in source_cache:
            path = find_source(cls)
            if path:
                lines = read_lines(path)
                source_cache[cls] = (path, lines)
                print(f"[code-ctx]   {short}: {path}", file=sys.stderr)
            else:
                source_cache[cls] = (None, [])
                print(f"[code-ctx]   {short}: NOT FOUND", file=sys.stderr)

        src_path, src_lines = source_cache[cls]

        for t in tests:
            entry = {k: t[k] for k in (
                "uid", "name", "className", "suite", "root_cause",
                "exception_head", "fail_title", "all_fail_titles",
                "stack_top", "last_api", "pre_finally_api", "recent_steps", "test_url"
            ) if k in t}
            entry["code_snippet"] = None

            if src_path and src_lines:
                # Find the first stack frame that references this class or its base classes
                # Priority: frame contains the short class name
                # Fallback: any frame inside com.kaltura.auto (not framework)
                FRAMEWORK_PKGS = ("il.co.topq", "org.testng", "java.", "sun.", "jdk.")
                kaltura_frames = [
                    f for f in (t.get("stack_top") or [])
                    if not any(f.startswith(p) for p in FRAMEWORK_PKGS)
                ]
                # First try: exact class match
                for frame in kaltura_frames:
                    if short in frame:
                        method, line_no = extract_frame_line(frame)
                        if method and line_no and 1 <= line_no <= len(src_lines):
                            entry["code_snippet"] = {
                                "file": src_path,
                                "method": method,
                                "line": line_no,
                                "context": build_context(src_lines, line_no),
                            }
                            break
                # Second try: kaltura frame that explicitly names this source file
                # (match on the filename inside the frame, e.g. "BouyguesVodSftpParallelIngestBaseTest.java:207")
                # Never match purely on line-number coincidence — that causes false positives
                # when a framework frame (e.g. ConditionAwaiter.java:167) shares a line number
                # with an unrelated class in the test source.
                src_filename = os.path.basename(src_path)  # e.g. "BouyguesVodSftpParallelIngestTests.java"
                src_stem = src_filename.replace(".java", "")        # e.g. "BouyguesVodSftpParallelIngestTests"
                if not entry["code_snippet"]:
                    for frame in kaltura_frames:
                        # Only match if this frame's filename matches the source file
                        if src_stem not in frame and src_filename not in frame:
                            continue
                        method, line_no = extract_frame_line(frame)
                        if method and line_no and 1 <= line_no <= len(src_lines):
                            entry["code_snippet"] = {
                                "file": src_path,
                                "method": method,
                                "line": line_no,
                                "context": build_context(src_lines, line_no),
                            }
                            break

                # Fallback: find the method in the file even without a stack frame
                if not entry["code_snippet"] and t.get("name"):
                    method_name = t["name"]
                    for i, line in enumerate(src_lines, 1):
                        if f"void {method_name}(" in line or f"public {method_name}(" in line:
                            entry["code_snippet"] = {
                                "file": src_path,
                                "method": method_name,
                                "line": i,
                                "context": build_context(src_lines, i),
                            }
                            break

            output.append(entry)

    out_path = data_path + ".code_context.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"[code-ctx] Written: {out_path}", file=sys.stderr)
    print(out_path)


if __name__ == "__main__":
    main()
