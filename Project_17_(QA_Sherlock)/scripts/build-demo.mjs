import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('web', 'dist', { recursive: true });
cpSync('demo', 'dist/demo', { recursive: true });
writeFileSync('dist/config.js', `window.QA_SHERLOCK_API_URL = ${JSON.stringify(process.env.QA_SHERLOCK_API_URL || '')};\n`);
