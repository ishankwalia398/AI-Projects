from drm_copilot.retrieval import PineconeKnowledgeRetriever, configured_rag_provider


def test_configured_provider_defaults_to_local(monkeypatch):
    monkeypatch.delenv("RAG_PROVIDER", raising=False)
    monkeypatch.delenv("PINECONE_API_KEY", raising=False)
    assert configured_rag_provider() == "local"


def test_configured_provider_infers_pinecone(monkeypatch):
    monkeypatch.delenv("RAG_PROVIDER", raising=False)
    monkeypatch.setenv("PINECONE_API_KEY", "test-key")
    assert configured_rag_provider() == "pinecone"


def test_converts_pinecone_search_hits():
    hits = [
        {
            "_id": "kb-test",
            "_score": 0.91,
            "fields": {
                "parent_id": "kb-test-parent",
                "title": "Widevine test",
                "topic": "Widevine",
                "content": "L1 policy test content",
                "source_type": "test",
                "source_url": "https://example.com",
                "chunk_index": 1,
                "chunk_count": 3,
            },
        }
    ]
    documents = PineconeKnowledgeRetriever._convert_hits(hits)
    assert documents[0].id == "kb-test"
    assert documents[0].score == 0.91
    assert documents[0].topic == "Widevine"
    assert documents[0].parent_id == "kb-test-parent"
    assert documents[0].chunk_index == 1
