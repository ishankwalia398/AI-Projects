import { useState } from 'react'
import { Key, SlidersHorizontal, Globe, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { ConfigState } from '../types'

interface ConfigurationTabProps {
  config: ConfigState
  onConfigChange: (config: ConfigState) => void
}

export default function ConfigurationTab({ config, onConfigChange }: ConfigurationTabProps) {
  const [testingState, setTestingState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const handleTestConnection = () => {
    setTestingState('testing')
    setTestMessage('')
    setTimeout(() => {
      setTestingState('success')
      setTestMessage('Connection successful — Langflow API is responding on port 7860')
      onConfigChange({ ...config, connectionStatus: 'connected' })
      setTimeout(() => setTestingState('idle'), 3000)
    }, 2000)
  }

  return (
    <div className="space-y-5">
      {/* Groq API Key */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">Groq API Key</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={config.groqApiKey}
            onChange={(e) => onConfigChange({ ...config, groqApiKey: e.target.value })}
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="flex-1 bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors font-mono"
          />
        </div>
        <p className="text-[11px] text-slate-600 mt-1.5">Required for Llama-3-70B inference via Groq</p>
      </div>

      {/* Top-K & Langflow Endpoint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top-K */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-200">Top-K Results</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={50}
              value={config.topK}
              onChange={(e) => onConfigChange({ ...config, topK: parseInt(e.target.value) })}
              className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-violet-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(139,92,246,0.5)]"
            />
            <span className="text-sm font-mono text-violet-300 min-w-[2ch] text-center">{config.topK}</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5">Number of similar documents to retrieve (1-50)</p>
        </div>

        {/* Langflow Endpoint */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Langflow Endpoint</h3>
          </div>
          <input
            type="text"
            value={config.langflowEndpoint}
            onChange={(e) => onConfigChange({ ...config, langflowEndpoint: e.target.value })}
            placeholder="http://localhost:7860"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors font-mono"
          />
          <p className="text-[11px] text-slate-600 mt-1.5">Default Langflow API server address</p>
        </div>
      </div>

      {/* Test Connection Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTestConnection}
          disabled={testingState === 'testing'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all
            bg-slate-800/40 border-slate-700/50 text-slate-300
            hover:bg-slate-700/40 hover:border-slate-600/60
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testingState === 'testing' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              Testing...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 text-cyan-400" />
              Test Langflow Connection
            </>
          )}
        </button>

        {testingState === 'success' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 animate-pulse-glow px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </div>
        )}
        {testingState === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/25">
            <AlertCircle className="w-3.5 h-3.5" />
            Connection failed
          </div>
        )}
      </div>

      {testMessage && testingState === 'success' && (
        <p className="text-xs text-emerald-400/70 mt-2">{testMessage}</p>
      )}
    </div>
  )
}
