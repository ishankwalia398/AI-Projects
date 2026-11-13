# Test Case Template: reference

Source: the user's `Test cases.xlsx` (the attached `Test cases.csv` is its first sheet). The template has four sheets:

- **Main** and **General CRUD** are reproduced in the output `.xlsx`, keeping their sheet names, cell positions, column widths, Lato font, orange (`FF6D01`) header rows and grey (`F3F3F3`) data rows.
- **TIPS** is the writing-style guide.
- **Common verification** holds notes for the sample project.

The output is only the `.xlsx`, never Word or PDF.

The sample content is the **Restful Booker** API. Use it only to learn style. Never copy its values: project name, URLs, booking fields, status codes, people, dates, or Postman scripts.

## Sheet "Main": header block and scenario summary

Header block: labels in C2:C7, values in D2:D7, under the orange title band **"Test Case Template for Project"** (merged C1:D1). Rows alternate white and cream (`FEF8E3`).

| Label | How to fill it |
|---|---|
| Project Name | From the inputs; otherwise ask |
| Module Name | From the inputs; otherwise ask |
| Created By | Ask the user. Never guess an author |
| Created Date | Generation date, MM/DD/YYYY (the template's format, e.g. 06/22/2023). The script fills it in |
| Peer Review By | Leave empty; filled after review |
| Peer Reviewed Date | Leave empty; filled after review |

Scenario summary table: headings in row 10, one row per scenario from row 11. Template columns (the template's "Desciption" is corrected to "Description"):

`A Test Scenario TID | B Test Scenario Description | C Priority | D No. of Test cases | E Linked Document | F–H (unnamed, empty) | I Executed QA Name | J Misc (Comments)`

Columns F–H are unnamed and empty in the template. They are kept as blank orange header cells, so Executed QA Name and Misc stay in columns I and J as in the template.

Sample rows (style only): `2 | PING HEALTH CHECK | P0 | 10 | Test Plan Link or FRD Link`, `4 | Get Single Booking | P0 | 15 | …`.

- **Test Scenario TID and No. of Test cases** are computed by the script.
- **Priority** uses the P0/P1/… scale, taken from the Test Plan or spec, or from a user answer.
- **Linked Document** names the Test Plan file and section, plus the spec reference, e.g. `STP_PasswordReset_20261113_144548.docx – Inclusions; PRD §2.3`.
- **Executed QA Name** stays empty.

## Sheet "General CRUD": detailed test cases

Headings in row 1, test cases from row 2. All 14 template columns, in order:

`A Scenario TID | B TestCase Description | C PreCondition | D TestSteps | E Expected Result | F Actual Result | G Steps to Execute | H Expected Result | I Actual Result | J Status | K Executed QA Name | L Misc (Comments) | M Priority | N Is Automated`

- Columns G–I (a second "Steps to Execute / Expected Result / Actual Result" group) are empty in every sample row. They are kept as empty columns so the sheet matches the template.
- Steps and expected results go in one cell each, as numbered lines (`1.…` newline `2.…`), as in the sample.
- **Scenario TID** appears only on the first test case of each scenario; the following rows leave it blank. The script does this.
- **Execution columns are left empty:** Actual Result, Status, Executed QA Name, and columns G–I. They record what happened when someone ran the test. Writing anything there would invent results.
- **Is Automated:** fill it only if the inputs say whether a case is automated; otherwise leave it empty.
- **Misc (Comments):** the script appends `Ref: <source>` to every case, so each case shows its traceability in the file.

Style of the sample rows:

- **TestCase Description** starts with "Verify if/that …" and names one check, e.g. *"Verify if you are getting status code of 201 for ping health check"*.
- **TestSteps** are numbered `1.` `2.` `3.`, one action per step. The sample's tool steps (*"1.Login to POSTMAN tool 2.In POSTMAN tool, Navigate to … 3.Enter the … url and Select GET request and Click Send"*) and `pm.test(...)` script snippets appear only because the sample's plan uses Postman. Include tool-specific steps or scripts only when the Test Plan names that tool. Otherwise write tool-neutral steps such as "Send a GET request to <endpoint from the spec>".
- **Expected Result** is numbered to match the steps, each line saying what must be true after that step, e.g. *"1.Successful Login 2.Successful Navigation 3.The Status code in the Response tab must be 201"*.
- **Negative cases** state the rejection the spec defines, e.g. *"Verify if user is not able to create new resource using POST request when Request json body sent has only 4 out of 8 fields"*, expected *"The Response code must be 500"*. Use only codes the spec gives; otherwise write "Insufficient information to determine. Open question: …".

## Sheet "TIPS": how to write a better test case (follow this)

- Use the keywords: **Should, Verify, Test, Validate, Select, Check**.
- **Test Case Title:** "Verify that with the X and Y, Z should work." e.g. *"Verify that with the Valid username <<>> and password <<>>, login should work"*.
- **Expected Result:** "with the Valid username and password, Login should work".
- **Actual Result** (execution only, never generated): "with the valid username and password, Login is working as expected."
- **Steps to Execute:** Navigate to X → Do this Z → Verify this Y.
- **Example scenario:** "Testing the login feature of a web application", with Test Case 1 "Verify that the user can successfully log in with valid credentials", Test Case 2 "Verify that the user is unable to log in with an incorrect password", and Test Case 3 "Verify that the user is unable to log in with an invalid username".

## Sheet "Common verification": not part of the output

This sheet is a per-HTTP-method checklist for the Restful Booker sample: whether the ID, Auth and Payload apply, the expected Status, Response and Headers. Its values are specific to that API and partly inconsistent, so they are never used as facts. The underlying idea can still prompt questions: for each operation the spec defines, check that its status, response body and headers are specified. If they aren't, ask.
