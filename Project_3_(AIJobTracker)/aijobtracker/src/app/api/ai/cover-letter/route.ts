import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateCoverLetter } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobDescription, resumeText, company, role } = body;

    if (!jobDescription || !resumeText || !company || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const coverLetter = await generateCoverLetter(jobDescription, resumeText, company, role);
    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
