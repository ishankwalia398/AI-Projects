'use server';

import { createClient } from '@/utils/supabase/server';
import { getAllApplications, getInterviews, getStatusTimeline, addApplication, addInterview } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { type Application, type Interview, type StatusTimelineEntry } from '@/types';

export async function exportDataAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const applications = await getAllApplications(supabase);
  
  const applicationsWithDetails = await Promise.all(
    applications.map(async (app) => {
      const interviews = await getInterviews(supabase, app.id);
      const timeline = await getStatusTimeline(supabase, app.id);
      return {
        ...app,
        interviews,
        timeline,
      };
    })
  );

  return { success: true, data: applicationsWithDetails };
}

export async function importDataAction(importedData: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    for (const app of importedData) {
      // Clean up fields that shouldn't be blindly inserted or might cause issues
      const { id, user_id, created_at, updated_at, interviews, timeline, ...appData } = app;
      
      // We use the db.ts helper to insert the application which will also create the initial timeline event
      const newApp = await addApplication(supabase, appData as Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, user.id);

      if (interviews && Array.isArray(interviews)) {
        for (const interview of interviews) {
          const { id: iId, user_id: iUserId, application_id, ...interviewData } = interview;
          // Insert interview
          await addInterview(supabase, {
            ...interviewData,
            applicationId: newApp.id,
          } as Omit<Interview, 'id'>, user.id);
        }
      }
    }

    revalidatePath('/');
    revalidatePath('/applications');
    revalidatePath('/board');
    revalidatePath('/calendar');
    revalidatePath('/analytics');

    return { success: true };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: 'Failed to import data.' };
  }
}
