# Template structure and fill rules

The generator (`scripts/build_test_plan.py`) fixes the headings, levels and order below, so you only supply each section's content. Read `template.md` for the template's exact wording and table layout.

Every section uses one of two kinds of content:

- **Project facts** come only from the user's input: the PRD, spec, Jira or Confluence page, API docs, screenshots, test data, or answers to your questions. That covers features, endpoints, environments, URLs, people, dates, durations, platforms, tools and risks specific to this project. If the input is silent, write an `insufficient` block with the open question. Never carry over the sample's facts (Restful Booker URLs, Devesh/Sonal/Prajeeth, "2 Sprints", and so on).
- **Template standard wording** is the template's generic QA-process text: test design techniques, the smoke-then-in-depth procedure, the STLC entry and exit criteria, and the approvals flow. It describes how the team works, not how the system behaves, so you may reuse it word for word with `source: "Template – standard practice"`. Before generating files, list in Verified Facts which sections reuse it, so the user can override them. Don't add system-specific claims to this wording.

| # | Heading (exact) | Level | Template content and table columns | Content kind |
|---|---|---|---|---|
| 0 | Test Plan + table of contents | 1 | Added by the script | n/a |
| 1 | Objective | H2 | One plain-language paragraph: what is verified, which operations, how execution and automation are done. Then a `URL - <link>` line. | Project facts. The tools named for execution or automation (Postman, REST Assured in the sample) must come from input; otherwise ask. |
| 2 | Scope | H2 | "Scope of Test Plan for <system>:" then a numbered list. Each item is a **bold testing type** with dash sub-points, followed by the closing note "It's important to note that the scope… may evolve…". | Testing types and sub-points must be backed by the input. For example, only list rate-limiting checks if the input mentions rate limits. Put types the input doesn't support (performance, i18n, backup) in the question batch instead of including them by default. The closing note is standard wording. |
| 3 | Inclusions | H3 | Bold group labels per operation or feature (e.g. "**Create (POST) Operations:**") with plain lines beneath, then cross-cutting groups (Boundary, Data Validation, Auth, Error Handling, …). | Project facts: one group per operation or feature in the input. A screenshot of the system under test goes after this section only if the user supplied one. |
| 4 | Test Environments | H3 | Paragraphs on OS, browsers, devices, network, hardware, security protocols and access roles; table **Name \| Env url**; then a list of OS – browser combinations. | Project facts. Ask for environment names and URLs, and for platforms and browsers, if absent. |
| 5 | Defect Reporting Procedure | H3 | Paragraphs on criteria, reporting steps, triage and prioritisation, tools, roles, communication and metrics; table **Defect Process \| POC**; `Tools - <tool>` line. | The process paragraphs are standard wording. POC names, areas and the tool are project facts, so ask for them. |
| 6 | Test Strategy | H3 | Step 1: scenarios and cases plus design techniques (Equivalence Class Partition, Boundary Value Analysis, Decision Table, State Transition, Use Case) and Error Guessing / Exploratory. Step 2: smoke test, reject unstable builds, in-depth testing, end-of-day defect email, testing types. Step 3: best practices (Context Driven, Shift Left, Exploratory, End to End Flow). | Standard wording. Adapt only where the input says otherwise. |
| 7 | Test Schedule | H3 | "Following is the test schedule planned for the project –"; table **Task \| Dates** with rows Creating Test Plan, Test Case Creation, Test Case Execution, Summary Reports Submission Date; then a bold duration line. | Task rows are standard. Dates and duration are project facts: leave a date cell as "Insufficient information to determine." and add an `insufficient` block with the question. |
| 8 | Test Deliverables. (with the trailing period) | H3 | "The following are to be delivered to the client:"; table **Deliverables \| Description \| Target Completion Date**: Test Plan, Functional Test Cases, Defect Reports (NA), Summary Reports. | Rows and descriptions are standard. Dates are project facts, handled as in Test Schedule. |
| 9 | Entry and Exit Criteria | H3 | Intro "The below are the entry and exit criteria for every phase of Software Testing Life Cycle:" then "Requirement Analysis". **Entry Criteria:** testing team receives the requirements documents. **Exit Criteria:** requirements explored and understood, doubts cleared. | Standard wording. |
| 10 | Test Execution | H3 | **Entry:** Test Scenarios and Test Cases signed off by the client; application ready for testing. **Exit:** Test Case Reports and Defect Reports ready. | Standard wording. |
| 11 | Test Closure | H3 | **Entry:** Test Case Reports and Defect Reports ready. **Exit:** Test Summary Reports. | Standard wording. |
| 12 | Tools | H4 | "The following are the list of Tools we will be using in this Project:" then a list. | Project facts. Confirm the tools with the user; the sample's JIRA, mind map, snipping tool and Word/Excel are not defaults. |
| 13 | Risks and Mitigations | H4 | "The following are the list of risks possible and the ways to mitigate them:" then Risk / Mitigation pairs. | The template's three generic pairs (resource unavailable, build URL down, less time) are standard wording. Add project risks only from the input. |
| 14 | Approvals | H4 | "Team will send different types of documents for Client Approval like below:" then Test Plan, Test Scenarios, Test Cases, Reports; closing "Testing will only continue to the next steps once these approvals are done". | Standard wording. |

## Writing style to match

- Short, direct sentences in the team's voice ("We will…", "Test the API's ability to…", "Verify that…").
- Bold lead-ins for groups and list titles; plain text beneath.
- Lists use `•` with `o` sub-bullets; the generator draws these marks, so don't type them yourself.
- Keep the template's capitalisation of headings exactly, including "Test Deliverables.".

## Missing information inside a section

Keep the section and its heading. Put any facts you do have first, then an `insufficient` block. It renders as **Insufficient information to determine.** followed by `Open question: …`. A section that is entirely unknown contains only that block. Never delete a section; the template structure is fixed.
