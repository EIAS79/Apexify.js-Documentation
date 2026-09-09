import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE_URL = process.env.DOC2_BASE_URL ?? 'http://127.0.0.1:3000';
const CHROME_PATH = process.env.CHROME_PATH;
if (!CHROME_PATH) throw new Error('[doc2-browser] CHROME_PATH is required');
const OUT = path.join(process.cwd(), '.doc2-runtime-evidence');
const SHOTS = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const ignoredUrl = (url) => /(_vercel\/insights|speed-insights|vercel-insights)/i.test(url);
const seriousOrCritical = (violations) => violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');

async function newConfiguredPage({ width, height, mode, systemDark = false, reduced = false }) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const networkErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') return;
    if (!/speed-insights|vercel-insights/i.test(text)) consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    if (!ignoredUrl(request.url())) networkErrors.push(`${request.failure()?.errorText ?? 'failed'} ${request.url()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !ignoredUrl(response.url())) networkErrors.push(`${response.status()} ${response.url()}`);
  });
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: systemDark ? 'dark' : 'light' },
    { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
  ]);
  await page.evaluateOnNewDocument((themeMode) => {
    localStorage.setItem('apexify-theme', themeMode);
    window.__doc2Perf = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__doc2Perf.lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__doc2Perf.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
  }, mode);
  return { page, consoleErrors, networkErrors, pageErrors };
}

async function axe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ['violations'] });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 6).map((node) => node.target),
    })).sort((a, b) => a.id.localeCompare(b.id));
  });
}

async function auditState(config) {
  const { page, consoleErrors, networkErrors, pageErrors } = await newConfiguredPage(config);
  await page.goto(`${BASE_URL}/docs/node/canvas`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-doc2-shell]');
  const violations = await axe(page);
  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const allInteractive = Array.from(document.querySelectorAll('a[href],button,input,select,textarea,summary,[role="button"],[role="radio"]')).filter(visible);
    const shellControls = Array.from(document.querySelectorAll('.apx-doc-header a,.apx-doc-header button,.apx-doc-header input,.apx-doc-mobile-bar button,.apx-doc-sidebar a,.apx-doc-sidebar summary,.apx-doc-sidebar input,.apx-doc-toc-rail a,.apx-breadcrumbs a,.apx-pager a')).filter(visible);
    const small = (items) => items.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    }).map((element) => ({ tag: element.tagName, text: (element.textContent ?? '').trim().slice(0, 80), aria: element.getAttribute('aria-label'), width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) }));
    const ids = new Map();
    for (const element of document.querySelectorAll('[id]')) ids.set(element.id, (ids.get(element.id) ?? 0) + 1);
    const duplicateIds = [...ids.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
    const motionElements = Array.from(document.querySelectorAll('.apx-doc-root *')).filter((element) => {
      const style = getComputedStyle(element);
      const durations = `${style.transitionDuration},${style.animationDuration}`.split(',').map((value) => Number.parseFloat(value) || 0);
      return style.animationName !== 'none' || durations.some((duration) => duration > 0.02);
    }).length;
    const resources = performance.getEntriesByType('resource').map((entry) => ({ name: entry.name, transferSize: entry.transferSize || 0, initiatorType: entry.initiatorType }));
    const js = resources.filter((entry) => /\.js($|\?)/.test(entry.name));
    const css = resources.filter((entry) => /\.css($|\?)/.test(entry.name));
    const fonts = resources.filter((entry) => entry.initiatorType === 'css' && /\.(woff2?|ttf|otf)($|\?)/.test(entry.name));
    return {
      resolvedTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      overflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      skipLinks: document.querySelectorAll('a.apx-skip-link[href="#docs-content"]').length,
      mainPresent: Boolean(document.querySelector('main#docs-content')),
      customCursorActive: document.documentElement.classList.contains('has-custom-cursor'),
      allSmallTargets: small(allInteractive),
      shellSmallTargets: small(shellControls),
      duplicateIds,
      motionElements,
      requestCount: resources.length,
      jsRequestCount: js.length,
      transferredJsBytes: js.reduce((sum, entry) => sum + entry.transferSize, 0),
      cssRequestCount: css.length,
      transferredCssBytes: css.reduce((sum, entry) => sum + entry.transferSize, 0),
      fontRequestCount: fonts.length,
      transferredFontBytes: fonts.reduce((sum, entry) => sum + entry.transferSize, 0),
      perf: window.__doc2Perf,
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
    };
  });
  const shot = `${config.name}.png`;
  await page.screenshot({ path: path.join(SHOTS, shot), fullPage: true });
  await page.close();
  return { ...config, ...metrics, axe: violations, consoleErrors, networkErrors, pageErrors, screenshot: `screenshots/${shot}` };
}

async function interactionAudit() {
  const results = {};

  {
    const { page } = await newConfiguredPage({ width: 1440, height: 900, mode: 'light' });
    await page.goto(`${BASE_URL}/docs/getting-started`, { waitUntil: 'networkidle2' });
    await page.keyboard.press('Tab');
    results.skipFirstFocus = await page.evaluate(() => document.activeElement?.classList.contains('apx-skip-link') ?? false);
    await page.keyboard.press('Enter');
    await new Promise((resolve) => setTimeout(resolve, 30));
    results.skipMovesToMain = await page.evaluate(() => document.activeElement?.id === 'docs-content');
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    results.searchShortcutFocus = await page.evaluate(() => Boolean(document.activeElement?.matches?.('[data-docs-search-input]')));
    const input = await page.$('[data-docs-search-input]');
    if (input) await input.type('canvas');
    await page.waitForSelector('[data-search-href="/docs/node/canvas"]', { timeout: 10000 });
    await page.click('[data-search-href="/docs/node/canvas"]');
    await page.waitForFunction(() => location.pathname === '/docs/node/canvas');
    results.searchCanonicalNavigation = await page.evaluate(() => location.pathname === '/docs/node/canvas');
    await page.waitForSelector('[data-doc2-pager] a[rel="next"]');
    await page.click('[data-doc2-pager] a[rel="next"]');
    await page.waitForFunction(() => location.pathname === '/docs/node/canvas/size-and-coordinates');
    results.pagerCanonicalNavigation = true;
    await page.close();
  }

  {
    const { page } = await newConfiguredPage({ width: 390, height: 844, mode: 'dark' });
    await page.goto(`${BASE_URL}/docs/node/canvas`, { waitUntil: 'networkidle2' });
    const navTrigger = 'button[aria-label="Open documentation navigation"]';
    await page.focus(navTrigger);
    await page.click(navTrigger);
    await page.waitForSelector('[role="dialog"][aria-label="Documentation navigation"]');
    results.navDrawerFocusEntry = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"][aria-label="Documentation navigation"]')));
    results.navDrawerAxe = await axe(page);
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"][aria-label="Documentation navigation"]', { hidden: true });
    results.navDrawerFocusReturn = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Open documentation navigation');

    const tocTrigger = 'button[aria-label="Open on this page navigation"]';
    await page.click(tocTrigger);
    await page.waitForSelector('[role="dialog"][aria-label="On this page"]');
    results.tocDrawerFocusEntry = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"][aria-label="On this page"]')));
    results.tocDrawerAxe = await axe(page);
    const tocLink = '#docs-toc-drawer a[href^="#"]';
    const firstTocHref = await page.$eval(tocLink, (element) => element.getAttribute('href'));
    await page.focus(tocLink);
    results.tocLinkKeyboardFocus = await page.evaluate((selector) => document.activeElement?.matches(selector) ?? false, tocLink);
    await page.keyboard.press('Enter');
    await page.waitForSelector('[role="dialog"][aria-label="On this page"]', { hidden: true });
    results.tocDeepLink = await page.evaluate((expected) => location.hash === expected, firstTocHref);

    const siteTrigger = 'button[aria-label="Open site navigation"]';
    await page.click(siteTrigger);
    await page.waitForSelector('[role="dialog"][aria-label="Site navigation"]');
    results.siteDrawerAxe = await axe(page);
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"][aria-label="Site navigation"]', { hidden: true });
    results.siteDrawerFocusReturn = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Open site navigation');
    await page.close();
  }

  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(`${BASE_URL}/docs#00-create-canvas-overview?h=signature-types`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => location.pathname === '/docs/node/canvas' && location.hash === '#signature-types', { timeout: 10000 });
    results.legacyHashRedirect = true;
    const response = await page.goto(`${BASE_URL}/docs/not-a-real-doc2-route`, { waitUntil: 'domcontentloaded' });
    results.unknownRouteStatus = response?.status() ?? null;
    await page.close();
  }

  return results;
}

try {
  const states = [];
  states.push(await auditState({ name: 'desktop-light', width: 1440, height: 900, mode: 'light' }));
  states.push(await auditState({ name: 'desktop-dark', width: 1440, height: 900, mode: 'dark' }));
  states.push(await auditState({ name: 'desktop-system-light', width: 1440, height: 900, mode: 'system', systemDark: false }));
  states.push(await auditState({ name: 'desktop-system-dark', width: 1440, height: 900, mode: 'system', systemDark: true }));
  states.push(await auditState({ name: 'tablet-light', width: 768, height: 1024, mode: 'light' }));
  states.push(await auditState({ name: 'mobile-light', width: 390, height: 844, mode: 'light' }));
  states.push(await auditState({ name: 'narrow-mobile-dark', width: 320, height: 720, mode: 'dark' }));
  states.push(await auditState({ name: 'desktop-reduced', width: 1440, height: 900, mode: 'dark', systemDark: true, reduced: true }));
  const interactions = await interactionAudit();

  const expectedThemes = new Map([
    ['desktop-light', 'light'], ['desktop-dark', 'dark'], ['desktop-system-light', 'light'], ['desktop-system-dark', 'dark'],
    ['tablet-light', 'light'], ['mobile-light', 'light'], ['narrow-mobile-dark', 'dark'], ['desktop-reduced', 'dark'],
  ]);
  const failures = [];
  for (const state of states) {
    if (state.resolvedTheme !== expectedThemes.get(state.name)) failures.push(`${state.name}: theme resolved to ${state.resolvedTheme}`);
    if (state.overflowPx > 0) failures.push(`${state.name}: page overflow ${state.overflowPx}px`);
    if (state.skipLinks !== 1) failures.push(`${state.name}: expected exactly one skip link, got ${state.skipLinks}`);
    if (!state.mainPresent) failures.push(`${state.name}: docs main landmark missing`);
    if (state.customCursorActive) failures.push(`${state.name}: custom cursor active on docs`);
    if (state.shellSmallTargets.length) failures.push(`${state.name}: ${state.shellSmallTargets.length} shell targets below 44px`);
    if (state.duplicateIds.length) failures.push(`${state.name}: duplicate IDs ${JSON.stringify(state.duplicateIds)}`);
    const severe = seriousOrCritical(state.axe);
    if (severe.length) failures.push(`${state.name}: serious/critical axe ${JSON.stringify(severe)}`);
    if (state.consoleErrors.length) failures.push(`${state.name}: console errors ${state.consoleErrors.join(' | ')}`);
    if (state.networkErrors.length) failures.push(`${state.name}: network errors ${state.networkErrors.join(' | ')}`);
    if (state.pageErrors.length) failures.push(`${state.name}: page errors ${state.pageErrors.join(' | ')}`);
  }
  const reduced = states.find((state) => state.name === 'desktop-reduced');
  if (!reduced || reduced.motionElements !== 0) failures.push(`desktop-reduced: expected zero motion-bearing elements, got ${reduced?.motionElements ?? 'missing'}`);
  for (const key of ['skipFirstFocus','skipMovesToMain','searchShortcutFocus','searchCanonicalNavigation','pagerCanonicalNavigation','navDrawerFocusEntry','navDrawerFocusReturn','tocDrawerFocusEntry','tocLinkKeyboardFocus','tocDeepLink','siteDrawerFocusReturn','legacyHashRedirect']) {
    if (!interactions[key]) failures.push(`interaction failed: ${key}`);
  }
  for (const key of ['navDrawerAxe','tocDrawerAxe','siteDrawerAxe']) {
    const severe = seriousOrCritical(interactions[key] ?? []);
    if (severe.length) failures.push(`${key}: serious/critical axe ${JSON.stringify(severe)}`);
  }
  if (interactions.unknownRouteStatus !== 404) failures.push(`unknown route status ${interactions.unknownRouteStatus}, expected 404`);

  const result = { schemaVersion: 1, phase: 'DOC-2', route: '/docs/node/canvas', states, interactions, failures };
  fs.writeFileSync(path.join(OUT, 'browser.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log('[doc2-browser] ' + JSON.stringify({ states: states.length, failures: failures.length, interactions: Object.keys(interactions).length }));
  if (failures.length) throw new Error(`[doc2-browser] verification failed:\n${failures.join('\n')}`);
} finally {
  await browser.close();
}
