# Basic_RAG — Architecture Diagram

```mermaid
graph TB
    subgraph Browser["🌐 Browser (Vite Dev Server :5175)"]
        React["⚛️ React App"]
        Pipeline["📊 Pipeline.jsx<br/>6-Stage Stepper"]
        ChunkList["📋 ChunkList.jsx<br/>Score Bars + Chunks"]
        App["🔄 App.jsx<br/>Ingestion + Query Panels"]
        API_Client["🔗 api.js<br/>fetch → /api/*"]
    end

    subgraph Server["🖥️ Express Server (:8787)"]
        Index["📦 index.js<br/>Route Handler"]
        PDF_Lib["📄 pdf.js<br/>Text Extraction<br/>pdf-parse"]
        Chunk_Lib["✂️ chunk.js<br/>1200-char windows<br/>200-char overlap"]
        Embed_Lib["🧠 embed.js<br/>Ollama Client"]
        Chroma_Lib["🗄️ chroma.js<br/>ChromaDB Client"]
        Groq_Lib["🤖 groq.js<br/>Augmented Prompt + LLM Call"]
    end

    subgraph ExternalServices["🔌 External Services"]
        Ollama["🦙 Ollama (:11434)<br/>nomic-embed-text<br/>768-dim vectors"]
        ChromaDB["🗃️ ChromaDB (:8000)<br/>Vector Store<br/>Cosine Similarity"]
        Groq["☁️ Groq API<br/>llama-3.3-70b-versatile<br/>or gpt-oss-120b"]
    end

    subgraph Data["📁 Data Layer"]
        PDF["📕 VWO PRD PDF<br/>Product Requirements Document"]
        ChromaData["💾 chroma-data/<br/>Persistent Vector Store"]
    end

    %% Client-side connections
    React --> App
    App --> Pipeline
    App --> ChunkList
    App --> API_Client

    %% API routes
    API_Client -- "GET /api/status" --> Index
    API_Client -- "POST /api/ingest" --> Index
    API_Client -- "POST /api/query" --> Index
    API_Client -- "POST /api/reset" --> Index

    %% Ingest pipeline
    Index -- "ingest" --> PDF_Lib
    PDF_Lib -- "extract text" --> PDF
    PDF_Lib --> Chunk_Lib
    Chunk_Lib --> Embed_Lib
    Embed_Lib -- "embedding request" --> Ollama
    Embed_Lib --> Chroma_Lib
    Chroma_Lib -- "store vectors" --> ChromaDB
    ChromaDB --> ChromaData

    %% Query pipeline
    Index -- "query" --> Embed_Lib
    Embed_Lib -- "embed query" --> Ollama
    Embed_Lib --> Chroma_Lib
    Chroma_Lib -- "retrieve top-4" --> ChromaDB
    Chroma_Lib --> Groq_Lib
    Groq_Lib -- "augmented prompt" --> Groq
    Groq_Lib --> Index

    %% Status pipeline
    Index -- "status" --> Chroma_Lib
    Chroma_Lib -- "ping + count" --> ChromaDB

    %% Reset pipeline
    Index -- "reset" --> Chroma_Lib
    Chroma_Lib -- "delete collection" --> ChromaDB

    %% Styling
    classDef browser fill:#1a1a2e,stroke:#e94560,stroke-width:2px,color:#fff
    classDef server fill:#16213e,stroke:#0f3460,stroke-width:2px,color:#fff
    classDef external fill:#0f3460,stroke:#533483,stroke-width:2px,color:#fff
    classDef data fill:#1a1a2e,stroke:#e94560,stroke-width:1px,color:#aaa

    class React,Pipeline,ChunkList,App,API_Client browser
    class Index,PDF_Lib,Chunk_Lib,Embed_Lib,Chroma_Lib,Groq_Lib server
    class Ollama,ChromaDB,Groq external
    class PDF,ChromaData data
```

## Data Flow Summary

### 1. Ingestion Pipeline `POST /api/ingest`
```
PDF → pdf.js (extract text) → chunk.js (1200-char windows, 200 overlap)
    → embed.js (Ollama nomic-embed-text) → chroma.js (store in ChromaDB)
```

### 2. Query Pipeline `POST /api/query`
```
User Question → embed.js (Ollama) → chroma.js (retrieve top-4 similar chunks)
    → groq.js (build augmented prompt) → Groq API (llama-3.3-70b-versatile)
    → Answer displayed in React UI
```

## Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Embedding | **Ollama** (local) | No API key needed, fully offline, 768-dim vectors |
| LLM | **Groq API** (cloud) | Fast inference, requires API key |
| Vector Store | **ChromaDB** | Lightweight, persistent, cosine similarity |
| Chunk Size | 1200 chars / 200 overlap | Balances context richness with retrieval precision |
| UI Framework | **React + Vite** | Fast dev experience, SPA architecture |
| Proxy | Vite proxy `/api` → Express | Single origin for dev, avoids CORS issues |
| Process Management | `concurrently` | Runs ChromaDB + Express + Vite in parallel |