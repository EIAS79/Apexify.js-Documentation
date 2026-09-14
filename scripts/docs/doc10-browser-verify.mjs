import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.env.DOC10_BASE_URL || 'http://127.0.0.1:3000';
const baseline = process.env.DOC10_BASELINE_URL || 'http://127.0.0.1:3001';
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('[DOC-10 browser] CHROME_PATH required');
const outDir = path.join(process.cwd(), 'generated', 'docs-doc10');
fs.mkdirSync(outDir, { recursive: true });

const apiManifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'generated', 'docs-doc4', 'api-manifest.json'), 'utf8'));
const representativeSymbol = apiManifest.symbols.find((item) => item.id === apiManifest.representativeApiId) ?? apiManifest.symbols[0];
const apiRoute = representativeSymbol?.href ?? '/api-reference';
const fixtureTokens = ['0.0.0-fixture', 'FIXTURE-APX-', 'WebPainterFixture', 'ReactCanvasFixture', 'NextBoundaryFixture'];

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const evidence = [];
const bundle = [];

async function stableState(page, theme = 'light') {
  await page.evaluateOnNewDocument((value) => { localStorage.clear(); localStorage.setItem('apexify-theme', value); }, theme);
}

async function visit(route, { width = 1365, height = 900, theme = 'light', reduced = false, fixture = false } = {}) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width, height });
  await stableState(page, theme);
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle2' });
  if (!response || response.status() !== 200) throw new Error(`${route}: HTTP ${response?.status()}`);
  const text = await page.evaluate(() => document.body.textContent || '');
  if (fixture) {
    if (!text.includes('TEST-ONLY · FIXTURE · ROADMAP')) throw new Error('fixture truth label missing');
    if (!text.includes('No renderer is active')) throw new Error('fixture no-renderer disclosure missing');
    const workspaces = await page.$$('[data-doc8-primitive="workspace"]');
    if (workspaces.length !== 2) throw new Error(`expected two reused DOC-8 workspaces, got ${workspaces.length}`);
    if (!(await page.$('[data-doc10-component="AvailabilityMatrix"]'))) throw new Error('availability matrix missing');
    if (!(await page.$('[data-doc4-component="OptionTable"]'))) throw new Error('DOC-4 option table missing');
    if (!(await page.$('[data-doc10-navigator="runtime-navigator"]'))) throw new Error('runtime navigator missing');
    if (!(await page.$('[data-doc10-navigator="package-navigator"]'))) throw new Error('package navigator missing');
    if (!(await page.$('[data-doc10-version-selector][data-enabled="false"]'))) throw new Error('inert version selector missing');
    if (width >= 768) {
      const separator = await page.$('[data-doc8-primitive="workspace"] [role="separator"]');
      if (!separator) throw new Error('workspace keyboard separator missing');
      const before = Number(await page.evaluate((element) => element.getAttribute('aria-valuenow'), separator));
      await separator.focus();
      await page.keyboard.press('ArrowLeft');
      const after = Number(await page.evaluate((element) => element.getAttribute('aria-valuenow'), separator));
      if (!(after < before)) throw new Error('workspace keyboard resize failed');
    }
    const checkbox = await page.$('input[type="checkbox"]');
    if (!checkbox) throw new Error('reduced-motion simulation control missing');
    await checkbox.click();
    if (!(await page.evaluate((element) => element.checked, checkbox))) throw new Error('reduced-motion fixture toggle failed');
  } else {
    for (const token of fixtureTokens) if (text.includes(token)) throw new Error(`${route}: fixture token leaked into production UI: ${token}`);
  }
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })));
  if (violations.length) throw new Error(`${route}: axe ${JSON.stringify(violations)}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error(`${route}: horizontal overflow`);
  if (consoleErrors.length || pageErrors.length) throw new Error(`${route}: browser errors ${JSON.stringify({ consoleErrors, pageErrors })}`);
  evidence.push({ route, width, height, theme, reduced, fixture, axeViolations: violations.length, overflow });
  await page.close();
}

async function transfer(origin, route) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1365, height: 900 });
  await stableState(page);
  const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle2' });
  if (!response || response.status() !== 200) throw new Error(`measure ${origin}${route}: HTTP ${response?.status()}`);
  const result = await page.evaluate(() => {
    const scripts = performance.getEntriesByType('resource').filter((entry) => entry.initiatorType === 'script');
    return { jsTransferBytes: scripts.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0), scriptCount: scripts.length };
  });
  await page.close();
  return result;
}

try {
  await visit('/__docs-fixtures/future-readiness', { fixture: true, width: 1440, height: 1000, theme: 'light' });
  await visit('/__docs-fixtures/future-readiness', { fixture: true, width: 390, height: 844, theme: 'dark' });
  await visit('/__docs-fixtures/future-readiness', { fixture: true, width: 768, height: 1024, theme: 'light', reduced: true });
  for (const route of ['/', '/docs/getting-started', '/gallery', '/api-reference']) await visit(route);

  const searchResponse = await fetch(`${base}/api/docs/search?q=WebPainterFixture`).then((response) => response.json());
  if (searchResponse.total !== 0) throw new Error(`fixture API leaked into production search: ${JSON.stringify(searchResponse.results?.slice?.(0, 3))}`);
  const diagnosticSearch = await fetch(`${base}/api/docs/search?q=FIXTURE-APX-WEB-001`).then((response) => response.json());
  if (diagnosticSearch.total !== 0) throw new Error('fixture diagnostic leaked into production search');
  const sitemap = await fetch(`${base}/sitemap.xml`).then((response) => response.text());
  if (sitemap.includes('/__docs-fixtures/') || fixtureTokens.some((token) => sitemap.includes(token))) throw new Error('fixture route/data leaked into production sitemap');

  for (const route of ['/docs/getting-started', apiRoute, '/studio']) {
    const [before, after] = await Promise.all([transfer(baseline, route), transfer(base, route)]);
    const deltaBytes = after.jsTransferBytes - before.jsTransferBytes;
    const deltaPct = before.jsTransferBytes ? (deltaBytes / before.jsTransferBytes) * 100 : null;
    const row = { route, baseline: before, current: after, deltaBytes, deltaPct };
    bundle.push(row);
    if (deltaBytes > 80 * 1024 && (deltaPct ?? 0) > 10) throw new Error(`production JS regression: ${JSON.stringify(row)}`);
  }
  const fixtureTransfer = await transfer(base, '/__docs-fixtures/future-readiness');
  bundle.push({ route: '/__docs-fixtures/future-readiness', baseline: null, current: fixtureTransfer, fixtureOnly: true });
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outDir, 'browser-verification.json'), `${JSON.stringify({ schemaVersion: 1, status: 'PASS', routes: evidence, productionFixtureLeaks: 0 }, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'bundle-comparison.json'), `${JSON.stringify({ schemaVersion: 1, status: 'PASS', productionBudget: { maxDeltaBytes: 81920, maxDeltaPctWhenByteThresholdExceeded: 10 }, routes: bundle, productionRuntimeDependenciesAdded: 0 }, null, 2)}\n`);
console.log(`[DOC-10 browser] PASS routes=${evidence.length} production bundle comparisons=3 fixture leaks=0`);
