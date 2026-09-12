import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.env.DOC8_BASE_URL || 'http://127.0.0.1:3000';
const baseline = process.env.DOC8_BASELINE_URL || 'http://127.0.0.1:3001';
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('[doc8-browser] CHROME_PATH required');
const outDir = path.join(process.cwd(), 'generated', 'docs-doc8', 'runtime');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const routeEvidence = [];
const performanceEvidence = [];

async function installStableClientState(page, theme = 'light') {
  await page.evaluateOnNewDocument((selectedTheme) => {
    localStorage.clear();
    localStorage.setItem('apexify-theme', selectedTheme);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => { window.__doc8Clipboard = String(text); },
        readText: async () => window.__doc8Clipboard || '',
      },
    });
  }, theme);
}

function expectedLocalMiss(row, origin) {
  const url = new URL(row.url);
  return row.status === 404 && url.origin === origin && (
    url.pathname === '/favicon.ico' || url.pathname === '/_vercel/speed-insights/script.js'
  );
}

async function auditRoute({ route, name, width, height, theme = 'light', reduced = false, kind }) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width, height });
  await installStableClientState(page, theme);
  if (reduced) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }

  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
  });

  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle2' });
  if (!response || response.status() !== 200) {
    throw new Error(`${name}: expected HTTP 200, received ${response?.status()}`);
  }

  if (kind === 'docs-playground') {
    await page.waitForSelector('[data-doc8-representative-playground="verified-example"]');
    for (const primitive of ['editor', 'preview', 'diagnostics', 'workspace']) {
      if (!(await page.$(`[data-doc8-primitive="${primitive}"]`))) {
        throw new Error(`${name}: shared ${primitive} primitive missing`);
      }
    }
    const truth = await page.$eval('[data-doc8-primitive="preview"]', (element) => element.textContent || '');
    if (!truth.includes('Verified output')) throw new Error(`${name}: verified preview truth label missing`);
    const diagnosticText = await page.$eval('[data-doc8-primitive="diagnostics"]', (element) => element.textContent || '');
    if (!diagnosticText.includes('DOC-5 verified output')) throw new Error(`${name}: provenance diagnostic missing`);

    const copyButton = await page.$('[data-doc8-action="copy-share-state"]');
    if (!copyButton) throw new Error(`${name}: local share-state control missing`);
    await copyButton.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => (window.__doc8Clipboard || '').includes('"schemaVersion":1'));

    if (width >= 768) {
      const separator = await page.$('[data-doc8-primitive="workspace"] [role="separator"]');
      if (!separator) throw new Error(`${name}: keyboard separator missing`);
      const before = Number(await page.$eval('[data-doc8-primitive="workspace"] [role="separator"]', (element) => element.getAttribute('aria-valuenow')));
      await separator.focus();
      await page.keyboard.press('ArrowLeft');
      const after = Number(await page.$eval('[data-doc8-primitive="workspace"] [role="separator"]', (element) => element.getAttribute('aria-valuenow')));
      if (!(after < before)) throw new Error(`${name}: keyboard pane resize failed`);
    }
  }

  if (kind === 'studio') {
    await page.waitForSelector('[data-doc8-primitive="editor"]');
    await page.waitForSelector('[data-doc8-primitive="workspace"]');
    await page.waitForSelector('[data-doc8-primitive="preview"]');
    const bodyText = await page.evaluate(() => document.body.textContent || '');
    if (!bodyText.includes('Public arbitrary code execution is unavailable')) {
      throw new Error(`${name}: Studio execution boundary disclosure missing`);
    }
    if (!bodyText.includes('not a security sandbox')) {
      throw new Error(`${name}: Studio must explicitly avoid sandbox overclaiming`);
    }
  }

  if (kind === 'ordinary') {
    if (await page.$('[data-doc8-representative-playground]')) {
      throw new Error(`${name}: ordinary route unexpectedly mounted DOC-8 playground`);
    }
    if (await page.$('[data-doc8-primitive="editor"]')) {
      throw new Error(`${name}: ordinary route unexpectedly mounted editor primitive`);
    }
  }

  await page.addScriptTag({ content: axeSource });
  const axeViolations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    }));
  });
  if (axeViolations.length) throw new Error(`${name}: axe ${JSON.stringify(axeViolations)}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error(`${name}: horizontal overflow`);

  let reducedMotionOk = true;
  if (reduced) {
    reducedMotionOk = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[data-doc8-primitive], [data-doc8-representative-playground] *')];
      return nodes.every((element) => {
        const style = getComputedStyle(element);
        const transitions = style.transitionDuration.split(',').map((value) => Number.parseFloat(value) || 0);
        const animations = style.animationDuration.split(',').map((value) => Number.parseFloat(value) || 0);
        return Math.max(...transitions, 0) <= 0.05 && Math.max(...animations, 0) <= 0.05;
      });
    });
    if (!reducedMotionOk) throw new Error(`${name}: reduced-motion contract failed`);
  }

  const origin = new URL(base).origin;
  const unexpectedHttp = httpErrors.filter((row) => !expectedLocalMiss(row, origin));
  const onlyExpected404s = httpErrors.length > 0 && unexpectedHttp.length === 0;
  const unexpectedConsole = consoleErrors.filter((message) => !(onlyExpected404s && message.includes('404')));
  if (unexpectedHttp.length || unexpectedConsole.length || pageErrors.length) {
    throw new Error(`${name}: browser errors ${JSON.stringify({ unexpectedHttp, unexpectedConsole, pageErrors })}`);
  }

  routeEvidence.push({ name, route, width, height, theme, reduced, axeViolations, overflow, reducedMotionOk });
  await page.close();
}

async function jsTransfer(origin, route) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1365, height: 900 });
  await installStableClientState(page, 'light');
  const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle2' });
  if (!response || response.status() !== 200) throw new Error(`measure ${origin}${route}: HTTP ${response?.status()}`);
  const result = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter((entry) => entry.initiatorType === 'script');
    return {
      jsTransferBytes: scripts.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0),
      scriptCount: scripts.length,
    };
  });
  await page.close();
  return result;
}

try {
  await auditRoute({ route: '/docs/node/canvas', name: 'docs-desktop-light', width: 1440, height: 1000, kind: 'docs-playground' });
  await auditRoute({ route: '/docs/node/canvas', name: 'docs-mobile-dark', width: 390, height: 844, theme: 'dark', kind: 'docs-playground' });
  await auditRoute({ route: '/docs/node/canvas', name: 'docs-reduced-dark', width: 1440, height: 1000, theme: 'dark', reduced: true, kind: 'docs-playground' });
  await auditRoute({ route: '/studio', name: 'studio-desktop-light', width: 1440, height: 1000, kind: 'studio' });
  await auditRoute({ route: '/studio', name: 'studio-mobile-dark', width: 390, height: 844, theme: 'dark', kind: 'studio' });
  await auditRoute({ route: '/docs/getting-started', name: 'ordinary-docs', width: 1365, height: 900, kind: 'ordinary' });
  await auditRoute({ route: '/', name: 'homepage', width: 1365, height: 900, kind: 'ordinary' });
  await auditRoute({ route: '/gallery', name: 'gallery-closed', width: 1365, height: 900, kind: 'ordinary' });

  const availability = await fetch(`${base}/api/gallery/run`).then((response) => response.json());
  if (availability.enabled !== false || availability.mode !== 'unavailable') {
    throw new Error(`production execution boundary mismatch: ${JSON.stringify(availability)}`);
  }
  const rejected = await fetch(`${base}/api/gallery/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'console.log(process.env)', lang: 'js', context: 'studio' }),
  });
  if (rejected.status !== 503) throw new Error(`public arbitrary execution should be rejected with 503, got ${rejected.status}`);

  for (const route of ['/studio', '/docs/node/canvas', '/docs/getting-started', '/', '/gallery']) {
    const [before, after] = await Promise.all([jsTransfer(baseline, route), jsTransfer(base, route)]);
    const deltaBytes = after.jsTransferBytes - before.jsTransferBytes;
    const deltaPct = before.jsTransferBytes ? (deltaBytes / before.jsTransferBytes) * 100 : null;
    const row = { route, baseline: before, current: after, deltaBytes, deltaPct };
    performanceEvidence.push(row);
    if (['/docs/getting-started', '/', '/gallery'].includes(route)) {
      const material = deltaBytes > 80 * 1024 && (deltaPct ?? 0) > 10;
      if (material) throw new Error(`ordinary route JS regression: ${JSON.stringify(row)}`);
    }
  }
} finally {
  await browser.close();
}

const evidence = {
  schemaVersion: 1,
  phase: 'DOC-8',
  routes: routeEvidence,
  executionBoundary: {
    publicArbitraryExecution: false,
    productionMode: 'unavailable',
    rejectedStatus: 503,
  },
  performance: performanceEvidence,
};
fs.writeFileSync(path.join(outDir, 'browser.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log('[doc8-browser] PASS', JSON.stringify(evidence));