import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'verification', 'doc-11');
const BASE = process.env.DOC11_BASE_URL || 'http://127.0.0.1:3000';
const CHROME = process.env.CHROME_PATH;
if (!CHROME) throw new Error('[DOC-11 browser] CHROME_PATH is required');
fs.mkdirSync(OUT, { recursive: true });

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const docsManifest = readJson('generated/docs-doc1/docs-manifest.json');
const apiManifest = readJson('generated/docs-doc4/api-manifest.json');
const exampleManifest = readJson('generated/docs-doc5/example-manifest.json');
const redirectManifest = readJson('generated/docs-doc1/redirect-manifest.json');
const docs = docsManifest.pages ?? [];
const symbols = apiManifest.symbols ?? [];
const examples = exampleManifest.examples ?? [];

const docText = (page) => [page.kind, page.category, page.title, page.slug, page.sourcePath, ...(page.keywords ?? [])].join(' ').toLowerCase();
const pickDoc = (pattern, fallback = '/docs/getting-started') => docs.find((page) => pattern.test(docText(page)))?.canonicalPath ?? fallback;
const plainGuide = docs.find((page) => page.canonicalPath !== '/docs/getting-started' && page.canonicalPath !== '/docs/node/canvas' && !/(recipe|tutorial|architecture|internals|changelog|advanced)/.test(docText(page)))?.canonicalPath ?? '/docs/getting-started';
const technicalGuide = pickDoc(/advanced|performance|security|render|media|internals/);
const recipe = pickDoc(/recipe|tutorial/);
const architecture = pickDoc(/architecture|internals/);
const changelog = pickDoc(/changelog|release notes/);
const simpleApi = symbols[0]?.href ?? '/api-reference';
const complexApi = [...symbols].sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0]?.href ?? simpleApi;
const exampleRoute = examples[0]?.canonicalRoute ?? (examples[0]?.id ? `/examples/${examples[0].id}` : '/gallery');
const legacyCandidate = docs.find((page) => (page.legacyHashes ?? []).length > 0);
const legacyHash = legacyCandidate?.legacyHashes?.[0] ?? redirectManifest.defaultLegacyIdentity;
const legacyTarget = legacyCandidate?.canonicalPath ?? '/docs/getting-started';

const ROUTE_MATRIX = [
  { kind: 'homepage', route: '/', canonical: '/' },
  { kind: 'docs landing', route: '/docs/getting-started', canonical: '/docs/getting-started' },
  { kind: 'plain guide', route: plainGuide, canonical: plainGuide },
  { kind: 'long technical guide', route: technicalGuide, canonical: technicalGuide },
  { kind: 'recipe/tutorial', route: recipe, canonical: recipe },
  { kind: 'architecture page', route: architecture, canonical: architecture },
  { kind: 'API landing', route: '/api-reference', canonical: '/api-reference' },
  { kind: 'simple API page', route: simpleApi, canonical: simpleApi },
  { kind: 'complex API page', route: complexApi, canonical: complexApi },
  { kind: 'example detail', route: exampleRoute, canonical: exampleRoute },
  { kind: 'Gallery', route: '/gallery', canonical: '/gallery' },
  { kind: 'search opened', route: '/docs/getting-started', canonical: '/docs/getting-started', state: 'search' },
  { kind: 'Studio', route: '/studio', canonical: '/studio' },
  { kind: 'interactive docs/playground', route: '/docs/node/canvas', canonical: '/docs/node/canvas' },
  { kind: 'changelog', route: changelog, canonical: changelog },
  { kind: '404', route: '/__doc11-not-found-probe__', expectedStatus: 404, state: '404' },
  { kind: 'legacy redirect', route: `/docs#${encodeURIComponent(legacyHash)}`, canonical: legacyTarget, state: 'legacy' },
];

const MAJOR_SOCIAL = new Set(['homepage', 'docs landing', 'API landing', 'Gallery', 'Studio']);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const routeEvidence = [];
const accessibilityEvidence = [];
const keyboardEvidence = [];
const metadataEvidence = [];
const mobileEvidence = [];
const reducedMotionEvidence = [];
const bundleEvidence = [];
const cacheEvidence = [];
const failures = [];

function fail(message) {
  failures.push(message);
  console.error(`[DOC-11] ${message}`);
}

function normalizePath(value) {
  try {
    const url = new URL(value, BASE);
    return url.pathname.length > 1 ? url.pathname.replace(/\/$/, '') : '/';
  } catch {
    return value;
  }
}

async function setupPage({ width = 1365, height = 900, reduced = false, theme = 'light', cache = false } = {}) {
  const page = await browser.newPage();
  await page.setCacheEnabled(cache);
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((selectedTheme) => {
    localStorage.clear();
    localStorage.setItem('apexify-theme', selectedTheme);
  }, theme);
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  return page;
}

function expectedLocalMiss(row) {
  const url = new URL(row.url);
  return row.status === 404 && url.origin === new URL(BASE).origin && (
    url.pathname === '/favicon.ico' || url.pathname === '/_vercel/speed-insights/script.js'
  );
}

async function collectAxe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => ({ target: node.target, html: node.html, failureSummary: node.failureSummary })),
    }));
  });
}

async function collectMetadata(page) {
  return page.evaluate(() => ({
    title: document.title.trim(),
    description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ?? '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ?? '',
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? '',
    lang: document.documentElement.lang,
    h1Count: document.querySelectorAll('h1').length,
  }));
}

async function keyboardFocusSample(page, maxTabs = 30) {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  });
  const sampled = [];
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      const outlined = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth || '0') >= 1;
      const ring = style.boxShadow !== 'none';
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        role: element.getAttribute('role'),
        label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 80) || null,
        visible,
        focusVisible: element.matches(':focus-visible'),
        outlined,
        ring,
      };
    });
    if (!state) continue;
    sampled.push(state);
    if (!state.visible) fail(`keyboard focus reached hidden control: ${JSON.stringify(state)}`);
    if (state.focusVisible && !state.outlined && !state.ring) fail(`keyboard focus has no visible outline/ring: ${JSON.stringify(state)}`);
  }
  if (sampled.length === 0) fail('keyboard audit found no reachable controls');
  return sampled;
}

async function openSearchAndVerify(page) {
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.down(mod);
  await page.keyboard.press('k');
  await page.keyboard.up(mod);
  await page.waitForSelector('[role="dialog"][aria-label="Search Apexify documentation"]', { visible: true, timeout: 5000 });
  await page.waitForSelector('#docs-command-search-input', { visible: true, timeout: 5000 });
  const focused = await page.evaluate(() => document.activeElement?.id === 'docs-command-search-input');
  if (!focused) fail('search dialog did not focus search input');
  const trapped = [];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    trapped.push(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))));
  }
  if (trapped.some((inside) => !inside)) fail('search focus escaped the modal while open');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"][aria-label="Search Apexify documentation"]', { hidden: true, timeout: 5000 });
  return { inputFocused: focused, focusTrapSamples: trapped, escapeClosed: true };
}

async function auditMatrixEntry(entry) {
  const page = await setupPage();
  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });
  try {
    const response = await page.goto(`${BASE}${entry.route}`, { waitUntil: 'networkidle2' });
    const status = response?.status() ?? 0;
    const expected = entry.expectedStatus ?? 200;
    if (status !== expected) fail(`${entry.kind}: expected HTTP ${expected}, got ${status}`);

    if (entry.state === 'legacy') {
      await page.waitForFunction((target) => location.pathname.replace(/\/$/, '') === target.replace(/\/$/, ''), { timeout: 7000 }, entry.canonical);
    }
    if (entry.state === 'search') await openSearchAndVerify(page);

    const finalPath = await page.evaluate(() => location.pathname);
    const axe = await collectAxe(page);
    const serious = axe.filter((violation) => ['critical', 'serious'].includes(violation.impact));
    if (serious.length) fail(`${entry.kind}: critical/serious axe violations ${JSON.stringify(serious)}`);
    accessibilityEvidence.push({ kind: entry.kind, route: entry.route, finalPath, violations: axe, criticalOrSerious: serious.length });

    const metadata = await collectMetadata(page);
    if (entry.state !== '404') {
      if (!metadata.title) fail(`${entry.kind}: missing title`);
      if (!metadata.description) fail(`${entry.kind}: missing meta description`);
      if (!metadata.canonical) fail(`${entry.kind}: missing canonical URL`);
      if (entry.canonical && normalizePath(metadata.canonical) !== normalizePath(entry.canonical)) {
        fail(`${entry.kind}: canonical mismatch expected ${entry.canonical}, got ${metadata.canonical}`);
      }
      if (MAJOR_SOCIAL.has(entry.kind) && (!metadata.ogTitle || !metadata.ogDescription || !metadata.ogUrl)) {
        fail(`${entry.kind}: incomplete Open Graph metadata`);
      }
      if (metadata.lang !== 'en') fail(`${entry.kind}: document language is not en`);
      if (metadata.h1Count !== 1) fail(`${entry.kind}: expected exactly one h1, found ${metadata.h1Count}`);
    } else {
      if (!/noindex/i.test(metadata.robots)) fail('404: missing noindex robots metadata');
      const body = await page.evaluate(() => document.body.textContent || '');
      if (!body.includes('Page not found')) fail('404: meaningful not-found message missing');
    }
    metadataEvidence.push({ kind: entry.kind, route: entry.route, ...metadata });

    let keyboard = null;
    if (entry.state !== '404' && entry.state !== 'legacy') keyboard = await keyboardFocusSample(page, entry.kind === 'Studio' ? 40 : 24);
    keyboardEvidence.push({ kind: entry.kind, route: entry.route, sampled: keyboard?.length ?? 0, controls: keyboard ?? [], state: entry.state ?? 'default' });

    const unexpectedHttp = httpErrors.filter((row) => !expectedLocalMiss(row) && !(entry.state === '404' && row.url.includes(entry.route)));
    const onlyExpected404s = httpErrors.length > 0 && unexpectedHttp.length === 0;
    const unexpectedConsole = consoleErrors.filter((message) => !(onlyExpected404s && message.includes('404')) && !message.includes('[Apexify docs] route error'));
    if (unexpectedHttp.length || unexpectedConsole.length || pageErrors.length) {
      fail(`${entry.kind}: browser errors ${JSON.stringify({ unexpectedHttp, unexpectedConsole, pageErrors })}`);
    }
    routeEvidence.push({ ...entry, status, finalPath, consoleErrors: unexpectedConsole.length, pageErrors: pageErrors.length, unexpectedHttp: unexpectedHttp.length });
  } catch (error) {
    fail(`${entry.kind}: ${error instanceof Error ? error.message : String(error)}`);
    routeEvidence.push({ ...entry, status: 'ERROR', error: error instanceof Error ? error.message : String(error) });
  } finally {
    await page.close();
  }
}

async function auditMobile(route, kind, width) {
  const page = await setupPage({ width, height: width <= 393 ? 844 : width <= 768 ? 1024 : 900 });
  try {
    const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2' });
    if (!response || response.status() !== 200) throw new Error(`HTTP ${response?.status()}`);
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '',
    }));
    if (layout.overflow) fail(`mobile ${kind}@${width}: horizontal overflow ${layout.scrollWidth}/${layout.clientWidth}`);
    if (!/width=device-width/.test(layout.viewportMeta)) fail(`mobile ${kind}@${width}: missing responsive viewport metadata`);
    mobileEvidence.push({ kind, route, width, ...layout, status: 'PASS' });
  } catch (error) {
    fail(`mobile ${kind}@${width}: ${error instanceof Error ? error.message : String(error)}`);
    mobileEvidence.push({ kind, route, width, status: 'FAIL', error: String(error) });
  } finally {
    await page.close();
  }
}

async function auditReducedMotion(route, kind) {
  const page = await setupPage({ reduced: true });
  try {
    const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2' });
    if (!response || response.status() !== 200) throw new Error(`HTTP ${response?.status()}`);
    const result = await page.evaluate(() => {
      const activeInfinite = [];
      for (const element of document.querySelectorAll('*')) {
        const style = getComputedStyle(element);
        const names = style.animationName.split(',').map((value) => value.trim());
        const iterations = style.animationIterationCount.split(',').map((value) => value.trim());
        const durations = style.animationDuration.split(',').map((value) => Number.parseFloat(value) || 0);
        if (names.some((name, index) => name !== 'none' && durations[index] > 0.05 && iterations[index] === 'infinite')) {
          activeInfinite.push({ tag: element.tagName.toLowerCase(), className: element.className?.toString().slice(0, 120) ?? '', names, iterations, durations });
          if (activeInfinite.length >= 20) break;
        }
      }
      return { activeInfinite, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
    });
    if (result.activeInfinite.length) fail(`reduced-motion ${kind}: infinite motion remains ${JSON.stringify(result.activeInfinite.slice(0, 5))}`);
    reducedMotionEvidence.push({ kind, route, status: result.activeInfinite.length ? 'FAIL' : 'PASS', ...result });
  } catch (error) {
    fail(`reduced-motion ${kind}: ${error instanceof Error ? error.message : String(error)}`);
    reducedMotionEvidence.push({ kind, route, status: 'FAIL', error: String(error) });
  } finally {
    await page.close();
  }
}

async function measureJs(route, kind, budgetBytes = null) {
  const page = await setupPage({ cache: false });
  const staticHeaders = [];
  page.on('response', async (response) => {
    if (response.url().includes('/_next/static/') && response.request().resourceType() === 'script') {
      staticHeaders.push({ url: response.url(), cacheControl: response.headers()['cache-control'] ?? '' });
    }
  });
  try {
    const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2' });
    if (!response || response.status() !== 200) throw new Error(`HTTP ${response?.status()}`);
    const metrics = await page.evaluate(() => {
      const scripts = performance.getEntriesByType('resource').filter((entry) => entry.initiatorType === 'script');
      return {
        jsTransferBytes: scripts.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0),
        jsDecodedBytes: scripts.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
        scriptCount: scripts.length,
      };
    });
    const pass = budgetBytes == null || metrics.jsTransferBytes <= budgetBytes;
    if (!pass) fail(`bundle ${kind}: ${metrics.jsTransferBytes} bytes exceeds ${budgetBytes}`);
    bundleEvidence.push({ kind, route, budgetBytes, status: pass ? 'PASS' : 'FAIL', ...metrics });
    cacheEvidence.push({ kind, route, staticHeaders });
  } catch (error) {
    fail(`bundle ${kind}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await page.close();
  }
}

async function auditHttpInfrastructure() {
  const sitemapResponse = await fetch(`${BASE}/sitemap.xml`);
  const sitemapText = await sitemapResponse.text();
  if (!sitemapResponse.ok) fail(`sitemap: HTTP ${sitemapResponse.status}`);
  const canonicalRoutes = [...new Set(ROUTE_MATRIX.filter((row) => row.canonical && row.state !== 'legacy').map((row) => normalizePath(row.canonical)))];
  const missing = canonicalRoutes.filter((route) => !sitemapText.includes(`https://apexifyjs.vercel.app${route === '/' ? '/' : route}`));
  if (missing.length) fail(`sitemap: representative canonical routes missing ${JSON.stringify(missing)}`);
  if (sitemapText.includes('/__docs-fixtures/') || sitemapText.includes('/docs#')) fail('sitemap: non-canonical fixture/hash route leaked');

  const robotsResponse = await fetch(`${BASE}/robots.txt`);
  const robotsText = await robotsResponse.text();
  if (!robotsResponse.ok) fail(`robots: HTTP ${robotsResponse.status}`);
  if (!robotsText.includes('Sitemap: https://apexifyjs.vercel.app/sitemap.xml')) fail('robots: canonical sitemap directive missing');
  if (!robotsText.includes('Disallow: /api/')) fail('robots: API endpoint exclusion missing');

  const pageUrl = `${BASE}/docs/getting-started`;
  const started = performance.now();
  const cold = await fetch(pageUrl);
  await cold.arrayBuffer();
  const coldMs = performance.now() - started;
  const warmStart = performance.now();
  const warm = await fetch(pageUrl);
  await warm.arrayBuffer();
  const warmMs = performance.now() - warmStart;
  const pageCacheControl = warm.headers.get('cache-control') ?? '';
  const staticHeaderRows = cacheEvidence.flatMap((row) => row.staticHeaders ?? []);
  const immutableStaticCount = staticHeaderRows.filter((row) => /immutable/i.test(row.cacheControl) && /max-age=/i.test(row.cacheControl)).length;
  if (staticHeaderRows.length && immutableStaticCount !== staticHeaderRows.length) fail('cache: one or more Next static scripts lack immutable caching');
  cacheEvidence.push({ kind: 'page-cache', route: '/docs/getting-started', coldMs, warmMs, cacheControl: pageCacheControl, staticAssetSamples: staticHeaderRows.length, immutableStaticCount });

  fs.writeFileSync(path.join(OUT, 'seo-infrastructure.json'), `${JSON.stringify({ schemaVersion: 1, sitemap: { status: sitemapResponse.status, bytes: Buffer.byteLength(sitemapText), representativeMissing: missing }, robots: { status: robotsResponse.status, text: robotsText } }, null, 2)}\n`);
}

try {
  for (const entry of ROUTE_MATRIX) await auditMatrixEntry(entry);

  const titleMap = new Map();
  const descriptionMap = new Map();
  for (const row of metadataEvidence.filter((row) => row.kind !== '404' && row.kind !== 'search opened' && row.kind !== 'legacy redirect')) {
    const canonical = normalizePath(row.canonical);
    if (row.title) {
      const prior = titleMap.get(row.title);
      if (prior && prior !== canonical) fail(`metadata: duplicate title across ${prior} and ${canonical}: ${row.title}`);
      titleMap.set(row.title, canonical);
    }
    if (row.description) {
      const prior = descriptionMap.get(row.description);
      if (prior && prior !== canonical) fail(`metadata: duplicate description across ${prior} and ${canonical}`);
      descriptionMap.set(row.description, canonical);
    }
  }

  const mobileRoutes = [
    ['homepage', '/'],
    ['docs', '/docs/getting-started'],
    ['API', '/api-reference'],
    ['example', exampleRoute],
    ['Gallery', '/gallery'],
    ['Studio', '/studio'],
  ];
  for (const [kind, route] of mobileRoutes) for (const width of [320, 375, 393, 768, 1024]) await auditMobile(route, kind, width);

  for (const [kind, route] of [['homepage', '/'], ['docs', '/docs/getting-started'], ['Gallery', '/gallery'], ['Studio', '/studio'], ['playground', '/docs/node/canvas']]) {
    await auditReducedMotion(route, kind);
  }

  await measureJs('/', 'homepage', 220 * 1024);
  await measureJs('/docs/getting-started', 'docs-textual', 180 * 1024);
  await measureJs('/api-reference', 'api-reference');
  await measureJs('/gallery', 'Gallery');
  await measureJs('/studio', 'Studio');
  await measureJs('/docs/node/canvas', 'playground');
  await measureJs(exampleRoute, 'example-detail');

  await auditHttpInfrastructure();
} finally {
  await browser.close();
}

const status = failures.length ? 'FAIL' : 'PASS';
const write = (name, value) => fs.writeFileSync(path.join(OUT, name), `${JSON.stringify(value, null, 2)}\n`);
write('route-matrix.json', { schemaVersion: 1, status, requiredKinds: ROUTE_MATRIX.length, routes: routeEvidence });
write('accessibility.json', { schemaVersion: 1, status: accessibilityEvidence.every((row) => row.criticalOrSerious === 0) ? 'PASS' : 'FAIL', routes: accessibilityEvidence });
write('keyboard.json', { schemaVersion: 1, status: failures.some((message) => message.startsWith('keyboard') || message.startsWith('search')) ? 'FAIL' : 'PASS', routes: keyboardEvidence });
write('mobile.json', { schemaVersion: 1, status: mobileEvidence.every((row) => row.status === 'PASS') ? 'PASS' : 'FAIL', widths: [320, 375, 393, 768, 1024], routes: mobileEvidence });
write('reduced-motion.json', { schemaVersion: 1, status: reducedMotionEvidence.every((row) => row.status === 'PASS') ? 'PASS' : 'FAIL', routes: reducedMotionEvidence });
write('metadata-seo.json', { schemaVersion: 1, status: failures.some((message) => message.startsWith('metadata') || message.includes('canonical') || message.includes('Open Graph') || message.includes('missing title') || message.includes('meta description')) ? 'FAIL' : 'PASS', routes: metadataEvidence });
write('bundle.json', { schemaVersion: 1, status: bundleEvidence.every((row) => row.status === 'PASS') ? 'PASS' : 'FAIL', budgets: { docsTextualGzipTransferBytes: 180 * 1024, homepageGzipTransferBytes: 220 * 1024 }, routes: bundleEvidence });
write('cache-reliability.json', { schemaVersion: 1, status: failures.some((message) => message.startsWith('cache:') || message.startsWith('404:') || message.includes('browser errors')) ? 'FAIL' : 'PASS', records: cacheEvidence });
write('browser-summary.json', { schemaVersion: 1, phase: 'DOC-11', status, failures, matrixKinds: ROUTE_MATRIX.map((row) => row.kind) });

if (failures.length) {
  console.error(`[DOC-11 browser] FAIL count=${failures.length}`);
  process.exit(1);
}
console.log(`[DOC-11 browser] PASS matrix=${ROUTE_MATRIX.length} mobile=${mobileEvidence.length} reduced=${reducedMotionEvidence.length}`);
