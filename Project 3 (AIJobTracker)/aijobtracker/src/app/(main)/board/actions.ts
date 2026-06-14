'use server';

import { createClient } from '@/utils/supabase/server';
import { updateApplication } from '@/lib/db';
import { ApplicationStatus } from '@/types';
import { revalidatePath } from 'next/cache';

export async function updateApplicationStatus(applicationId: string, newStatus: ApplicationStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    await updateApplication(supabase, applicationId, { status: newStatus }, user.id);
    revalidatePath('/board');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update application status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
