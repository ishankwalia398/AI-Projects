import * as z from 'zod';
import { ApplicationStatus, Priority } from '@/types';

export const applicationSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role title is required'),
  jdLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  salary: z.string().optional(),
  status: z.nativeEnum(ApplicationStatus),
  priority: z.nativeEnum(Priority),
  appliedDate: z.string().optional(),
  resumeRef: z.string().optional(),
  notes: z.string().optional(),
  recruiter: z.string().optional(),
  source: z.string().optional(),
  referral: z.string().optional(),
  applicationId: z.string().optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;

export const interviewSchema = z.object({
  applicationId: z.string(),
  round: z.enum(['HR', 'Technical', 'Manager', 'Director', 'Final']),
  mode: z.enum(['In-Person', 'Video', 'Phone']),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  interviewer: z.string().optional(),
  link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type InterviewFormValues = z.infer<typeof interviewSchema>;

export const settingsSchema = z.object({
  darkMode: z.boolean(),
  monthlyGoal: z.coerce.number().min(1, 'Goal must be at least 1').max(500, 'Goal is too high'),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
