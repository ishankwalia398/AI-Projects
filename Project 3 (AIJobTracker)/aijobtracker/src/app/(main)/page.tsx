import { createClient } from '@/utils/supabase/server';
import { getAllApplications, getActivityLog, getSettings } from '@/lib/db';
import { StatCards } from '@/components/dashboard/StatCards';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { GoalTracker } from '@/components/dashboard/GoalTracker';
import { ApplicationStatus } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // Middleware handles redirect

  // Fetch all required data concurrently
  const [applications, activityLog, settings] = await Promise.all([
    getAllApplications(supabase),
    getActivityLog(supabase, 10),
    getSettings(supabase, user.id)
  ]);

  // Calculate metrics
  const totalApps = applications.length;
  const offers = applications.filter(a => a.status === ApplicationStatus.Offer).length;
  const interviews = applications.filter(a => 
    a.status === ApplicationStatus.Interview || a.status === ApplicationStatus.Offer
  ).length;

  const interviewRate = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;
  
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your job search pipeline.
        </p>
      </div>

      <StatCards 
        totalApps={totalApps} 
        interviewRate={interviewRate} 
        offers={offers} 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <StatusChart data={chartData} />
        </div>
        
        <div className="lg:col-span-3 space-y-6">
          <GoalTracker 
            currentApps={totalApps} 
            monthlyGoal={settings.monthlyGoal} 
          />
          <ActivityFeed activities={activityLog} />
        </div>
      </div>
    </div>
  );
}
