# Automation Report Analysis Skill

## Overview

This skill analyzes automation test reports (provided as zip files) and performs Root Cause Analysis (RCA) on failed tests. It generates a comprehensive Excel report with detailed failure analysis and solutions.

## Features

- **Automated RCA**: Analyzes each failed test to determine root cause
- **API Request/Response Extraction**: Captures full API details including URLs, methods, headers, and response bodies
- **Smart Filtering**: Automatically skips 503 errors and "no healthy upstream" failures
- **Cross-Platform**: Works seamlessly on Windows, Mac, and Linux
- **Standard Output Location**: Saves Excel reports to `~/.claude/outputs/` (auto-created)
  - Windows: `C:\Users\<username>\.claude\outputs\`
  - Mac/Linux: `~/.claude/outputs/`
- **Excel Output**: Professional formatted Excel report with two sheets:
  - Failed Tests Analysis (detailed RCA for each failure)
  - Summary Statistics (overall test metrics and failure categories)
- **Senior Engineer Perspective**: Provides actionable solutions based on 10+ years of testing experience

## Requirements

- Python 3.7+
- openpyxl library: `pip install openpyxl`

## Usage

### From Command Line

```bash
python scripts/analyze_report.py <path_to_report.zip> [output_directory]
```

Examples:
```bash
# Uses default location: ~/.claude/outputs/
python scripts/analyze_report.py execution478028.zip

# Specify custom output directory
python scripts/analyze_report.py execution478028.zip /path/to/output
```

### As a Claude Skill

Simply provide a test report zip file and ask for analysis:

```
"Analyze this test report and give me an RCA"
"I need a failure analysis of these test results"
"Create an Excel report of failed tests with root causes"
```

## Output

### Sheet 1: Failed Tests Analysis

| S.No. | Test_Name | API_Request_Response | Failure | Failure_Reason | Solution |
|-------|-----------|---------------------|---------|----------------|----------|
| 1 | test_name | Full request/response details | Failure message | Root cause | Recommended fix |

### Sheet 2: Summary Statistics

- Total Tests
- Total Passed
- Total Failed
- Tests Analyzed
- Tests Skipped (503/no healthy upstream)
- Pass Rate %
- Failure Categories breakdown

## Report Structure

The skill expects reports with this structure:

```
report.zip
├── tests/
│   ├── test_xxxxx-1/
│   │   ├── test.js (test execution data)
│   │   └── _response_*.txt (API responses)
│   ├── test_xxxxx-2/
│   └── ...
└── index.html (report dashboard)
```

## Example Analysis

**Failure**: Response body field 'TotalCount' value is '0', not greater than or equal to: 1

**Failure Reason**: API returned empty result set. TotalCount is 0 when test expected at least 1 record.

**Solution**:
1. Verify test data setup - ensure required records exist in the database
2. Check if data cleanup ran before this test
3. Verify API query parameters are correct
4. Check database connection and query execution logs

## Exclusion Rules

Tests are automatically skipped if they contain:
- HTTP 503 status code
- Error message "no healthy upstream" (any case variation)

These are counted separately in the Summary Statistics sheet.

## Author

Created for QA Engineers and Test Automation experts who need systematic failure analysis.