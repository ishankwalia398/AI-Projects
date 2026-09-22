// Browser-only types. Runtime validation is performed by backend/schemas.py.
export type Ticket = { key: string; title: string; description: string; status: string; priority: string; components: string[]; url?: string | null; source: string; warnings: string[] };
export type Triage = { severity: string; priority: string; category: string; summary: string; severityReason: string; priorityReason: string; categoryReason: string; evidence: string[]; missingInformation: string[] };
export type RCA = { conclusion: string; status: string; hypotheses: { cause: string; confidence: number; evidence: string; killTest: string }[]; investigationSteps: string[]; blastRadius: string[]; limitations: string[] };
export type Strategy = { missingTest: string; verification: string; tests: { id: string; title: string; layer: string; type: string; steps: string[]; expected: string; rationale: string }[]; manualChecks: string[]; exitCriteria: string[] };
export type Report = { id: string; model: string; createdAt: string; durationMs: number; ticket: Ticket; triage: Triage; rca: RCA; strategy: Strategy };
