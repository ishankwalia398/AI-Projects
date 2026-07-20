"use client";

import Link from "next/link";
import { ArrowLeft, Layers, Database, Brain, Search, FileText, Server, Cloud, Clock, GitBranch } from "lucide-react";

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">
      <header className="border-b border-cream-300 bg-cream-50 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link href="/" className="flex items-center gap-1 text-sm text-terracotta-500 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          <span className="text-ink-800/20">|</span>
          <h1 className="text-sm font-bold">QABuddy.AI Architecture</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Section 1: How We Built the Backend */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Layers className="h-5 w-5 text-terracotta-500" />
            How We Built the Backend
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-cream-300 bg-cream-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">Ingestion Pipeline</h3>
              <p className="text-xs leading-relaxed text-ink-800/70">
                10 source folders + JIRA MCP (JQL) → Loader/Parser → Chunker → Embedding → Vector DB upsert + Metadata store.
                Hourly cron (Phase 1) → webhook/file-watcher (Phase 2).
              </p>
            </div>
            <div className="rounded-lg border border-cream-300 bg-cream-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">Retrieval Pipeline</h3>
              <p className="text-xs leading-relaxed text-ink-800/70">
                Question → Understand/Rewrite → Parallel Search (Dense + BM25) → Merge → Cross-Encoder Rerank → Context Assembly → LLM Answer with Citations.
              </p>
            </div>
            <div className="rounded-lg border border-cream-300 bg-cream-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">Chunking Strategy</h3>
              <p className="text-xs leading-relaxed text-ink-800/70">
                Code: by function/class (~300-500 tokens). CSV: 10-row groups. JIRA: per ticket. PDFs: ~500 tokens by heading. Meeting notes: by speaker turn. Jenkins: by build/stage.
              </p>
            </div>
            <div className="rounded-lg border border-cream-300 bg-cream-50 p-4">
              <h3 className="mb-2 text-sm font-semibold">JIRA MCP Integration</h3>
              <p className="text-xs leading-relaxed text-ink-800/70">
                JQL queries run hourly via Vercel Cron. Tickets are normalized, chunked by field (summary, description, comments), embedded, and upserted with ticket_key metadata for citation.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Overall Architecture */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Server className="h-5 w-5 text-terracotta-500" />
            Overall Architecture
          </h2>
          <div className="rounded-lg border border-cream-300 bg-cream-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
              {/* Vercel Box */}
              <div className="flex-1 rounded border border-cream-300 bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-black" />
                  <span className="text-xs font-bold">Vercel (Serverless)</span>
                </div>
                <div className="space-y-1.5">
                  <div className="rounded bg-cream-100 px-2 py-1 text-[11px]">Next.js App Router</div>
                  <div className="rounded bg-cream-100 px-2 py-1 text-[11px]">API Routes (/api/chat, /api/ingest, /api/cron)</div>
                  <div className="rounded bg-cream-100 px-2 py-1 text-[11px]">Vercel Cron (hourly)</div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 rotate-180 text-ink-800/30" />
              </div>

              {/* External Services */}
              <div className="flex-1 space-y-3">
                <div className="rounded border border-cream-300 bg-white p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Database className="h-4 w-4 text-terracotta-500" />
                    <span className="text-xs font-bold">Qdrant Cloud</span>
                  </div>
                  <p className="text-[11px] text-ink-800/60">Vector DB — dense + sparse vectors, payload filtering</p>
                </div>
                <div className="rounded border border-cream-300 bg-white p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-terracotta-500" />
                    <span className="text-xs font-bold">LLM API (Groq/Together)</span>
                  </div>
                  <p className="text-[11px] text-ink-800/60">gpt-oss-120b or llama-3.1-70b via OpenAI-compatible API</p>
                </div>
                <div className="rounded border border-cream-300 bg-white p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-terracotta-500" />
                    <span className="text-xs font-bold">Neon Postgres</span>
                  </div>
                  <p className="text-[11px] text-ink-800/60">Metadata store — source paths, ticket IDs, line ranges, timestamps</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Tech Stack */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <GitBranch className="h-5 w-5 text-terracotta-500" />
            Technologies & Implementation Details
          </h2>
          <div className="overflow-hidden rounded-lg border border-cream-300">
            <table className="w-full text-xs">
              <thead className="bg-cream-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Layer</th>
                  <th className="px-3 py-2 text-left font-semibold">Choice</th>
                  <th className="px-3 py-2 text-left font-semibold">Hosted</th>
                  <th className="px-3 py-2 text-left font-semibold">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                <tr className="bg-cream-50">
                  <td className="px-3 py-2 font-medium">Frontend + API</td>
                  <td className="px-3 py-2">Next.js 14 App Router</td>
                  <td className="px-3 py-2">Vercel</td>
                  <td className="px-3 py-2 text-ink-800/70">Native fit, zero-config deploys, serverless functions</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Embedding</td>
                  <td className="px-3 py-2">BAAI/bge-m3</td>
                  <td className="px-3 py-2">External inference</td>
                  <td className="px-3 py-2 text-ink-800/70">Dense + sparse + ColBERT in one model, 8k context</td>
                </tr>
                <tr className="bg-cream-50">
                  <td className="px-3 py-2 font-medium">Vector DB</td>
                  <td className="px-3 py-2">Qdrant</td>
                  <td className="px-3 py-2">Qdrant Cloud</td>
                  <td className="px-3 py-2 text-ink-800/70">Native sparse vectors, payload filtering, managed</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Keyword Search</td>
                  <td className="px-3 py-2">BM25 via Qdrant sparse</td>
                  <td className="px-3 py-2">Qdrant Cloud</td>
                  <td className="px-3 py-2 text-ink-800/70">Exact-match for ticket IDs, exceptions, method names</td>
                </tr>
                <tr className="bg-cream-50">
                  <td className="px-3 py-2 font-medium">Reranker</td>
                  <td className="px-3 py-2">BAAI/bge-reranker-v2-m3</td>
                  <td className="px-3 py-2">External inference</td>
                  <td className="px-3 py-2 text-ink-800/70">Cross-encoder reorders merged candidates</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">LLM</td>
                  <td className="px-3 py-2">gpt-oss-120b / llama-3.1-70b</td>
                  <td className="px-3 py-2">Groq / Together</td>
                  <td className="px-3 py-2 text-ink-800/70">OpenAI-compatible API, fast, high quality</td>
                </tr>
                <tr className="bg-cream-50">
                  <td className="px-3 py-2 font-medium">Metadata</td>
                  <td className="px-3 py-2">Postgres</td>
                  <td className="px-3 py-2">Neon / Supabase</td>
                  <td className="px-3 py-2 text-ink-800/70">Free tier, Vercel-compatible, tracks citations</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Scheduling</td>
                  <td className="px-3 py-2">Vercel Cron</td>
                  <td className="px-3 py-2">Vercel</td>
                  <td className="px-3 py-2 text-ink-800/70">Free, simple, triggers /api/cron hourly</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Flow Diagrams */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Search className="h-5 w-5 text-terracotta-500" />
            Flow Diagrams
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-cream-300 bg-cream-50 p-4">
              <h3 className="mb-3 text-sm font-semibold">Query-Time Flow</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">1</span>
                  <span>User asks a question</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">2</span>
                  <span>Understand/Rewrite into search variants</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">3</span>
                  <span>Parallel Search: Dense + BM25</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">4</span>
                  <span>Merge results (Reciprocal Rank Fusion)</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">5</span>
                  <span>Cross-Encoder Rerank → top 6 chunks</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">6</span>
                  <span>LLM generates cited answer</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-cream-300 bg-cream-50 p-4">
              <h3 className="mb-3 text-sm font-semibold">Ingestion-Time Flow</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-terracotta-500" />
                  <span>Vercel Cron triggers hourly</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-terracotta-500" />
                  <span>Load 10 source folders + JIRA (JQL)</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-terracotta-500" />
                  <span>Parse & chunk by source type</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-terracotta-500" />
                  <span>Embed with BGE-M3 (dense + sparse)</span>
                </div>
                <div className="ml-2.5 h-4 border-l border-cream-300"></div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-terracotta-500" />
                  <span>Upsert to Qdrant + metadata to Postgres</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
