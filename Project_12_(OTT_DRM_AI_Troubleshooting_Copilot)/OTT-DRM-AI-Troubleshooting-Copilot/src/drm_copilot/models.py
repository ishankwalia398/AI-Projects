from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class IncidentInput(BaseModel):
    summary: str = Field(min_length=5)
    platform: str = "Unknown"
    device_model: str = "Unknown"
    player: str = "Unknown"
    drm_system: str = "Unknown"
    security_level: str = "Unknown"
    required_security_level: str = "Unknown"
    hdcp_version: str = "Unknown"
    required_hdcp: str = "Unknown"
    requested_resolution: str = "Unknown"
    codec: str = "Unknown"
    manifest_text: str = ""
    license_status_code: int | None = None
    license_response: str = ""
    player_logs: str = ""
    notes: str = ""


class EvidenceItem(BaseModel):
    source: str
    observation: str
    implication: str


class RootCause(BaseModel):
    cause: str
    probability: float = Field(ge=0, le=100)
    rationale: str


class RetrievedDocument(BaseModel):
    id: str
    parent_id: str = ""
    title: str
    topic: str
    content: str
    source_type: str
    source_url: str = ""
    score: float = 0.0
    chunk_index: int = 0
    chunk_count: int = 1


class AIExplanation(BaseModel):
    executive_summary: str
    evidence: list[EvidenceItem]
    expected_behavior: str
    suggested_tests: list[str]
    caveats: list[str]


class Diagnosis(BaseModel):
    root_causes: list[RootCause]
    evidence: list[EvidenceItem]
    expected_behavior: str
    suggested_tests: list[str]
    retrieved_sources: list[RetrievedDocument] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "medium"
    mode: Literal["rules", "hybrid"] = "rules"
    retrieval_backend: str = "pinecone"
    executive_summary: str = ""
    caveats: list[str] = Field(default_factory=list)
    parsed_signals: dict[str, Any] = Field(default_factory=dict)

    @field_validator("root_causes")
    @classmethod
    def probabilities_sum_to_100(cls, causes: list[RootCause]) -> list[RootCause]:
        if causes and abs(sum(c.probability for c in causes) - 100) > 0.2:
            raise ValueError("Root-cause probabilities must sum to 100")
        return causes
