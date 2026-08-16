from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

ROOT = Path(__file__).parents[1]
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT / "src"))

from drm_copilot.models import Diagnosis, IncidentInput  # noqa: E402
from drm_copilot.retrieval import configured_rag_provider  # noqa: E402
from drm_copilot.service import analyze_incident  # noqa: E402

app = FastAPI(
    title="OTT DRM AI Troubleshooting Copilot API",
    version="1.2.1",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
logger = logging.getLogger(__name__)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ott-drm-ai-copilot"}


@app.get("/api/config")
def public_config() -> dict[str, str | bool]:
    return {
        "ai_enabled": os.getenv("ENABLE_AI_EXPLANATION", "false").lower() == "true",
        "rag_provider": configured_rag_provider(),
    }


@app.get("/api/knowledge/topics", include_in_schema=False)
@app.get("/api/knowledge", include_in_schema=False)
def removed_knowledge_browser() -> None:
    raise HTTPException(status_code=404, detail="The public knowledge browser is not available")


@app.post("/api/analyze", response_model=Diagnosis)
def analyze(incident: IncidentInput, use_ai: bool = False) -> Diagnosis:
    ai_enabled = os.getenv("ENABLE_AI_EXPLANATION", "false").lower() == "true"
    if use_ai and not ai_enabled:
        raise HTTPException(status_code=403, detail="AI explanation is disabled for this deployment")
    try:
        return analyze_incident(incident, ROOT / "data", use_ai=use_ai and ai_enabled)
    except Exception as exc:
        logger.exception("Incident analysis failed")
        raise HTTPException(
            status_code=500,
            detail="Analysis service failed. Check server logs and environment configuration.",
        ) from exc


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


# Local development convenience. On Vercel, public/ is served directly by its CDN.
app.mount("/", StaticFiles(directory=ROOT / "public", html=True, check_dir=False), name="public")
