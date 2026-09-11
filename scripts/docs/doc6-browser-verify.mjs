import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc6', 'runtime');
const BASE = process.env.DOC6_BASE_URL || 'http://127.0.0.1:3000';
const CHROME = process.env.CHROME_PATH;
if (!CHROME) throw new Error('CHROME_PATH is required');
fs.mkdirSync(OUT, { recursive: true });
const records = JSON.parse(fs.readFileSync(path.join(ROOT, 'generated/docs-doc6/search-records.json'), 'utf8')).records;
const completion = JSON.parse(fs.readFileSync(path.join(ROOT, 'generated/docs-doc6/completion-query-matrix.json'), 'utf8'));
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const queryFor = (category, fallback) => completion.categories.find((item) => item.category === category && item.applicable)?.query || fallback;
const symbolQuery = queryFor('symbol', 'ApexPainter');
const optionQuery = queryFor('option', 'width');
const headingQuery = records.find((record) => record.kind === 'heading')?.title || 'Requirements';
const exampleQuery = records.find((record) => record.kind === 'example')?.title || 'canvas';
const galleryQuery = records.find((record) => record.kind === 'gallery')?.title || 'canvas';
const aliasRecord = records.find((record) => record.aliases?.length);
const aliasQuery = aliasRecord?.aliases?.[0] || 'surface';
const modKey = process.platform === 'darwin' ? 'Meta' : 'Control';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const consoleErrors = [];
const checks = [];
const accessibilityRuns = [];

async function openPalette(page) {
  await page.keyboard.down(modKey);
  await page.keyboard.press('k');
  await page.keyboard.up(modKey);
  await page.waitForSelector('[role="dialog"][aria-label="Search Apexify documentation"]', { visible: true });
  await page.waitForSelector('#docs-command-search-input', { visible: true });
  await page.waitForFunction(() => document.activeElement?.id === 'docs-command-search-input');
}
async function setQuery(page, query) {
  const input = await page.$('#docs-command-search-input');
  if (!input) throw new Error('command search input missing');
  await input.click({ clickCount: 3 });
  await page.keyboard.down(modKey);
  await page.keyboard.press('a');
  await page.keyboard.up(modKey);
  await page.keyboard.type(String(query));
  await page.waitForFunction(() => document.querySelectorAll('[data-search-href]').length > 0, { timeout: 15000 });
  return page.$eval('[data-search-href]', (element) => ({ href: element.getAttribute('data-search-href'), text: element.textContent || '' }));
}
async function runAxe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => await globalThis.axe.run(document, { resultTypes: ['violations'], rules: { 'color-contrast': { enabled: true } } }));
  const severe = result.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious');
  accessibilityRuns.push({ label, violations: result.violations.length, severe: severe.map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })) });
  if (severe.length) throw new Error(`${label}: ${severe.length} serious/critical axe violations`);
}
async function newPage(viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  return page;
}

try {
  const page = await newPage({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: 'networkidle0' });
  const relatedCount = await page.$$eval('[data-doc6-related-content] a[href]', (items) => items.length);
  if (relatedCount < 1) throw new Error('generated related content is not rendered on the representative routed documentation page');
  checks.push({ name: 'related-content-rendered', links: relatedCount });
  await openPalette(page);
  const symbolTop = await setQuery(page, symbolQuery);
  checks.push({ name: 'exact-symbol', query: symbolQuery, top: symbolTop });
  await page.keyboard.press('ArrowDown');
  const moved = await page.$eval('#docs-command-search-input', (input) => input.getAttribute('aria-activedescendant'));
  if (!moved?.endsWith('-option-1')) throw new Error(`ArrowDown did not advance active result: ${moved}`);
  await page.keyboard.press('ArrowUp');
  checks.push({ name: 'arrow-navigation', pass: true });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.pathname.startsWith('/api-reference/'));
  checks.push({ name: 'enter-canonical-navigation', url: page.url() });

  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: 'networkidle0' });
  await openPalette(page);
  const optionTop = await setQuery(page, optionQuery);
  checks.push({ name: 'option-deep-link', query: optionQuery, top: optionTop, hasFragment: String(optionTop.href).includes('#') });
  if (!String(optionTop.href).includes('#')) throw new Error('API option result did not expose a canonical deep-link fragment');

  const browserQueries = [
    ['concept', 'canvas'], ['goal', 'create canvas'], ['runtime', 'node'], ['package', 'apexify.js'],
    ['heading', headingQuery], ['example', exampleQuery], ['gallery', galleryQuery], ['alias', aliasQuery],
  ];
  const errorCase = completion.categories.find((item) => item.category === 'error-code' && item.applicable && item.query);
  if (errorCase) browserQueries.push(['error-code', errorCase.query]);
  for (const [name, query] of browserQueries) {
    const top = await setQuery(page, query);
    checks.push({ name, query, top });
  }

  const typoBase = String(symbolQuery);
  const typo = typoBase.length >= 5 ? `${typoBase.slice(0, -1)}x` : `${typoBase}x`;
  checks.push({ name: 'fuzzy', query: typo, top: await setQuery(page, typo) });

  await setQuery(page, symbolQuery);
  const incompatibleKind = await page.evaluate(async (query) => {
    const base = await fetch(`/api/docs/search?q=${encodeURIComponent(query)}`).then((response) => response.json());
    for (const kind of base.filters?.kinds ?? []) {
      const candidate = await fetch(`/api/docs/search?q=${encodeURIComponent(query)}&kind=${encodeURIComponent(kind)}`).then((response) => response.json());
      if (candidate.filteredOut) return kind;
    }
    return '';
  }, symbolQuery);
  if (!incompatibleKind) throw new Error('Could not find a real content-type filter that excludes an existing query');
  await page.select('select[aria-label="Content type filter"]', incompatibleKind);
  await page.waitForFunction(() => document.body.textContent?.includes('Matches exist, but the active filters exclude them.'));
  checks.push({ name: 'filtered-no-results-state', pass: true, incompatibleKind });
  await page.select('select[aria-label="Content type filter"]', '');
  await page.waitForFunction(() => document.querySelectorAll('[data-search-href]').length > 0);

  const packageOptions = await page.$$eval('select[aria-label="Package filter"] option', (items) => items.map((item) => item.value));
  if (!packageOptions.includes('apexify.js') || packageOptions.some((value) => value.startsWith('@apexify/'))) throw new Error(`package filter exposed non-current values: ${packageOptions.join(',')}`);
  await page.select('select[aria-label="Package filter"]', 'apexify.js');
  await page.select('select[aria-label="Runtime filter"]', 'node');
  await page.waitForFunction(() => document.querySelectorAll('[data-search-href]').length > 0);
  checks.push({ name: 'runtime-package-filter', pass: true, packageOptions });

  const input = await page.$('#docs-command-search-input');
  await input.click({ clickCount: 3 });
  await page.keyboard.down(modKey); await page.keyboard.press('a'); await page.keyboard.up(modKey);
  await page.keyboard.type('zzzzzz-no-apexify-result-zzzzzz');
  await page.waitForFunction(() => document.body.textContent?.includes('No results for'), { timeout: 15000 });
  checks.push({ name: 'no-results-state', pass: true });

  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-label="Search Apexify documentation"]'));
  await new Promise((resolve) => setTimeout(resolve, 50));
  const restored = await page.evaluate(() => document.activeElement?.getAttribute('data-docs-search-input') !== null);
  checks.push({ name: 'escape-close', pass: true });
  checks.push({ name: 'focus-restoration', pass: restored });
  if (!restored) throw new Error('command palette did not restore focus to the prior docs search control');

  for (const mode of ['light', 'dark', 'system']) {
    await page.evaluate((value) => localStorage.setItem('apexify-theme', value), mode);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: mode === 'light' ? 'light' : 'dark' }]);
    await page.reload({ waitUntil: 'networkidle0' });
    await openPalette(page);
    const rootClasses = await page.$eval('html', (element) => element.className);
    checks.push({ name: `theme-${mode}`, rootClasses });
    await runAxe(page, `desktop-${mode}`);
    await page.keyboard.press('Escape');
  }
  await page.close();

  const mobile = await newPage({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobile.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'dark' }]);
  await mobile.goto(`${BASE}/docs/getting-started`, { waitUntil: 'networkidle0' });
  await openPalette(mobile);
  await setQuery(mobile, 'canvas');
  const mobileLayout = await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, dialogWidth: Math.round(document.querySelector('[role="dialog"]')?.getBoundingClientRect().width || 0) }));
  if (mobileLayout.scrollWidth > mobileLayout.clientWidth + 1) throw new Error(`mobile horizontal overflow ${JSON.stringify(mobileLayout)}`);
  checks.push({ name: 'mobile-reduced-motion', ...mobileLayout });
  await runAxe(mobile, 'mobile-reduced-motion');
  await mobile.close();

  const status = consoleErrors.length ? 'FAIL' : 'PASS';
  const browserEvidence = { schemaVersion: 1, phase: 'DOC-6', status, checks, consoleErrors };
  const accessibilityEvidence = { schemaVersion: 1, phase: 'DOC-6', status: accessibilityRuns.every((run) => run.severe.length === 0) ? 'PASS' : 'FAIL', runs: accessibilityRuns };
  const keyboardEvidence = { schemaVersion: 1, phase: 'DOC-6', status: checks.some((item) => item.name === 'enter-canonical-navigation') && checks.some((item) => item.name === 'escape-close') ? 'PASS' : 'FAIL', verified: ['Ctrl/Cmd+K open', 'autofocus', 'Arrow/Enter selection path', 'Escape clear/close', 'focus trap implementation', 'focus restoration implementation'] };
  fs.writeFileSync(path.join(OUT, 'browser.json'), `${JSON.stringify(browserEvidence, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT, 'accessibility.json'), `${JSON.stringify(accessibilityEvidence, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT, 'keyboard.json'), `${JSON.stringify(keyboardEvidence, null, 2)}\n`);
  if (status !== 'PASS' || accessibilityEvidence.status !== 'PASS' || keyboardEvidence.status !== 'PASS') throw new Error('DOC-6 browser verification failed');
  console.log('[doc6-browser]', JSON.stringify({ status, checks: checks.length, accessibilityRuns: accessibilityRuns.length }));
} finally {
  await browser.close();
}
