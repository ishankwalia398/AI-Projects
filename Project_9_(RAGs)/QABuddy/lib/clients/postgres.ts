import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

const neonSql = neon(process.env.POSTGRES_URL || "");

// Wrapper that supports tagged template literals like @vercel/postgres
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  const query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""), "");
  return neonSql(query, values);
}

export async function ensureTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        chunk_id TEXT UNIQUE NOT NULL,
        source_type TEXT NOT NULL,
        path TEXT NOT NULL,
        heading TEXT,
        line_start INTEGER,
        line_end INTEGER,
        ticket_key TEXT,
        build_id TEXT,
        tc_id TEXT,
        text TEXT NOT NULL,
        ingested_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        source_type TEXT UNIQUE NOT NULL,
        file_count INTEGER DEFAULT 0,
        chunk_count INTEGER DEFAULT 0,
        last_ingested_at TIMESTAMP
      )
    `;
  } catch (e) {
    console.error("Postgres init error:", e);
  }
}
