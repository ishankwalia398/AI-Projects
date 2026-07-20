import { qdrantClient, qdrantCollection } from "./clients/qdrant";

export interface Citation {
  index: number;
  source: string;
  path: string;
  snippet: string;
  line_start?: number;
  line_end?: number;
  ticket_key?: string;
  build_id?: string;
  tc_id?: string;
}

// UI source IDs -> Qdrant folder names
const UI_TO_FOLDER: Record<string, string> = {
  selenium: "01_selenium_framework",
  playwright: "02_playwright_framework",
  testcases: "03_test_cases",
  jira: "04_jira_tickets",
  docs: "05_company_docs",
  figma: "06_figma_designs",
  meetings: "07_meeting_notes_transcripts",
  lucid: "08_lucid_charts",
  prd: "09_prd_srs_brd_frd",
  jenkins: "10_jenkins_logs",
};

export async function hybridSearch(
  question: string,
  sourceFilter: string[]
): Promise<Citation[]> {
  try {
    // Map UI source IDs to Qdrant folder names
    const qdrantSources = sourceFilter
      .map((id) => UI_TO_FOLDER[id])
      .filter(Boolean);

    // Scroll all chunks (vectors are placeholders, so semantic search doesn't work)
    const allPoints: any[] = [];
    let offset: string | undefined = undefined;
    while (true) {
      const result = await qdrantClient.scroll(qdrantCollection, {
        limit: 100,
        offset,
        with_payload: true,
        with_vector: false,
      });
      allPoints.push(...result.points);
      if (!result.next_page_offset) break;
      offset = result.next_page_offset as string;
    }

    // Filter by source in JS (Qdrant filter format is unreliable with JS client)
    const points = qdrantSources.length
      ? allPoints.filter((p) => qdrantSources.includes(p.payload?.source_type))
      : allPoints;

    // Keyword matching across filtered chunks
    const keywords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    let scored = points
      .map((point: any) => {
        const text = (point.payload?.text || "").toLowerCase();
        // Score by keyword matches + partial word matches
        let score = 0;
        for (const kw of keywords) {
          if (text.includes(kw)) score += 1;
          // Also check if any word in text starts with the keyword
          else if (text.split(/\s+/).some((w: string) => w.startsWith(kw))) score += 0.5;
        }
        return { point, score };
      })
      .filter((s: any) => s.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 6);

    // Fallback: if no keyword matches, return first 6 chunks so LLM has context
    if (scored.length === 0 && points.length > 0) {
      scored = points.slice(0, 6).map((point: any) => ({ point, score: 0 }));
    }

    return scored.map((item: any, idx: number) => {
      const p = item.point.payload || {};
      return {
        index: idx + 1,
        source: p.source_type || "unknown",
        path: p.path || "",
        snippet: (p.text || "").slice(0, 300),
        line_start: p.line_start,
        line_end: p.line_end,
        ticket_key: p.ticket_key,
        build_id: p.build_id,
        tc_id: p.tc_id,
      };
    });
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}
