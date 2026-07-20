import { openaiClient, llmModel } from "./clients/llm";
import { Citation } from "./retrieval";

export function detectMode(question: string): string {
  const q = question.toLowerCase();
  if (/\b(generate|create|write|draft|build test)\b/.test(q)) return "generate";
  if (/\b(root cause|flaky|failure|debug|why did it fail|stack trace)\b/.test(q)) return "rca";
  if (/\b(review|coverage|gap|missing|audit)\b/.test(q)) return "review";
  return "answer";
}

const SYSTEM_PROMPTS: Record<string, string> = {
  answer: `You are QABuddy.AI, a QA engineering assistant. Answer using ONLY the provided context chunks.
Cite every claim as [n] matching the chunk index. If the answer isn't in the context, say so explicitly.
Be concise, technical, and accurate.`,
  generate: `You are QABuddy.AI, a QA engineering assistant. Generate test cases or code using ONLY the provided context chunks.
Cite requirements or references as [n]. Include step-by-step test cases with preconditions, steps, and expected results.
If context is insufficient, say so.`,
  review: `You are QABuddy.AI, a QA engineering assistant. Review coverage/gaps against requirements using ONLY the provided context chunks.
Cite each finding as [n]. Be specific about what is missing or covered.
If context is insufficient, say so.`,
  rca: `You are QABuddy.AI, a QA engineering assistant. Perform root cause analysis using ONLY the provided context chunks.
Cite logs, tickets, and traces as [n]. Identify the most likely cause and suggest fixes.
If context is insufficient, say so.`,
};

export async function generateAnswer(
  question: string,
  citations: Citation[],
  mode: string,
  history: { role: string; content: string }[]
): Promise<string> {
  try {
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.answer;

    const contextBlocks = citations.map((c, i) => {
      const meta = `[${i + 1}] ${c.source} | ${c.path}`;
      return `${meta}\n${c.snippet}`;
    });

    const context = contextBlocks.join("\n\n");

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Context chunks:\n\n${context}` },
      ...history.slice(-4).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: question },
    ];

    const response = await openaiClient.chat.completions.create({
      model: llmModel,
      messages: messages as any,
      temperature: 0.2,
      max_tokens: 2048,
    });

    return response.choices[0]?.message?.content || "No response generated.";
  } catch (error: any) {
    console.error("LLM error:", error);
    return `Error generating answer: ${error.message}. Please check your LLM API configuration.`;
  }
}
