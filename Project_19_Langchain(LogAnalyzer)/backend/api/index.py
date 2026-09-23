from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from dotenv import load_dotenv

from .parser import extract_upload, make_markdown
from .langchain_pipeline import analyze_logs, PipelineUnavailable, AGENT_ROLES

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
app = FastAPI(title="Logscope LangChain API")
app.add_middleware(CORSMiddleware, allow_origins=["https://log-analyzer-lc.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["GET", "POST"], allow_headers=["*"], max_age=600)
MAX_BYTES = 4_000_000


@app.get("/api/health")
def health():
    return {"ok": True, "langchain_configured": bool(os.getenv("COMMANDCODE_API_KEY") or os.getenv("GROQ_API_KEY")),
            "engine": "LangChain", "process": "sequential", "agents": AGENT_ROLES,
            "stages": ["parsing", "analysis", "suggestions"]}


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    content = await file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(413, "File must be 4 MB or smaller for this deployment.")
    try:
        records = await run_in_threadpool(extract_upload, filename, content)
        result = await run_in_threadpool(analyze_logs, records, filename)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except PipelineUnavailable as exc:
        raise HTTPException(503, str(exc)) from exc
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    md_name = f"logfile_{stamp}.md"
    entries = result.pop("entries")
    markdown = make_markdown(filename, entries)
    return JSONResponse({
        "filename": filename,
        "markdown_filename": md_name,
        "markdown": markdown,
        "entries_count": len(entries),
        **result,
    })
