"""Live Vercel entry point; shares the reference catalog and DeepEval runner."""
from __future__ import annotations

import os
import sys
import threading
from dataclasses import asdict
from pathlib import Path
from typing import Literal

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "03_DeepFramework"))
os.environ.setdefault("DEEPEVAL_TELEMETRY_OPT_OUT", "YES")
os.environ.setdefault("DEEPEVAL_FILE_SYSTEM", "READ_ONLY")
from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from dashboard.runner import run_spec
from metrics_catalog import ALL_SPECS, SPECS_BY_KEY, CATEGORIES
from token_meter import METER
from hosted import HostedChatbot, HostedRag, HostedJudge, Provider, search, CHUNKS, CHATBOT_MODEL, RAG_MODEL, JUDGE_MODEL

app = FastAPI(title="DeepEval Live Lab")
templates = Jinja2Templates(directory=str(ROOT / "03_DeepFramework/dashboard/templates"))
app.mount("/static", StaticFiles(directory=str(ROOT / "03_DeepFramework/dashboard/static")), name="static")
# The reference meter has a process-wide run bucket. Serialize this worker's
# model calls so another request cannot corrupt the reported token counts.
RUN_LOCK = threading.Lock()

def catalog():
    fields = ("key", "number", "title", "blurb", "question", "threshold", "scale_hint", "category", "target", "kind", "test_file", "needs")
    return [{**{f: getattr(s, f) for f in fields}, "cases_total": len(s.cases())} for s in ALL_SPECS]

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "cards": catalog(),
        "categories": CATEGORIES, "chatbot_url": CHATBOT_MODEL,
        "rag_url": "Bundled policies · BM25 retrieval", "judge_model": JUDGE_MODEL})

@app.get("/how-it-works")
def explainer():
    return FileResponse(ROOT / "dist/how-it-works.html")

@app.get("/api/catalog")
def api_catalog():
    return {"cards": catalog(), "categories": CATEGORIES}

@app.get("/api/status")
def status():
    configured = bool(os.getenv("GROQ_API_KEY"))
    return {"mode": "live", "chatbot": {"up": configured, "model": CHATBOT_MODEL},
        "rag": {"up": configured and bool(CHUNKS), "model": RAG_MODEL, "retrieval": "BM25", "chunks": len(CHUNKS)},
        "judge": {"up": configured, "model": JUDGE_MODEL}, "status_basis": "configuration"}

class RunRequest(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    sample: int = Field(default=1, ge=1, le=1)
    offset: int = Field(default=0, ge=0)

def safe_error(error):
    text = str(error)
    for key in ("GROQ_API_KEY", "CONFIDENT_API_KEY", "VERCEL_TOKEN"):
        value = os.getenv(key)
        if value:
            text = text.replace(value, "[redacted]")
    return text[:1500]

@app.post("/api/run")
def run(body: RunRequest):
    spec = SPECS_BY_KEY.get(body.key)
    if spec is None:
        raise HTTPException(404, "Unknown metric")
    if body.offset >= len(spec.cases()):
        raise HTTPException(422, "Case offset exceeds the dataset")
    if not RUN_LOCK.acquire(blocking=False):
        raise HTTPException(429, "Another evaluation is running. Please retry shortly.")
    try:
        provider = Provider()
        result = run_spec(spec, HostedJudge(provider), HostedChatbot(provider),
                          sample=1, offset=body.offset, rag=HostedRag(provider))
        if result.get("error"):
            result["error"] = result["reason"] = safe_error(result["error"])
        return result
    except Exception as error:
        return JSONResponse({"detail": safe_error(error)}, status_code=502)
    finally:
        RUN_LOCK.release()

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=6000)
    history: list[Message] = Field(default_factory=list, max_length=12)
    top_k: int = Field(default=3, ge=1, le=6)

@app.post("/api/chatbot")
def chatbot(body: ChatRequest):
    return target_response(body, False)

@app.post("/api/rag/chat")
def rag_chat(body: ChatRequest):
    return target_response(body, True)

def target_response(body, rag):
    if not RUN_LOCK.acquire(blocking=False):
        raise HTTPException(429, "An evaluation is running. Please retry shortly.")
    try:
        METER.start_run()
        provider = Provider()
        history = [m.model_dump() for m in body.history]
        reply = (HostedRag(provider).ask(body.message, body.top_k, history) if rag
                 else HostedChatbot(provider).chat(body.message, history))
        return {**asdict(reply), "tokens": METER.run_snapshot()}
    except Exception as error:
        return JSONResponse({"detail": safe_error(error)}, status_code=502)
    finally:
        RUN_LOCK.release()

class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=6000)
    top_k: int = Field(default=3, ge=1, le=6)

@app.post("/api/rag/search")
def rag_search(body: SearchRequest):
    return {"hits": search(body.query, body.top_k), "retrieval": "BM25"}
