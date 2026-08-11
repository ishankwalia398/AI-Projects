"""
Test Case Validator for PractiTest Uploads
Pre-validates test cases against PractiTest constraints
"""

import re
from typing import Dict, List, Any, Optional


class TestCaseValidator:
    """
    Validates test cases against PractiTest constraints before upload
    Prevents API errors and ensures data integrity
    """

    # PractiTest field constraints
    CONSTRAINTS = {
        "name": {
            "max_length": 255,
            "required": True,
            "allow_empty": False
        },
        "description": {
            "max_length": 10000,
            "required": False,
            "allow_empty": True
        },
        "step_name": {
            "max_length": 255,
            "required": True,
            "allow_empty": False
        },
        "step_description": {
            "max_length": 10000,
            "required": False,
            "allow_empty": True
        },
        "expected_results": {
            "max_length": 10000,
            "required": False,
            "allow_empty": True
        },
        "priority": {
            "format": r"^\d+-\w+$",  # e.g., "2-high", "4-low"
            "required": False
        },
        "status": {
            "allowed_values": ["Draft", "Ready"],
            "required": False
        }
    }

    # Dangerous characters that might cause issues
    DANGEROUS_CHARS = ['<script>', '</script>', 'javascript:', 'onerror=', 'onclick=']

    def __init__(self, strict_mode: bool = True):
        """
        Initialize validator

        Args:
            strict_mode: If True, treats warnings as errors
        """
        self.strict_mode = strict_mode

    def validate_test_case(self, test_case: Dict[str, Any]) -> Dict[str, List[str]]:
        """
        Validate a single test case

        Args:
            test_case: Test case dictionary with fields: name, description, steps, etc.

        Returns:
            Dictionary with 'errors' and 'warnings' lists
        """
        errors = []
        warnings = []

        # Validate test case name
        name = test_case.get('name', '')
        if not name or not name.strip():
            errors.append("Test case name is required and cannot be empty")
        elif len(name) > self.CONSTRAINTS['name']['max_length']:
            errors.append(f"Test case name too long: {len(name)} chars (max {self.CONSTRAINTS['name']['max_length']})")

        # Check for dangerous characters in name
        if self._has_dangerous_chars(name):
            warnings.append(f"Test case name contains potentially unsafe characters: {name[:50]}")

        # Validate description
        description = test_case.get('description', '')
        if description and len(description) > self.CONSTRAINTS['description']['max_length']:
            errors.append(f"Description too long: {len(description)} chars (max {self.CONSTRAINTS['description']['max_length']})")

        # Validate priority format
        priority = test_case.get('priority')
        if priority:
            if not re.match(self.CONSTRAINTS['priority']['format'], priority):
                errors.append(f"Invalid priority format: '{priority}'. Expected format: '2-high', '3-medium', etc.")

        # Validate status
        status = test_case.get('status')
        if status and status not in self.CONSTRAINTS['status']['allowed_values']:
            errors.append(f"Invalid status: '{status}'. Allowed: {self.CONSTRAINTS['status']['allowed_values']}")

        # Validate steps
        steps = test_case.get('steps', [])
        if not steps:
            warnings.append("Test case has no steps")
        else:
            for i, step in enumerate(steps):
                step_errors = self._validate_step(step, i + 1)
                errors.extend(step_errors)

        # Validate custom fields
        custom_fields = test_case.get('custom_fields', {})
        if custom_fields:
            for field_id, value in custom_fields.items():
                if not field_id.startswith('---f-'):
                    warnings.append(f"Custom field ID '{field_id}' doesn't match expected format '---f-XXXXX'")

                if isinstance(value, str) and len(value) > 1000:
                    warnings.append(f"Custom field {field_id} value is very long ({len(value)} chars)")

        return {
            "errors": errors,
            "warnings": warnings if not self.strict_mode else errors + warnings
        }

    def _validate_step(self, step: Dict[str, Any], step_num: int) -> List[str]:
        """Validate a single step"""
        errors = []

        # Step name is required
        step_name = step.get('name', '')
        if not step_name or not step_name.strip():
            errors.append(f"Step {step_num}: name is required")
        elif len(step_name) > self.CONSTRAINTS['step_name']['max_length']:
            errors.append(f"Step {step_num}: name too long ({len(step_name)} chars, max {self.CONSTRAINTS['step_name']['max_length']})")

        # Validate step description
        step_desc = step.get('description', '')
        if step_desc and len(step_desc) > self.CONSTRAINTS['step_description']['max_length']:
            errors.append(f"Step {step_num}: description too long ({len(step_desc)} chars)")

        # Validate expected results
        expected = step.get('expected_results', '')
        if expected and len(expected) > self.CONSTRAINTS['expected_results']['max_length']:
            errors.append(f"Step {step_num}: expected results too long ({len(expected)} chars)")

        return errors

    def _has_dangerous_chars(self, text: str) -> bool:
        """Check if text contains dangerous characters"""
        if not text:
            return False

        text_lower = text.lower()
        return any(danger in text_lower for danger in self.DANGEROUS_CHARS)

    def validate_batch(self, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate a batch of test cases

        Args:
            test_cases: List of test case dictionaries

        Returns:
            Dictionary with validation results:
            {
                "valid": True/False,
                "total": int,
                "passed": int,
                "failed": int,
                "test_case_errors": {tc_id: {errors: [...], warnings: [...]}}
            }
        """
        results = {
            "valid": True,
            "total": len(test_cases),
            "passed": 0,
            "failed": 0,
            "test_case_errors": {}
        }

        for tc in test_cases:
            tc_id = tc.get('tc_id') or tc.get('id') or f"TC_{test_cases.index(tc)}"
            validation = self.validate_test_case(tc)

            if validation['errors']:
                results["failed"] += 1
                results["valid"] = False
                results["test_case_errors"][tc_id] = validation
            else:
                results["passed"] += 1
                if validation['warnings']:
                    results["test_case_errors"][tc_id] = validation

        return results

    def generate_validation_report(self, validation_results: Dict[str, Any]) -> str:
        """Generate a human-readable validation report"""
        results = validation_results

        report = f"""
Validation Report
{'=' * 70}

Total Test Cases: {results['total']}
Passed: {results['passed']}
Failed: {results['failed']}
Status: {'✅ VALID' if results['valid'] else '❌ INVALID'}
"""

        if results['test_case_errors']:
            report += "\nIssues Found:\n"
            for tc_id, issues in list(results['test_case_errors'].items())[:20]:
                if issues['errors']:
                    report += f"\n  {tc_id} - ERRORS:\n"
                    for error in issues['errors']:
                        report += f"    ❌ {error}\n"

                if issues['warnings']:
                    report += f"  {tc_id} - WARNINGS:\n"
                    for warning in issues['warnings']:
                        report += f"    ⚠️  {warning}\n"

            if len(results['test_case_errors']) > 20:
                report += f"\n  ... and {len(results['test_case_errors']) - 20} more test cases with issues\n"

        return report

    @staticmethod
    def sanitize_field(value: str) -> str:
        """
        Sanitize a field value by removing/escaping dangerous content

        Args:
            value: Field value to sanitize

        Returns:
            Sanitized value
        """
        if not value:
            return value

        # Remove script tags
        value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)

        # Remove javascript: protocols
        value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)

        # Remove event handlers
        value = re.sub(r'\s*on\w+\s*=', '', value, flags=re.IGNORECASE)

        # Trim whitespace
        value = value.strip()

        return value

    @staticmethod
    def truncate_field(value: str, max_length: int, suffix: str = "...") -> str:
        """
        Truncate a field value to maximum length

        Args:
            value: Field value to truncate
            max_length: Maximum allowed length
            suffix: Suffix to add when truncating

        Returns:
            Truncated value
        """
        if not value or len(value) <= max_length:
            return value

        return value[:max_length - len(suffix)] + suffix
