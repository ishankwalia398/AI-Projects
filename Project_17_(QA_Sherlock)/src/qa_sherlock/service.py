from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path
from uuid import uuid4

from .core import ingest_playwright_data, retrieve_local, validate_report
from .crew import investigate
from .integrations import Jira, PineconeStore
from .providers import Router
from .reporting import write_report
from .uploads import evidence_from_uploads, safe_name


def configuration_status():
    names = ["COMMANDCODE_API_KEY", "GEMINI_API_KEY", "PINECONE_API_KEY", "PINECONE_HOST",
             "DEEPSEEK_API_KEY", "JIRA_MCP_URL", "JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN"]
    return {name: bool(os.getenv(name)) for name in names}


def run_upload(payload, config, runs_dir):
    failure = payload["failure"]
    failure_name = safe_name(failure["name"])
    failure_bytes = failure["content"]
    if not failure_name.lower().endswith(".json"):
        raise ValueError("The Playwright report must be a .json file")
    if len(failure_bytes) > 10 * 1024 * 1024:
        raise ValueError("The Playwright report exceeds the 10 MB limit")
    try:
        failure_data = json.loads(failure_bytes.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("The Playwright report is not valid UTF-8 JSON") from exc
    failures = ingest_playwright_data(failure_data)
    if not failures:
        raise ValueError("The Playwright report contains no failed attempts")

    uploaded = evidence_from_uploads(payload["evidence"])
    query = json.dumps(failures, ensure_ascii=False)
    run_id = uuid4().hex[:12]
    run_dir = Path(runs_dir) / run_id
    input_dir = run_dir / "input"
    input_dir.mkdir(parents=True, exist_ok=False)
    (input_dir / failure_name).write_bytes(failure_bytes)
    for item in payload["evidence"]:
        (input_dir / safe_name(item["name"])).write_bytes(item["content"])

    events = [{"source": "upload", "status": "success", "files": len(payload["evidence"]) + 1}]
    if payload.get("use_pinecone", True):
        namespace = f"qa-sherlock-upload-{run_id}"
        store = PineconeStore(config["pinecone"], namespace=namespace)
        store.upsert(uploaded)
        evidence = []
        for attempt in range(4):
            evidence = store.search(query)
            if evidence:
                break
            time.sleep(1.5 * (attempt + 1))
        events.append({"source": "pinecone", "status": "success", "namespace": namespace, "retrieved": len(evidence)})
        by_id = {item["id"]: item for item in evidence}
        for item in retrieve_local(query, uploaded, top_k=config["pinecone"]["top_k"]):
            by_id.setdefault(item["id"], item)
        evidence = list(by_id.values())
    else:
        evidence = retrieve_local(query, uploaded, top_k=config["pinecone"]["top_k"])
        events.append({"source": "local_retrieval", "status": "success", "retrieved": len(evidence)})
    if not evidence:
        evidence = [dict(item, score=0.0) for item in uploaded[:config["pinecone"]["top_k"]]]
        events.append({"source": "retrieval_fallback", "status": "success", "reason": "no lexical or vector matches"})

    jira_key = str(payload.get("jira_key", "")).strip().upper()
    if jira_key:
        jira = Jira(config["jira"])
        issue = asyncio.run(jira.get_issue(jira_key))
        evidence.append({"id": jira_key, "kind": "jira", "title": issue["fields"].get("summary", jira_key),
                         "text": json.dumps(issue["fields"], ensure_ascii=False), "source": "Jira " + jira_key})
        events.extend(jira.events)

    router = Router([config["primary"], config["fallback"]])
    report = investigate(failures, evidence, router)
    report["mode"] = "LIVE · uploaded evidence · CrewAI six-agent investigation"
    validate_report(report, evidence)
    report.update(evidence=evidence, failures=failures, events=events + router.events, run_id=run_id)
    if payload.get("run_evaluation", True):
        from .evaluation import evaluate
        try:
            report["evaluation"] = evaluate(report, evidence, config)
        except Exception as exc:
            report["evaluation"] = {"status": "failed", "error_type": type(exc).__name__, "metrics": []}
    else:
        report["evaluation"] = {"status": "not_run", "reason": "Disabled for this upload", "metrics": []}
    write_report(report, run_dir)
    return run_id, report
