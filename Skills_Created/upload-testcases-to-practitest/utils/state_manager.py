"""
State Manager for PractiTest Uploads
Provides idempotency, resume capability, and rollback functionality
"""

import json
import hashlib
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any


class UploadStateManager:
    """
    Manages upload state to enable:
    - Idempotency: prevent duplicate uploads
    - Resume: continue from checkpoint after failure
    - Rollback: clean up failed uploads
    """

    def __init__(self, project_id: str, source_file: str, batch_id: Optional[str] = None):
        """
        Initialize state manager

        Args:
            project_id: PractiTest project ID
            source_file: Path to source file being uploaded
            batch_id: Optional batch identifier (auto-generated if not provided)
        """
        self.project_id = project_id
        self.source_file = source_file

        # Generate unique batch ID based on file content hash
        if batch_id is None:
            file_hash = self._hash_file(source_file)
            self.batch_id = f"{project_id}_{file_hash}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        else:
            self.batch_id = batch_id

        # State file location
        state_dir = Path.home() / ".claude" / "practitest_upload_states"
        state_dir.mkdir(parents=True, exist_ok=True)
        self.state_file = state_dir / f"{self.batch_id}.json"

        # Load existing state or initialize new
        self.state = self._load_state()

    def _hash_file(self, file_path: str) -> str:
        """Generate hash of file content for idempotency"""
        hasher = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                # Read in chunks to handle large files
                for chunk in iter(lambda: f.read(4096), b''):
                    hasher.update(chunk)
            return hasher.hexdigest()[:16]
        except Exception:
            # Fallback to filename-based hash
            return hashlib.sha256(file_path.encode()).hexdigest()[:16]

    def _load_state(self) -> Dict[str, Any]:
        """Load state from file or initialize new state"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        else:
            return {
                "batch_id": self.batch_id,
                "project_id": self.project_id,
                "source_file": self.source_file,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "status": "initialized",  # initialized, in_progress, completed, failed, rolled_back
                "total_test_cases": 0,
                "uploaded": {},  # {tc_id: {"pt_test_id": "123", "timestamp": "...", "display_id": "456"}}
                "failed": {},  # {tc_id: {"error": "...", "timestamp": "...", "attempts": 1}}
                "skipped": [],  # [tc_id, ...]
                "last_checkpoint": None,
                "custom_fields": {},
                "field_mapping": {},
                "metadata": {}
            }

    def _save_state(self):
        """Save current state to file"""
        self.state["updated_at"] = datetime.now().isoformat()
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)

    def initialize(self, total_test_cases: int, custom_fields: Dict, field_mapping: Dict, metadata: Dict = None):
        """
        Initialize upload session

        Args:
            total_test_cases: Total number of test cases to upload
            custom_fields: Custom field mappings
            field_mapping: Column name to PractiTest field mapping
            metadata: Additional metadata about the upload
        """
        self.state["total_test_cases"] = total_test_cases
        self.state["custom_fields"] = custom_fields
        self.state["field_mapping"] = field_mapping
        self.state["metadata"] = metadata or {}
        self.state["status"] = "in_progress"
        self._save_state()

    def is_uploaded(self, tc_id: str) -> bool:
        """Check if test case has already been uploaded"""
        return tc_id in self.state["uploaded"]

    def is_failed(self, tc_id: str) -> bool:
        """Check if test case previously failed"""
        return tc_id in self.state["failed"]

    def is_skipped(self, tc_id: str) -> bool:
        """Check if test case was skipped"""
        return tc_id in self.state["skipped"]

    def mark_uploaded(self, tc_id: str, pt_test_id: str, display_id: str = None):
        """
        Mark test case as successfully uploaded

        Args:
            tc_id: Test case ID from source file
            pt_test_id: PractiTest internal test ID
            display_id: PractiTest display ID (human-readable)
        """
        self.state["uploaded"][tc_id] = {
            "pt_test_id": pt_test_id,
            "display_id": display_id,
            "timestamp": datetime.now().isoformat()
        }
        self.state["last_checkpoint"] = tc_id

        # Remove from failed if it was there (retry succeeded)
        if tc_id in self.state["failed"]:
            del self.state["failed"][tc_id]

        self._save_state()

    def mark_failed(self, tc_id: str, error: str):
        """
        Mark test case as failed

        Args:
            tc_id: Test case ID from source file
            error: Error message
        """
        if tc_id not in self.state["failed"]:
            self.state["failed"][tc_id] = {
                "error": error,
                "timestamp": datetime.now().isoformat(),
                "attempts": 1
            }
        else:
            self.state["failed"][tc_id]["attempts"] += 1
            self.state["failed"][tc_id]["last_error"] = error
            self.state["failed"][tc_id]["last_attempt"] = datetime.now().isoformat()

        self._save_state()

    def mark_skipped(self, tc_id: str, reason: str):
        """
        Mark test case as skipped

        Args:
            tc_id: Test case ID from source file
            reason: Reason for skipping
        """
        self.state["skipped"].append({
            "tc_id": tc_id,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        })
        self._save_state()

    def get_resume_point(self) -> Optional[str]:
        """Get the last successfully uploaded test case ID"""
        return self.state.get("last_checkpoint")

    def get_uploaded_count(self) -> int:
        """Get number of successfully uploaded test cases"""
        return len(self.state["uploaded"])

    def get_failed_count(self) -> int:
        """Get number of failed test cases"""
        return len(self.state["failed"])

    def get_skipped_count(self) -> int:
        """Get number of skipped test cases"""
        return len(self.state["skipped"])

    def get_progress(self) -> Dict[str, Any]:
        """Get upload progress statistics"""
        total = self.state["total_test_cases"]
        uploaded = self.get_uploaded_count()
        failed = self.get_failed_count()
        skipped = self.get_skipped_count()
        remaining = total - uploaded - skipped

        return {
            "total": total,
            "uploaded": uploaded,
            "failed": failed,
            "skipped": skipped,
            "remaining": remaining,
            "progress_percent": (uploaded / total * 100) if total > 0 else 0,
            "status": self.state["status"]
        }

    def get_uploaded_test_ids(self) -> List[str]:
        """Get list of uploaded test case IDs"""
        return list(self.state["uploaded"].keys())

    def get_failed_test_ids(self) -> List[str]:
        """Get list of failed test case IDs"""
        return list(self.state["failed"].keys())

    def get_pt_test_id(self, tc_id: str) -> Optional[str]:
        """Get PractiTest test ID for a given source test case ID"""
        if tc_id in self.state["uploaded"]:
            return self.state["uploaded"][tc_id]["pt_test_id"]
        return None

    def mark_completed(self):
        """Mark the entire upload as completed"""
        self.state["status"] = "completed"
        self.state["completed_at"] = datetime.now().isoformat()
        self._save_state()

    def mark_failed_batch(self):
        """Mark the entire upload as failed"""
        self.state["status"] = "failed"
        self.state["failed_at"] = datetime.now().isoformat()
        self._save_state()

    def rollback(self, mcp_delete_function) -> Dict[str, Any]:
        """
        Rollback the upload by deleting all uploaded tests

        Args:
            mcp_delete_function: Function to delete a test, signature: fn(project_id, test_id) -> bool

        Returns:
            Dictionary with rollback results
        """
        results = {
            "attempted": 0,
            "deleted": 0,
            "failed_to_delete": []
        }

        # Delete all uploaded tests
        for tc_id, upload_info in self.state["uploaded"].items():
            results["attempted"] += 1
            try:
                success = mcp_delete_function(
                    self.project_id,
                    upload_info["pt_test_id"]
                )
                if success:
                    results["deleted"] += 1
                else:
                    results["failed_to_delete"].append({
                        "tc_id": tc_id,
                        "pt_test_id": upload_info["pt_test_id"],
                        "error": "Delete returned false"
                    })
            except Exception as e:
                results["failed_to_delete"].append({
                    "tc_id": tc_id,
                    "pt_test_id": upload_info["pt_test_id"],
                    "error": str(e)
                })

        # Mark state as rolled back
        self.state["status"] = "rolled_back"
        self.state["rolled_back_at"] = datetime.now().isoformat()
        self.state["rollback_results"] = results
        self._save_state()

        return results

    def generate_report(self) -> str:
        """Generate a human-readable report of the upload"""
        progress = self.get_progress()

        report = f"""
Upload Report - Batch {self.batch_id}
{'=' * 70}

Source File: {self.state['source_file']}
Project ID: {self.state['project_id']}
Status: {self.state['status'].upper()}
Created: {self.state['created_at']}
Updated: {self.state['updated_at']}

Progress:
  Total Test Cases: {progress['total']}
  Uploaded: {progress['uploaded']} ({progress['progress_percent']:.1f}%)
  Failed: {progress['failed']}
  Skipped: {progress['skipped']}
  Remaining: {progress['remaining']}

Last Checkpoint: {self.state['last_checkpoint'] or 'None'}
"""

        if self.state["failed"]:
            report += "\nFailed Test Cases:\n"
            for tc_id, fail_info in list(self.state["failed"].items())[:10]:
                report += f"  - {tc_id}: {fail_info['error']} (attempts: {fail_info['attempts']})\n"
            if len(self.state["failed"]) > 10:
                report += f"  ... and {len(self.state['failed']) - 10} more\n"

        return report

    def cleanup(self):
        """Remove state file (only if completed or rolled back)"""
        if self.state["status"] in ["completed", "rolled_back"]:
            if self.state_file.exists():
                self.state_file.unlink()

    @staticmethod
    def list_active_uploads() -> List[str]:
        """List all active upload state files"""
        state_dir = Path.home() / ".claude" / "practitest_upload_states"
        if not state_dir.exists():
            return []

        active = []
        for state_file in state_dir.glob("*.json"):
            try:
                with open(state_file, 'r') as f:
                    state = json.load(f)
                    if state.get("status") in ["initialized", "in_progress"]:
                        active.append(state_file.stem)
            except Exception:
                continue

        return active

    @staticmethod
    def load_by_batch_id(batch_id: str) -> Optional['UploadStateManager']:
        """Load an existing state by batch ID"""
        state_dir = Path.home() / ".claude" / "practitest_upload_states"
        state_file = state_dir / f"{batch_id}.json"

        if not state_file.exists():
            return None

        with open(state_file, 'r') as f:
            state = json.load(f)

        manager = UploadStateManager(
            state["project_id"],
            state["source_file"],
            batch_id
        )
        manager.state = state
        return manager
