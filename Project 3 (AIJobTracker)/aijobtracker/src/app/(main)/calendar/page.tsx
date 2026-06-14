import { createClient } from '@/utils/supabase/server';
import { InterviewCalendar, type InterviewWithApp } from '@/components/calendar/InterviewCalendar';

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch interviews joined with application details
  const { data, error } = await supabase
    .from('interviews')
    .select(`
      *,
      applications (
        company,
        role
      )
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  const interviews = (data || []) as unknown as InterviewWithApp[];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <p className="text-muted-foreground">Manage your interview schedule.</p>
      </div>

      <InterviewCalendar interviews={interviews} />
    </div>
  );
}
