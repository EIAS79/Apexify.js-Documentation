import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.env.DOC7_BASE_URL || 'http://127.0.0.1:3000';
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('[doc7-browser] CHROME_PATH required');
const out = path.join(process.cwd(), 'generated', 'docs-doc7', 'runtime');
fs.mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const states = [
  { name: 'desktop-light', width: 1440, height: 1000, theme: 'light' },
  { name: 'tablet-dark', width: 900, height: 1000, theme: 'dark' },
  { name: 'mobile-light', width: 390, height: 844, theme: 'light' },
  { name: 'narrow-dark', width: 320, height: 760, theme: 'dark' },
  { name: 'reduced-dark', width: 1440, height: 1000, theme: 'dark', reduced: true },
];

function expectedLocalMiss(row) {
  const url = new URL(row.url);
  return row.status === 404 && url.origin === new URL(base).origin &&
    (url.pathname === '/favicon.ico' || url.pathname === '/_vercel/speed-insights/script.js');
}

async function auditRoute(page, route, state, routeName) {
  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });

  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle2' });
  if (!response || response.status() !== 200) throw new Error(`${state.name} ${routeName} status ${response?.status()}`);

  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    }));
  });
  if (axe.length) throw new Error(`${state.name} ${routeName} axe ${JSON.stringify(axe)}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error(`${state.name} ${routeName} horizontal overflow`);

  if (state.reduced) {
    const motion = await page.evaluate(() =>
      [...document.querySelectorAll('main *')].some((element) => {
        const style = getComputedStyle(element);
        const animations = style.animationDuration.split(',').map((value) => parseFloat(value) || 0);
        return Math.max(...animations, 0) > 0.01;
      }),
    );
    if (motion) throw new Error(`${state.name} ${routeName} active main-content animation under reduced motion`);
  }

  const unexpectedHttp = httpErrors.filter((row) => !expectedLocalMiss(row));
  const onlyExpectedLocal404s = httpErrors.length > 0 && unexpectedHttp.length === 0 && httpErrors.every(expectedLocalMiss);
  const unexpectedConsole = consoleErrors.filter((message) => !(onlyExpectedLocal404s && message.includes('404')));
  if (unexpectedHttp.length || unexpectedConsole.length || pageErrors.length) {
    throw new Error(`${state.name} ${routeName} browser errors ${JSON.stringify({ unexpectedHttp, unexpectedConsole, pageErrors })}`);
  }

  return { route, status: 200, axeViolations: axe, horizontalOverflow: false };
}

const results = [];
try {
  for (const state of states) {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({ width: state.width, height: state.height });
    await page.evaluateOnNewDocument((theme) => localStorage.setItem('apexify-theme', theme), state.theme);
    if (state.reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

    const home = await auditRoute(page, '/', state, 'home');
    const canonical = await page.$eval('link[rel="canonical"]', (element) => element.href);
    if (canonical !== 'https://apexifyjs.vercel.app/') throw new Error(`${state.name} homepage canonical mismatch: ${canonical}`);
    if (!(await page.$('[data-doc7-verified-hero="node.chart.bar"]'))) throw new Error(`${state.name} verified homepage hero missing`);
    if (!(await page.$('[data-product-status="CURRENT"]'))) throw new Error(`${state.name} CURRENT status missing`);
    if (!(await page.$('[data-product-status="ROADMAP"]'))) throw new Error(`${state.name} ROADMAP status missing`);
    const staleHome = await page.evaluate(() => document.body.textContent?.includes('v5.4.5') ?? false);
    if (staleHome) throw new Error(`${state.name} stale homepage version copy`);

    const gallery = await auditRoute(page, '/gallery', state, 'gallery');
    if (!(await page.$('section[aria-label="Gallery provenance and runtime filters"]'))) throw new Error(`${state.name} Gallery provenance controls missing`);
    const galleryText = await page.evaluate(() => document.body.textContent || '');
    if (galleryText.includes('v5.4.5')) throw new Error(`${state.name} stale Gallery version copy`);
    if (!galleryText.includes('Verified examples') || !galleryText.includes('Legacy gallery')) {
      throw new Error(`${state.name} Gallery provenance explanation missing`);
    }

    results.push({ name: state.name, home, gallery });
    await page.close();
  }

  const keyboard = await browser.newPage();
  await keyboard.setViewport({ width: 1200, height: 900 });
  await keyboard.goto(`${base}/gallery`, { waitUntil: 'networkidle2' });
  const verifiedButton = await keyboard.$('button[aria-pressed="false"]');
  if (!verifiedButton) throw new Error('Gallery scope controls missing for keyboard verification');

  const buttons = await keyboard.$$('section[aria-label="Gallery provenance and runtime filters"] button');
  let target = null;
  for (const button of buttons) {
    const text = await button.evaluate((element) => element.textContent?.trim() || '');
    if (text.startsWith('Verified')) { target = button; break; }
  }
  if (!target) throw new Error('Verified evidence filter button missing');
  await target.focus();
  await keyboard.keyboard.press('Enter');
  await keyboard.waitForFunction(() => {
    const controls = [...document.querySelectorAll('section[aria-label="Gallery provenance and runtime filters"] button')];
    return controls.some((button) => button.textContent?.trim().startsWith('Verified') && button.getAttribute('aria-pressed') === 'true');
  });

  await keyboard.goto(`${base}/gallery#${encodeURIComponent('node.canvas.basic+advance')}`, { waitUntil: 'networkidle2' });
  await keyboard.waitForSelector('#gallery-modal-title');
  if (!(await keyboard.$('#gallery-modal-about a[href="/examples/node.canvas.basic"]'))) {
    throw new Error('Gallery canonical DOC-5 example linkage missing');
  }
  await keyboard.close();
} finally {
  await browser.close();
}

const evidence = {
  schemaVersion: 1,
  phase: 'DOC-7',
  states: results,
  keyboard: { evidenceFilter: true },
  galleryCanonicalExampleLinkage: true,
};
fs.writeFileSync(path.join(out, 'browser.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log('[doc7-browser] PASS', JSON.stringify(evidence));
