export interface TestCase {
  testCaseId: string
  description: string
  expectedResult: string
  status: 'passed' | 'failed' | 'blocked' | 'skipped' | 'untested'
  relevanceScore: number
  priority: 'high' | 'medium' | 'low'
}

export interface LLMResponse {
  answer: string
  model: string
  latencyMs: number
  tokensUsed: number
  confidence: number
}

export interface SearchResult {
  query: string
  searchType: 'similarity' | 'mmr'
  topK: number
  retrievedDocs: TestCase[]
  llmSynthesis: LLMResponse
}

export type TabId = 'config' | 'ingest' | 'query'

export type PipelineStep =
  | 'upload'
  | 'chunk'
  | 'embed'
  | 'chroma'
  | 'query_step'
  | 'retrieve'
  | 'generate'
  | 'results'

export interface IngestionProgress {
  step: PipelineStep
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
}

export interface ConfigState {
  groqApiKey: string
  topK: number
  langflowEndpoint: string
  connectionStatus: 'idle' | 'testing' | 'connected' | 'error'
}

export interface IngestionState {
  file: File | null
  textKeyColumn: string
  chunkSize: number
  chunkOverlap: number
  progress: IngestionProgress[]
  isProcessing: boolean
  isComplete: boolean
}

export interface QueryState {
  queryText: string
  searchType: 'similarity' | 'mmr'
  isExecuting: boolean
  results: SearchResult | null
  activeResultTab: 'context' | 'synthesis'
}
