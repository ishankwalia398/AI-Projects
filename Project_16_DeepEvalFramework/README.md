# DeepEval Live Lab

Live adaptation of chapter_16_DeepEval_Framwork. The dashboard runs the original
25 DeepEval metrics against fresh model responses. Cards start as NOT RUN, with
Run and Run all visible controls. The snapshot notice has been removed.

Expand Try the chatbot or RAG to ask questions or inspect retrieved sources.
Hosted RAG uses BM25 keyword retrieval over bundled policy documents. The original
local Ollama/Chroma implementation remains in 02_RAG_Explorer.

## Run locally

Use Python 3.12 and the existing task .env containing GROQ_API_KEY:

```powershell
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
.venv/Scripts/python.exe -m uvicorn app:app --port 8203 --env-file .env
```

Open http://localhost:8203. No separate local services are needed for this adapter.
Defaults: qwen/qwen3.8-27b for chatbot/RAG, openai/gpt-oss-120b for the judge.
Override CHATBOT_MODEL, RAG_MODEL, or JUDGE_MODEL in the environment if needed.

```powershell
.venv/Scripts/python.exe -m unittest discover -s tests_hosted -v
.venv/Scripts/python.exe build.py
node deploy.mjs
node deploy.mjs --status
```

## Deployment

The deploy script updates the existing project in deployment.json and stores
GROQ_API_KEY as an encrypted production environment variable. Authorization to
store that key in Vercel is required before publishing this live version.
VERCEL_TOKEN remains local and authenticates deployment requests only. The script
uploads an explicit source-file allowlist, never .env. CONFIDENT_API_KEY is not
needed or provisioned for direct DeepEval measurement.

Live runs consume the server's Groq quota. Temporary rate limits are retried using
Groq's retry-after timing, within the request deadline. Persistent limits appear
as execution errors, separately from genuine failed metric scores.
Multiple cases run sequentially in separate requests to fit the 300-second Vercel
limit. Runs are serialized within a worker to isolate token counts. Results and
counters belong to the current browser tab and reset on reload. Status lights
indicate configuration readiness, not a paid health probe.

## API

- GET /api/catalog: shared metric definitions.
- GET /api/status: model configuration and corpus readiness.
- POST /api/run: {"key":"answer_relevancy","sample":1,"offset":0}.
- POST /api/chatbot: {"message":"What is the return window?"}.
- POST /api/rag/chat: {"message":"How long do refunds take?","top_k":3}.
- POST /api/rag/search: {"query":"refund policy","top_k":3}.

Chat endpoints accept optional user/assistant history. Input sizes, offsets, and
sample counts are validated. API credentials never appear in page output.

The original pytest suite, datasets, and standalone dashboard are retained in
03_DeepFramework. Its runner accepts an injected RAG adapter and accounts for
retrieval target token usage. The hosted app uses direct adapters instead of
calling localhost. Subsystem READMEs describe the upstream local architecture;
this README describes the live hosting adaptation.
