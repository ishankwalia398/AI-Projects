import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret if configured
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await runIngestion();
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: error.message || "Cron ingestion failed" },
      { status: 500 }
    );
  }
}
