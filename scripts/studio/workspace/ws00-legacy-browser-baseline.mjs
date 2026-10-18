#!/usr/bin/env node
/**
 * WS-00 legacy browser baseline. Read-only: visits routes, records layout
 * observations and screenshots; no code Run, upload or data migration.
 * Existing overflow is evidence for WS-01/11, not hidden by a false pass.
 */
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.STUDIO_WS00_BASE_URL || 'http://127.0.0.1:3000';
const chrome = process.env.CHROME_PATH;
const output = process.env.STUDIO_WS00_OUTPUT || 'generated/studio/workspace/ws00-browser';
if (!chrome) throw new Error('CHROME_PATH is required for browser evidence');

const layouts = [
  ['mobile-small', 320, 568],
  ['mobile', 390, 844],
  ['tablet', 820, 1180],
  ['laptop', 1280, 720],
  ['desktop', 1440, 900],
];
const routes = [
  ['/studio', null],
  ['/studio/legacy/code', 'code'],
  ['/studio/legacy/visual', 'visual'],
];
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
await mkdir(output, { recursive: true });
const observations = [];
let blockingFailures = 0;

try {
  for (const [layout, width, height] of layouts) {
    for (const [route, expectedMode] of routes) {
      const page = await browser.newPage();
      const faults = [];
      page.on('pageerror', err => faults.push(err.message));
      const name = layout + '-' + route.replaceAll('/', '_').replace(/^_/, '');
      let record = { layout, route, width, height, expectedMode, status: 'PASS' };
      try {
        await page.setCacheEnabled(false);
        await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' });
        await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
        const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
        const status = response?.status() ?? 0;
        if (status !== 200 && status !== 304) throw new Error('HTTP ' + status);
        await page.waitForSelector('[data-studio-shell]', { timeout: 40000 });
        if (expectedMode === 'visual') {
          await page.waitForSelector('[data-studio-visual-workspace][data-active="true"]', { timeout: 40000 });
        }
        const snapshot = await page.evaluate(() => {
          const root = document.querySelector('[data-studio-shell]');
          const doc = document.documentElement;
          const visible = selector => {
            const node = document.querySelector(selector);
            return node && node.getBoundingClientRect().width > 0 &&
              getComputedStyle(node).display !== 'none';
          };
          const code = document.querySelector('[data-studio-code-panel]');
          const visual = document.querySelector('[data-studio-visual-panel]');
          return {
            mode: root?.getAttribute('data-studio-mode'),
            isLegacy: root?.getAttribute('data-legacy-studio') === 'true',
            docHorizontalOverflowPx: Math.max(0, doc.scrollWidth - doc.clientWidth),
            documentWidth: doc.clientWidth,
            codePanelHidden: !code || code.hasAttribute('hidden'),
            visualPanelHidden: !visual || visual.hasAttribute('hidden'),
            visibleCanvas: Boolean(visible('[data-studio-visual-workspace]')),
          };
        });
        record = { ...record, ...snapshot, errors: faults.slice(0, 6) };
        if (expectedMode && snapshot.mode !== expectedMode) {
          throw new Error('Legacy mode mismatch: expected ' + expectedMode + ', got ' + snapshot.mode);
        }
        if (expectedMode && !snapshot.isLegacy) throw new Error('Legacy route lost its identity');
        if (snapshot.docHorizontalOverflowPx > 1) record.layoutFinding = 'EXISTING_HORIZONTAL_OVERFLOW';
        await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
      } catch (error) {
        blockingFailures++;
        record.status = 'FAIL';
        record.error = error instanceof Error ? error.message : String(error);
        try { await page.screenshot({ path: path.join(output, name + '-failure.png') }); } catch {}
      } finally {
        observations.push(record);
        await page.close();
      }
      console.log('[ws00-browser]', name, record.status, record.error || record.layoutFinding || '');
    }
  }
} finally {
  await browser.close();
}
await writeFile(path.join(output, 'report.json'), JSON.stringify({
  schemaVersion: 1,
  phase: 'WS-00',
  intent: 'pre-redesign baseline; known layout flaws are recorded without mislabelling new Studio acceptance',
  blockingFailures,
  observations,
}, null, 2) + '\n');
if (blockingFailures) process.exitCode = 1;
