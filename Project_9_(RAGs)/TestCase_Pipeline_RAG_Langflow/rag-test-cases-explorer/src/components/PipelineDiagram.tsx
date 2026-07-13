import { Upload, FileText, Layers, Database, Search, ChevronRight, Cpu, MessageSquare } from 'lucide-react'
import type { TabId } from '../types'

interface PipelineDiagramProps {
  activeTab: TabId
  onNodeClick: (tab: TabId) => void
}

interface PipelineNode {
  id: string
  label: string
  icon: React.ReactNode
  phase: 'ingestion' | 'retrieval'
  tab: TabId
  color: string
}

export default function PipelineDiagram({ activeTab, onNodeClick }: PipelineDiagramProps) {
  const ingestionNodes: PipelineNode[] = [
    {
      id: 'upload',
      label: 'Upload File',
      icon: <Upload className="w-4 h-4" />,
      phase: 'ingestion',
      tab: 'ingest',
      color: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-300',
    },
    {
      id: 'chunk',
      label: 'Chunk Text',
      icon: <FileText className="w-4 h-4" />,
      phase: 'ingestion',
      tab: 'ingest',
      color: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-300',
    },
    {
      id: 'embed',
      label: 'Embed Data',
      icon: <Layers className="w-4 h-4" />,
      phase: 'ingestion',
      tab: 'ingest',
      color: 'border-violet-500/40 bg-violet-500/8 text-violet-300',
    },
    {
      id: 'chroma',
      label: 'Store in Chroma',
      icon: <Database className="w-4 h-4" />,
      phase: 'ingestion',
      tab: 'ingest',
      color: 'border-violet-500/40 bg-violet-500/8 text-violet-300',
    },
  ]

  const retrievalNodes: PipelineNode[] = [
    {
      id: 'query',
      label: 'User Query',
      icon: <Search className="w-4 h-4" />,
      phase: 'retrieval',
      tab: 'query',
      color: 'border-sky-500/40 bg-sky-500/8 text-sky-300',
    },
    {
      id: 'retrieve',
      label: 'Retrieve Vectors',
      icon: <Database className="w-4 h-4" />,
      phase: 'retrieval',
      tab: 'query',
      color: 'border-violet-500/40 bg-violet-500/8 text-violet-300',
    },
    {
      id: 'generate',
      label: 'LLM Gen (Groq)',
      icon: <Cpu className="w-4 h-4" />,
      phase: 'retrieval',
      tab: 'query',
      color: 'border-amber-500/40 bg-amber-500/8 text-amber-300',
    },
    {
      id: 'results',
      label: 'Display Results',
      icon: <MessageSquare className="w-4 h-4" />,
      phase: 'retrieval',
      tab: 'query',
      color: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-300',
    },
  ]

  const isActive = (tab: TabId) => activeTab === tab

  return (
    <div className="bg-gradient-card border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
          Pipeline Architecture
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Ingestion
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Retrieval &amp; Gen
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ingestion Phase Row */}
        <div>
          <div className="text-[11px] font-medium text-emerald-400/70 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-8 h-px bg-emerald-500/30" />
            Phase 1: Ingestion
            <span className="flex-1 h-px bg-emerald-500/30" />
          </div>
          <div className="flex items-center gap-0">
            {ingestionNodes.map((node, i) => (
              <div key={node.id} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => onNodeClick(node.tab)}
                  className={`pipeline-step flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium w-full
                    ${isActive(node.tab)
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600/60 hover:text-slate-300'
                    }`}
                >
                  <span className={isActive(node.tab) ? 'text-emerald-400' : 'text-slate-500'}>
                    {node.icon}
                  </span>
                  <span className="truncate">{node.label}</span>
                </button>
                {i < ingestionNodes.length - 1 && (
                  <div className="flex-shrink-0 px-1">
                    <ChevronRight className={`w-4 h-4 ${isActive('ingest') ? 'text-emerald-500/60' : 'text-slate-700'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Retrieval Phase Row */}
        <div>
          <div className="text-[11px] font-medium text-amber-400/70 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-8 h-px bg-amber-500/30" />
            Phase 2: Retrieval &amp; Generation
            <span className="flex-1 h-px bg-amber-500/30" />
          </div>
          <div className="flex items-center gap-0">
            {retrievalNodes.map((node, i) => (
              <div key={node.id} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => onNodeClick(node.tab)}
                  className={`pipeline-step flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium w-full
                    ${isActive(node.tab)
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600/60 hover:text-slate-300'
                    }`}
                >
                  <span className={isActive(node.tab) ? 'text-amber-400' : 'text-slate-500'}>
                    {node.icon}
                  </span>
                  <span className="truncate">{node.label}</span>
                </button>
                {i < retrievalNodes.length - 1 && (
                  <div className="flex-shrink-0 px-1">
                    <ChevronRight className={`w-4 h-4 ${isActive('query') ? 'text-amber-500/60' : 'text-slate-700'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
