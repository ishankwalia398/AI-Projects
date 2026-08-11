#!/usr/bin/env python3
"""
Fetch Difido execution data using Playwright (works with internal DNS that curl/requests can't reach).
Outputs a JSON file ready for generate_report.py --from-file.

Usage: fetch_difido_execution.py <difido_base_url>
Output: difido_fetched_data.json in the current directory
"""

import json
import os
import re
import sys
from playwright.sync_api import sync_playwright

def normalise_base(raw_url):
    """Strip trailing /index.html or trailing slash."""
    url = raw_url.strip().rstrip("/")
    if url.endswith("/index.html"):
        url = url[: -len("/index.html")]
    return url

def main():
    if len(sys.argv) < 2:
        print("Usage: fetch_difido_execution.py <difido_base_url>", file=sys.stderr)
        sys.exit(1)

    base_url = normalise_base(sys.argv[1])
    print(f"Fetching data from: {base_url}", file=sys.stderr)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Fetch execution.js
        print("Fetching execution.js...", file=sys.stderr)
        page.goto(f"{base_url}/execution.js", wait_until="domcontentloaded")
        execution_js = page.evaluate("() => document.body.innerText")

        # Parse to find failed tests
        print("Parsing execution tree...", file=sys.stderr)
        failed_tests = page.evaluate("""
        () => {
          const text = document.body.innerText;
          const json = JSON.parse(text.replace(/^var execution = /, '').replace(/;$/, ''));
          const failed = [];
          function walk(node, suite) {
            if (node.type === 'test') {
              if (node.status === 'failure' || node.status === 'error') {
                failed.push({
                  uid: node.uid,
                  name: node.name,
                  className: node.className,
                  status: node.status,
                  suite: suite,
                  duration: node.duration || 0,
                  date: node.date || '',
                  timestamp: node.timestamp || ''
                });
              }
              return;
            }
            const children = node.children || [];
            const suiteName = node.type === 'scenario' ? (node.name || suite) : suite;
            const effectiveSuite = (node.type === 'scenario' && suite === '') ? (node.name || '') : suite;
            children.forEach(c => walk(c, effectiveSuite || suiteName));
          }
          (json.machines || []).forEach(m => (m.children || []).forEach(c => walk(c, '')));
          return failed;
        }
        """)

        print(f"Found {len(failed_tests)} failed tests", file=sys.stderr)

        # Fetch test details in batches
        test_details = {}
        batch_size = 50
        uids = [test["uid"] for test in failed_tests]

        for i in range(0, len(uids), batch_size):
            batch = uids[i:i+batch_size]
            print(f"Fetching test details batch {i//batch_size + 1}/{(len(uids)-1)//batch_size + 1} ({len(batch)} tests)...", file=sys.stderr)

            # Navigate to base to establish origin
            if i == 0:
                page.goto(f"{base_url}/index.html", wait_until="domcontentloaded")

            batch_results = page.evaluate(f"""
            async (uids) => {{
              const base = '{base_url}';
              const results = {{}};
              await Promise.all(uids.map(async uid => {{
                try {{
                  const url = `${{base}}/tests/test_${{uid}}/test.js`;
                  const resp = await fetch(url);
                  results[uid] = await resp.text();
                }} catch(e) {{
                  results[uid] = null;
                }}
              }}));
              return results;
            }}
            """, batch)

            test_details.update(batch_results)

        browser.close()

    # Write output
    output = {
        "base_url": base_url,
        "execution_js": execution_js,
        "test_details": test_details
    }

    output_path = os.path.abspath("difido_fetched_data.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nWrote fetched data to: {output_path}", file=sys.stderr)
    print(output_path)  # Print to stdout for script consumption
    sys.exit(0)

if __name__ == "__main__":
    main()
