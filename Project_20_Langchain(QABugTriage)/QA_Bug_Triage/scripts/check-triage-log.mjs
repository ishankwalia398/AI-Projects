import 'dotenv/config';
import { spawn } from 'node:child_process';

const requestId = process.argv[2];
if (!/^[0-9a-f-]{36}$/i.test(requestId || '')) throw new Error('Pass the report reference UUID.');
const args = ['node_modules/vercel/dist/index.js', 'logs', '--project', 'qa-bug-triage-lc', '--environment', 'production', '--query', 'triage_failed', '--since', '24h', '--expand', '--limit', '100', '--no-branch', '--json', '--token', process.env.VERCEL_TOKEN];
if (process.env.VERCEL_SCOPE) args.push('--scope', process.env.VERCEL_SCOPE);
const result = await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve(stdout) : reject(new Error(`Vercel log lookup failed (${code}).`)));
});
let matched = 0;
let parsed = 0;
let shape = [];
for (const line of result.split(/\r?\n/)) {
  try {
    const item = JSON.parse(line);
    parsed++;
    if (!shape.length) shape = Object.keys(item);
    const message = String(item.message || item.text || '');
    if (!message.includes(requestId)) continue;
    const event = JSON.parse(message);
    if (event.requestId !== requestId || event.event !== 'triage_failed') continue;
    console.log(JSON.stringify({ phase: event.phase, errorType: event.errorType }));
    matched++;
  } catch { /* Ignore unrelated CLI output and requests. */ }
}
if (!matched) console.log(JSON.stringify({ note: 'No matching application error record was found in retained logs.', parsed, shape }));
