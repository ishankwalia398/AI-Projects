import 'dotenv/config';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

const token = process.env.VERCEL_TOKEN;
if (!token) throw new Error('Add VERCEL_TOKEN to .env.');
if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) throw new Error('Add GEMINI_API_KEY, GOOGLE_API_KEY or GROQ_API_KEY to .env.');
const name = 'qa-bug-triage-lc';
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.vercel.com${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  if (!response.ok) { const error = new Error(`Vercel ${method} ${path.split('?')[0]} failed (${response.status}, ${data.error?.code || 'unknown'}).`); error.status = response.status; throw error; }
  return data;
}
const teams = (await api('/v2/teams')).teams;
const team = process.env.VERCEL_SCOPE ? teams.find(t => t.slug === process.env.VERCEL_SCOPE) : teams.length === 1 ? teams[0] : undefined;
if ((process.env.VERCEL_SCOPE && !team) || (!process.env.VERCEL_SCOPE && teams.length > 1)) throw new Error('Set VERCEL_SCOPE to the intended team slug in .env.');
const suffix = team ? `?teamId=${encodeURIComponent(team.id)}` : '';
let project;
try { project = await api(`/v9/projects/${name}${suffix}`); } catch (e) { if (e.status !== 404) throw e; project = await api(`/v11/projects${suffix}`, 'POST', { name, framework: 'vite', buildCommand: 'npm run build', outputDirectory: 'dist' }); }
if (!process.env.APP_ACCESS_TOKEN) {
  process.env.APP_ACCESS_TOKEN = randomBytes(24).toString('base64url');
  await appendFile('.env', `\n# Generated workspace password. Enter this in the app to run live triage.\nAPP_ACCESS_TOKEN=${process.env.APP_ACCESS_TOKEN}\n`);
  console.log('Generated workspace password and saved it to .env (value not logged).');
}
if (process.env.APP_ACCESS_TOKEN.length < 16) throw new Error('APP_ACCESS_TOKEN must contain at least 16 characters.');
const allowed = ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'GROQ_API_KEY', 'JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN', 'APP_ACCESS_TOKEN', 'JIRA_MCP_URL', 'JIRA_MCP_TOKEN', 'JIRA_MCP_TOOL', 'JIRA_MCP_ISSUE_ARG', 'JIRA_MCP_EXTRA_ARGS'];
const values = allowed.filter(key => process.env[key]).map(key => ({ key, value: process.env[key], type: 'encrypted', target: ['production'] }));
await api(`/v10/projects/${project.id}/env${suffix}${suffix ? '&' : '?'}upsert=true`, 'POST', values);
await mkdir('.vercel', { recursive: true });
await writeFile('.vercel/project.json', JSON.stringify({ projectId: project.id, orgId: project.accountId, projectName: name }));
function cli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/vercel/dist/index.js', ...args, '--token', token, ...(team ? ['--scope', team.slug] : [])], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    let output = '';
    const sanitize = value => {
      for (const [name, secret] of Object.entries(process.env)) {
        if (secret && /KEY|TOKEN|PASSWORD|SECRET/.test(name)) value = value.replaceAll(secret, '[REDACTED]');
      }
      return value;
    };
    // CLI failure suggestions can echo --token; buffer complete lines before redacting.
    let outBuffer = '', errBuffer = '';
    child.stdout.on('data', d => {
      output += d.toString(); outBuffer += d.toString();
      const lines = outBuffer.split('\n'); outBuffer = lines.pop();
      for (const line of lines) process.stdout.write(sanitize(line) + '\n');
    });
    child.stderr.on('data', d => {
      errBuffer += d.toString();
      const lines = errBuffer.split('\n'); errBuffer = lines.pop();
      for (const line of lines) process.stderr.write(sanitize(line) + '\n');
    });
    child.on('error', reject); child.on('exit', code => {
      if (outBuffer) process.stdout.write(sanitize(outBuffer));
      if (errBuffer) process.stderr.write(sanitize(errBuffer));
      code === 0 ? resolve(output.trim()) : reject(new Error(`Vercel CLI exited ${code}.`));
    });
  });
}
const output = await cli(['deploy', '--prod', '--yes']);
const urls = output.match(/https:\/\/[^\s]+\.vercel\.app/g);
if (!urls?.length) throw new Error('Deployment finished but no deployment URL was returned. Inspect Vercel.');
await cli(['alias', 'set', urls.at(-1), 'qa-bug-triage-lc.vercel.app']);
console.log('Published: https://qa-bug-triage-lc.vercel.app');
