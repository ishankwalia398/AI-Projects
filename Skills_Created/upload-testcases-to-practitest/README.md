# Upload Test Cases to PractiTest - Skill Documentation

**Version**: 1.0.0  
**Last Updated**: 2026-08-03  
**Status**: ✅ Production Ready

---

## Overview

This skill enables Claude to upload test cases from various file formats (CSV, Excel, PDF, Word, Markdown) directly into PractiTest using the PractiTest MCP connector. It follows strict anti-hallucination rules to ensure data accuracy and never invents or assumes information.

## Features

- ✅ Multi-format support (CSV, Excel, PDF, Word, Markdown)
- ✅ Automatic project and mandatory field detection
- ✅ Smart parsing for single-row and multi-row test case formats
- ✅ Field mapping confirmation before upload
- ✅ Comprehensive error handling and validation
- ✅ Batch upload with parallel MCP calls
- ✅ Clear success/failure reporting with exact counts

## Prerequisites

### 1. MCP Connection
The PractiTest MCP server must be connected and authenticated:
```bash
# Check connection status
/mcp

# If not connected, run setup
/practitest:setup
```

### 2. Python Dependencies
Required packages:
- `pandas` - For CSV/Excel parsing
- `openpyxl` - For Excel (.xlsx) support

Optional packages:
- `PyPDF2` - For PDF support
- `python-docx` - For Word (.docx) support

Install with:
```bash
pip install pandas openpyxl PyPDF2 python-docx
```

## Usage

### Basic Usage
```
Upload these test cases to PractiTest
[Attach or provide path to test case file]
```

### With Project Specified
```
Upload test_cases.xlsx to PractiTest project "Mobile QA" (ID: 12345)
```

### With Field Mappings
```
Upload api_tests.csv to PT project 891023. 
Priority column should map to PT priority field.
API_Endpoint column goes to custom field ---f-89234.
```

## Workflow

1. **MCP Connection Check**: Verifies PractiTest MCP is available
2. **File Ingestion**: Detects file type and extracts content
3. **Parsing**: Identifies test cases and steps with smart format detection
4. **Project Selection**: Lists available projects if not specified
5. **Mandatory Fields Check**: Retrieves and validates required custom fields
6. **Field Mapping Confirmation**: Asks user to confirm column mappings
7. **Validation**: Runs anti-hallucination checks to prevent data invention
8. **Upload**: Creates test cases via PractiTest MCP (batched/parallel)
9. **Reporting**: Provides clear summary with exact counts and IDs

## Supported File Formats

### CSV (.csv)
- Standard comma-separated values
- Both single-row and multi-row formats supported

### Excel (.xlsx, .xls)
- Multiple sheets supported (will ask which sheet to use)
- Handles both test case formats:
  - **Single-row**: Each row is a complete test case
  - **Multi-row**: Each row is a step, grouped by TC_ID

### PDF (.pdf)
- Basic text extraction (limited support)
- Best results when converted to CSV/Excel first

### Word (.docx)
- Extracts tables and paragraphs
- Works best with structured tables

### Markdown (.md)
- Parses tables and structured lists
- Basic text format supported

## Field Mapping

### Standard Fields
The skill automatically maps common column names:
- `TC_Name`, `Test_Name`, `Name` → Test name (required)
- `TC_Description`, `Description` → Test description
- `Step_Name`, `Step#` → Step name
- `Step_Description` → Step description
- `Expected_Result` → Step expected results
- `Priority` → Priority field
- `Status` → Status field

### Custom Fields
For any column not matching standard fields, the skill:
1. Calls `get_custom_fields` to retrieve available custom fields
2. Suggests mappings based on name similarity
3. Asks user to confirm before uploading

### Mandatory Fields
The skill automatically detects mandatory custom fields and:
- Checks if source file has matching columns
- If missing, asks user for default value or per-test-case values
- Will NOT upload if mandatory fields cannot be populated

## Anti-Hallucination Rules

This skill operates under strict verification rules:

1. **Never invents data** - All field values must be traceable to source file or explicit user confirmation
2. **Never assumes mappings** - Always confirms field mappings with user
3. **Never guesses missing info** - Stops and asks rather than filling in blanks
4. **Deterministic behavior** - Same input + same mapping = same output every time

### Validation Process
Before upload, the skill generates:
1. **Verified Facts**: What was extracted from the file
2. **Missing/Unknown Info**: What's missing or ambiguous
3. **Generated Output**: What will be uploaded (derived only from verified facts)
4. **Self-Check**: Confirmation that nothing was invented

If validation fails, the skill stops and asks for clarification.

## Error Handling

| Error | Behavior |
|---|---|
| MCP not available | Stops, guides user to check `/mcp` |
| Mandatory fields missing | Stops, asks for values or suggests adding to file |
| Test case name missing | Stops, reports specific rows, asks to skip or provide names |
| Ambiguous mapping | Stops, asks user to clarify |
| Partial upload failure | Continues with remaining tests, reports which failed and why |

## Examples

### Example 1: Standard Upload
```
User: Upload these test cases to PractiTest
      [Provides TVOD_Backend_TestCases.xlsx]

Skill: [Verifies MCP connection]
       [Parses file → 47 test cases found]
       Lists available projects:
       1. Kaltura Backend QA (ID: 891023)
       2. Mobile App Testing (ID: 238471)
       
       Which project should I upload to?

User: Kaltura Backend QA

Skill: [Checks mandatory fields → finds "Test Type" and "Component"]
       Project requires two mandatory fields:
       - Test Type (---f-12345)
       - Component (---f-67890)
       
       Your file doesn't have these. What values should I use?

User: Use "Backend" for Test Type and "VOD" for Component

Skill: [Confirms mappings]
       [Uploads 47 test cases]
       ✅ Uploaded 47 test cases to "Kaltura Backend QA" (ID: 891023)
```

### Example 2: With Missing Data
```
User: Upload api_tests.csv to project 238471

Skill: [Parses file → finds 15 test cases]
       [Checks mandatory fields → none required]
       
       Found 15 test cases, but 3 are missing names:
       - Row 5: TC_Name is empty
       - Row 12: TC_Name is empty
       - Row 14: TC_Name is empty
       
       Should I skip these or can you provide names?

User: Skip them

Skill: [Uploads 12 test cases]
       ✅ Uploaded 12 of 15 test cases to project 238471
       Skipped 3 test cases (missing names)
```

## Bundled Resources

### scripts/parse_testcases.py
Helper script for parsing test case files. Can be used standalone:

```bash
# Parse a file and output JSON
python scripts/parse_testcases.py test_cases.xlsx

# Specify sheet for Excel files
python scripts/parse_testcases.py test_cases.xlsx --sheet "Sheet2"

# Save to file
python scripts/parse_testcases.py test_cases.csv --output parsed.json
```

Output format:
```json
[
  {
    "name": "Test case name",
    "description": "Test description",
    "preconditions": "Setup steps",
    "steps": [
      {
        "name": "Step 1",
        "description": "Action to perform",
        "expected_results": "Expected outcome"
      }
    ],
    "priority": "High",
    "custom_fields": {}
  }
]
```

## CI/CD Validation

The skill has passed comprehensive CI/CD audit:
- ✅ No security vulnerabilities
- ✅ No breaking API calls
- ✅ Cross-platform path handling
- ✅ Comprehensive error handling
- ✅ All dependencies documented

See `AUDIT_REPORT.md` for full details.

## Troubleshooting

### "PractiTest MCP connection failed"
**Solution**: 
1. Run `/mcp` to check connection status
2. If not connected, run `/practitest:setup`
3. Verify API token and email are correct

### "pandas not installed"
**Solution**: 
```bash
pip install pandas openpyxl
```

### "Could not find TC_ID column for grouping"
**Issue**: File has multi-row format but no clear grouping column  
**Solution**: Ensure file has a `TC_ID` or `TC_Name` column, or use single-row format

### "Mandatory field missing" during upload
**Issue**: PractiTest validation failed due to missing required field  
**Solution**: The skill checks this in advance (Step 3), but if it still occurs:
1. Call `get_custom_fields` to see what's required
2. Add missing column to file, or provide default value

## Version History

### v1.0.0 (2026-08-03)
- ✅ Initial production release
- ✅ Applied all CI/CD audit recommendations
- ✅ Added MCP connection check (Step 0)
- ✅ Added pandas dependency validation
- ✅ Shortened description for better triggering
- ✅ Added compatibility metadata
- ✅ Added timeout handling
- ✅ Fixed eval test paths

## Support

For issues or questions:
1. Check the audit report: `AUDIT_REPORT.md`
2. Review the full skill instructions: `SKILL.md`
3. Test the parser standalone: `python scripts/parse_testcases.py --help`

## License

This skill is part of the Claude Code skill library.
