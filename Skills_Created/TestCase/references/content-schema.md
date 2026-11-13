# Test case content JSON (input to build_test_cases.py)

```json
{
  "feature_name": "PasswordReset",
  "header": {
    "project_name": {"value": "Accounts", "source": "User answer Q1"},
    "module_name":  {"value": "Password Reset API", "source": "PRD title"},
    "created_by":   {"value": "Ishank Walia", "source": "User answer Q2"}
  },
  "coverage_items": [
    {"id": "TP-INC-1", "text": "Create (POST) reset request", "source": "Test Plan – Inclusions"},
    {"id": "TP-SCO-3", "text": "Rate limiting", "source": "Test Plan – Scope item 3"}
  ],
  "out_of_scope": [
    {"text": "SMS-based reset", "source": "PRD §5; Test Plan – Scope"}
  ],
  "scenarios": [
    {
      "description": "Password reset request",
      "priority": "P0",
      "linked_document": "STP_PasswordReset_20261113_144548.docx – Inclusions; PRD §2.3",
      "comments": "",
      "source": "PRD §2.3; Test Plan – Inclusions",
      "test_cases": [
        {
          "description": "Verify that with a valid registered email, the reset request should return HTTP 202",
          "precondition": "An account exists for the email",
          "steps": ["Send POST /api/v1/password-reset/request with the registered email", "Check the status code"],
          "expected": ["The request is accepted", "The status code must be 202"],
          "priority": "P0",
          "is_automated": "",
          "comments": "",
          "source": "PRD §2.3",
          "covers": ["TP-INC-1"]
        }
      ]
    }
  ]
}
```

## Rules the script enforces

- **`feature_name`:** letters and digits only, because it goes into `TestCases_<FeatureName>_<timestamp>`.
- **`header`:** `project_name`, `module_name` and `created_by` each need a `value`. A value also needs a `source`, unless it is an "Insufficient information to determine. Open question: …" text. Don't send `created_date` (the script uses today's date in MM/DD/YYYY) or `peer_review_by` / `peer_reviewed_date` (left empty).
- **`coverage_items`:** every in-scope item of the Test Plan, from its Scope and Inclusions sections and any requirement the plan says is in scope. Each needs a unique `id` and a `source`. Every item must be covered by at least one test case, or the script stops with a coverage-gap error.
- **`out_of_scope`:** optional. Items the Test Plan or spec exclude. They are not printed, but they show in chat why something has no test case.
- **Each scenario** needs `description`, `priority`, `linked_document`, `source` and at least one test case. TID and test-case count are computed.
- **Each test case** needs:
  - `description`, `priority` and `source`;
  - `steps` and `expected` as non-empty lists, with no more expected entries than steps;
  - `covers`: at least one known coverage-item id.
- **Execution fields** (`actual_result`, `status`, `executed_qa_name`, `steps_to_execute`, `expected_2`, `actual_result_2`) must be empty or absent.
- **Unknown values:** any text containing "Insufficient information to determine." must continue with "Open question: <question>".
- **Working headings:** the four (Verified Facts, Missing / Unknown Information, Generated Output, Self-Validation Check) may not appear anywhere in the content.

`source` text is printed in **Misc (Comments)** as `Ref: <source>`. Cite the most specific reference available: requirement ID, PRD section, Jira field, or Test Plan section. Write inferences into the text with the label `Inference (low confidence):`.
