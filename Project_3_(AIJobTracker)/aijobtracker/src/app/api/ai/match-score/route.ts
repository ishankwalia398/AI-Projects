import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateMatchScore } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobDescription, resumeText } = body;

    if (!jobDescription || !resumeText) {
      return NextResponse.json({ error: 'Missing jobDescription or resumeText' }, { status: 400 });
    }

    const result = await generateMatchScore(jobDescription, resumeText);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating match score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
