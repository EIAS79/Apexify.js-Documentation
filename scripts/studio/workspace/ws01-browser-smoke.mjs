#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const chrome = process.env.CHROME_PATH;
const base = process.env.STUDIO_WS01_BASE_URL || 'http://127.0.0.1:3000';
const output = process.env.STUDIO_WS01_EVIDENCE || 'generated/studio/workspace/ws01-browser';
if (!chrome) throw new Error('CHROME_PATH is required');

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const screens = [['desktop', 1440, 900], ['wide', 1920, 1080], ['laptop', 1280, 720], ['compact', 1024, 768], ['tablet', 820, 1180], ['tablet-small', 768, 1024], ['mobile', 390, 844], ['small', 320, 568]];
await mkdir(output, { recursive: true });
const results = [];

try {
  for (const [name, width, height] of screens) {
    const page = await browser.newPage();
    const failures = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.setCacheEnabled(false);
      await page.setViewport({ width, height, isMobile: width < 600, hasTouch: width < 600 });
      const response = await page.goto(base + '/studio/workspace', { waitUntil: 'domcontentloaded', timeout: 90000 });
      if (![200,304].includes(response?.status())) throw new Error('preview HTTP ' + response?.status());
      await page.waitForSelector('[data-workspace-studio]', { timeout: 90000 });
      await page.waitForSelector('[data-studio-visual-workspace][data-active="true"]', { timeout: 60000 });
      await page.waitForSelector('.ws01-canvas-onboarding', { timeout: 30000 });
      const visualDockDefault = await page.$eval('.apx-pre4-dock', element => element.getAttribute('data-collapsed'));
      if (visualDockDefault !== 'true') failures.push('Workspace Visual dock must start collapsed');
      await page.screenshot({ path: path.join(output, name + '-visual.png'), fullPage: true });
      const disabledGraph = await page.$eval('.ws01-modes button[aria-label="Graph not yet available"]', b => b.disabled);
      if (!disabledGraph) failures.push('Graph feature falsely enabled');
      const before = await page.$eval('.ws01-main', e => e.clientWidth);
      await page.click('button[aria-label="Templates"]');
      await page.waitForSelector('.ws01-drawer .ws01-template');
      const after = await page.$eval('.ws01-main', e => e.clientWidth);
      if (width >= 1200 && after >= before) failures.push('Drawer did not reclaim/use a new width');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.ws01-drawer'));
      await page.click('.ws01-modes button:nth-child(2)');
      await page.waitForFunction(() => document.querySelector('[data-ws01-current-mode]')?.getAttribute('data-ws01-current-mode') === 'code');
      if (width < 760) {
        const visibleOutput = await page.evaluate(() => [...document.querySelectorAll('.studio-output-panel')].some(node => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }));
        if (visibleOutput) failures.push('Compact Code Studio must focus source unless Preview is explicitly selected');
      }
      await page.click('button[aria-label="Use light theme"]');
      const lightTheme = await page.$eval('[data-workspace-studio]', el => el.getAttribute('data-ws01-theme'));
      if (lightTheme !== 'light') failures.push('Light theme toggle did not update shell tokens');
      await page.click('button[aria-label="Use dark theme"]');
      await page.click('button[aria-controls="ws01-inspector"]');
      await page.waitForSelector('.ws01-inspector .ws01-facts');
      const propertyMetrics = await page.$eval('.ws01-inspector', el => ({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
      if (propertyMetrics.clientHeight < 120) failures.push('Inspector too short to use');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.ws01-inspector'));
      await page.click('button[aria-controls="ws01-dock"]');
      await page.waitForSelector('.ws01-dock .ws01-dock-body');
      await page.click('.ws01-dock-tabs button:nth-child(2)');
      await page.waitForFunction(() => document.querySelector('.ws01-dock-tabs button:nth-child(2)')?.getAttribute('aria-pressed') === 'true');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.ws01-dock'));
            await page.click('button[aria-label="Assets"]');
      await page.waitForSelector('.ws01-drawer');
      await page.click('button[aria-label="Close panel"]');
      await page.waitForFunction(() => !document.querySelector('.ws01-drawer'));
      const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
      if (overflow > 1) failures.push('Document horizontal overflow ' + overflow);
      const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('apexify-workspace-layout-ws01-v1') || '{}'));
      if (persisted.theme !== 'dark') failures.push('Layout/theme preference did not persist');
      if (width >= 1200) {
        await page.click('button[aria-label="Templates"]');
        const resizer = await page.$('.ws01-resizer--drawer');
        if (!resizer) failures.push('Accessible desktop resizer missing');
        else {
          await resizer.focus();
          const initial = await page.$eval('.ws01-resizer--drawer', el => Number(el.getAttribute('aria-valuenow')));
          await page.keyboard.press('ArrowRight');
          const resized = await page.$eval('.ws01-resizer--drawer', el => Number(el.getAttribute('aria-valuenow')));
          if (resized <= initial) failures.push('Keyboard resize did not change drawer width');
        }
        await page.keyboard.press('Escape');
      }
      if (errors.length) failures.push('Browser JS errors: ' + errors.join(' | '));
      await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
      results.push({ name, width, height, status: failures.length ? 'FAIL' : 'PASS', failures, overflow });
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
      results.push({ name, width, height, status: 'FAIL', failures });
      try { await page.screenshot({ path: path.join(output, name + '-failure.png') }); } catch {}
    } finally { await page.close(); }
  }
} finally { await browser.close(); }

await writeFile(path.join(output, 'report.json'), JSON.stringify({ phase: 'WS-01', route: '/studio/workspace', stage: 'compatibility-shell-only', results }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
