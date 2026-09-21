import puppeteer from 'puppeteer-core';

const base = process.env.STUDIO_VISUAL_BASE_URL || 'http://127.0.0.1:3000';
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('[studio-visual-shell] CHROME_PATH required');

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function verify(width, height) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width, height });
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
    localStorage.setItem('apexify-theme', 'dark');
  });

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const response = await page.goto(base + '/studio', { waitUntil: 'networkidle2' });
  if (!response || response.status() >= 400) throw new Error('Studio HTTP ' + response?.status());

  await page.waitForSelector('[data-studio-shell][data-studio-mode="code"]');
  await page.waitForSelector('.cm-editor');

  const original = await page.$eval('.cm-content', (node) => node.textContent || '');
  if (!original.includes('ApexPainter')) throw new Error('Code Studio starter source missing');

  await page.click('[data-studio-code-panel]:not([hidden]) [data-studio-mode-tab="visual"]');
  await page.waitForSelector('[data-studio-shell][data-studio-mode="visual"]');
  await page.waitForSelector('[data-studio-visual-workspace]');

  const visualText = await page.$eval('[data-studio-visual-workspace]', (node) => node.textContent || '');
  for (const label of ['Assets', 'Output', 'Diagnostics', 'History', 'Visual workspace ready']) {
    if (!visualText.includes(label)) throw new Error('Visual shell missing ' + label);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error(width + 'x' + height + ' horizontal overflow');

  await page.click('[data-studio-visual-panel]:not([hidden]) [data-studio-mode-tab="code"]');
  await page.waitForSelector('[data-studio-shell][data-studio-mode="code"]');

  const restored = await page.$eval('.cm-content', (node) => node.textContent || '');
  if (restored !== original) throw new Error('Code Studio session changed after mode round trip');

  // Phase 2: generated Visual code must fork into a new Code Studio buffer.
  await page.click('[data-studio-code-panel]:not([hidden]) [data-studio-mode-tab="visual"]');
  await page.waitForSelector('[data-studio-shell][data-studio-mode="visual"]');
  await page.click('.apx-vw-project-menu > summary');
  await page.waitForSelector('[data-visual-open-generated-code]:not([disabled])', { visible: true });
  await page.click('[data-visual-open-generated-code]');
  await page.waitForSelector('[data-studio-shell][data-studio-mode="code"]');

  await page.waitForFunction(() => {
    const content = document.querySelector('.cm-content')?.textContent || '';
    return content.includes('createCanvas') && content.includes('return canvas.buffer');
  });
  const generated = await page.$eval('.cm-content', (node) => node.textContent || '');
  if (!generated.includes("import { ApexPainter } from 'apexify.js'")) {
    throw new Error('Visual → Code handoff did not open generated Apexify source');
  }

  if (errors.length) throw new Error('page errors: ' + JSON.stringify(errors));

  await page.close();
}

await verify(1440, 900);
await verify(390, 844);

await browser.close();
console.log('[studio-visual-shell] PASS');
