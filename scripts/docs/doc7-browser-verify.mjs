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
const screenshots = path.join(out, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
await browser.defaultBrowserContext().overridePermissions(base, ['clipboard-read', 'clipboard-write']);

const states = [
  { name: 'desktop-light', width: 1440, height: 900, theme: 'light' },
  { name: 'desktop-system', width: 1024, height: 900, theme: 'system' },
  { name: 'tablet-dark', width: 768, height: 1024, theme: 'dark' },
  { name: 'mobile-light', width: 390, height: 844, theme: 'light' },
  { name: 'narrow-dark', width: 320, height: 760, theme: 'dark' },
  { name: 'reduced-system', width: 1440, height: 900, theme: 'system', reduced: true },
];

function expectedLocalMiss(row) {
  const url = new URL(row.url);
  return row.status === 404 && url.origin === new URL(base).origin &&
    (url.pathname === '/favicon.ico' || url.pathname === '/_vercel/speed-insights/script.js');
}

async function makePage(state) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: state.width, height: state.height });
  await page.evaluateOnNewDocument((theme) => {
    if (theme === 'system') localStorage.removeItem('apexify-theme');
    else localStorage.setItem('apexify-theme', theme);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => { window.__doc7Clipboard = String(text); },
        readText: async () => window.__doc7Clipboard || '',
      },
    });
  }, state.theme);
  const features = [];
  if (state.theme === 'system') features.push({ name: 'prefers-color-scheme', value: 'dark' });
  if (state.reduced) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  if (features.length) await page.emulateMediaFeatures(features);
  return page;
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
    return result.violations.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.length }));
  });
  const serious = axe.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  if (serious.length) throw new Error(`${state.name} ${routeName} serious axe ${JSON.stringify(serious)}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error(`${state.name} ${routeName} horizontal overflow`);
  if (state.reduced) {
    const motion = await page.evaluate(() => [...document.querySelectorAll('main *')].some((element) => {
      const style = getComputedStyle(element);
      const animations = style.animationDuration.split(',').map((value) => parseFloat(value) || 0);
      return Math.max(...animations, 0) > 0.01;
    }));
    if (motion) throw new Error(`${state.name} ${routeName} active main-content animation under reduced motion`);
  }

  const unexpectedHttp = httpErrors.filter((row) => !expectedLocalMiss(row));
  const onlyExpectedLocal404s = httpErrors.length > 0 && unexpectedHttp.length === 0 && httpErrors.every(expectedLocalMiss);
  const unexpectedConsole = consoleErrors.filter((message) => !(onlyExpectedLocal404s && message.includes('404')));
  if (unexpectedHttp.length || unexpectedConsole.length || pageErrors.length) {
    throw new Error(`${state.name} ${routeName} browser errors ${JSON.stringify({ unexpectedHttp, unexpectedConsole, pageErrors })}`);
  }
  return { route, status: 200, axeViolations: axe, seriousCriticalViolations: serious.length, horizontalOverflow: false };
}

const results = [];
try {
  for (const state of states) {
    const homePage = await makePage(state);
    const home = await auditRoute(homePage, '/', state, 'home');
    const canonical = await homePage.$eval('link[rel="canonical"]', (element) => element.href);
    if (canonical !== 'https://apexifyjs.vercel.app/') throw new Error(`${state.name} homepage canonical mismatch: ${canonical}`);
    if (!(await homePage.$('a[href="#main-content"]'))) throw new Error(`${state.name} homepage skip link missing`);
    if (!(await homePage.$('#main-content'))) throw new Error(`${state.name} homepage main landmark target missing`);
    if (!(await homePage.$('[data-doc7-verified-hero="node.chart.bar"]'))) throw new Error(`${state.name} verified homepage hero missing`);
    if (!(await homePage.$('[data-product-status="CURRENT"]'))) throw new Error(`${state.name} CURRENT status missing`);
    if (!(await homePage.$('[data-product-status="ROADMAP"]'))) throw new Error(`${state.name} ROADMAP status missing`);
    if ((await homePage.$$('[aria-labelledby="current-capabilities"] a')).length < 9) throw new Error(`${state.name} capability API links incomplete`);
    if ((await homePage.$$('[aria-labelledby="feature-tracks"] a')).length < 4) throw new Error(`${state.name} feature-track links incomplete`);
    if ((await homePage.$$('[aria-labelledby="verified-examples"] a[href^="/examples/"]')).length < 4) throw new Error(`${state.name} verified-example strip incomplete`);
    const copyButton = await homePage.$('button[aria-label="Copy Apexify.js install command"]');
    if (!copyButton) throw new Error(`${state.name} copy-install control missing`);
    await copyButton.focus();
    await homePage.keyboard.press('Enter');
    await homePage.waitForFunction(() => document.body.textContent?.includes('Copied'), { timeout: 3000 });
    const copiedCommand = await homePage.evaluate(() => window.__doc7Clipboard || '');
    if (!copiedCommand.includes('github:EIAS79/Apexify.js#')) throw new Error(`${state.name} copy-install did not copy the authoritative package pin`);
    const staleHome = await homePage.evaluate(() => document.body.textContent?.includes('v5.4.5') ?? false);
    if (staleHome) throw new Error(`${state.name} stale homepage version copy`);
    await homePage.screenshot({ path: path.join(screenshots, `${state.name}-home.png`), fullPage: true });
    await homePage.close();

    const galleryPage = await makePage(state);
    const gallery = await auditRoute(galleryPage, '/gallery', state, 'gallery');
    if (!(await galleryPage.$('a[href="#gallery-main"]'))) throw new Error(`${state.name} Gallery skip link missing`);
    if (!(await galleryPage.$('#gallery-main'))) throw new Error(`${state.name} Gallery main landmark target missing`);
    if (!(await galleryPage.$('section[aria-label="Gallery provenance and runtime filters"]'))) throw new Error(`${state.name} Gallery provenance controls missing`);
    if (!(await galleryPage.$('button[aria-label="Open search"]'))) throw new Error(`${state.name} Gallery search trigger missing`);
    const galleryText = await galleryPage.evaluate(() => document.body.textContent || '');
    if (galleryText.includes('v5.4.5')) throw new Error(`${state.name} stale Gallery version copy`);
    if (!galleryText.includes('Verified examples') || !galleryText.includes('Legacy gallery')) throw new Error(`${state.name} Gallery provenance explanation missing`);
    await galleryPage.screenshot({ path: path.join(screenshots, `${state.name}-gallery.png`), fullPage: true });
    await galleryPage.close();

    results.push({ name: state.name, home, gallery });
  }

  const keyboard = await makePage({ name: 'keyboard', width: 1200, height: 900, theme: 'light' });
  await keyboard.goto(`${base}/gallery`, { waitUntil: 'networkidle2' });
  const scopeButtons = await keyboard.$$('section[aria-label="Gallery provenance and runtime filters"] button');
  let verified = null;
  let node = null;
  for (const button of scopeButtons) {
    const text = await button.evaluate((element) => element.textContent?.trim() || '');
    if (text.startsWith('Verified')) verified = button;
    if (text === 'Node') node = button;
  }
  if (!verified || !node) throw new Error('Gallery runtime/evidence controls missing for keyboard verification');
  await node.focus();
  await keyboard.keyboard.press('Enter');
  await verified.focus();
  await keyboard.keyboard.press('Enter');
  await keyboard.waitForFunction(() => {
    const controls = [...document.querySelectorAll('section[aria-label="Gallery provenance and runtime filters"] button')];
    return controls.some((button) => button.textContent?.trim().startsWith('Verified') && button.getAttribute('aria-pressed') === 'true') &&
      controls.some((button) => button.textContent?.trim() === 'Node' && button.getAttribute('aria-pressed') === 'true');
  });

  const search = await keyboard.$('button[aria-label="Open search"]');
  await search.focus();
  await keyboard.keyboard.press('Enter');
  await keyboard.waitForSelector('[role="dialog"][aria-label="Search gallery"] input');
  await keyboard.type('[role="dialog"][aria-label="Search gallery"] input', 'chart');
  await keyboard.keyboard.press('Escape');
  await keyboard.waitForSelector('[role="dialog"][aria-label="Search gallery"]', { hidden: true });

  await keyboard.goto(`${base}/gallery#${encodeURIComponent('node.canvas.basic+advance')}`, { waitUntil: 'networkidle2' });
  await keyboard.waitForSelector('#gallery-modal-title');
  if (!(await keyboard.$('#gallery-modal-about a[href="/examples/node.canvas.basic"]'))) throw new Error('Gallery canonical DOC-5 example linkage missing');
  await keyboard.close();
} finally {
  await browser.close();
}

const evidence = {
  schemaVersion: 1,
  phase: 'DOC-7',
  states: results,
  keyboard: { installCopy: true, runtimeAndEvidenceCombined: true, searchDialog: true, canonicalExampleLinkage: true },
  screenshots: states.flatMap((state) => [`${state.name}-home.png`, `${state.name}-gallery.png`]),
  galleryCanonicalExampleLinkage: true,
};
fs.writeFileSync(path.join(out, 'browser.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log('[doc7-browser] PASS', JSON.stringify(evidence));
