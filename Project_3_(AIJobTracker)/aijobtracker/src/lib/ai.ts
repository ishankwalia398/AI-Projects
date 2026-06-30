import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

export async function generateCoverLetter(jobDescription: string, resumeText: string, company: string, role: string) {
  const prompt = `You are an expert career coach and cover letter writer.
Write a professional, concise, and compelling cover letter for the role of ${role} at ${company}.
Use the provided job description and the candidate's resume/profile to tailor the letter.

Job Description:
${jobDescription}

Candidate Profile/Resume:
${resumeText}

Output only the cover letter content. Do not include placeholders for addresses unless strictly necessary.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

export async function generateMatchScore(jobDescription: string, resumeText: string) {
  const prompt = `You are an expert ATS (Applicant Tracking System) simulator.
Evaluate the candidate's resume against the provided job description.
Return a JSON object with the following fields:
- "score": A number from 0 to 100 representing the match percentage.
- "analysis": A short paragraph explaining the score.
- "missingKeywords": An array of important skills or keywords from the JD that are missing in the resume.
- "strengths": An array of key strengths the candidate has that match the JD.

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Output valid JSON only.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateInsights(applicationsList: any[]) {
  const prompt = `You are a career coach analyzing a job seeker's application pipeline.
Here is a list of their recent job applications (in JSON format):
${JSON.stringify(applicationsList, null, 2)}

Provide actionable, brief insights about their job search. Return a JSON object with the following fields:
- "summary": A 2-3 sentence overview of their current status (e.g., "You have a strong interview rate but are struggling to convert interviews to offers.").
- "recommendations": An array of 3 specific action items to improve their chances.
- "positives": An array of 2 things they are doing well.

Output valid JSON only.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateReadinessScore(applications: any[], monthlyGoal: number) {
  const appCount = applications.filter(a => new Date(a.appliedDate).getMonth() === new Date().getMonth()).length;
  
  const prompt = `Evaluate the job seeker's readiness. They have applied to ${appCount} jobs this month against a goal of ${monthlyGoal}.
Their pipeline consists of ${applications.length} total applications.

Return a JSON object with:
- "score": A number from 0 to 100 representing job search momentum.
- "feedback": One sentence of encouragement or advice.

Output valid JSON only.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
