// ============================================================
// AIJobTracker — Type Definitions
// ============================================================

// --- Enums ---

export enum ApplicationStatus {
  Wishlist = 'Wishlist',
  Applied = 'Applied',
  FollowUp = 'Follow-up',
  Interview = 'Interview',
  Offer = 'Offer',
  Rejected = 'Rejected',
}

export const STATUS_ORDER: ApplicationStatus[] = [
  ApplicationStatus.Wishlist,
  ApplicationStatus.Applied,
  ApplicationStatus.FollowUp,
  ApplicationStatus.Interview,
  ApplicationStatus.Offer,
  ApplicationStatus.Rejected,
];

export enum Priority {
  Urgent = 'Urgent',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export const PRIORITY_ORDER: Priority[] = [
  Priority.Urgent,
  Priority.High,
  Priority.Medium,
  Priority.Low,
];

export enum InterviewRound {
  HR = 'HR',
  Technical = 'Technical',
  Manager = 'Manager',
  Director = 'Director',
  Final = 'Final',
}

export enum InterviewMode {
  InPerson = 'In-Person',
  Video = 'Video',
  Phone = 'Phone',
}

// --- Core Data Types ---

export interface Application {
  id: string;
  company: string;
  role: string;
  jdLink: string;
  location: string;
  salary: string;
  status: ApplicationStatus;
  priority: Priority;
  tags: string[];
  appliedDate: string; // ISO date string
  resumeRef: string;
  notes: string;
  recruiter: string;
  source: string;
  referral: string;
  applicationId: string; // External application ID / tracking number
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface StatusTimelineEntry {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  changedAt: string; // ISO datetime
}

export interface Interview {
  id: string;
  applicationId: string;
  date: string; // ISO date
  time: string; // HH:mm
  mode: InterviewMode;
  link: string; // Meeting link
  interviewer: string;
  round: InterviewRound;
}

export interface ActivityLogEntry {
  id: string;
  applicationId: string | null;
  action: string;
  createdAt: string; // ISO datetime
}

export interface Settings {
  id: string; // always 'settings'
  darkMode: boolean;
  monthlyGoal: number;
}

// --- UI Helper Types ---

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  color: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof Application;
  direction: SortDirection;
}

export interface FilterConfig {
  status: ApplicationStatus[];
  priority: Priority[];
  tags: string[];
  dateRange: { start: string; end: string } | null;
  source: string;
  search: string;
}

// --- Color mappings ---

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.Wishlist]: '#8B5CF6',    // violet
  [ApplicationStatus.Applied]: '#3B82F6',     // blue
  [ApplicationStatus.FollowUp]: '#F59E0B',    // amber
  [ApplicationStatus.Interview]: '#06B6D4',   // cyan
  [ApplicationStatus.Offer]: '#10B981',       // emerald
  [ApplicationStatus.Rejected]: '#EF4444',    // red
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.Urgent]: '#EF4444',  // red
  [Priority.High]: '#F97316',    // orange
  [Priority.Medium]: '#F59E0B',  // amber
  [Priority.Low]: '#6B7280',     // gray
};
