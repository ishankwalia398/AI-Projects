import { NextRequest, NextResponse } from "next/server";
import { hybridSearch } from "@/lib/retrieval";
import { generateAnswer, detectMode } from "@/lib/llm";
import { llmModel } from "@/lib/clients/llm";

export async function POST(req: NextRequest) {
  try {
    console.log(`[chat] Runtime model: ${llmModel}`);
    const body = await req.json();
    const { messages, source_filter, mode } = body;

    const question = messages[messages.length - 1]?.content || "";
    const detectedMode = mode || detectMode(question);

    // Retrieve relevant chunks
    const citations = await hybridSearch(question, source_filter || []);

    // Generate answer
    const answer = await generateAnswer(question, citations, detectedMode, messages);

    return NextResponse.json({
      answer,
      citations,
      mode: detectedMode,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
