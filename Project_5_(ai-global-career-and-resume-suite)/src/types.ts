export interface UserSession {
  email: string;
  name: string;
  isLoggedIn: boolean;
}

export type JobStatus = "OPEN" | "SELECTED FOR INTERVIEW" | "IN PROCESS" | "NOT SELECTED" | "CLOSED";
export type PriorityTag = "Urgent" | "High" | "Medium" | "Low";

export interface JobApplication {
  id: string;
  role: string;
  company: string;
  jobDescription: string;
  resumeText: string;
  dateApplied: string;
  status: JobStatus;
  priority: PriorityTag;
  createdAt: number; // For clearing out > 60 days
}

export interface SkillFinderData {
  name: string;
  role: string;
  yearsOfExperience: string;
  skillsExtracted: string[];
  certificationsExtracted: string[];
  top20Keywords: string[];
  commonJobTitles20: string[];
  highestPaidCertifications5: Array<{ name: string; averagePay: string }>;
  top6Countries: Array<{ country: string; region: string; openToIndians: string; visaTime: string }>;
  aiIntegration: {
    courses: string[];
    fearsAndThrivingStrategy: Array<{ threat: string; mitigation: string }>;
    longTermStrategy10Years: string;
  };
}

export interface ResumeScoreDetail {
  score: number;
  feedback: string;
}

export interface ResumeReviewData {
  scores: {
    overall: number;
    effectivity: ResumeScoreDetail;
    layout: ResumeScoreDetail;
    relevance: ResumeScoreDetail;
    grammar: ResumeScoreDetail;
    impact: ResumeScoreDetail;
  };
  keywordGaps: {
    matching: string[];
    missing: string[];
  };
  feedbackMarkdown: string;
  generatedResume: string;
}

export interface AtsPureReviewData {
  scores: {
    overall: number;
    effectivity: ResumeScoreDetail;
    layout: ResumeScoreDetail;
    relevance: ResumeScoreDetail;
    grammar: ResumeScoreDetail;
    impact: ResumeScoreDetail;
  };
  feedbackMarkdown: string;
  generatedResume: string;
}

export interface GeneratedLettersData {
  coverLetter: string;
  motivationalLetter: string;
}

export interface InterviewCheatSheetData {
  q1Answer: string;
  q2Answer: string;
  q3Answer: string;
  q4Answer: string;
  q5Questions: string;
}

export interface RegionData {
  companies: Array<{ num: number; name: string; url: string; type: string; benefits: string }>;
  agencies: Array<{ num: number; name: string; url: string; type: string; benefits: string }>;
}

export interface JobSearchResponse {
  regionsData: {
    [key: string]: RegionData;
  };
}
