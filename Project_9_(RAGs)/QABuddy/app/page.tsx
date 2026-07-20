"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Zap, Circle, ChevronDown, ChevronRight, Send, BookOpen, Sparkles, Search, BarChart3, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Source {
  id: string;
  name: string;
  count: number;
  chunks: number;
  color: string;
  enabled: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  mode?: string;
}

interface Citation {
  index: number;
  source: string;
  path: string;
  snippet: string;
}

const SOURCES: Source[] = [
  { id: "selenium", name: "Selenium Framework", count: 0, chunks: 0, color: "#22c55e", enabled: true },
  { id: "playwright", name: "Playwright Framework", count: 0, chunks: 0, color: "#8b5cf6", enabled: true },
  { id: "testcases", name: "Test Cases", count: 0, chunks: 0, color: "#f59e0b", enabled: true },
  { id: "jira", name: "JIRA Tickets", count: 0, chunks: 0, color: "#ef4444", enabled: true },
  { id: "docs", name: "Company Docs", count: 0, chunks: 0, color: "#3b82f6", enabled: true },
  { id: "figma", name: "Figma Designs", count: 0, chunks: 0, color: "#ec4899", enabled: false },
  { id: "meetings", name: "Meeting Notes", count: 0, chunks: 0, color: "#14b8a6", enabled: true },
  { id: "lucid", name: "Lucid Charts", count: 0, chunks: 0, color: "#06b6d4", enabled: false },
  { id: "prd", name: "PRD / SRS / BRD", count: 0, chunks: 0, color: "#f97316", enabled: true },
  { id: "jenkins", name: "Jenkins Logs", count: 0, chunks: 0, color: "#64748b", enabled: true },
];

const SUGGESTED_PROMPTS = [
  "What is KAN-1002 and why is it still flaky?",
  "Review test coverage for login module",
  "Generate test cases for checkout flow",
  "Why did Jenkins build #452 fail?",
  "Explain the Page Object pattern in our Selenium framework",
];

const FLOW_STEPS = [
  { num: 1, title: "Understand", desc: "Rewrite & expand the question into search variants" },
  { num: 2, title: "Search", desc: "Parallel dense + BM25 retrieval across all sources" },
  { num: 3, title: "Rank", desc: "Cross-encoder reranker picks the best 6 chunks" },
  { num: 4, title: "Answer", desc: "LLM generates cited response from grounded context" },
];

export default function Home() {
  const [sources, setSources] = useState<Source[]>(SOURCES);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalChunks, setTotalChunks] = useState(0);
  const [mode, setMode] = useState("auto");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setTotalChunks(data.total_chunks || 0);
      setSources((prev) =>
        prev.map((s) => {
          const found = (data.by_source || []).find((x: any) => x.id === s.id);
          return found ? { ...s, count: found.count, chunks: found.chunks } : s;
        })
      );
    } catch {}
  };

  const toggleSource = (id: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const toggleAll = (enabled: boolean) => {
    setSources((prev) => prev.map((s) => ({ ...s, enabled })));
  };

  const enabledSources = sources.filter((s) => s.enabled).map((s) => s.id);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          source_filter: enabledSources,
          mode: mode === "auto" ? undefined : mode,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
          mode: data.mode,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please check that the backend services are configured." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (ingesting) return;
    setIngesting(true);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      await fetchStats();
      alert(`Ingest complete! ${data.results?.length || 0} sources processed.`);
    } catch (e: any) {
      alert(`Ingest error: ${e.message}`);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-cream-100 text-ink-900">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-cream-300 bg-cream-50 transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-cream-300 px-4 py-3">
          <BookOpen className="h-4 w-4 text-terracotta-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-800">Knowledge Base</span>
        </div>

        <div className="flex-1 overflow-auto p-3 scrollbar-thin">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xxs uppercase tracking-wider text-ink-800/60">Sources</span>
            <div className="flex gap-1">
              <button onClick={() => toggleAll(true)} className="text-xxs text-terracotta-500 hover:underline">All</button>
              <button onClick={() => toggleAll(false)} className="text-xxs text-ink-800/40 hover:underline">None</button>
            </div>
          </div>

          <div className="space-y-1">
            {sources.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSource(s.id)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  s.enabled ? "bg-cream-200/60" : "opacity-50"
                }`}
              >
                <Circle className="h-2.5 w-2.5 fill-current" style={{ color: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-medium">{s.name}</div>
                  <div className="text-xxs text-ink-800/40">
                    {s.count} files · {s.chunks} chunks
                  </div>
                </div>
                {s.enabled ? <ChevronDown className="h-3 w-3 text-ink-800/30" /> : <ChevronRight className="h-3 w-3 text-ink-800/30" />}
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-cream-300 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Total Chunks</span>
              <span className="text-xs font-mono text-terracotta-500">{totalChunks.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xxs uppercase tracking-wider text-ink-800/60">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mt-1 w-full rounded border border-cream-300 bg-cream-50 px-2 py-1 text-xs outline-none focus:border-terracotta-400"
            >
              <option value="auto">Auto-detect</option>
              <option value="answer">Answer</option>
              <option value="generate">Generate</option>
              <option value="review">Review</option>
              <option value="rca">RCA</option>
            </select>
          </div>

          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded border border-terracotta-400 bg-terracotta-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-terracotta-600 disabled:opacity-50"
          >
            <Zap className={`h-3 w-3 ${ingesting ? "animate-pulse" : ""}`} />
            {ingesting ? "Ingesting..." : "Ingest Now"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-cream-300 bg-cream-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded p-1 hover:bg-cream-200"
            >
              <BookOpen className="h-4 w-4 text-ink-800" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-terracotta-500" />
              <div>
                <h1 className="text-sm font-bold tracking-tight">QABuddy.AI</h1>
                <p className="text-xxs uppercase tracking-widest text-ink-800/50">Hybrid RAG for QA</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-cream-300 bg-cream-50 px-3 py-1">
              <span className="text-xxs text-ink-800/60">understand</span>
              <ArrowRight className="h-2.5 w-2.5 text-ink-800/30" />
              <span className="text-xxs text-ink-800/60">retrieve</span>
              <ArrowRight className="h-2.5 w-2.5 text-ink-800/30" />
              <span className="text-xxs text-ink-800/60">rerank</span>
              <ArrowRight className="h-2.5 w-2.5 text-ink-800/30" />
              <span className="text-xxs text-terracotta-500 font-medium">answer with sources</span>
            </div>
            <Link href="/architecture" className="text-xs text-terracotta-500 hover:underline">
              Architecture
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              <span className="text-xxs text-ink-800/50">Online</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10">
              {/* Hero Card */}
              <div className="w-full max-w-3xl rounded-lg border border-cream-300 bg-cream-50 p-6 shadow-sm">
                <h2 className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-ink-800/60">
                  How the Answer is Fetched
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {FLOW_STEPS.map((step) => (
                    <div key={step.num} className="rounded border border-cream-300 bg-cream-100 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-xxs font-bold text-white">
                          {step.num}
                        </span>
                        <span className="text-xs font-semibold">{step.title}</span>
                      </div>
                      <p className="text-xxs leading-relaxed text-ink-800/60">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Prompts */}
              <div className="mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs text-ink-800/70 hover:border-terracotta-400 hover:text-terracotta-600"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "border-terracotta-400/30 bg-terracotta-500/10 text-ink-900"
                        : "border-cream-300 bg-cream-50 text-ink-900"
                    }`}
                  >
                    {m.role === "assistant" && m.mode && (
                      <div className="mb-1.5">
                        <span className="inline-flex items-center rounded border border-terracotta-400/30 bg-terracotta-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-terracotta-600">
                          {m.mode}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 border-t border-cream-300 pt-2">
                        <div className="mb-1 text-xxs uppercase tracking-wider text-ink-800/40">Sources</div>
                        <div className="flex flex-wrap gap-1">
                          {m.citations.map((c) => (
                            <span
                              key={c.index}
                              className="inline-flex items-center gap-1 rounded border border-cream-300 bg-cream-100 px-1.5 py-0.5 text-[10px] text-terracotta-600"
                              title={`${c.source} | ${c.path}`}
                            >
                              [{c.index}] {c.source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg border border-cream-300 bg-cream-50 px-4 py-3 text-sm text-ink-800/50">
                    <Sparkles className="h-4 w-4 animate-pulse text-terracotta-500" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-4 border-t border-cream-300 bg-cream-50 px-4 py-1.5">
          <span className="text-xxs text-ink-800/40">llm openai/gpt-oss-120b</span>
          <span className="text-xxs text-ink-800/20">|</span>
          <span className="text-xxs text-ink-800/40">embed BAAI/bge-m3</span>
        </div>

        {/* Composer */}
        <div className="border-t border-cream-300 bg-cream-50 px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Ask anything — tests, bugs, frameworks, failures, docs..."
              className="flex-1 resize-none rounded-lg border border-cream-300 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-800/30 outline-none focus:border-terracotta-400"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-terracotta-500 text-white hover:bg-terracotta-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mx-auto mt-1 max-w-3xl text-center text-[10px] text-ink-800/30">
            Press Enter to send. Shift+Enter for new line.
          </p>
        </div>
      </main>
    </div>
  );
}
