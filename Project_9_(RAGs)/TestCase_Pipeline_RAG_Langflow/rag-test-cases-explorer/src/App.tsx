import { useState } from 'react'
import { Settings, Database, Play } from 'lucide-react'
import Header from './components/Header'
import PipelineDiagram from './components/PipelineDiagram'
import ConfigurationTab from './components/ConfigurationTab'
import IngestionTab from './components/IngestionTab'
import QueryTab from './components/QueryTab'
import type { TabId, ConfigState } from './types'

type TabConfig = {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: TabConfig[] = [
  { id: 'config', label: 'Config & Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'ingest', label: 'Document Ingestion', icon: <Database className="w-4 h-4" /> },
  { id: 'query', label: 'Pipeline Playground', icon: <Play className="w-4 h-4" /> },
]

export default function App() {
  // Config state
  const [config, setConfig] = useState<ConfigState>({
    groqApiKey: '',
    topK: 10,
    langflowEndpoint: 'http://localhost:7860',
    connectionStatus: 'idle',
  })

  // Ingestion state
  const [textKeyColumn, setTextKeyColumn] = useState('Test Case ID')
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)

  // Query state
  const [queryText, setQueryText] = useState('')
  const [searchType, setSearchType] = useState<'similarity' | 'mmr'>('similarity')

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('config')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030712' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <Header topK={config.topK} />

        {/* Pipeline Diagram */}
        <div className="mb-5">
          <PipelineDiagram activeTab={activeTab} onNodeClick={setActiveTab} />
        </div>

        {/* Main Content Card */}
        <div className="bg-gradient-card border border-slate-800/60 rounded-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800/60">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all
                  ${activeTab === tab.id
                    ? 'active text-violet-300 border-violet-500 bg-violet-500/5'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeTab === 'config' && (
              <ConfigurationTab config={config} onConfigChange={setConfig} />
            )}

            {activeTab === 'ingest' && (
              <IngestionTab
                textKeyColumn={textKeyColumn}
                onTextKeyColumnChange={setTextKeyColumn}
                chunkSize={chunkSize}
                onChunkSizeChange={setChunkSize}
                chunkOverlap={chunkOverlap}
                onChunkOverlapChange={setChunkOverlap}
              />
            )}

            {activeTab === 'query' && (
              <QueryTab
                queryText={queryText}
                onQueryTextChange={setQueryText}
                searchType={searchType}
                onSearchTypeChange={setSearchType}
                topK={config.topK}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 pb-4 text-center text-[10px] text-slate-700">
          <span className="px-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/30">
            RAG Test Cases Explorer &middot; Langflow Pipeline &middot; Chroma DB + Groq
          </span>
        </footer>
      </div>
    </div>
  )
}
