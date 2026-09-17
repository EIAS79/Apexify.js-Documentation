import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.POST_DOC12_BASE_URL ?? 'http://127.0.0.1:3000';
const CHROME = process.env.CHROME_PATH;
if (!CHROME) throw new Error('[post-doc12-browser] CHROME_PATH is required');
const OUT = path.join(process.cwd(), 'generated/post-doc12-ux-recovery');
const SHOTS = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const serious = (violations) => violations.filter((item) => item.impact === 'serious' || item.impact === 'critical');
const results = [];
const fail = [];
const write = (name, value) => fs.writeFileSync(path.join(OUT, name), `${JSON.stringify(value, null, 2)}\n`);

async function axe(page) {
  return page.evaluate(async () => {
    const scan = await window.axe.run(document, { resultTypes: ['violations'] });
    return scan.violations.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.length, targets: violation.nodes.slice(0, 5).map((node) => node.target) })).sort((a, b) => a.id.localeCompare(b.id));
  });
}

async function open({ name, route, width = 1440, height = 1100, theme = 'light', systemDark = false, reduced = false, shot = true }) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !/vercel|speed-insights|Failed to load resource: the server responded with a status of 404/i.test(text)) consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: systemDark ? 'dark' : 'light' },
    { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
  ]);
  await page.evaluateOnNewDocument((mode) => localStorage.setItem('apexify-theme', mode), theme);
  const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2' });
  if (!response?.ok()) throw new Error(`${name}: ${route} returned ${response?.status()}`);
  await page.addScriptTag({ content: axeSource });
  const violations = await axe(page);
  const metrics = await page.evaluate(() => ({
    pathname: location.pathname,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    overflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    interactiveCount: document.querySelectorAll('a[href],button,input,textarea,select,summary,[tabindex="0"]').length,
    resources: performance.getEntriesByType('resource').length,
    jsResources: performance.getEntriesByType('resource').filter((entry) => /\.js($|\?)/.test(entry.name)).length,
  }));
  if (shot) await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  const record = { name, route, width, height, theme, systemDark, reduced, violations, seriousViolations: serious(violations), consoleErrors, pageErrors, metrics };
  results.push(record);
  if (record.seriousViolations.length) fail.push(`${name}: ${record.seriousViolations.length} serious/critical axe violations`);
  if (metrics.overflowPx > 1) fail.push(`${name}: horizontal overflow ${metrics.overflowPx}px`);
  if (pageErrors.length) fail.push(`${name}: page errors ${pageErrors.join(' | ')}`);
  return { page, record };
}

try {
  const homeLight = await open({ name: 'homepage-desktop-light', route: '/', theme: 'light' });
  const recoveredHeadline = await homeLight.page.evaluate(() => (document.querySelector('h1')?.textContent ?? '').replace(/\s+/g, ' ').trim());
  if (!recoveredHeadline.includes('Draw anything.') || !recoveredHeadline.includes('From a script.')) fail.push(`homepage: recovered legacy headline missing (${recoveredHeadline})`);
  await homeLight.page.close();

  const homeDark = await open({ name: 'homepage-desktop-dark', route: '/', theme: 'dark' });
  if (homeDark.record.metrics.theme !== 'dark') fail.push('homepage dark theme did not resolve dark');
  await homeDark.page.close();

  const homeMobile = await open({ name: 'homepage-mobile', route: '/', width: 390, height: 844, theme: 'system', systemDark: false });
  if (homeMobile.record.metrics.theme !== 'light') fail.push('homepage system theme did not follow light OS preference');
  await homeMobile.page.close();

  const docs = await open({ name: 'docs-tree-active', route: '/docs/node/canvas', theme: 'light' });
  const navState = await docs.page.evaluate(() => ({
    treePresent: Boolean(document.querySelector('[data-post-doc12-tree]')),
    current: document.querySelector('.apx-sidebar-link[aria-current="page"]')?.textContent?.trim() ?? null,
    expanded: [...document.querySelectorAll('.apx-sidebar-disclosure[aria-expanded="true"]')].map((node) => node.getAttribute('aria-label')),
    repeatedMeta: document.querySelectorAll('.apx-sidebar-link__meta').length,
  }));
  if (!navState.treePresent) fail.push('docs: recovered tree marker missing');
  if (!navState.current) fail.push('docs: active sidebar item missing');
  if (navState.expanded.length < 2) fail.push('docs: active ancestors did not auto-expand');
  if (navState.repeatedMeta) fail.push('docs: repetitive per-link metadata remains');

  const toggleDisclosure = await docs.page.$('.apx-sidebar-disclosure[aria-expanded="false"]');
  let keyboardDisclosure = false;
  if (toggleDisclosure) {
    await toggleDisclosure.focus();
    const before = await toggleDisclosure.evaluate((node) => node.getAttribute('aria-expanded'));
    await docs.page.keyboard.press('Enter');
    const after = await toggleDisclosure.evaluate((node) => node.getAttribute('aria-expanded'));
    keyboardDisclosure = before !== after;
  }
  if (!keyboardDisclosure) fail.push('docs: keyboard disclosure toggle failed');

  const beforeWorkbench = await docs.page.evaluate(() => ({ resources: performance.getEntriesByType('resource').length, workbench: Boolean(document.querySelector('[data-post-doc12-workbench="collapsed"]')) }));
  if (!beforeWorkbench.workbench) fail.push('workbench: collapsed-by-default surface missing');
  await docs.page.screenshot({ path: path.join(SHOTS, 'workbench-collapsed.png'), fullPage: true });
  const showButtons = await docs.page.$$('button');
  let activated = false;
  for (const button of showButtons) {
    const text = await button.evaluate((node) => node.textContent?.trim());
    if (text === 'Show code & preview') {
      await button.click();
      activated = true;
      break;
    }
  }
  if (!activated) fail.push('workbench: Show code & preview button missing');
  else {
    await docs.page.waitForSelector('[data-post-doc12-workbench]:not([data-post-doc12-workbench="collapsed"])', { timeout: 15000 });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await docs.page.screenshot({ path: path.join(SHOTS, 'workbench-expanded.png'), fullPage: true });
  }
  const afterWorkbench = await docs.page.evaluate(() => ({
    resources: performance.getEntriesByType('resource').length,
    modes: [...document.querySelectorAll('[role="tab"]')].map((node) => node.textContent?.trim()),
    studio: [...document.querySelectorAll('button')].some((node) => node.textContent?.trim() === 'Open in Studio'),
    run: [...document.querySelectorAll('button')].some((node) => node.textContent?.trim() === 'Run'),
  }));
  if (!afterWorkbench.modes.includes('TypeScript') || !afterWorkbench.modes.includes('Preview') || !afterWorkbench.modes.includes('Both')) fail.push('workbench: required view modes missing');
  if (!afterWorkbench.studio) fail.push('workbench: Open in Studio missing');
  if (afterWorkbench.run) fail.push('workbench: fake Run button present');
  if (activated && afterWorkbench.resources <= beforeWorkbench.resources) fail.push('workbench: editor/workspace bundle was not deferred until activation');

  let keyboardWorkbenchTab = false;
  const previewTab = await docs.page.$('[role="tab"]');
  if (previewTab) {
    const tabs = await docs.page.$$('[role="tab"]');
    for (const tab of tabs) {
      const label = await tab.evaluate((node) => node.textContent?.trim());
      if (label === 'Preview') {
        await tab.focus();
        await docs.page.keyboard.press('Enter');
        keyboardWorkbenchTab = (await tab.evaluate((node) => node.getAttribute('aria-selected'))) === 'true';
        break;
      }
    }
  }
  if (!keyboardWorkbenchTab) fail.push('workbench: keyboard tab activation failed');

  const expandedViolations = await axe(docs.page);
  if (serious(expandedViolations).length) fail.push(`workbench: ${serious(expandedViolations).length} serious/critical axe violations after expansion`);

  let studioHandoff = null;
  if (afterWorkbench.studio) {
    const buttons = await docs.page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate((node) => node.textContent?.trim());
      if (text === 'Open in Studio') {
        await Promise.all([
          docs.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null),
          button.click(),
        ]);
        studioHandoff = await docs.page.evaluate(() => ({ pathname: location.pathname, hashPrefix: location.hash.slice(0, 9), hashLength: location.hash.length }));
        break;
      }
    }
  }
  if (!studioHandoff || studioHandoff.pathname !== '/studio' || !studioHandoff.hashPrefix.startsWith('#snippet=')) fail.push('workbench: Studio handoff did not preserve encoded snippet transport');
  await docs.page.close();

  const table = await open({ name: 'table-heavy-desktop', route: '/docs/node/canvas/backgrounds-primary', width: 1024, height: 900, theme: 'light' });
  const tableMetrics = await table.page.evaluate(() => {
    const wrap = document.querySelector('.apx-doc-table-wrap');
    const table = wrap?.querySelector('table');
    return { wrapper: Boolean(wrap), nativeTable: Boolean(table), scrollable: Boolean(wrap && wrap.scrollWidth >= wrap.clientWidth), tabIndex: wrap?.getAttribute('tabindex') };
  });
  if (!tableMetrics.wrapper || !tableMetrics.nativeTable || tableMetrics.tabIndex !== '0') fail.push('table: semantic scroll wrapper missing');
  await table.page.close();

  const tabletDocs = await open({ name: 'docs-tablet', route: '/docs/node/canvas', width: 768, height: 1024, theme: 'system', systemDark: true });
  if (tabletDocs.record.metrics.theme !== 'dark') fail.push('docs tablet system theme did not follow dark OS preference');
  await tabletDocs.page.close();

  const api = await open({ name: 'api-reference', route: '/api-reference/apexify.js/ApexPainter/createImage', width: 1440, height: 1000, theme: 'dark' });
  await api.page.close();

  const mobileDocs = await open({ name: 'docs-mobile', route: '/docs/node/canvas', width: 360, height: 800, theme: 'dark' });
  const mobileWorkbenchCollapsed = await mobileDocs.page.evaluate(() => Boolean(document.querySelector('[data-post-doc12-workbench="collapsed"]')));
  if (!mobileWorkbenchCollapsed) fail.push('workbench: mobile collapsed surface missing');
  await mobileDocs.page.close();

  const reduced = await open({ name: 'docs-reduced-motion', route: '/docs/node/canvas', width: 1024, height: 800, theme: 'light', reduced: true, shot: false });
  const reducedMetrics = await reduced.page.evaluate(() => {
    const node = document.querySelector('.apx-sidebar-disclosure > span');
    return node ? getComputedStyle(node).transitionDuration : null;
  });
  if (reducedMetrics !== '0s') fail.push(`reduced motion: sidebar disclosure transition duration is ${reducedMetrics}`);
  await reduced.page.close();

  const gallery = await open({ name: 'gallery', route: '/gallery', width: 1440, height: 1000, theme: 'light' });
  await gallery.page.close();
  const studio = await open({ name: 'studio', route: '/studio', width: 1440, height: 1000, theme: 'dark' });
  await studio.page.close();

  write('accessibility.json', { status: fail.some((item) => item.includes('axe')) ? 'FAIL' : 'PASS', pages: results.map((item) => ({ name: item.name, seriousViolations: item.seriousViolations })), expandedWorkbenchSeriousViolations: serious(expandedViolations) });
  write('keyboard.json', { status: keyboardDisclosure && keyboardWorkbenchTab ? 'PASS' : 'FAIL', disclosureEnterToggle: keyboardDisclosure, workbenchTabEnterActivation: keyboardWorkbenchTab, studioHandoff });
  write('responsive.json', { status: results.every((item) => item.metrics.overflowPx <= 1) ? 'PASS' : 'FAIL', viewports: results.map((item) => ({ name: item.name, width: item.width, overflowPx: item.metrics.overflowPx })) });
  write('theme.json', { status: 'PASS', states: results.map((item) => ({ name: item.name, requested: item.theme, systemDark: item.systemDark, resolved: item.metrics.theme })) });
  write('reduced-motion.json', { status: reducedMetrics === '0s' ? 'PASS' : 'FAIL', disclosureTransitionDuration: reducedMetrics });
  write('bundle-comparison.json', { collapsedResourceCount: beforeWorkbench.resources, expandedResourceCount: afterWorkbench.resources, deferredWorkbenchResources: Math.max(0, afterWorkbench.resources - beforeWorkbench.resources) });
  write('performance-comparison.json', { status: 'INFORMATIONAL', routeResourceCounts: results.map((item) => ({ name: item.name, total: item.metrics.resources, js: item.metrics.jsResources })) });
  write('browser-regression.json', { status: fail.length ? 'FAIL' : 'PASS', failures: fail, navigation: navState, table: tableMetrics, workbench: { before: beforeWorkbench, after: afterWorkbench, mobileCollapsed: mobileWorkbenchCollapsed }, studioHandoff, screenshots: fs.readdirSync(SHOTS).sort() });

  if (fail.length) throw new Error(`[post-doc12-browser] ${fail.length} failure(s):\n- ${fail.join('\n- ')}`);
  console.log(`[post-doc12-browser] PASS states=${results.length} screenshots=${fs.readdirSync(SHOTS).length}`);
} finally {
  await browser.close();
}
