create a RAG explorer as below in the folder Task(04th july)/Basic_RAG
# Role & Objective
You are an expert Full-Stack AI Engineer. Your task is to build a complete, production-ready "RAG Explorer" web application. The primary goal of this application is to visually demonstrate the end-to-end Retrieval-Augmented Generation (RAG) pipeline—from document ingestion to final answer generation—using a local vector database and a modern React frontend.

---

# Architecture & Tech Stack

### 1. Frontend
* **Framework:** React (Vite preferred for speed and simplicity).
* **Styling:** Tailwind CSS (clean, modern, and highly scannable UI).
* **State Management:** Clear component states to manage loading, ingestion progress, and query results.

### 2. Backend / API Layer
* **Framework:** Node.js (Express/Fastify) or Python (FastAPI)—choose the one that best integrates the required AI SDKs.
* **PDF Processing:** Extract text from files located in the `./data` directory (specifically, a Product Requirements Document for vwo.com).
* **Chunking Strategy:** Fixed-size chunking (e.g., 500 characters with a 50-character overlap) to ensure clean context splitting.

### 3. AI & Vector Database Integration
* **Embedding Model:** Nomic Embed (`nomic-embed-text`).
* **Vector Database:** Local ChromaDB instance to store and query the generated embeddings.
* **LLM Provider:** Groq Cloud API.
* **Model:** `llama-3.1-70b-versatile` (Note: "OpenGPT 120B" does not exist; use Groq's largest available model, like Llama 3.1 70B or 8B, for the text generation).

---

# Detailed Core Functionality

### Phase 1: Ingestion Pipeline (The "Backend" Flow)
1. **Read:** Automatically read the target PDF file from the local `./data` folder.
2. **Chunk:** Split the PDF text into logical chunks.
3. **Embed:** Send these chunks to the Nomic embedding model to generate vectors.
4. **Upsert:** Store the text chunks and their corresponding embedding vectors into a local ChromaDB collection.

### Phase 2: Retrieval & Generation Pipeline
1. **Query:** Accept a user's natural language question via the UI.
2. **Vector Search:** Embed the user's query using Nomic, then query ChromaDB to retrieve the **top 4 most relevant chunks** ($k=4$).
3. **LLM Prompting:** Construct a system prompt containing the 4 retrieved chunks as context, followed by the user's question.
4. **Generation:** Fire the prompt to Groq using the specified model to get the final answer.

---

# UI & UX Requirements

The frontend must visually break down the RAG process into two distinct views or sections so the user can "see under the hood":

### 1. Ingestion Dashboard
* A button to "Trigger Data Ingestion".
* A visual stepper or progress indicator showing the status: `[Reading PDF] -> [Splitting Chunks] -> [Generating Embeddings] -> [ChromaDB Synced]`.
* A summary metric card once complete (e.g., "Total Chunks Created: 42").

### 2. Query & Playground Interface
* A clean chat-like search bar for user queries.
* **The "RAG Explainer" Panel:** When a query is submitted, the UI must split into two sections:
    * **Left Side (The Answer):** Displays the final, streamed/generated answer from the Groq LLM.
    * **Right Side (The Context):** Displays 4 distinct cards showing the exact **top 4 retrieved text chunks** used to formulate the answer, including their ChromaDB similarity/distance scores if available.

---

# Deliverables
1. Complete, well-documented source code for both frontend and backend.
2. A `README.md` file with explicit setup instructions (how to run ChromaDB locally, required environment variables for Groq/Nomic, and install steps).
3. Clean error handling for missing API keys, empty PDF files, or database connection failures.
