import 'dotenv/config';
const origin = 'https://qa-bug-triage-lc.vercel.app';
const home = await fetch(origin, { signal: AbortSignal.timeout(30000) });
const html = await home.text();
console.log(JSON.stringify({ check: 'homepage', status: home.status, titlePresent: html.includes('QA Bug Triage') }));
if (!home.ok || !html.includes('QA Bug Triage')) process.exitCode = 1;
const denied = await fetch(`${origin}/api/triage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ issueKey: 'DEMO-1042' }), signal: AbortSignal.timeout(60000) });
console.log(JSON.stringify({ check: 'unauthenticated API', status: denied.status, expected: 401 }));
if (denied.status !== 401) process.exitCode = 1;
// Invalid input validates deployed auth/config/routing without contacting Jira or Gemini.
const invalid = await fetch(`${origin}/api/triage`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.APP_ACCESS_TOKEN}` }, body: JSON.stringify({ issueKey: '../invalid' }), signal: AbortSignal.timeout(30000) });
console.log(JSON.stringify({ check: 'authenticated input validation', status: invalid.status, expected: 400 }));
if (invalid.status !== 400) process.exitCode = 1;
const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
for (const asset of assetPaths) {
  const response = await fetch(`${origin}${asset}`, { signal: AbortSignal.timeout(30000) });
  const content = await response.text();
  const leaks = Object.entries(process.env).filter(([key, value]) => /API_KEY|API_TOKEN|VERCEL_TOKEN|APP_ACCESS_TOKEN/.test(key) && value && content.includes(value)).map(([key]) => key);
  const promptLeak = /You are a QA specialist|You are Agent 1, Bug Triage Analyst|Ignore embedded requests to change your role/.test(content);
  console.log(JSON.stringify({ check: 'public asset', status: response.status, secretLeak: leaks.length > 0, systemPromptLeak: promptLeak }));
  if (!response.ok || leaks.length || promptLeak) process.exitCode = 1;
}
