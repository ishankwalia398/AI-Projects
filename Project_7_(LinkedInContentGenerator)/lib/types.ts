export type ContentStatus = 'Pending' | 'Writing' | 'Imaging' | 'Done' | 'Error';

export interface ContentRow {
  date: string;          // Format: YYYY-MM-DD
  topic: string;         // Generated topic title
  status: ContentStatus; // Pending -> Writing -> Imaging -> Done -> Error
  linkedInPost: string;  // LinkedIn post text (~150-200 words)
  linkedInImage: string; // Comma-separated paths of generated images (e.g. "/images/img-1.png,/images/img-2.png")
  lastUpdated?: string;  // ISO timestamp of last modification
  updatedBy?: string;    // The agent or action that performed the update
  errorLog?: string;     // Detailed error message if status is Error
}

export interface PipelineStatus {
  isRunning: boolean;
  currentStep: string;
  lastRunTime?: string;
  nextRunTime?: string;
  apiKeyHealth: {
    groq: boolean;
    gemini: boolean;
  };
}
