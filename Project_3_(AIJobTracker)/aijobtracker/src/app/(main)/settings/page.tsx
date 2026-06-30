import { createClient } from '@/utils/supabase/server';
import { getSettings } from '@/lib/db';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { DataManagementCard } from '@/components/settings/DataManagementCard';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const settings = await getSettings(supabase, user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <SettingsForm settings={settings} />

      <DataManagementCard />
    </div>
  );
}
