import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}
const token = env.VERCEL_TOKEN;
if (!token) throw new Error('VERCEL_TOKEN is missing from the task .env');
const headers = { Authorization: `Bearer ${token}` };
const metadataPath = path.join(root, 'deployment.json');
const previous = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : null;
const scope = env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : '';
async function api(endpoint, options = {}) {
  const response = await fetch(`https://api.vercel.com${endpoint}${scope ? (endpoint.includes('?') ? '&' : '?') + scope.slice(1) : ''}`, {
    ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  if (!response.ok) {
    let message = data.error?.message || response.statusText;
    for (const value of Object.values(env)) if (value) message = message.replaceAll(value, '[redacted]');
    throw new Error(`Vercel ${response.status}: ${message}`);
  }
  return data;
}
let deployment;
if (process.argv.includes('--status')) {
  if (!previous?.id) throw new Error('No saved deployment to inspect');
  deployment = await api(`/v13/deployments/${previous.id}`);
} else if (process.argv.includes('--logs')) {
  const events = await api(`/v3/deployments/${previous.id}/events`);
  for (const event of events) {
    let line = event.text || event.payload?.text || '';
    for (const value of Object.values(env)) if(value) line=line.replaceAll(value,'[redacted]');
    if(line) console.log(line);
  }
  process.exit(0);
} else {
  if (!previous?.projectId) throw new Error('Existing Vercel project metadata is required');
  if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is required for live runs');
  await api(`/v10/projects/${previous.projectId}/env?upsert=true`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify([{key:'GROQ_API_KEY',value:env.GROQ_API_KEY,type:'encrypted',target:['production']},
      ...['CHATBOT_MODEL','RAG_MODEL','JUDGE_MODEL'].filter(k=>env[k]).map(key=>({key,value:env[key],type:'plain',target:['production']}))])
  });
  await api(`/v9/projects/${previous.projectId}`, {method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({framework:'fastapi',buildCommand:null,outputDirectory:null,installCommand:null})});
  const selected = ['app.py','hosted.py','requirements.txt','.python-version','vercel.json',
    'dist/how-it-works.html','01_Chatbot_Shopeasy_chatbot/01_chatbot/backend/app.py'];
  function collect(relative, allow){
    for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){
      const name=relative+'/'+entry.name;
      if(entry.isDirectory() && !['__pycache__','snapshot','tests'].includes(entry.name)) collect(name,allow);
      else if(entry.isFile() && allow(name)) selected.push(name);
    }
  }
  collect('03_DeepFramework',name=> /\.(py|html|css)$/.test(name));
  collect('02_RAG_Explorer/02_rag_explorer/data/ecommerce',name=>name.endsWith('.md'));
  const payloads = selected.map(file=>({file,content:fs.readFileSync(path.join(root,file))}));
  for (const { file, content } of payloads) {
    for (const value of Object.values(env)) {
      if (value.length >= 12 && content.includes(Buffer.from(value))) throw new Error(`Secret detected in ${file}`);
    }
  }
  const files = [];
  for (const { file, content } of payloads) {
    const sha = crypto.createHash('sha1').update(content).digest('hex');
    await api('/v2/files', { method: 'POST', headers: {
      'Content-Type': 'application/octet-stream', 'x-vercel-digest': sha,
    }, body: content });
    files.push({ file, sha, size: content.length });
  }
  deployment = await api('/v13/deployments', { method: 'POST', headers: {
    'Content-Type': 'application/json',
  }, body: JSON.stringify({
    name: 'deepeval-lab-task-06-sep1', target: 'production', files,
    ...(previous?.projectId ? { project: previous.projectId } : {}),
    projectSettings: { framework: 'fastapi', buildCommand: null, outputDirectory: null, installCommand: null },
  }) });
}
const metadata = {
  id: deployment.id, projectId: deployment.projectId,
  url: `https://${deployment.url}`, state: deployment.readyState || deployment.status,
  aliases: deployment.alias || [],
};
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify(metadata, null, 2));
