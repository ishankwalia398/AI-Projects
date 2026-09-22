import 'dotenv/config';
for (const path of ['/v2/user', '/v9/projects?limit=1', '/v2/teams']) {
  const r = await fetch(`https://api.vercel.com${path}`, { headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` }, signal: AbortSignal.timeout(20000) });
  const data = await r.json();
  let message = String(data.error?.message || '');
  if (process.env.VERCEL_TOKEN) message = message.replaceAll(process.env.VERCEL_TOKEN, '[REDACTED]');
  console.log(JSON.stringify({ endpoint: path, status: r.status, code: data.error?.code, message: message.slice(0, 300) }));
}
