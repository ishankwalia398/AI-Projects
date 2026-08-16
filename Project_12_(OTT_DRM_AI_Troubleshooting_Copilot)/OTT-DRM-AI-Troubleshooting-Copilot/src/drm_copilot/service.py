from __future__ import annotations

import json
import os
from pathlib import Path

from .ai import explain_with_ai
from .models import Diagnosis, IncidentInput
from .parsers import extract_signals
from .retrieval import retrieve_knowledge
from .rules import diagnose_with_rules


def analyze_incident(incident: IncidentInput, data_dir: Path, use_ai: bool = False) -> Diagnosis:
    signals = extract_signals(incident)
    rule_result = diagnose_with_rules(incident, signals)
    query = " ".join([incident.summary, incident.player_logs, incident.notes, json.dumps(signals)])
    retrieved, retrieval_backend, retrieval_warning = retrieve_knowledge(query, data_dir, top_k=5)
    caveats = ["Probabilities are heuristic rankings, not statistically calibrated failure probabilities."]
    if retrieval_warning:
        caveats.append(retrieval_warning)
    diagnosis = Diagnosis(
        root_causes=rule_result.root_causes,
        evidence=rule_result.evidence,
        expected_behavior=rule_result.expected_behavior,
        suggested_tests=rule_result.suggested_tests,
        retrieved_sources=retrieved,
        confidence=rule_result.confidence,
        mode="rules",
        retrieval_backend=retrieval_backend,
        executive_summary="Rule-based preliminary diagnosis. Add an API key for an AI-written, evidence-grounded explanation.",
        caveats=caveats,
        parsed_signals=signals,
    )
    if use_ai and os.getenv("OPENAI_API_KEY"):
        explanation = explain_with_ai(incident, diagnosis.root_causes, signals, retrieved)
        diagnosis.evidence = explanation.evidence
        diagnosis.expected_behavior = explanation.expected_behavior
        diagnosis.suggested_tests = explanation.suggested_tests
        diagnosis.executive_summary = explanation.executive_summary
        diagnosis.caveats = list(dict.fromkeys(diagnosis.caveats + explanation.caveats))
        diagnosis.mode = "hybrid"
    return diagnosis
