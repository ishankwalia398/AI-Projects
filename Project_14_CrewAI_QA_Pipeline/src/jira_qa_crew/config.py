from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

from .exceptions import ConfigurationError

load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


def _env_first(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value is not None and value.strip():
            return value.strip()
    return default


@dataclass(frozen=True)
class Settings:
    app_name: str = field(default_factory=lambda: os.getenv("APP_NAME", "Jira QA Crew"))
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    output_dir: Path = field(default_factory=lambda: Path(os.getenv("OUTPUT_DIR", "outputs")))
    llm_primary_model: str = field(
        default_factory=lambda: _env_first(
            "LLM_PRIMARY_MODEL",
            "LLM_MODEL",
            default="openai/deepseek/deepseek-v4-flash",
        )
    )
    llm_primary_api_key: str = field(
        default_factory=lambda: _env_first("COMMANDCODE_API_KEY", "LLM_PRIMARY_API_KEY")
    )
    llm_primary_base_url: str = field(
        default_factory=lambda: _env_first(
            "LLM_PRIMARY_BASE_URL",
            default="https://api.commandcode.ai/provider/v1",
        )
    )
    llm_fallback_enabled: bool = field(
        default_factory=lambda: _bool("LLM_FALLBACK_ENABLED", True)
    )
    llm_fallback_model: str = field(
        default_factory=lambda: _env_first(
            "LLM_FALLBACK_MODEL", default="gemini/gemini-3.6-flash"
        )
    )
    llm_fallback_api_key: str = field(
        default_factory=lambda: _env_first(
            "LLM_FALLBACK_API_KEY", "GEMINI_API_KEY", "LLM_API_KEY"
        )
    )
    llm_fallback_base_url: str = field(
        default_factory=lambda: _env_first("LLM_FALLBACK_BASE_URL")
    )
    llm_temperature: float = field(default_factory=lambda: float(os.getenv("LLM_TEMPERATURE", "0.1")))
    llm_max_output_tokens: int = field(default_factory=lambda: int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "8192")))
    llm_primary_max_output_tokens: int = field(
        default_factory=lambda: int(os.getenv("LLM_PRIMARY_MAX_OUTPUT_TOKENS", "16384"))
    )
    llm_primary_timeout: float = field(
        default_factory=lambda: float(os.getenv("LLM_PRIMARY_TIMEOUT_SECONDS", "300"))
    )
    llm_primary_reasoning_effort: str = field(
        default_factory=lambda: os.getenv("LLM_PRIMARY_REASONING_EFFORT", "low").lower()
    )
    jira_mode: str = field(default_factory=lambda: os.getenv("JIRA_INTEGRATION_MODE", "auto").lower())
    jira_url: str = field(default_factory=lambda: os.getenv("JIRA_URL", "").rstrip("/"))
    jira_auth_mode: str = field(default_factory=lambda: os.getenv("JIRA_AUTH_MODE", "basic").lower())
    jira_email: str = field(default_factory=lambda: os.getenv("JIRA_EMAIL", ""))
    jira_api_token: str = field(default_factory=lambda: os.getenv("JIRA_API_TOKEN", ""))
    jira_bearer_token: str = field(default_factory=lambda: os.getenv("JIRA_BEARER_TOKEN", ""))
    jira_acceptance_field: str = field(default_factory=lambda: os.getenv("JIRA_ACCEPTANCE_CRITERIA_FIELD", ""))
    jira_include_comments: bool = field(default_factory=lambda: _bool("JIRA_INCLUDE_COMMENTS"))
    jira_max_comments: int = field(default_factory=lambda: int(os.getenv("JIRA_MAX_COMMENTS", "20")))
    mcp_transport: str = field(default_factory=lambda: os.getenv("JIRA_MCP_TRANSPORT", "streamable_http"))
    mcp_url: str = field(default_factory=lambda: os.getenv("JIRA_MCP_URL", ""))
    mcp_command: str = field(default_factory=lambda: os.getenv("JIRA_MCP_COMMAND", ""))
    mcp_args: list[str] = field(default_factory=lambda: json.loads(os.getenv("JIRA_MCP_ARGS_JSON", "[]")))
    mcp_headers: dict[str, str] = field(default_factory=lambda: json.loads(os.getenv("JIRA_MCP_HEADERS_JSON", "{}")))
    mcp_get_issue_tool: str = field(default_factory=lambda: os.getenv("JIRA_MCP_GET_ISSUE_TOOL", ""))
    mcp_issue_arg: str = field(default_factory=lambda: os.getenv("JIRA_MCP_ISSUE_ARGUMENT", "issue_key"))
    mcp_timeout: float = field(default_factory=lambda: float(os.getenv("JIRA_MCP_TIMEOUT_SECONDS", "20")))
    max_tickets: int = field(default_factory=lambda: int(os.getenv("PIPELINE_MAX_TICKETS", "20")))
    max_retries: int = field(default_factory=lambda: int(os.getenv("PIPELINE_MAX_RETRIES", "2")))
    ticket_timeout: int = field(default_factory=lambda: int(os.getenv("PIPELINE_TICKET_TIMEOUT_SECONDS", "600")))
    demo_mode: bool = field(default_factory=lambda: _bool("DEMO_MODE"))

    def validate(self, mode: str | None = None) -> list[str]:
        selected = (mode or self.jira_mode).lower()
        errors: list[str] = []
        if selected not in {"auto", "mcp", "rest"}: errors.append("JIRA_INTEGRATION_MODE must be auto, mcp, or rest")
        if not 1 <= self.max_tickets <= 100: errors.append("PIPELINE_MAX_TICKETS must be between 1 and 100")
        if not 256 <= self.llm_max_output_tokens <= 65_536:
            errors.append("LLM_MAX_OUTPUT_TOKENS must be between 256 and 65536")
        if not 256 <= self.llm_primary_max_output_tokens <= 65_536:
            errors.append(
                "LLM_PRIMARY_MAX_OUTPUT_TOKENS must be between 256 and 65536"
            )
        if not 10 <= self.llm_primary_timeout <= self.ticket_timeout:
            errors.append(
                "LLM_PRIMARY_TIMEOUT_SECONDS must be between 10 and "
                "PIPELINE_TICKET_TIMEOUT_SECONDS"
            )
        if self.llm_primary_reasoning_effort not in {"none", "low", "medium", "high"}:
            errors.append(
                "LLM_PRIMARY_REASONING_EFFORT must be none, low, medium, or high"
            )
        if not self.demo_mode and not self.llm_primary_model:
            errors.append("LLM_PRIMARY_MODEL is required")
        if (
            "api.commandcode.ai" in self.llm_primary_base_url.lower()
            and not self.llm_primary_api_key
        ):
            errors.append(
                "COMMANDCODE_API_KEY or LLM_PRIMARY_API_KEY is required for CommandCode"
            )
        if self.llm_fallback_enabled and not self.llm_fallback_model:
            errors.append("LLM_FALLBACK_MODEL is required when fallback is enabled")
        if (
            self.llm_fallback_enabled
            and self.llm_fallback_model.startswith(("gemini/", "google/"))
            and not self.llm_fallback_api_key
        ):
            errors.append(
                "LLM_FALLBACK_API_KEY or GEMINI_API_KEY is required for the Gemini fallback"
            )
        if selected in {"auto", "mcp"} and not (self.mcp_url or self.mcp_command): errors.append("MCP URL or command is not configured")
        if selected in {"auto", "rest"} and not self.jira_url: errors.append("JIRA_URL is not configured")
        return errors

    def require_generation_ready(self, mode: str | None = None) -> None:
        errors = self.validate(mode)
        if errors and not self.demo_mode: raise ConfigurationError("; ".join(errors))
