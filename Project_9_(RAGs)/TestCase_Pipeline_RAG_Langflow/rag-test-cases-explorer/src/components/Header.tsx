import { Database, Zap, ShieldCheck, Globe } from 'lucide-react'

interface HeaderProps {
  topK: number
}

export default function Header({ topK }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5 px-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/30">
            <Database className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            RAG Test Cases Explorer
          </h1>
        </div>
        <p className="text-sm text-slate-500 ml-12">
          Semantic search for test case documents &middot; AI-powered retrieval &amp; generation
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Top-K badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-xs font-medium text-violet-300">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          Top-K: {topK}
        </div>

        {/* Pipeline status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-medium text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Pipeline Ready
        </div>

        {/* Langflow badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-medium text-cyan-300">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Langflow Connected
        </div>

        {/* Groq badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-medium text-amber-300">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Groq Key Active
        </div>
      </div>
    </header>
  )
}
