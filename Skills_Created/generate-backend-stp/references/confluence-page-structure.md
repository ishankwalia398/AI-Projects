# Confluence STP Page Structure

This document contains the detailed specifications for building and publishing the Confluence STP page.

## Page Title

```
<FeatureName> - STP
```

Use the same `feature_name` value used for the Excel filename (spaces restored, not underscored).

## Page Body Sections (in order)

1. **Introduction (Purpose):** one paragraph, same content as Sheet 1 `Purpose`.

2. **Business requirements:** one short paragraph summarising the business need (derive from the spec's
   opening/summary — this is usually a one-line restatement of the feature's purpose from the caller's
   perspective).

3. **Related tickets table** — columns `Ticket | Description | Status`. Populate rows only if ticket
   references (Jira keys, links) were found in the spec source; otherwise leave a single placeholder row
   with `Ticket = "TBD"` and a note that links should be added once available. Never invent ticket IDs.

4. **Spec link:** a single line linking to the spec source captured in Step 5 (Confluence URL / Jira
   ticket / uploaded filename / "User-provided text (pasted)").

5. **Use Cases to be tested table** — this is the **non-unit-test** scenario table. See "Non-Unit-Test
   Table Format" below.

6. **Unit testing to be filled by developer table** — see "Unit Test Table Format" below.

7. **STD link (test-management tool):** placeholder line, e.g. `TBD — add STD/test-management link once created.`

8. **Dependencies table** — columns `Dependency | Action item | Responsibility`. Leave blank/placeholder rows unless the spec names explicit dependencies.

9. **Estimations:** placeholder value, e.g. `TBD`.

10. **Professional team table** — columns `Title | Name`, rows for `QA | PM | SA | Integration | PS Development | Core Development`. Leave `Name` blank/`TBD` unless the user has supplied names.

11. **Developed/changed components table** — columns `Component | Release notes link`. Leave blank unless derivable from the spec.

12. **Automation ticket:** placeholder line, e.g. `TBD`.

13. **Important notes:** numbered list, empty placeholder (`1.`) unless there are caveats worth flagging from Step 3 analysis.

Sections 3, 7–9, 11–13 are administrative/tracking fields the specification does not contain — always
render them as clearly marked placeholders (`TBD`) rather than fabricating values. Never invent ticket
numbers, names, or links.

---

## Non-Unit-Test Table Format

Columns: `Title | Description | Comment`

- One row per Test Scenario / Config Validation scenario that is **not** already represented in the
  Unit Tests (Sheet 6) table — i.e., partition the full scenario set derived in Step 3d/3e: scenarios
  that map onto a Sheet 6 unit-test row are excluded here and appear only in the Unit Test table instead.
- **Title column:** do NOT use the bare scenario title. Prefix it with the UC number:
  `"<UC-ID>: <Scenario Title>"` (e.g. `"UC-01: Valid accessToken Login Triggers PreSignIn"`).
- **Description column:** a single sentence starting with "Verify..." that states the expected
  behaviour (this is the same content style as the `Then` field of the scenario, phrased as a
  verification statement — matching Sheet 4's Given/When/Then collapsed into one sentence).
- **Comment column:** leave blank for QA annotations, unless Step 3 analysis flagged an open question
  for that scenario (e.g. "to be confirmed with SA").
- Number rows sequentially starting at 1.

---

## Unit Test Table Format

Columns: `Use Case | Input | Expected Results | Dev Test name (PASS / FAIL / NA)`

- One row per entry in the Excel Sheet 6 (Unit Tests - Negative) table — same content, renamed columns:
  - `Use Case` = Sheet 6 `Scenario`
  - `Input` = Sheet 6 `Input`
  - `Expected Results` = Sheet 6 `Expected Output`
  - `Dev Test name (PASS / FAIL / NA)` = leave blank for developer fill-in (do not pre-fill with
    `Developer Test Name` camelCase value here — that stays in the Excel workbook only).
- Number rows sequentially starting at 1.
- In the rendered Confluence storage-format XHTML, colour the literal words `PASS` (green), `FAIL`
  (red), and `NA` (default/grey) inside the header cell text, matching the reference image.

---

## Publishing the Page

1. If not already resolved, call `mcp__atlassian__getAccessibleAtlassianResources` to obtain the `cloudId`.

2. Build the page body as Confluence storage-format XHTML (tables as `<table><tbody><tr><th>/<td>`, bold
   section headers as `<h2>`/`<strong>`, placeholder text as plain `TBD`).

3. Call `mcp__atlassian__createConfluencePage` with:
   - `cloudId`
   - `spaceId` = `space_id` from Step 0b (the numeric ID resolved from the space key)
   - `parentId` = `parent_page_id` from Step 0b (omit if none)
   - `title` = `f"{feature_name} - STP"`
   - `body` = the storage-format XHTML built above

4. Capture the full page URL returned by the tool response (`confluence_url`). This is required by
   Steps 5, 5b, and 6.

**If the MCP is unavailable, returns an error, or the space/parent cannot be found:**
> "I generated the STP content but couldn't publish it to Confluence — [error reason]. Here's the page
> content so you can paste it in manually, or let me know if you'd like to retry."

Provide the built XHTML/plain-text content inline, set `confluence_url = "Not published — see note above"`,
and continue to Steps 5–6 with the Excel workbook and log still being produced normally.
