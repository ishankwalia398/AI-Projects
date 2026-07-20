import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion";

function serializeError(error: any): any {
  if (!error) return null;
  const plain: any = {};
  Object.getOwnPropertyNames(error).forEach((key) => {
    try {
      plain[key] = (error as any)[key];
    } catch {}
  });
  return plain;
}

export async function POST(req: NextRequest) {
  try {
    const results = await runIngestion();
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Ingest error:", error);
    const serialized = serializeError(error);
    return NextResponse.json(
      {
        error: error.message || "Ingestion failed",
        type: error.constructor?.name || typeof error,
        serialized,
      },
      { status: 500 }
    );
  }
}
