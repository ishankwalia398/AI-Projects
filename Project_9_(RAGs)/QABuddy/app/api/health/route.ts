import { NextResponse } from "next/server";
import { qdrantClient } from "@/lib/clients/qdrant";

export async function GET() {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (c: any) => c.name === process.env.QDRANT_COLLECTION || "qabuddy"
    );

    return NextResponse.json({
      status: "ok",
      qdrant_connected: true,
      collection_exists: collectionExists,
      llm_provider: process.env.LLM_PROVIDER || "groq",
      llm_ready: !!process.env.GROQ_API_KEY || !!process.env.LLM_API_KEY,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "degraded",
      qdrant_connected: false,
      collection_exists: false,
      llm_provider: process.env.LLM_PROVIDER || "groq",
      llm_ready: !!process.env.GROQ_API_KEY || !!process.env.LLM_API_KEY,
      error: error.message,
    });
  }
}
