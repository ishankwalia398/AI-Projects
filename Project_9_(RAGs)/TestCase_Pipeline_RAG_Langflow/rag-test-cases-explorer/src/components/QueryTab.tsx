import { useState } from 'react'
import { Search, SlidersHorizontal, Loader2, Table2, MessageSquare, CheckCircle2, XCircle, AlertTriangle, Cpu } from 'lucide-react'
import { simulateQueryResponse } from '../data/mockData'
import type { SearchResult } from '../types'

interface QueryTabProps {
  queryText: string
  onQueryTextChange: (val: string) => void
  searchType: 'similarity' | 'mmr'
  onSearchTypeChange: (val: 'similarity' | 'mmr') => void
  topK: number
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'passed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  if (status === 'failed') return <XCircle className="w-3.5 h-3.5 text-rose-400" />
  if (status === 'blocked') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
  return <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
    medium: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    low: 'bg-slate-500/10 border-slate-500/25 text-slate-400',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${colors[priority] || colors.low}`}>
      {priority}
    </span>
  )
}

export default function QueryTab({
  queryText, onQueryTextChange,
  searchType, onSearchTypeChange,
  topK,
}: QueryTabProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [activeResultTab, setActiveResultTab] = useState<'context' | 'synthesis'>('context')
  const [error, setError] = useState<string | null>(null)

  const handleExecute = async () => {
    if (!queryText.trim()) return
    setIsExecuting(true)
    setError(null)
    setResults(null)
    try {
      const res = await simulateQueryResponse(queryText, searchType, topK)
      setResults(res)
    } catch {
      setError('Query execution failed. Please check your connection and try again.')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Query Input Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-200">Natural Language Query</h3>
            </div>
            <textarea
              value={queryText}
              onChange={(e) => onQueryTextChange(e.target.value)}
              placeholder="e.g., Find all test cases related to payment checkout flow with high priority..."
              rows={3}
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Search Type & Execute */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Type</h3>
            </div>
            <select
              value={searchType}
              onChange={(e) => onSearchTypeChange(e.target.value as 'similarity' | 'mmr')}
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors appearance-none cursor-pointer"
            >
              <option value="similarity">Similarity</option>
              <option value="mmr">MMR</option>
            </select>
          </div>

          <button
            onClick={handleExecute}
            disabled={!queryText.trim() || isExecuting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              bg-gradient-to-r from-sky-600 to-violet-600 text-white
              hover:from-sky-500 hover:to-violet-500
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-[0_0_12px_rgba(125,211,252,0.12)]"
          >
            {isExecuting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Executing...</>
            ) : (
              <><Search className="w-4 h-4" /> Execute Pipeline Query</>
            )}
          </button>
        </div>
      </div>

      {/* Results Area */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {isExecuting && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          <p className="text-sm text-slate-500">Retrieving from Chroma &amp; generating with Groq...</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-violet-500/50 animate-dot-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {results && !isExecuting && (
        <div>
          {/* Result tabs */}
          <div className="flex gap-1 mb-3 border-b border-slate-800">
            <button
              onClick={() => setActiveResultTab('context')}
              className={`tab-btn flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all
                ${activeResultTab === 'context'
                  ? 'active text-violet-300 border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'}`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Retrieved Context Data Table
            </button>
            <button
              onClick={() => setActiveResultTab('synthesis')}
              className={`tab-btn flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-all
                ${activeResultTab === 'synthesis'
                  ? 'active text-amber-300 border-amber-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              LLM Final Synthesis Output
            </button>
          </div>

          {/* Context Data Table */}
          {activeResultTab === 'context' && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50 bg-slate-800/50">
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-400">Test Case ID</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-400">Description</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-400">Expected Result</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-slate-400">Status</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-slate-400">Priority</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-400">Relevance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.retrievedDocs.map((doc) => (
                      <tr key={doc.testCaseId} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-violet-300 font-medium">{doc.testCaseId}</td>
                        <td className="px-3 py-2.5 text-slate-300 max-w-[240px] truncate" title={doc.description}>
                          {doc.description}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 max-w-[200px] truncate" title={doc.expectedResult}>
                          {doc.expectedResult}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex justify-center">
                            <StatusBadge status={doc.status} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <PriorityBadge priority={doc.priority} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.round(doc.relevanceScore * 100)}%`,
                                  background: `linear-gradient(90deg, #a78bfa, #34d399)`,
                                }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 w-[3ch] text-right">
                              {Math.round(doc.relevanceScore * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 text-[10px] text-slate-600 border-t border-slate-800/50">
                Retrieved {results.retrievedDocs.length} documents &middot; Search type: {results.searchType.toUpperCase()} &middot; Top-K: {results.topK}
              </div>
            </div>
          )}

          {/* LLM Synthesis Output */}
          {activeResultTab === 'synthesis' && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-slate-200">Groq Llama-3 Response</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                  <span>{results.llmSynthesis.latencyMs}ms</span>
                  <span>{results.llmSynthesis.tokensUsed} tokens</span>
                  <span>{(results.llmSynthesis.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {results.llmSynthesis.answer.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-base font-bold text-slate-100 mt-4 mb-2">{line.replace('## ', '')}</h2>
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-sm font-semibold text-slate-200 mt-3 mb-1.5">{line.replace('### ', '')}</h3>
                    }
                    if (line.startsWith('- **')) {
                      return <li key={i} className="text-slate-300 ml-4 mb-1 list-disc">{line.replace('- ', '')}</li>
                    }
                    if (line.match(/^\d+\./)) {
                      return <li key={i} className="text-slate-300 ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>
                    }
                    if (line.trim() === '') return <br key={i} />
                    return <p key={i} className="text-slate-300 mb-1">{line}</p>
                  })}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/50 text-[10px] text-slate-600 italic">
                Model: {results.llmSynthesis.model} &middot; Response generated in {results.llmSynthesis.latencyMs}ms
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
