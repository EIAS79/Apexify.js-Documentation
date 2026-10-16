#!/usr/bin/env node
/** Run against a local built Next server, not a Vercel-protected preview.
 * Requires puppeteer-core and an installed Chrome/Chromium.
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.APEXIFY_SMOKE_URL || 'http://127.0.0.1:3000';
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('CHROME_PATH is required');
const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const errors = [];
const results = [];
const shots = process.env.APEXIFY_SMOKE_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });

async function visit(view) {
  const page = await browser.newPage();
  const findings = { ...view, status: 'PASS' };
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  try {
    // Next production responds 304 across sequential independent browser pages
    // with reused cache validators. Disable cache, then assert rendered DOM.
    await page.setCacheEnabled(false);
    await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' });
    await page.setViewport({ width: view.width, height: view.height });
    if (view.reduced) {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    }
    let res = await page.goto(base + '/gallery', { waitUntil: 'networkidle2', timeout: 90000 });
    if (res?.status() !== 200 && res?.status() !== 304) throw new Error('Gallery HTTP ' + res?.status());
    await page.waitForSelector('.motion-field .field-stage');
    const title = await page.$eval('.field-intro h1', el => el.textContent?.trim());
    if (!title?.toLowerCase().includes('explore')) throw new Error('Selected Gallery concept missing');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) throw new Error('Horizontal overflow ' + overflow + 'px');
    const missingBadFixtures = await page.evaluate(() => {
      const names = document.body.textContent || '';
      return !names.includes('Render a bar chart') &&
        !names.includes('Build a multi-file chart report');
    });
    if (!missingBadFixtures) throw new Error('Basic chart fixtures remain in showcase');

    // The staged motion study is backed by an actual video.
    const video = await page.$('.field-stage-center video');
    if (!video) throw new Error('Motion stage video not found');
    await page.waitForFunction(() => {
      const video = document.querySelector('.field-stage-center video');
      return video && (video.readyState >= 1 || video.error);
    }, { timeout: 20000 });
    const meta = await page.$eval('.field-stage-center video', node => ({
      duration: node.duration, width: node.videoWidth, height: node.videoHeight,
    }));
    if (!Number.isFinite(meta.duration) || meta.duration <= 0 || meta.width < 1 || meta.height < 1)
      throw new Error('Motion metadata missing: ' + JSON.stringify(meta));
    findings.video = meta;
    if (shots) await page.screenshot({ path: path.join(shots, view.name + '-gallery.png'), fullPage: true });

    // Navigate each first-class section using the actual UI.
    for (const name of ['Use Cases', 'Templates', 'Examples', 'Explore']) {
      const section = await page.$eval('.field-sections', (el, wanted) => {
        const button = [...el.querySelectorAll('button')].find(x => x.textContent?.includes(wanted));
        if (!button) return false;
        button.click();
        return true;
      }, name);
      if (!section) throw new Error(name + ' section missing');
      await page.waitForFunction(wanted => {
        const button = [...document.querySelectorAll('.field-sections button')]
          .find(x => x.textContent?.includes(wanted));
        return button?.getAttribute('aria-pressed') === 'true';
      }, {}, name);
    }
    // Select a real standalone source-backed card and inspect it.
    await page.$eval('.field-sections', el => {
      [...el.querySelectorAll('button')].find(x => x.textContent?.includes('Templates'))?.click();
    });
    await page.waitForSelector('.field-stage-center .field-player');
    const inspect = await page.$('.field-detail-action .field-primary');
    if (!inspect) throw new Error('Template inspector action missing');
    await inspect.click();
    await page.waitForSelector('.field-dialog[open]', { timeout: 15000 });
    await page.$eval('.field-segment[aria-label="Example view"]', el => {
      [...el.querySelectorAll('button')].find(x => x.textContent?.includes('Full source'))?.click();
    });
    await page.waitForFunction(() => document.querySelector('.field-code-scroll')?.textContent?.includes('ApexPainter'), { timeout: 15000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.field-dialog[open]'));

    // API uses the same Frame theme provider as the updated Docs.
    res = await page.goto(base + '/api-reference', { waitUntil: 'networkidle2', timeout: 90000 });
    if (res?.status() !== 200 && res?.status() !== 304) throw new Error('API HTTP ' + res?.status());
    await page.waitForSelector('.apx-api-root .apx-doc-root[data-frame-theme]');
    await page.waitForSelector('input[aria-label="Search API exports"]');
    const cardsBefore = await page.$$eval('.apx-api-explorer .apx-api-reference-card', nodes => nodes.length);
    if (cardsBefore < 1) throw new Error('No actual API export cards');
    await page.type('input[aria-label="Search API exports"]', 'ApexPainter');
    await page.waitForFunction(() => [...document.querySelectorAll('.apx-api-explorer .apx-api-reference-card strong')]
      .some(x => x.textContent?.includes('ApexPainter')));
    const apiOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (apiOverflow > 1) throw new Error('API horizontal overflow ' + apiOverflow + 'px');
    if (shots) await page.screenshot({ path: path.join(shots, view.name + '-api.png'), fullPage: true });
    if (pageErrors.length) throw new Error('Browser errors: ' + pageErrors.join(' | '));
  } catch (err) {
    findings.status = 'FAIL';
    findings.error = err instanceof Error ? err.message : String(err);
    errors.push(view.name + ': ' + findings.error);
  } finally {
    results.push(findings);
    await page.close();
  }
}

try {
  await visit({ name: 'desktop', width: 1440, height: 900 });
  await visit({ name: 'mobile', width: 390, height: 844 });
  await visit({ name: 'reduced', width: 768, height: 1024, reduced: true });
} finally { await browser.close(); }
console.log(JSON.stringify({ status: errors.length ? 'FAIL' : 'PASS', results, errors }, null, 2));
if (errors.length) process.exitCode = 1;
