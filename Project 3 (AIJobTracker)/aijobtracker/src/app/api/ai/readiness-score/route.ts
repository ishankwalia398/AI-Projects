import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateReadinessScore } from '@/lib/ai';
import { getAllApplications, getSettings } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await getAllApplications(supabase);
    const settings = await getSettings(supabase, user.id);
    
    const slimApps = applications.map(a => ({
      status: a.status,
      appliedDate: a.appliedDate,
    }));

    const result = await generateReadinessScore(slimApps, settings.monthlyGoal);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating readiness score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
