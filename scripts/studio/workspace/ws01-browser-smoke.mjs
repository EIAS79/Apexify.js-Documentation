#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const chrome = process.env.CHROME_PATH;
const base = process.env.STUDIO_WS01_BASE_URL || 'http://127.0.0.1:3000';
const output = process.env.STUDIO_WS01_EVIDENCE || 'generated/studio/workspace/ws01-browser';
if (!chrome) throw new Error('CHROME_PATH is required');

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const screens = [['desktop', 1440, 900], ['tablet', 820, 1180], ['mobile', 390, 844], ['small', 320, 568]];
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
      const disabledGraph = await page.$eval('.ws01-modes button[aria-label="Graph not yet available"]', b => b.disabled);
      if (!disabledGraph) failures.push('Graph feature falsely enabled');
      const before = await page.$eval('.ws01-main', e => e.clientWidth);
      await page.click('button[aria-label="Templates"]');
      await page.waitForSelector('.ws01-drawer .ws01-template');
      const after = await page.$eval('.ws01-main', e => e.clientWidth);
      if (width >= 1020 && after >= before) failures.push('Drawer did not reclaim/use a new width');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('.ws01-drawer'));
      await page.click('.ws01-modes button:nth-child(2)');
      await page.waitForFunction(() => document.querySelector('[data-ws01-current-mode]')?.getAttribute('data-ws01-current-mode') === 'code');
      await page.click('button[aria-label="Assets"]');
      await page.waitForSelector('.ws01-drawer');
      await page.click('button[aria-label="Close panel"]');
      await page.waitForFunction(() => !document.querySelector('.ws01-drawer'));
      const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
      if (overflow > 1) failures.push('Document horizontal overflow ' + overflow);
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
