import 'dotenv/config';
const key = process.argv[2] || 'MTP-7061';
if (!/^[A-Z][A-Z0-9_]{1,19}-[1-9][0-9]{0,9}$/.test(key)) throw new Error('Pass a valid Jira key.');
const response = await fetch('https://qa-bug-triage-lc.vercel.app/api/ticket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.APP_ACCESS_TOKEN}` },
  body: JSON.stringify({ issueKey: key }), signal: AbortSignal.timeout(30000),
});
const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : {};
console.log(JSON.stringify({ status: response.status, keyMatches: body.ticket?.key === key, hasDescription: Boolean(body.ticket?.description), hasJiraLink: body.ticket?.url?.startsWith('https://') || false }));
if (!response.ok || body.ticket?.key !== key || !body.ticket?.url) process.exitCode = 1;
