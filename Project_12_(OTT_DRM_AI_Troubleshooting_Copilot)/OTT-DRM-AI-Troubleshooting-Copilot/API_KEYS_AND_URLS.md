# API keys and URLs needed

You can open and run the project in VS Code without sharing any secret with the source code. Put local secrets only in `.env`; add deployment secrets through Vercel Project Settings.

## Required for Pinecone RAG

### `PINECONE_API_KEY`

- Required: **Yes**, if you want Pinecone retrieval.
- Create it: <https://app.pinecone.io/> → select the project → **API keys** → **Create API key**.
- Documentation: <https://docs.pinecone.io/guides/projects/manage-api-keys>
- Paste only into `.env` locally and the `PINECONE_API_KEY` sensitive environment variable on Vercel.

No custom Pinecone service URL is needed. The Pinecone SDK resolves the service from the API key and index name.

Use these non-secret settings:

```dotenv
RAG_PROVIDER=pinecone
PINECONE_INDEX=ott-drm-ai-copilot
PINECONE_NAMESPACE=knowledge
PINECONE_EMBED_MODEL=llama-text-embed-v2
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP_PERCENT=15
```

Keep `RAG_PROVIDER=pinecone` explicit in local and Vercel configuration. If it is accidentally omitted but `PINECONE_API_KEY` exists, version 1.2.1 still identifies and displays the configured provider as Pinecone. The label `local-fallback` is reserved for an individual analysis where Pinecone could not be reached and local retrieval was actually used.

Version 1.2.1 indexes knowledge cards, historical incidents, synthetic device capability profiles, and section-based records from `data/sources/OTT_DRM_Streaming_RAG_Resources.md`. After changing any of these sources, rebuild the namespace with `python scripts/index_pinecone.py --rebuild`. Evaluation cases are intentionally not indexed.

## Optional for AI-written explanations

### `OPENAI_API_KEY`

- Required: **No**. The deterministic diagnosis and Pinecone RAG work without it.
- Create it: <https://platform.openai.com/api-keys>
- Paste only into `.env` locally and the `OPENAI_API_KEY` sensitive environment variable on Vercel.

Use:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
ENABLE_AI_EXPLANATION=false
```

Keep `ENABLE_AI_EXPLANATION=false` for an unauthenticated public demo. Change it to `true` only after adding authentication and rate limiting.

## Required only when deploying to Vercel

### `VERCEL_TOKEN`

- Required: **Only for CLI or CI deployment**.
- Create it: Vercel personal account → **Settings** → **Tokens** → **Create Token**.
- Documentation: <https://vercel.com/kb/guide/how-do-i-use-a-vercel-api-access-token>
- Keep it in your shell or CI secret store.
- Do **not** put it in `.env`, frontend code, Git, or Vercel runtime environment variables.

Production URLs for this project:

```text
Main:          https://ott-drm-copilot.vercel.app/
Custom domain: https://ott-drm-troubleshooting-copilot.vercel.app/
API docs:      https://ott-drm-troubleshooting-copilot.vercel.app/api/docs
```

No application URL is required before deployment because the frontend calls the API using same-origin paths such as `/api/analyze`.

## PDF report export

PDF export runs entirely in the browser and requires no API key, URL, package, or additional Vercel environment variable. After an analysis finishes, select **Export PDF** to download the diagnosis, ranked causes, evidence, expected behavior, tests, retrieved sources, and caveats.

## Optional Vercel CI identifiers

`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are optional. The interactive `vercel link` command creates `.vercel/project.json`, so you do not need these for a manual deployment. They are useful later for non-interactive CI pipelines.

## Local URLs

After running `python run_app.py`:

```text
Application: http://localhost:8000
Health:      http://localhost:8000/api/health
API docs:    http://localhost:8000/api/docs
```

## Minimum keys to send or configure

For local Pinecone RAG:

```text
PINECONE_API_KEY
```

For optional AI explanation:

```text
OPENAI_API_KEY
```

For later Vercel deployment:

```text
VERCEL_TOKEN
```

Do not send API keys through chat. Configure them yourself in `.env` or the relevant deployment secret store.
