// ============================================================
// AIJobTracker — Supabase Database Layer
// ============================================================

import { type SupabaseClient } from '@supabase/supabase-js';
import {
  type Application,
  type StatusTimelineEntry,
  type Interview,
  type ActivityLogEntry,
  type Settings,
  ApplicationStatus,
  Priority,
} from '@/types';

// ============================================================
// Applications CRUD
// ============================================================

export async function getAllApplications(supabase: SupabaseClient): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapDbToApplication);
}

export async function getApplication(supabase: SupabaseClient, id: string): Promise<Application | undefined> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? mapDbToApplication(data) : undefined;
}

export async function addApplication(
  supabase: SupabaseClient,
  data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
  userId: string
): Promise<Application> {
  const dbPayload = {
    company: data.company,
    role: data.role,
    jd_link: data.jdLink,
    location: data.location,
    salary: data.salary,
    status: data.status,
    priority: data.priority,
    tags: data.tags || [],
    applied_date: data.appliedDate,
    resume_ref: data.resumeRef,
    notes: data.notes,
    recruiter: data.recruiter,
    source: data.source,
    referral: data.referral,
    application_id: data.applicationId,
    user_id: userId
  };

  const { data: newApp, error } = await supabase
    .from('applications')
    .insert([dbPayload])
    .select()
    .single();

  if (error) throw error;
  
  const app = mapDbToApplication(newApp);

  // Log the initial status
  await addStatusTimelineEntry(supabase, app.id, app.status, userId);
  await addActivityLogEntry(supabase, app.id, `Created application for ${app.role} at ${app.company}`, userId);

  return app;
}

export async function updateApplication(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Application>,
  userId: string
): Promise<Application | undefined> {
  const existing = await getApplication(supabase, id);
  if (!existing) return undefined;

  const oldStatus = existing.status;
  
  const dbPayload: any = {
    updated_at: new Date().toISOString()
  };
  if (data.company !== undefined) dbPayload.company = data.company;
  if (data.role !== undefined) dbPayload.role = data.role;
  if (data.jdLink !== undefined) dbPayload.jd_link = data.jdLink;
  if (data.location !== undefined) dbPayload.location = data.location;
  if (data.salary !== undefined) dbPayload.salary = data.salary;
  if (data.status !== undefined) dbPayload.status = data.status;
  if (data.priority !== undefined) dbPayload.priority = data.priority;
  if (data.tags !== undefined) dbPayload.tags = data.tags;
  if (data.appliedDate !== undefined) dbPayload.applied_date = data.appliedDate;
  if (data.resumeRef !== undefined) dbPayload.resume_ref = data.resumeRef;
  if (data.notes !== undefined) dbPayload.notes = data.notes;
  if (data.recruiter !== undefined) dbPayload.recruiter = data.recruiter;
  if (data.source !== undefined) dbPayload.source = data.source;
  if (data.referral !== undefined) dbPayload.referral = data.referral;
  if (data.applicationId !== undefined) dbPayload.application_id = data.applicationId;

  const { data: updatedApp, error } = await supabase
    .from('applications')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const app = mapDbToApplication(updatedApp);

  // Log status change if changed
  if (data.status && data.status !== oldStatus) {
    await addStatusTimelineEntry(supabase, id, data.status, userId);
    await addActivityLogEntry(supabase, id, `Status changed from ${oldStatus} to ${data.status}`, userId);
  }

  return app;
}

export async function deleteApplication(supabase: SupabaseClient, id: string, userId: string): Promise<void> {
  const app = await getApplication(supabase, id);
  if (!app) return;

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await addActivityLogEntry(supabase, null, `Deleted application for ${app.role} at ${app.company}`, userId);
}

// ============================================================
// Status Timeline
// ============================================================

export async function getStatusTimeline(supabase: SupabaseClient, applicationId: string): Promise<StatusTimelineEntry[]> {
  const { data, error } = await supabase
    .from('status_timeline')
    .select('*')
    .eq('application_id', applicationId)
    .order('changed_at', { ascending: false });

  if (error) throw error;
  return data.map(mapDbToStatusTimelineEntry);
}

export async function addStatusTimelineEntry(
  supabase: SupabaseClient,
  applicationId: string,
  status: ApplicationStatus,
  userId: string
): Promise<StatusTimelineEntry> {
  const { data, error } = await supabase
    .from('status_timeline')
    .insert([{ application_id: applicationId, status, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return mapDbToStatusTimelineEntry(data);
}

// ============================================================
// Interviews
// ============================================================

export async function getInterviews(supabase: SupabaseClient, applicationId: string): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('application_id', applicationId)
    .order('date', { ascending: true });

  if (error) throw error;
  return data.map(mapDbToInterview);
}

export async function getAllInterviews(supabase: SupabaseClient): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*');

  if (error) throw error;
  return data.map(mapDbToInterview);
}

export async function addInterview(
  supabase: SupabaseClient,
  data: Omit<Interview, 'id'>,
  userId: string
): Promise<Interview> {
  const { data: interview, error } = await supabase
    .from('interviews')
    .insert([{ ...data, user_id: userId }])
    .select()
    .single();

  if (error) throw error;

  await addActivityLogEntry(supabase, data.applicationId, `Added ${data.round} interview on ${data.date}`, userId);
  return mapDbToInterview(interview);
}

export async function updateInterview(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Interview>
): Promise<Interview | undefined> {
  const { data: updated, error } = await supabase
    .from('interviews')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return updated ? mapDbToInterview(updated) : undefined;
}

export async function deleteInterview(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// Activity Log
// ============================================================

export async function getActivityLog(supabase: SupabaseClient, limit: number = 50): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(mapDbToActivityLogEntry);
}

export async function getApplicationActivityLog(supabase: SupabaseClient, applicationId: string): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapDbToActivityLogEntry);
}

export async function addActivityLogEntry(
  supabase: SupabaseClient,
  applicationId: string | null,
  action: string,
  userId: string
): Promise<ActivityLogEntry> {
  const { data, error } = await supabase
    .from('activity_log')
    .insert([{ application_id: applicationId, action, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return mapDbToActivityLogEntry(data);
}

// ============================================================
// Settings
// ============================================================

export async function getSettings(supabase: SupabaseClient, userId: string): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  if (!data) {
    // Return default if not found (though trigger should handle this)
    return {
      id: userId,
      darkMode: false,
      monthlyGoal: 20,
    };
  }

  return {
    id: data.user_id,
    darkMode: data.dark_mode,
    monthlyGoal: data.monthly_goal,
  };
}

export async function updateSettings(supabase: SupabaseClient, userId: string, data: Partial<Settings>): Promise<Settings> {
  const updateData: any = {};
  if (data.darkMode !== undefined) updateData.dark_mode = data.darkMode;
  if (data.monthlyGoal !== undefined) updateData.monthly_goal = data.monthlyGoal;

  const { data: updated, error } = await supabase
    .from('settings')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: updated.user_id,
    darkMode: updated.dark_mode,
    monthlyGoal: updated.monthly_goal,
  };
}

// ============================================================
// Helper: Create a default new application
// ============================================================

export function createDefaultApplication(): Omit<Application, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    company: '',
    role: '',
    jdLink: '',
    location: '',
    salary: '',
    status: ApplicationStatus.Wishlist,
    priority: Priority.Medium,
    tags: [],
    appliedDate: new Date().toISOString().split('T')[0],
    resumeRef: '',
    notes: '',
    recruiter: '',
    source: '',
    referral: '',
    applicationId: '',
  };
}

// ============================================================
// Storage (Resumes)
// ============================================================

export async function uploadResume(supabase: SupabaseClient, file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('resumes')
    .upload(fileName, file, { upsert: true });

  if (error) throw error;
  return fileName;
}

export function getResumeUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from('resumes').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// Bulk Insert (CSV)
// ============================================================

export async function bulkInsertApplications(
  supabase: SupabaseClient,
  applications: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[],
  userId: string
): Promise<void> {
  const payload = applications.map(app => ({
    company: app.company,
    role: app.role,
    jd_link: app.jdLink,
    location: app.location,
    salary: app.salary,
    status: app.status,
    priority: app.priority,
    tags: app.tags || [],
    applied_date: app.appliedDate,
    resume_ref: app.resumeRef,
    notes: app.notes,
    recruiter: app.recruiter,
    source: app.source,
    referral: app.referral,
    application_id: app.applicationId,
    user_id: userId,
  }));

  const { data: newApps, error } = await supabase
    .from('applications')
    .insert(payload)
    .select();

  if (error) throw error;

  // Log activity for bulk insert
  await addActivityLogEntry(supabase, null, `Bulk imported ${applications.length} applications`, userId);

  // Note: For large bulk inserts, inserting individual timeline entries might be slow, 
  // but we can try to do a bulk insert into timeline as well.
  if (newApps && newApps.length > 0) {
    const timelinePayload = newApps.map((app: any) => ({
      application_id: app.id,
      status: app.status,
      user_id: userId,
    }));
    await supabase.from('status_timeline').insert(timelinePayload);
  }
}

// ============================================================
// Mapping Helpers
// ============================================================

export function mapDbToApplication(row: any): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    jdLink: row.jd_link || '',
    location: row.location || '',
    salary: row.salary || '',
    status: row.status,
    priority: row.priority,
    tags: row.tags || [],
    appliedDate: row.applied_date || '',
    resumeRef: row.resume_ref || '',
    notes: row.notes || '',
    recruiter: row.recruiter || '',
    source: row.source || '',
    referral: row.referral || '',
    applicationId: row.application_id || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDbToActivityLogEntry(row: any): ActivityLogEntry {
  return {
    id: row.id,
    applicationId: row.application_id,
    action: row.action,
    createdAt: row.created_at,
  };
}

export function mapDbToStatusTimelineEntry(row: any): StatusTimelineEntry {
  return {
    id: row.id,
    applicationId: row.application_id,
    status: row.status,
    changedAt: row.changed_at,
  };
}

export function mapDbToInterview(row: any): Interview {
  return {
    id: row.id,
    applicationId: row.application_id,
    date: row.date,
    time: row.time,
    mode: row.mode,
    link: row.link || '',
    interviewer: row.interviewer || '',
    round: row.round,
  };
}
