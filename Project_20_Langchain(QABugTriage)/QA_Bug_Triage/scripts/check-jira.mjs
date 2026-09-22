import 'dotenv/config';
const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) throw new Error('Missing Jira credentials.');
const base = new URL(JIRA_BASE_URL);
if (base.protocol !== 'https:') throw new Error('Jira requires HTTPS.');
try {
  const response = await fetch(`${base.origin}/rest/api/3/myself`, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { Accept: 'application/json', Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}` } });
  console.log(JSON.stringify({ jiraAuthenticationStatus: response.status, authenticated: response.ok }));
  if (!response.ok) process.exitCode = 1;
} catch { console.error('Jira authentication check could not reach the configured server.'); process.exitCode = 1; }
