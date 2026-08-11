"""
Structured Logger for PractiTest Uploads
Provides audit trail and debugging capabilities
"""

import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional


class UploadLogger:
    """
    Structured logger for PractiTest upload operations
    Provides both human-readable logs and JSON audit trail
    """

    def __init__(self, batch_id: str, log_level: str = "INFO"):
        """
        Initialize logger

        Args:
            batch_id: Unique batch identifier
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        """
        self.batch_id = batch_id

        # Create logs directory
        log_dir = Path.home() / ".claude" / "practitest_upload_logs"
        log_dir.mkdir(parents=True, exist_ok=True)

        # Log file paths
        self.log_file = log_dir / f"{batch_id}.log"
        self.audit_file = log_dir / f"{batch_id}_audit.jsonl"

        # Setup Python logger for human-readable logs
        self.logger = logging.getLogger(f"practitest_upload_{batch_id}")
        self.logger.setLevel(getattr(logging, log_level.upper()))

        # Remove existing handlers
        self.logger.handlers = []

        # File handler
        file_handler = logging.FileHandler(self.log_file, encoding='utf-8')
        file_handler.setLevel(getattr(logging, log_level.upper()))

        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)

        self.logger.addHandler(file_handler)

        # Initialize audit log
        self._write_audit({
            "event": "logger_initialized",
            "batch_id": batch_id,
            "log_level": log_level,
            "log_file": str(self.log_file),
            "audit_file": str(self.audit_file)
        })

    def _write_audit(self, event: Dict[str, Any]):
        """Write to JSON audit log"""
        event["timestamp"] = datetime.now().isoformat()
        event["batch_id"] = self.batch_id

        with open(self.audit_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(event) + '\n')

    def info(self, message: str, **kwargs):
        """Log info message"""
        self.logger.info(message)
        self._write_audit({
            "event": "info",
            "message": message,
            **kwargs
        })

    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self.logger.warning(message)
        self._write_audit({
            "event": "warning",
            "message": message,
            **kwargs
        })

    def error(self, message: str, error: Optional[Exception] = None, **kwargs):
        """Log error message"""
        self.logger.error(message)
        self._write_audit({
            "event": "error",
            "message": message,
            "error_type": type(error).__name__ if error else None,
            "error_message": str(error) if error else None,
            **kwargs
        })

    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self.logger.debug(message)
        self._write_audit({
            "event": "debug",
            "message": message,
            **kwargs
        })

    def upload_started(self, project_id: str, total_test_cases: int, source_file: str):
        """Log upload start"""
        msg = f"Upload started: {total_test_cases} test cases from {source_file} to project {project_id}"
        self.logger.info(msg)
        self._write_audit({
            "event": "upload_started",
            "project_id": project_id,
            "total_test_cases": total_test_cases,
            "source_file": source_file
        })

    def test_case_created(self, tc_id: str, pt_test_id: str, display_id: str = None):
        """Log successful test case creation"""
        msg = f"Created test case {tc_id} → PT#{display_id or pt_test_id}"
        self.logger.info(msg)
        self._write_audit({
            "event": "test_case_created",
            "tc_id": tc_id,
            "pt_test_id": pt_test_id,
            "display_id": display_id
        })

    def test_case_failed(self, tc_id: str, error: str, attempt: int = 1):
        """Log test case creation failure"""
        msg = f"Failed to create test case {tc_id} (attempt {attempt}): {error}"
        self.logger.error(msg)
        self._write_audit({
            "event": "test_case_failed",
            "tc_id": tc_id,
            "error": error,
            "attempt": attempt
        })

    def test_case_skipped(self, tc_id: str, reason: str):
        """Log skipped test case"""
        msg = f"Skipped test case {tc_id}: {reason}"
        self.logger.warning(msg)
        self._write_audit({
            "event": "test_case_skipped",
            "tc_id": tc_id,
            "reason": reason
        })

    def validation_failed(self, tc_id: str, errors: list):
        """Log validation failure"""
        msg = f"Validation failed for {tc_id}: {len(errors)} errors"
        self.logger.error(msg)
        self._write_audit({
            "event": "validation_failed",
            "tc_id": tc_id,
            "errors": errors
        })

    def progress_update(self, uploaded: int, total: int, elapsed_seconds: float = None):
        """Log progress update"""
        progress_pct = (uploaded / total * 100) if total > 0 else 0
        msg = f"Progress: {uploaded}/{total} ({progress_pct:.1f}%)"
        if elapsed_seconds:
            rate = uploaded / elapsed_seconds if elapsed_seconds > 0 else 0
            msg += f" - {rate:.1f} tests/sec"

        self.logger.info(msg)
        self._write_audit({
            "event": "progress_update",
            "uploaded": uploaded,
            "total": total,
            "progress_percent": progress_pct,
            "elapsed_seconds": elapsed_seconds
        })

    def upload_completed(self, uploaded: int, failed: int, skipped: int, duration_seconds: float):
        """Log upload completion"""
        msg = f"Upload completed: {uploaded} succeeded, {failed} failed, {skipped} skipped ({duration_seconds:.1f}s)"
        self.logger.info(msg)
        self._write_audit({
            "event": "upload_completed",
            "uploaded": uploaded,
            "failed": failed,
            "skipped": skipped,
            "duration_seconds": duration_seconds,
            "rate": uploaded / duration_seconds if duration_seconds > 0 else 0
        })

    def rollback_started(self, test_count: int):
        """Log rollback start"""
        msg = f"Rollback started: deleting {test_count} uploaded tests"
        self.logger.warning(msg)
        self._write_audit({
            "event": "rollback_started",
            "test_count": test_count
        })

    def rollback_completed(self, deleted: int, failed_to_delete: int):
        """Log rollback completion"""
        msg = f"Rollback completed: {deleted} deleted, {failed_to_delete} failed to delete"
        self.logger.info(msg)
        self._write_audit({
            "event": "rollback_completed",
            "deleted": deleted,
            "failed_to_delete": failed_to_delete
        })

    def api_call(self, method: str, endpoint: str, duration_ms: float = None, status_code: int = None):
        """Log API call"""
        self._write_audit({
            "event": "api_call",
            "method": method,
            "endpoint": endpoint,
            "duration_ms": duration_ms,
            "status_code": status_code
        })

    def rate_limit_hit(self, retry_after_seconds: int = None):
        """Log rate limit hit"""
        msg = f"Rate limit hit"
        if retry_after_seconds:
            msg += f", retrying after {retry_after_seconds}s"
        self.logger.warning(msg)
        self._write_audit({
            "event": "rate_limit_hit",
            "retry_after_seconds": retry_after_seconds
        })

    def get_log_path(self) -> str:
        """Get path to human-readable log file"""
        return str(self.log_file)

    def get_audit_path(self) -> str:
        """Get path to JSON audit log"""
        return str(self.audit_file)

    def generate_summary(self) -> str:
        """Generate summary from audit log"""
        events = []
        with open(self.audit_file, 'r', encoding='utf-8') as f:
            for line in f:
                events.append(json.loads(line))

        # Count event types
        event_counts = {}
        for event in events:
            event_type = event.get('event', 'unknown')
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

        # Find key events
        start_event = next((e for e in events if e['event'] == 'upload_started'), None)
        end_event = next((e for e in reversed(events) if e['event'] == 'upload_completed'), None)

        summary = f"""
Upload Summary - Batch {self.batch_id}
{'=' * 70}

Log Files:
  Human-readable: {self.log_file}
  Audit trail: {self.audit_file}

Event Counts:
"""
        for event_type, count in sorted(event_counts.items()):
            summary += f"  {event_type}: {count}\n"

        if start_event:
            summary += f"\nUpload Details:\n"
            summary += f"  Started: {start_event.get('timestamp')}\n"
            summary += f"  Source: {start_event.get('source_file')}\n"
            summary += f"  Project: {start_event.get('project_id')}\n"
            summary += f"  Total Test Cases: {start_event.get('total_test_cases')}\n"

        if end_event:
            summary += f"\nResults:\n"
            summary += f"  Uploaded: {end_event.get('uploaded')}\n"
            summary += f"  Failed: {end_event.get('failed')}\n"
            summary += f"  Skipped: {end_event.get('skipped')}\n"
            summary += f"  Duration: {end_event.get('duration_seconds'):.1f}s\n"
            summary += f"  Rate: {end_event.get('rate'):.1f} tests/sec\n"

        return summary
