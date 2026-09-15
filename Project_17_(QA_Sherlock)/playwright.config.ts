import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './demo', testMatch: 'regression.spec.ts',
  use: { baseURL: 'http://127.0.0.1:8765' },
  reporter: [['list'], ['json', { outputFile: 'runs/playwright-results.json' }]],
});
