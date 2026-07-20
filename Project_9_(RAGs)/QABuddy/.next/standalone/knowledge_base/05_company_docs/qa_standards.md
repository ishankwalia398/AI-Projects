# QA Standards & Best Practices

## Test Case Design
- Every test case must have a unique ID (TC_XXX format)
- Preconditions must be explicit and achievable
- Steps must be atomic and numbered
- Expected results must be verifiable and specific

## Automation Guidelines
- Page Object Model (POM) is mandatory for UI tests
- Tests must be independent (no cross-test dependencies)
- Data-driven tests should use external CSV/JSON files
- All flaky tests must be flagged and fixed within 48 hours

## Bug Reporting
- Use JIRA ticket format: [PROJECT-123]
- Include: Summary, Steps to Reproduce, Expected vs Actual, Environment, Screenshots
- Severity: Critical, High, Medium, Low
- Priority mapping: Critical = P0, High = P1, Medium = P2, Low = P3

## CI/CD Integration
- All automated tests run on every PR
- Jenkins pipeline must not exceed 30 minutes
- Failed builds block merge (gated check-in)
- Nightly regression suite runs at 2 AM UTC
