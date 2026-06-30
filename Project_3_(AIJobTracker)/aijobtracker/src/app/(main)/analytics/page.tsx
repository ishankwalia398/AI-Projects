import { createClient } from '@/utils/supabase/server';
import { getAllApplications } from '@/lib/db';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const applications = await getAllApplications(supabase);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Gain insights into your job search performance.</p>
      </div>

      <AnalyticsCharts applications={applications} />
    </div>
  );
}
