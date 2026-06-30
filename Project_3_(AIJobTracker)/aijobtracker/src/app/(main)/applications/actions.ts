'use server';

import { createClient } from '@/utils/supabase/server';
import { addApplication, updateApplication, deleteApplication, addInterview } from '@/lib/db';
import { applicationSchema, interviewSchema, type ApplicationFormValues, type InterviewFormValues } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createApplicationAction(values: ApplicationFormValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Validate values
  const parsed = applicationSchema.parse(values);

  try {
    // Add default values for required arrays/fields missing in the form schema
    const newApp = await addApplication(supabase, {
      ...parsed,
      jdLink: parsed.jdLink || '',
      location: parsed.location || '',
      salary: parsed.salary || '',
      appliedDate: parsed.appliedDate || new Date().toISOString().split('T')[0],
      resumeRef: parsed.resumeRef || '',
      notes: parsed.notes || '',
      recruiter: parsed.recruiter || '',
      source: parsed.source || '',
      referral: parsed.referral || '',
      applicationId: parsed.applicationId || '',
      tags: [],
    }, user.id);

    revalidatePath('/applications');
    revalidatePath('/board');
    revalidatePath('/');
    return { success: true, id: newApp.id };
  } catch (error) {
    console.error('Failed to create application:', error);
    return { success: false, error: 'Failed to create application' };
  }
}

export async function updateApplicationAction(id: string, values: Partial<ApplicationFormValues>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    await updateApplication(supabase, id, values, user.id);
    revalidatePath('/applications');
    revalidatePath(`/applications/${id}`);
    revalidatePath('/board');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update application:', error);
    return { success: false, error: 'Failed to update application' };
  }
}

export async function deleteApplicationAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    await deleteApplication(supabase, id, user.id);
    revalidatePath('/applications');
    revalidatePath('/board');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete application:', error);
    return { success: false, error: 'Failed to delete application' };
  }
}

export async function deleteInterviewAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    const { error } = await supabase.from('interviews').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/applications/[id]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete interview:', error);
    return { success: false, error: 'Failed to delete interview' };
  }
}

export async function addInterviewAction(values: InterviewFormValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const parsed = interviewSchema.parse(values);

  try {
    await addInterview(supabase, {
      applicationId: parsed.applicationId,
      round: parsed.round as any,
      mode: parsed.mode as any,
      date: parsed.date,
      time: parsed.time,
      interviewer: parsed.interviewer || '',
      link: parsed.link || '',
    }, user.id);

    revalidatePath('/applications/[id]', 'page');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    console.error('Failed to add interview:', error);
    return { success: false, error: 'Failed to add interview' };
  }
}
