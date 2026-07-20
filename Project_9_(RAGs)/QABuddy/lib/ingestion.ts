import { qdrantClient, qdrantCollection } from "./clients/qdrant";
import { sql, ensureTables } from "./clients/postgres";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function stringToUuid(str: string): string {
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

const KNOWLEDGE_BASE = path.join(process.cwd(), "knowledge_base");

const SOURCE_CONFIG: Record<string, { chunker: string; extensions: string[] }> = {
  "01_selenium_framework": { chunker: "code", extensions: [".java", ".xml", ".md"] },
  "02_playwright_framework": { chunker: "code", extensions: [".ts", ".js", ".json", ".md"] },
  "03_test_cases": { chunker: "csv", extensions: [".csv", ".xlsx"] },
  "04_jira_tickets": { chunker: "json", extensions: [".json"] },
  "05_company_docs": { chunker: "text", extensions: [".pdf", ".md", ".txt"] },
  "06_figma_designs": { chunker: "text", extensions: [".md", ".txt"] },
  "07_meeting_notes_transcripts": { chunker: "text", extensions: [".md", ".txt"] },
  "08_lucid_charts": { chunker: "text", extensions: [".md", ".txt"] },
  "09_prd_srs_brd_frd": { chunker: "text", extensions: [".pdf", ".md", ".txt"] },
  "10_jenkins_logs": { chunker: "text", extensions: [".log", ".txt", ".json", ".xml"] },
};

const FOLDER_TO_UI_ID: Record<string, string> = {
  "01_selenium_framework": "selenium",
  "02_playwright_framework": "playwright",
  "03_test_cases": "testcases",
  "04_jira_tickets": "jira",
  "05_company_docs": "docs",
  "06_figma_designs": "figma",
  "07_meeting_notes_transcripts": "meetings",
  "08_lucid_charts": "lucid",
  "09_prd_srs_brd_frd": "prd",
  "10_jenkins_logs": "jenkins",
};

export async function getStats() {
  try {
    await ensureTables();
    const collectionInfo = await qdrantClient.getCollection(qdrantCollection);
    const totalChunks = (collectionInfo as any).points_count || (collectionInfo as any).result?.points_count || 0;

    // Get per-source stats from Postgres
    const sources = await sql`SELECT * FROM sources`;
    const sourcesArray = Array.isArray(sources) ? sources : (sources as any).rows || [];

    return {
      total_chunks: totalChunks,
      by_source: sourcesArray.map((r: any) => ({
        id: FOLDER_TO_UI_ID[r.source_type] || r.source_type,
        count: r.file_count,
        chunks: r.chunk_count,
      })),
    };
  } catch (e: any) {
    console.error("[stats] Error:", e.message);
    return { total_chunks: 0, by_source: [] };
  }
}

async function ensureCollection() {
  try {
    await qdrantClient.getCollection(qdrantCollection);
    return;
  } catch (e: any) {
    console.log("Collection does not exist, creating...", e.message || e);
  }

  try {
    await qdrantClient.createCollection(qdrantCollection, {
      vectors: { size: 384, distance: "Cosine" },
    });
    console.log("Collection created successfully");
  } catch (e: any) {
    console.error("Failed to create collection:", e.message, e.status, e.statusText);
    throw e;
  }
}

export async function runIngestion() {
  console.log("[ingest] Starting ingestion...");
  await ensureTables();
  await ensureCollection();
  console.log("[ingest] Collection ensured");

  const results: any[] = [];

  for (const [folder, config] of Object.entries(SOURCE_CONFIG)) {
    console.log(`[ingest] Processing source: ${folder}`);
    const folderPath = path.join(KNOWLEDGE_BASE, folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`[ingest] Source missing: ${folderPath}`);
      results.push({ source: folder, status: "missing", chunks: 0 });
      continue;
    }

    const files = walkDir(folderPath).filter((f) =>
      config.extensions.some((ext) => f.endsWith(ext))
    );
    console.log(`[ingest] Found ${files.length} files in ${folder}`);

    let chunkCount = 0;
    for (const file of files) {
      console.log(`[ingest] Processing file: ${file}`);
      const chunks = await processFile(file, folder, config.chunker);
      chunkCount += chunks.length;
      console.log(`[ingest] Generated ${chunks.length} chunks for ${file}`);

      // Upsert to Qdrant
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const pointId = stringToUuid(`${folder}_${path.basename(file)}_${i}`);
        try {
          await qdrantClient.upsert(qdrantCollection, {
            points: [
              {
                id: pointId,
                vector: new Array(384).fill(0),
                payload: {
                  text: chunk.text,
                  source_type: folder,
                  path: file,
                  heading: chunk.heading,
                  line_start: chunk.line_start,
                  line_end: chunk.line_end,
                  ticket_key: chunk.ticket_key,
                  build_id: chunk.build_id,
                  tc_id: chunk.tc_id,
                },
              },
            ],
          });
        } catch (e: any) {
          console.error(`[ingest] Qdrant upsert failed for ${pointId}:`, e.message, e.status, e.statusText);
          throw e;
        }
      }
    }

    // Update source stats
    try {
      await sql`
        INSERT INTO sources (source_type, file_count, chunk_count, last_ingested_at)
        VALUES (${folder}, ${files.length}, ${chunkCount}, NOW())
        ON CONFLICT (source_type)
        DO UPDATE SET
          file_count = EXCLUDED.file_count,
          chunk_count = EXCLUDED.chunk_count,
          last_ingested_at = EXCLUDED.last_ingested_at
      `;
      console.log(`[ingest] Postgres updated for ${folder}: ${files.length} files, ${chunkCount} chunks`);
    } catch (e: any) {
      console.error(`[ingest] Postgres update failed for ${folder}:`, e.message);
      throw e;
    }

    results.push({ source: folder, status: "ingested", chunks: chunkCount, files: files.length });
  }

  console.log("[ingest] Ingestion complete");
  return results;
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results.push(...walkDir(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

interface Chunk {
  text: string;
  heading?: string;
  line_start?: number;
  line_end?: number;
  ticket_key?: string;
  build_id?: string;
  tc_id?: string;
}

async function processFile(filePath: string, sourceType: string, chunker: string): Promise<Chunk[]> {
  const content = fs.readFileSync(filePath, "utf-8");

  if (chunker === "code") {
    return chunkCode(content, filePath);
  } else if (chunker === "csv") {
    return chunkCSV(content, filePath);
  } else {
    return chunkText(content, filePath);
  }
}

function chunkCode(content: string, path: string): Chunk[] {
  const lines = content.split("\n");
  const chunks: Chunk[] = [];
  let current: string[] = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(public|private|protected|def|function|class|interface)\s/.test(line.trim()) && current.length > 5) {
      chunks.push({
        text: current.join("\n"),
        line_start: startLine + 1,
        line_end: i,
        heading: current[0]?.slice(0, 80),
      });
      current = [line];
      startLine = i;
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    chunks.push({
      text: current.join("\n"),
      line_start: startLine + 1,
      line_end: lines.length,
    });
  }

  return chunks;
}

function chunkCSV(content: string, path: string): Chunk[] {
  const lines = content.split("\n");
  const header = lines[0];
  const chunks: Chunk[] = [];
  const groupSize = 10;

  for (let i = 1; i < lines.length; i += groupSize) {
    const group = lines.slice(i, i + groupSize);
    chunks.push({
      text: `${header}\n${group.join("\n")}`,
      line_start: i + 1,
      line_end: Math.min(i + groupSize, lines.length),
    });
  }

  return chunks;
}

function chunkText(content: string, path: string): Chunk[] {
  const maxTokens = 500;
  const overlap = 50;
  const words = content.split(/\s+/);
  const chunks: Chunk[] = [];

  for (let i = 0; i < words.length; i += maxTokens - overlap) {
    const slice = words.slice(i, i + maxTokens);
    chunks.push({
      text: slice.join(" "),
      line_start: i,
      line_end: i + slice.length,
    });
  }

  return chunks;
}
