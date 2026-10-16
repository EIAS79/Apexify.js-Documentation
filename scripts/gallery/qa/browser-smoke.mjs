#!/usr/bin/env node
/**
 * Optional gallery browser smoke for a served Next build.
 * Requires existing project tooling: puppeteer-core plus CHROME_PATH.
 * Does not submit source to a runner or change gallery data.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const base = (process.env.GALLERY_QA_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const chrome = process.env.CHROME_PATH;
const screenshotDir = process.env.GALLERY_QA_SCREENSHOT_DIR;
if (!chrome) throw new Error('CHROME_PATH must point to Chrome/Chromium');
const views = [
  { name: 'desktop-dark', width: 1440, height: 900, theme: 'dark' },
  { name: 'tablet-dark-reduced', width: 768, height: 1024, theme: 'dark', reduced: true },
  { name: 'mobile-light', width: 390, height: 844, theme: 'light' },
  { name: 'narrow-dark', width: 320, height: 760, theme: 'dark' },
];
const evidence = { base, results: [], errors: [] };
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function checkView(view) {
  const page = await browser.newPage();
  const entry = { view: view.name, viewport: view.width + 'x' + view.height };
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  try {
    await page.setViewport({ width: view.width, height: view.height });
    await page.evaluateOnNewDocument(theme => {
      localStorage.setItem('apexify-theme', theme);
    }, view.theme);
    if (view.reduced) {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    }
    const response = await page.goto(base + '/gallery', {
      waitUntil: 'networkidle2', timeout: 60000,
    });
    if (response?.status() !== 200) throw new Error('Gallery HTTP ' + response?.status());
    entry.cardCount = await page.$$eval('.apx-gallery-card__button', cards => cards.length);
    if (entry.cardCount < 1) throw new Error('No Gallery cards found');
    const geom = await page.evaluate(() => ({
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
    }));
    entry.geometry = geom;
    if (geom.documentScrollWidth > geom.documentClientWidth + 1) {
      throw new Error('Document horizontal overflow by ' +
        (geom.documentScrollWidth - geom.documentClientWidth) + 'px');
    }
    if (screenshotDir) {
      await mkdir(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, view.name + '-gallery.png'), fullPage: true });
    }

    // On desktop and mobile, verify the inspector can open and Escape closes it.
    await page.click('.apx-gallery-card__button');
    await page.waitForSelector('[role="dialog"][aria-modal="true"]');
    const dialogGeom = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      const r = dialog.getBoundingClientRect();
      return { width: r.width, left: r.left, right: r.right };
    });
    if (dialogGeom.left < -1 || dialogGeom.right > view.width + 1) {
      throw new Error('Inspector escapes viewport');
    }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'));

    // Prefer a template with actual displayed source.
    const sourceCard = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.apx-gallery-card')];
      const item = cards.find(card => card.querySelector('.apx-gallery-card__meta')?.textContent?.includes('source'));
      if (!item) return false;
      item.querySelector('button')?.click();
      return true;
    });
    if (sourceCard) {
      await page.waitForSelector('[role="dialog"][aria-modal="true"]');
      const codeLength = await page.evaluate(() => {
        const root = document.querySelector('.apx-gallery-inspector');
        const code = root?.querySelector('.cm-content, pre code, [class*="language-"]');
        return code?.textContent?.trim().length || 0;
      });
      // Some gallery sources have a delayed editor; don't pretend zero-length code is valid.
      if (codeLength < 15) {
        await page.waitForFunction(() => {
          const root = document.querySelector('.apx-gallery-inspector');
          const code = root?.querySelector('.cm-content, pre code, [class*="language-"]');
          return (code?.textContent?.trim().length ?? 0) >= 15;
        }, { timeout: 5000 });
      }
      entry.sourceInspector = 'PASS';
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'));
    } else {
      entry.sourceInspector = 'NOT AVAILABLE';
    }

    // Check metadata from the actual playable modal video, not only file extension.
    const videoCard = await page.$('.apx-gallery-card[data-media="video"] .apx-gallery-card__button');
    if (videoCard) {
      await videoCard.click();
      await page.waitForSelector('[role="dialog"] video[controls]');
      entry.video = await page.evaluate(async () => {
        const video = document.querySelector('[role="dialog"] video[controls]');
        video.preload = 'metadata';
        video.load();
        await new Promise((resolve, reject) => {
          if (video.readyState >= 1) return resolve();
          const timeout = setTimeout(() => reject(new Error('Video metadata timeout')), 15000);
          video.addEventListener('loadedmetadata', () => { clearTimeout(timeout); resolve(); }, { once: true });
          video.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Video metadata error')); }, { once: true });
        });
        return { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
      });
      if (!Number.isFinite(entry.video.duration) || entry.video.duration <= 0 ||
          entry.video.width <= 0 || entry.video.height <= 0) {
        throw new Error('MP4 has zero/non-finite duration or invalid dimensions');
      }
    } else {
      entry.video = 'NOT AVAILABLE';
    }
    if (runtimeErrors.length) throw new Error('Browser runtime errors: ' + runtimeErrors.join(' | '));
    entry.status = 'PASS';
  } catch (error) {
    entry.status = 'FAIL';
    entry.error = error instanceof Error ? error.message : String(error);
    evidence.errors.push(view.name + ': ' + entry.error);
  } finally {
    evidence.results.push(entry);
    await page.close();
  }
}

try {
  for (const view of views) await checkView(view);
} finally {
  await browser.close();
}
const output = JSON.stringify(evidence, null, 2) + '\n';
console.log(output);
if (process.env.GALLERY_QA_REPORT) {
  await writeFile(process.env.GALLERY_QA_REPORT, output);
}
if (evidence.errors.length) process.exitCode = 1;
