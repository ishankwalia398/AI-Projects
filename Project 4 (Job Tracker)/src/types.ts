export type StatusType = 'Wishlist' | 'Applied' | 'Follow-up' | 'Interview' | 'Offer' | 'Rejected';
export type PriorityType = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface User {
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  userId: string; // To support multi-user IndexedDB isolation
  company: string;
  role: string;
  jdLink?: string;
  jdText?: string; // Stored to run AI analysis
  location?: string;
  salary?: string;
  status: StatusType;
  priority: PriorityType;
  tags: string[];
  appliedDate: string; // YYYY-MM-DD
  resumeRef?: string;
  resumeText?: string; // Stored to run AI comparison
  notes?: string;
  recruiter?: string;
  source?: string;
  referral?: string;
  applicationId?: string; // QA / Reference Id
  createdAt: string;
  updatedAt: string;
}

export interface StatusTimeline {
  id: string;
  applicationId: string;
  status: StatusType;
  changedAt: string; // ISO Timestamp
}

export interface Interview {
  id: string;
  applicationId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  mode?: 'In-Person' | 'Zoom' | 'Google Meet' | 'Take-Home' | 'Phone' | 'Other';
  link?: string;
  interviewer?: string;
  round: 'HR' | 'Technical' | 'Manager' | 'Director' | 'Final' | 'Other';
}

export interface ActivityLog {
  id: string;
  userId: string;
  applicationId?: string;
  action: string;
  createdAt: string; // ISO Timestamp
}

export interface UserSettings {
  userId: string;
  darkMode: boolean;
  monthlyGoal: number;
}

export interface DashboardStats {
  totalApps: number;
  responseRate: number; // % of apps that moved pattern past Wishlist/Applied
  interviewRate: number; // % of apps that reached Interview
  offersCount: number;
  avgDaysToResponse: number; // days from Applied to next status
}
