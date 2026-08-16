from fastapi.testclient import TestClient

from api.index import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_public_config_disables_ai_by_default():
    response = client.get("/api/config")
    assert response.status_code == 200
    assert response.json()["ai_enabled"] is False


def test_public_config_reports_explicit_pinecone(monkeypatch):
    monkeypatch.setenv("RAG_PROVIDER", "pinecone")
    response = client.get("/api/config")
    assert response.status_code == 200
    assert response.json()["rag_provider"] == "pinecone"


def test_public_config_infers_pinecone_from_api_key(monkeypatch):
    monkeypatch.delenv("RAG_PROVIDER", raising=False)
    monkeypatch.setenv("PINECONE_API_KEY", "test-key")
    response = client.get("/api/config")
    assert response.status_code == 200
    assert response.json()["rag_provider"] == "pinecone"


def test_local_root_serves_browser_ui():
    response = client.get("/")
    assert response.status_code == 200
    assert "OTT DRM AI Troubleshooting Copilot" in response.text


def test_browser_ui_offers_pdf_export():
    response = client.get("/app.js")
    assert response.status_code == 200
    assert "EXPORT PDF" in response.text
    assert "application/pdf" in response.text
    assert "COPY REPORT" not in response.text


def test_knowledge_coverage_is_static_and_not_browsable():
    page = client.get("/")
    assert page.status_code == 200
    assert '<div class="knowledge-tags"' in page.text
    assert "knowledge-explorer" not in page.text
    assert client.get("/api/knowledge/topics").status_code == 404


def test_analyze_endpoint():
    response = client.post(
        "/api/analyze",
        json={
            "summary": "4K playback black screen on Android TV",
            "security_level": "L3",
            "required_security_level": "L1",
            "player_logs": "Widevine: L3",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["root_causes"][0]["cause"] == "DRM security-level policy mismatch"
    assert body["retrieval_backend"] in {"local", "local-fallback", "pinecone"}
