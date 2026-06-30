'use server';

import { createClient } from '@/utils/supabase/server';
import { updateSettings } from '@/lib/db';
import { settingsSchema, type SettingsFormValues } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function updateSettingsAction(values: SettingsFormValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const parsed = settingsSchema.parse(values);

  try {
    await updateSettings(supabase, user.id, parsed);
    revalidatePath('/settings');
    revalidatePath('/'); // Goal tracking on dashboard
    return { success: true };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
