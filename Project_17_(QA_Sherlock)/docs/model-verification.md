# Provider verification — 2026-09-05

| Purpose | Default identifier | Evidence |
|---|---|---|
| Primary | `Qwen/Qwen3.8-27B` | [Command Code model catalog](https://commandcode.ai/docs/reference/cli/models) explicitly lists this identifier |
| Fallback | `gemini-3.6-flash` | [Google model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash) lists the stable API code |
| Judge | `deepseek-v4-flash` | [DeepSeek API docs](https://api-docs.deepseek.com/) list direct API code |

[Command Code Provider API](https://commandcode.ai/docs/provider) documents `https://api.commandcode.ai/provider/v1`, chat completions and `/models`. The primary uses that gateway and your Command Code key. Its upstream being Groq cannot be guaranteed from the public API contract. [Groq's model listing](https://console.groq.com/docs/models) and [vision documentation](https://console.groq.com/docs/vision) were inconsistent about Qwen 3.8 during verification. We therefore do not claim a verified Groq route or silently substitute Qwen 3.6.

All three requested model families are retained. To use all models on Command Code, replace fallback with `google/gemini-3.6-flash` and judge with `deepseek/deepseek-v4-flash`, using the Command Code URL and key environment name. Direct-provider defaults keep the fallback independent of a Command Code outage.

Documentation verification is not authenticated account verification. Run `qa-sherlock models` with your keys and inspect the live catalog before the first paid investigation. Provider identifiers can change; configuration is the source of truth.

Implementation references: [CrewAI custom LLM](https://docs.crewai.com/en/learn/custom-llm), [Pinecone semantic search](https://docs.pinecone.io/guides/search/semantic-search), [DeepEval GEval](https://deepeval.com/docs/metrics-llm-evals), [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk). The MCP dependency is constrained to v1 because its transport signature differs from v2.
