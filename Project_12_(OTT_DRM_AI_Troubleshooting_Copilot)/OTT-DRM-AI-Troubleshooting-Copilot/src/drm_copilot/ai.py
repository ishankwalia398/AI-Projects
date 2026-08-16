from __future__ import annotations

import json
import os

from openai import OpenAI

from .models import AIExplanation, IncidentInput, RetrievedDocument, RootCause


SYSTEM_PROMPT = """You are a senior OTT playback and DRM QA engineer.
Explain a diagnosis produced by a deterministic rule engine. Do not change, invent,
or re-rank its probabilities. Use only supplied incident evidence and retrieved
knowledge. Clearly distinguish observations from hypotheses. Tests must be safe,
specific, and ordered to discriminate between the leading causes. If evidence is
missing, say so. Never claim that heuristic probabilities are statistically calibrated.
"""


def explain_with_ai(
    incident: IncidentInput,
    causes: list[RootCause],
    parsed_signals: dict,
    retrieved: list[RetrievedDocument],
) -> AIExplanation:
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    payload = {
        "incident": incident.model_dump(),
        "rule_engine_causes": [cause.model_dump() for cause in causes],
        "parsed_signals": parsed_signals,
        "retrieved_knowledge": [doc.model_dump() for doc in retrieved],
    }
    response = client.responses.parse(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload, indent=2)},
        ],
        text_format=AIExplanation,
    )
    if response.output_parsed is None:
        raise RuntimeError("The model did not return a structured diagnosis")
    return response.output_parsed

