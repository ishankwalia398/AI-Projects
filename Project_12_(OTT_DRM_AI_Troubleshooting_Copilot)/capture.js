const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High resolution (Retina quality)
  });
  const page = await context.newPage();

  const url = 'https://ott-drm-copilot.vercel.app/';
  await page.goto(url, { waitUntil: 'networkidle' });

  // 1. Full Landing / Home View
  await page.screenshot({ path: '01_full_overview.png', fullPage: true });

  // 2. Diagnose Tab
  const diagnoseNav = page.locator('a[href="#diagnose"]');
  if (await diagnoseNav.count()) {
    await diagnoseNav.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '02_diagnose_tab.png' });
  }

  // 3. Results / Report Tab
  const resultsNav = page.locator('a[href="#results"]');
  if (await resultsNav.count()) {
    await resultsNav.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '03_results_report_tab.png' });
  }

  // 4. Knowledge Tab
  const knowledgeNav = page.locator('a[href="#knowledge"]');
  if (await knowledgeNav.count()) {
    await knowledgeNav.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '04_knowledge_tab.png' });
  }

  console.log('Screenshots generated successfully!');
  await browser.close();
})();

