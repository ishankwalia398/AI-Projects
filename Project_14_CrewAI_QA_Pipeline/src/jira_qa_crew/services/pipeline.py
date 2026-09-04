from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

from ..config import Settings
from ..crew.factory import QACrewFactory
from ..exceptions import LLMProvidersExhaustedError, PipelineValidationError
from ..models import RunResult, TicketResult
from .artifacts import write_run
from .redaction import redact
from .traceability import calculate_traceability
from .validation import (
    canonicalize_output_ids,
    validate_analysis,
    validate_plan,
    validate_playwright,
    validate_suite,
)


class PipelineService:
    def __init__(self, settings: Settings, factory: QACrewFactory, progress=None): self.settings, self.factory, self.progress = settings, factory, progress or (lambda *a: None)

    def run(self, keys: list[str]) -> tuple[RunResult, Path]:
        started = datetime.now(UTC); run_id = started.strftime("RUN-%Y%m%d-%H%M%S-") + uuid4().hex[:6].upper(); results = []
        for index, key in enumerate(keys):
            result = TicketResult(ticket_key=key, status="RUNNING"); self.progress(key, "Jira Analyst", "RUNNING", index / len(keys))
            try:
                jira_issue = self.factory.fetch_issue(key)
                provider_errors: list[str] = []
                completed = False
                for provider_index, profile in enumerate(self.factory.llm_profiles()):
                    stage = f"LLM {profile.name}: {profile.model}"
                    self.progress(key, stage, "RUNNING", index / len(keys))
                    try:
                        analysis, plan, suite, bundle = self._execute_with_repair(
                            key, jira_issue, profile, index / len(keys)
                        )
                        result.llm_model_used = profile.model
                        result.llm_fallback_used = provider_index > 0
                        completed = True
                        break
                    except Exception as exc:
                        provider_errors.append(
                            f"{profile.name} ({profile.model}): {type(exc).__name__}: {exc}"
                        )
                        self.progress(key, stage, "WARNING", index / len(keys))
                if not completed:
                    raise LLMProvidersExhaustedError(
                        "All configured LLM providers failed. " + " | ".join(provider_errors)
                    )
                result.requirement_analysis, result.test_plan, result.test_cases, result.playwright = analysis, plan, suite, bundle
                result.traceability = calculate_traceability(analysis, suite, bundle)
                result.warnings = analysis.missing_information + bundle.missing_configuration
                result.status = "COMPLETED_WITH_WARNINGS" if result.warnings else "COMPLETED"
            except Exception as exc:
                secrets = [
                    self.settings.llm_primary_api_key,
                    self.settings.llm_fallback_api_key,
                    self.settings.jira_api_token,
                    self.settings.jira_bearer_token,
                ]
                result.status = "FAILED"; result.errors = [redact(str(exc), secrets)]
            result.completed_at = datetime.now(UTC); results.append(result); self.progress(key, "Complete", result.status, (index + 1) / len(keys))
        run = RunResult(run_id=run_id, tickets=results, started_at=started, completed_at=datetime.now(UTC))
        return run, write_run(run, self.settings.output_dir)

    def _execute_with_repair(self, key, jira_issue, profile, fraction):
        last_error = None
        for attempt in range(2):
            try:
                output = self.factory.create(key, profile, jira_issue).kickoff(inputs={"ticket_key": key})
                tasks = output.tasks_output
                analysis, plan, suite, bundle = (tasks[i].pydantic for i in range(4))
                if not all((analysis, plan, suite, bundle)):
                    raise ValueError("CrewAI did not return all four structured outputs")
                canonicalize_output_ids(analysis, plan, suite, bundle)
                validate_analysis(analysis)
                validate_plan(plan, analysis)
                validate_suite(suite, analysis)
                validate_playwright(bundle, suite)
                return analysis, plan, suite, bundle
            except (PipelineValidationError, ValidationError, ValueError, TypeError) as exc:
                last_error = exc
                if attempt == 1:
                    raise
                self.progress(key, "Structured output repair", "RUNNING", fraction)
        raise last_error  # pragma: no cover
