import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { Upload, FileText, Layers, Database, CheckCircle2, Loader2, FileUp, X, ArrowRight } from 'lucide-react'
import { simulateIngestionProgress } from '../data/mockData'
import type { IngestionProgress } from '../types'

interface IngestionTabProps {
  textKeyColumn: string
  onTextKeyColumnChange: (val: string) => void
  chunkSize: number
  onChunkSizeChange: (val: number) => void
  chunkOverlap: number
  onChunkOverlapChange: (val: number) => void
}

const ACCEPTED_TYPES = '.csv,.json,.txt'

const steps: { key: IngestionProgress['step']; label: string; icon: React.ReactNode }[] = [
  { key: 'upload', label: 'Upload File', icon: <Upload className="w-3.5 h-3.5" /> },
  { key: 'chunk', label: 'Chunk Text', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'embed', label: 'Embed Data', icon: <Layers className="w-3.5 h-3.5" /> },
  { key: 'chroma', label: 'Store in Chroma', icon: <Database className="w-3.5 h-3.5" /> },
]

export default function IngestionTab({
  textKeyColumn, onTextKeyColumnChange,
  chunkSize, onChunkSizeChange,
  chunkOverlap, onChunkOverlapChange,
}: IngestionTabProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState<IngestionProgress[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) setFile(droppedFile)
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) setFile(selectedFile)
  }

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setIsComplete(false)
    await simulateIngestionProgress(setProgress)
    setIsProcessing(false)
    setIsComplete(true)
  }

  const getStepStatus = (stepKey: IngestionProgress['step']) => {
    if (isComplete) return 'completed'
    const found = progress.find((p) => p.step === stepKey)
    return found?.status ?? 'pending'
  }

  return (
    <div className="space-y-5">
      {/* File Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`drop-zone relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragOver
            ? 'border-violet-500/60 bg-violet-500/5'
            : file
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-slate-700/50 bg-slate-800/20 hover:border-slate-600/60'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          className="hidden"
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
              <FileUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">{file.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB &middot; Click to change file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/25 flex items-center justify-center mx-auto">
              <FileUp className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-sm text-slate-400">
              <span className="text-violet-400 font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-600">CSV, JSON, or Text files supported</p>
          </div>
        )}
      </div>

      {/* Ingestion Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Text Key Column</label>
          <input
            type="text"
            value={textKeyColumn}
            onChange={(e) => onTextKeyColumnChange(e.target.value)}
            placeholder="Test Case ID"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Chunk Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={chunkSize}
              onChange={(e) => onChunkSizeChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
            />
            <span className="text-sm font-mono text-emerald-300 min-w-[4ch]">{chunkSize}</span>
          </div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Chunk Overlap</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={500}
              step={50}
              value={chunkOverlap}
              onChange={(e) => onChunkOverlapChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
            />
            <span className="text-sm font-mono text-emerald-300 min-w-[4ch]">{chunkOverlap}</span>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleProcess}
          disabled={!file || isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
            bg-gradient-to-r from-emerald-600 to-emerald-500 text-white
            hover:from-emerald-500 hover:to-emerald-400
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-[0_0_12px_rgba(52,211,153,0.15)]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Process Complete
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Process and Store in Vector DB
            </>
          )}
        </button>

        {isComplete && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Stored in Chroma DB successfully
          </span>
        )}
      </div>

      {/* Progress Checklist */}
      {(progress.length > 0 || isComplete) && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ingestion Progress</h4>
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, i) => {
              const status = getStepStatus(step.key)
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300
                    ${status === 'completed'
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                      : status === 'in_progress'
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-400 animate-pulse'
                        : 'border-slate-700/50 bg-slate-800/50 text-slate-600'
                    }`}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : status === 'in_progress' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight
                    ${status === 'completed' ? 'text-emerald-400' : status === 'in_progress' ? 'text-amber-400' : 'text-slate-600'}`}>
                    {step.label}
                  </span>
                  {i < steps.length - 1 && (
                    <ArrowRight className={`w-3 h-3 -ml-1 -mr-1 ${status === 'completed' ? 'text-emerald-500/40' : 'text-slate-700'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
