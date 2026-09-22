"""Opt-in live provider check: python -m tests.smoke_live is not required by unit tests."""
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from backend.api.index import app

if "--groq" in sys.argv:
    os.environ.pop("COMMANDCODE_API_KEY", None)

sample = [{"timestamp": "2026-09-21T10:00:00Z", "session_id": "smoke-session",
           "message": "Upstream service unavailable", "status": 503,
           "request": {"method": "GET", "url": "https://example.test/orders"},
           "response": {"status": 503, "body": "Service Unavailable"}}]
response = TestClient(app).post("/api/analyze", files={"file": ("smoke.json", json.dumps(sample), "application/json")})
data = response.json()
assert response.status_code == 200, data.get("detail", response.status_code)
assert data["pipeline"]["stages"] == ["parsing", "analysis", "suggestions"]
assert len(data["pipeline"]["agents"]) == 3
assert data["pipeline"]["process"] == "sequential"
assert data["entries_count"] == 1 and data["findings"]
assert data["findings"][0]["session_id"] == "smoke-session"
assert data["findings"][0]["suggestions"]
assert "Source ID: source-1" in data["markdown"]
print(json.dumps({"status": response.status_code, "provider": data["provider"], "pipeline": data["pipeline"],
                  "findings": len(data["findings"]), "suggestions": len(data["findings"][0]["suggestions"])}))
