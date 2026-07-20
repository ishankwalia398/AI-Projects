import OpenAI from "openai";

const groqApiKey = process.env.GROQ_API_KEY || "";
const llmApiKey = process.env.LLM_API_KEY || groqApiKey;
const llmBaseUrl = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const llmModel = "llama-3.3-70b-versatile";

console.log(`[LLM] Using model: ${llmModel}, baseURL: ${llmBaseUrl}`);

export const openaiClient = new OpenAI({
  apiKey: llmApiKey,
  baseURL: llmBaseUrl,
});

export { llmModel };
