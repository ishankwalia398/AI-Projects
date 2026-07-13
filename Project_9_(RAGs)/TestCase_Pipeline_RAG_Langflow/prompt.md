# Build a RAG Test Cases Explorer Dashboard

Act as an expert frontend engineer and Next.js / React developer. Build a single-page web application dashboard named "RAG Test Cases Explorer" using React, Tailwind CSS, Lucide icons, and Shadcn UI components.

The application is a functional user interface wrapper for a dual-phase Langflow RAG pipeline (Phase 1: Ingestion & Ingesting Data into Chroma DB; Phase 2: Similarity Retrieval & LLM Generation using Groq).

## Visual & Theme Layout
- Theme: Deep dark futuristic cyber theme (Dark slate/navy background #030712 or #090d16).
- Highlights: Neon accents matching the workflow steps (Emerald green for active steps, violet for embedding/query, orange/amber for generation).
- Layout: Clean typography, high scannability, responsive grid card interface.

## Header Section
- Left side: Title "RAG Test Cases Explorer" with subtitle "Semantic search for test case documents · AI-powered retrieval & generation".
- Right side state badges: Top-K count dynamic badge, a glowing green status dot ("Pipeline Ready"), "Langflow Connected" badge, and a "Groq Key Active" badge.

## Core Component: Interactive Pipeline Architecture Diagram
Create a visually stunning interactive workflow map in the center card representing the structural path of the RAG pipeline.
- Top row (Ingestion Phase): [Upload File] -> [Chunk Text] -> [Embed Data] -> [Store in Chroma]
- Bottom row (Retrieval & Gen Phase): [User Query] -> [Retrieve Vectors] -> [LLM Gen (Groq)] -> [Display Results]
- Connectors: Clean linear CSS or SVG flow arrows tracking the sequence from step to step.
- Interactive features: Clicking any node highlights the step and changes the active sub-panel tab below.

## Tabbed Configuration & Playground Workspace
Provide a clean tab layout to toggle between operations:

### TAB 1: Configuration & Settings
- Inputs for: "Groq API Key" (Password mask), "Top-K Results (1-50)" numeric input field, and "Langflow Endpoint URL" (defaulting to http://localhost:7860).
- Action button: "Test Langflow Connection" with simulated loading state and a successful check indicator.

### TAB 2: Document Ingestion (Upload)
- File upload drop-zone supporting CSV, JSON, and Text formats.
- Form fields matching the Langflow node specifications: "Text Key Column Selector" (Default: 'Test Case ID'), "Chunk Size" (Default: 1000), "Chunk Overlap" (Default: 200).
- Primary Action button: "Process and Store in Vector DB". Show a step-by-step progress checklist overlay mirroring the "Top Row" map sequence as it works.

### TAB 3: Pipeline Playground (Query)
- Split screen or wide card workspace.
- Left Panel: Textarea field for typing a natural language query against test cases. Plus a slider or select option dropdown for "Search Type" (Similarity vs MMR).
- Action button: "Execute Pipeline Query".
- Right Panel: Two tabbed result output fields:
  1. "Retrieved Context Data Table": Render mock array records matching a parsed test-case dataframe layout (Columns: Test Case ID, Description, Expected Result, Status, Relevance Score).
  2. "LLM Final Synthesis Output": Clean rendered markdown block text representing the Groq Llama-3 model answer parsed cleanly.

## Code Requirements & Mock Capabilities
- Implement robust local state variables utilizing standard React hooks to govern tab changes, modal configurations, loading animations, and file input status.
- Build clean mock responses simulating exact data output formats expected from a multi-stage Langchain/Chroma engine so the UI behaves exactly like a real production environment.
- Prioritize high-fidelity clean CSS stylings, interactive hover behaviors, and responsive grid layouts.
