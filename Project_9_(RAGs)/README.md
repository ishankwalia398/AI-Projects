# Project 9 – RAG Experiments

Retrieval-Augmented Generation (RAG) experiments for QA use cases, built with different stacks so the approaches can be compared.

## Sub-projects

| Folder | Description | Stack |
|---|---|---|
| `Basic_RAG_prompt/rag-explorer` | Step-by-step RAG demo over a VWO PRD (PDF → chunks → embeddings → retrieval → answer) showing every stage in the UI. | React, Vite, Express, ChromaDB, Ollama (`nomic-embed-text`), Groq |
| `Basic_RAG_n8n` | n8n workflow with a form to ingest docs into a vector DB and a chat RAG agent with memory. | n8n, OpenAI embeddings and chat model, Pinecone |
| `TestCase_Pipeline_RAG_Langflow` | Langflow RAG pipeline that generates QA test cases, plus an explorer UI. | Langflow, React, TypeScript, Tailwind CSS v4 |
| `QABuddy` | QABuddy.AI – a RAG assistant over a QA knowledge base (Selenium/Playwright frameworks, test cases, Jira tickets, PRDs, meeting notes). Answers include citations. | Next.js 14, Groq, Qdrant, Neon Postgres, Mermaid |

## Features

- End-to-end visibility into chunking, embedding, retrieval and prompt augmentation.
- Local (Ollama + ChromaDB) and hosted (Pinecone, Qdrant) vector stores.
- No-code (n8n, Langflow) and full-code (Next.js, Express) implementations.
- Citation tracking and architecture docs in QABuddy.

## Getting started

Each sub-project is self-contained; see its own README, `guide.md` or `link.md` for setup and deployment. Copy `.env.example` files to `.env` and add your own keys – never commit them.
