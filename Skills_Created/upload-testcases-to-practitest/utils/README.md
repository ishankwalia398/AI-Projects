# PractiTest Upload Utilities

Comprehensive CI/CD-ready utilities for safe, resumable test case uploads.

## Quick Start

```python
from utils.state_manager import UploadStateManager
from utils.validator import TestCaseValidator
from utils.logger import UploadLogger
from utils.rate_limiter import RateLimiter

# Initialize
state_mgr = UploadStateManager(project_id="19980", source_file="tests.xlsx")
logger = UploadLogger(state_mgr.batch_id)
validator = TestCaseValidator(strict_mode=True)
rate_limiter = RateLimiter()

# Validate
results = validator.validate_batch(test_cases)
if not results['valid']:
    print(validator.generate_validation_report(results))
    exit(1)

# Upload with state tracking
state_mgr.initialize(len(test_cases), custom_fields, field_mapping)

for tc in test_cases:
    if state_mgr.is_uploaded(tc['tc_id']):
        continue  # Skip already uploaded
    
    try:
        result = rate_limiter.execute_with_rate_limit(
            create_test, **tc_params
        )
        state_mgr.mark_uploaded(tc['tc_id'], result['data']['id'])
        logger.test_case_created(tc['tc_id'], result['data']['id'])
    except Exception as e:
        state_mgr.mark_failed(tc['tc_id'], str(e))
        logger.test_case_failed(tc['tc_id'], str(e))

# Report
print(state_mgr.generate_report())
```

## Modules

### `state_manager.py`
**Purpose**: Idempotency, resume capability, rollback

- `UploadStateManager(project_id, source_file, batch_id=None)`
  - `initialize()` - Start new upload session
  - `is_uploaded(tc_id)` - Check if already uploaded
  - `mark_uploaded(tc_id, pt_test_id, display_id)` - Track success
  - `mark_failed(tc_id, error)` - Track failure
  - `get_progress()` - Get statistics
  - `rollback(delete_fn)` - Clean up failed upload
  - `generate_report()` - Human-readable report

### `validator.py`
**Purpose**: Pre-validate against PractiTest constraints

- `TestCaseValidator(strict_mode=True)`
  - `validate_test_case(tc)` - Validate single test
  - `validate_batch(test_cases)` - Validate all
  - `generate_validation_report(results)` - Report
  - `sanitize_field(value)` - Remove dangerous chars
  - `truncate_field(value, max_length)` - Truncate

### `logger.py`
**Purpose**: Structured logging and audit trail

- `UploadLogger(batch_id, log_level="INFO")`
  - `upload_started(project_id, total, source_file)`
  - `test_case_created(tc_id, pt_test_id, display_id)`
  - `test_case_failed(tc_id, error, attempt=1)`
  - `progress_update(uploaded, total, elapsed_sec)`
  - `upload_completed(uploaded, failed, skipped, duration)`
  - `generate_summary()` - Aggregate from audit log

### `rate_limiter.py`
**Purpose**: Prevent API rate limit violations

- `RateLimiter(max_calls_per_second=2, max_concurrent=5)`
  - `execute_with_rate_limit(func, *args, max_retries=3)`
  - `acquire()` - Wait for clearance
  - `release_success()` - Reset backoff
  - `release_failure(is_rate_limit)` - Increase backoff

## Configuration

Environment variables:

```bash
# Rate limiting
PT_MAX_CALLS_PER_SECOND=2
PT_MAX_CONCURRENT=5

# Timeouts
PT_TIMEOUT_LIST=30
PT_TIMEOUT_CREATE=60
```

## File Locations

- **State files**: `~/.claude/practitest_upload_states/{batch_id}.json`
- **Human logs**: `~/.claude/practitest_upload_logs/{batch_id}.log`
- **Audit trail**: `~/.claude/practitest_upload_logs/{batch_id}_audit.jsonl`

## Features

✅ **Idempotency** - Safe to run multiple times
✅ **Resume** - Continue from checkpoint after failure
✅ **Validation** - Pre-check all data
✅ **Logging** - Full audit trail
✅ **Rate Limiting** - Respects API limits
✅ **Rollback** - Clean up failed uploads

## Examples

### Check for existing uploads

```python
active = UploadStateManager.list_active_uploads()
for batch_id in active:
    state = UploadStateManager.load_by_batch_id(batch_id)
    print(f"{batch_id}: {state.get_progress()}")
```

### Resume from checkpoint

```python
# Load existing state
state_mgr = UploadStateManager.load_by_batch_id("19980_abc123_20260805")

# Find where it left off
last_uploaded = state_mgr.get_resume_point()
print(f"Resuming from {last_uploaded}")

# Continue uploading remaining tests
for tc in test_cases:
    if state_mgr.is_uploaded(tc['tc_id']):
        continue  # Already done
    # ... upload logic
```

### Rollback failed upload

```python
def delete_test(project_id, test_id):
    # Your delete implementation
    return mcp_delete_test(project_id, test_id)

results = state_mgr.rollback(delete_test)
print(f"Deleted: {results['deleted']}")
print(f"Failed: {len(results['failed_to_delete'])}")
```

### Dry-run validation

```python
validator = TestCaseValidator()
results = validator.validate_batch(test_cases)

if results['valid']:
    print("✅ All test cases valid, ready for upload")
else:
    print(f"❌ {results['failed']} invalid test cases")
    print(validator.generate_validation_report(results))
```

## Thread Safety

The `RateLimiter` is thread-safe for parallel uploads:

```python
import threading

rate_limiter = RateLimiter()

def upload_batch(test_cases):
    for tc in test_cases:
        rate_limiter.execute_with_rate_limit(create_test, **tc)

# Spawn multiple threads
threads = [
    threading.Thread(target=upload_batch, args=(batch,))
    for batch in split_into_batches(test_cases, 4)
]

for t in threads:
    t.start()
for t in threads:
    t.join()
```

## Error Handling

All utilities handle errors gracefully:

```python
try:
    state_mgr.mark_uploaded(tc_id, pt_test_id)
except Exception as e:
    logger.error(f"Failed to mark uploaded: {e}")
    # State file is still consistent

try:
    results = validator.validate_batch(test_cases)
except Exception as e:
    logger.error(f"Validation error: {e}")
    # Can continue with unvalidated upload (not recommended)
```

## Testing

To test without actually uploading:

```python
# 1. Use dry-run validation
validator = TestCaseValidator()
results = validator.validate_batch(test_cases)

# 2. Initialize state manager without upload
state_mgr = UploadStateManager(project_id, source_file)
state_mgr.initialize(len(test_cases), {}, {})

# 3. Simulate uploads
for tc in test_cases:
    state_mgr.mark_uploaded(tc['tc_id'], "FAKE_ID_123", "FAKE_DISPLAY_456")

# 4. Check report
print(state_mgr.generate_report())
```

## License

Part of the upload-testcases-to-practitest skill.
