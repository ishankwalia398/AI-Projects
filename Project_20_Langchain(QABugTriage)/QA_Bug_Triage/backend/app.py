"""FastAPI streaming API; no ticket/credential payloads in logs."""
import asyncio
import hashlib
import hmac
import json
import logging
import os
import re
from contextlib import suppress
from pathlib import Path
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from .jira import fetch_ticket
from .prompts import PROMPTS
from .schemas import issue_key
from .workflow import run_workflow

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
log = logging.getLogger("qa_triage")


def authorized(header: str | None, secret: str | None) -> bool:
    if not secret or len(secret) < 16 or not header or not header.startswith("Bearer "):
        return False
    digest = lambda text: hashlib.sha256(text.encode()).digest()
    return hmac.compare_digest(digest(header[7:]), digest(secret))


def failure(status: int, message: str):
    return JSONResponse({"error": message}, status_code=status, headers={"Cache-Control": "no-store"})


async def request_key(request: Request):
    if not authorized(request.headers.get("authorization"), os.getenv("APP_ACCESS_TOKEN")):
        return failure(401, "Enter the configured workspace access password.")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 2048:
            return failure(413, "Request is too large.")
    try:
        payload = json.loads(body)
        if not isinstance(payload, dict) or not isinstance(payload.get("issueKey"), str):
            raise ValueError("Invalid request.")
        return issue_key(payload["issueKey"])
    except (ValueError, UnicodeDecodeError):
        return failure(400, "Enter a valid Jira key such as QA-123.")


def ticket_preview(ticket):
    """Show ticket evidence without echoing role instructions in the interface."""
    prompt_lines = {
        line.strip().casefold()
        for prompt in PROMPTS.values()
        for line in prompt.splitlines()
        if len(line.strip()) >= 20
    }
    instruction = re.compile(r"^\s*(?:you are (?:an? |the )?(?:qa |agent\b|assistant\b)|system prompt\s*:|developer instructions\s*:|ignore (?:all )?previous instructions\b)", re.I)
    safe_lines = [
        line for line in ticket.description.splitlines()
        if not instruction.search(line) and line.strip().casefold() not in prompt_lines
    ]
    return {**ticket.model_dump(), "description": "\n".join(safe_lines)}


@app.post("/api/ticket")
@app.post("/api/index/ticket")
async def read_ticket(request: Request):
    key = await request_key(request)
    if isinstance(key, JSONResponse):
        return key
    try:
        ticket = await fetch_ticket(key)
    except Exception as exc:
        log.error(json.dumps({"event": "jira_read_failed", "errorType": type(exc).__name__}))
        return failure(502, "Could not read this Jira ticket. Check the key and service-account access.")
    return JSONResponse({"ticket": ticket_preview(ticket)}, headers={"Cache-Control": "no-store"})


@app.post("/api/triage")
@app.post("/api/index")
async def triage(request: Request):
    key = await request_key(request)
    if isinstance(key, JSONResponse):
        return key
    if not (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("GROQ_API_KEY")):
        return failure(503, "No model provider is configured on the server.")

    async def stream():
        queue = asyncio.Queue()
        request_id = str(uuid4())
        phase = "jira"

        def notify(stage, state):
            nonlocal phase
            phase = stage
            queue.put_nowait({"type": "stage", "stage": stage, "state": state})

        async def produce():
            try:
                async with asyncio.timeout(270):
                    notify("jira", "running")
                    ticket = await fetch_ticket(key)
                    notify("jira", "complete")
                    queue.put_nowait({"type": "ticket", "ticket": ticket_preview(ticket)})
                    report = await run_workflow(ticket, notify)
                    queue.put_nowait({"type": "result", "report": report.model_dump()})
            except Exception as exc:
                status = getattr(exc, "status_code", None)
                log.error(json.dumps({"event": "triage_failed", "requestId": request_id, "phase": phase, "errorType": type(exc).__name__, "providerStatus": status if isinstance(status, int) else None}))
                busy = any(value in str(exc).lower() for value in ("429", "503", "high demand", "resource_exhausted"))
                message = "Analysis timed out. Please retry." if isinstance(exc, TimeoutError) else (
                    f"The upstream service is busy or rate-limited during {phase}. Please try again shortly." if busy else
                    f"Analysis failed during {phase}. Check server credentials, service availability and ticket permissions."
                )
                queue.put_nowait({"type": "error", "error": message, "requestId": request_id})
            finally:
                queue.put_nowait(None)

        task = asyncio.create_task(produce())
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=10)
                except TimeoutError:
                    event = {"type": "heartbeat"}
                if event is None:
                    break
                yield json.dumps(event) + "\n"
        finally:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task

    return StreamingResponse(stream(), media_type="application/x-ndjson", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})
