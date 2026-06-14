import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateInsights } from '@/lib/ai';
import { getAllApplications } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await getAllApplications(supabase);
    
    // To save tokens, we pass only essential info to the AI
    const slimApps = applications.map(a => ({
      role: a.role,
      company: a.company,
      status: a.status,
      appliedDate: a.appliedDate,
    }));

    const result = await generateInsights(slimApps);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
