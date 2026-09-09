import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE_URL = process.env.DOC2_BASE_URL ?? 'http://127.0.0.1:3000';
const CHROME_PATH = process.env.CHROME_PATH;
if (!CHROME_PATH) throw new Error('[doc2-baseline] CHROME_PATH is required');
const OUT = path.join(process.cwd(), '.doc2-baseline-evidence');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox','--disable-dev-shm-usage'] });

async function audit({ name, width, height, mode, systemDark = false, reduced = false }) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('speed-insights')) consoleErrors.push(m.text()); });
  page.on('requestfailed', r => { if (!r.url().includes('speed-insights')) requestFailures.push(`${r.failure()?.errorText ?? 'failed'} ${r.url()}`); });
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
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__doc2Perf.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
  }, mode);
  await page.goto(`${BASE_URL}/docs/node/canvas`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-doc-article]');
  await page.addScriptTag({ content: axeSource });
  const data = await page.evaluate(async () => {
    const all = Array.from(document.querySelectorAll('*'));
    const interactive = Array.from(document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="radio"]'));
    const smallTargets = interactive.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    });
    const motion = all.filter((el) => {
      const cs = getComputedStyle(el);
      const durations = `${cs.transitionDuration},${cs.animationDuration}`.split(',').map(v => parseFloat(v) || 0);
      return cs.animationName !== 'none' || durations.some(v => v > 0.02);
    });
    const resources = performance.getEntriesByType('resource').map((r) => ({ name: r.name, transferSize: r.transferSize, initiatorType: r.initiatorType }));
    const js = resources.filter((r) => /\.js($|\?)/.test(r.name));
    const axe = await window.axe.run(document, { resultTypes: ['violations'] });
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    return {
      resolvedTheme: theme,
      overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      skipLinkCount: document.querySelectorAll('a[href="#main-content"],a[href="#docs-content"]').length,
      smallTargetCount: smallTargets.length,
      motionElementCount: motion.length,
      customCursorActive: document.documentElement.classList.contains('has-custom-cursor'),
      sidebarTriggerExpanded: document.querySelector('button[aria-label="Toggle docs navigation"]')?.getAttribute('aria-expanded') ?? null,
      mobileTocDialogRole: document.querySelector('[aria-label="On this page"]')?.closest('[role="dialog"]')?.getAttribute('role') ?? null,
      jsRequestCount: js.length,
      transferredJsBytes: js.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      requestCount: resources.length,
      perf: window.__doc2Perf,
      axe: {
        violations: axe.violations.length,
        serious: axe.violations.filter(v => v.impact === 'serious').length,
        critical: axe.violations.filter(v => v.impact === 'critical').length,
        ids: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })).sort((a,b)=>a.id.localeCompare(b.id)),
      },
    };
  });
  const screenshot = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.close();
  return { name, viewport: `${width}x${height}`, mode, systemDark, reduced, ...data, consoleErrors, requestFailures, screenshot: path.basename(screenshot) };
}

try {
  const states = [];
  states.push(await audit({ name: 'desktop-light', width: 1440, height: 900, mode: 'light' }));
  states.push(await audit({ name: 'desktop-dark', width: 1440, height: 900, mode: 'dark' }));
  states.push(await audit({ name: 'tablet-system-dark', width: 768, height: 1024, mode: 'system', systemDark: true }));
  states.push(await audit({ name: 'mobile-light', width: 390, height: 844, mode: 'light' }));
  states.push(await audit({ name: 'narrow-mobile-dark', width: 320, height: 720, mode: 'dark' }));
  states.push(await audit({ name: 'desktop-reduced', width: 1440, height: 900, mode: 'dark', systemDark: true, reduced: true }));
  const buildEvidencePath = path.join(process.cwd(), '.doc1-runtime-evidence', 'build-bundle.json');
  const build = fs.existsSync(buildEvidencePath) ? JSON.parse(fs.readFileSync(buildEvidencePath, 'utf8')) : null;
  const result = {
    schemaVersion: 1,
    phase: 'DOC-2',
    kind: 'starting-baseline',
    startingSha: process.env.DOC2_STARTING_SHA ?? null,
    route: '/docs/node/canvas',
    build,
    sourceCssBytes: fs.statSync(path.join(process.cwd(), 'app', 'globals.css')).size,
    states,
  };
  fs.writeFileSync(path.join(OUT, 'baseline.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log('[doc2-baseline] ' + JSON.stringify({ states: states.length, sourceCssBytes: result.sourceCssBytes, routedBytes: build?.routedDocsManifestBytes ?? null }));
} finally {
  await browser.close();
}
