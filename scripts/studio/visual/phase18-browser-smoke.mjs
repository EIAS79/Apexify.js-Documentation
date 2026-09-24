import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.env.STUDIO_VISUAL_BASE_URL || 'http://127.0.0.1:3000';
const chrome = process.env.CHROME_PATH;
const fixturePath = path.resolve('generated/studio/phase18-proof-projects.json');
if (!fs.existsSync(fixturePath)) {
  throw new Error('[studio-visual:phase18-browser] generate fixtures first');
}
const releaseFixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf8')).fixtures ?? [];
if (!chrome) throw new Error('[studio-visual:phase18-browser] CHROME_PATH required');

const matrix = [
  ['desktop', 1440, 900],
  ['laptop', 1100, 800],
  ['tablet', 820, 1180],
  ['mobile', 390, 844],
];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function openVisual(page) {
  const response = await page.goto(base + '/studio', { waitUntil: 'networkidle2' });
  if (!response || response.status() >= 400) throw new Error('Studio HTTP ' + response?.status());
  await page.waitForSelector('[data-studio-shell]');
  const mode = await page.$eval('[data-studio-shell]', (node) => node.getAttribute('data-studio-mode'));
  if (mode !== 'visual') {
    await page.click('[data-studio-code-panel]:not([hidden]) [data-studio-mode-tab="visual"]');
  }
  await page.waitForSelector('[data-studio-visual-workspace][data-active="true"]');
}

async function noOverflow(page, name) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error(name + ': document horizontal overflow');
}

async function audit(page, name) {
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    const root = document.querySelector('[data-studio-visual-workspace]');
    if (!root || !window.axe) return [];
    const result = await window.axe.run(root, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
    return result.violations
      .filter((item) => item.impact === 'critical')
      .map((item) => ({ id: item.id, nodes: item.nodes.slice(0, 5).map((node) => node.target) }));
  });
  if (violations.length) throw new Error(name + ': critical accessibility violations ' + JSON.stringify(violations));
}

async function waitForDownload(dir, extension, previous = new Set()) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const files = fs.readdirSync(dir).filter((name) => !name.endsWith('.crdownload'));
    const match = files.find((name) => name.endsWith(extension) && !previous.has(name));
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('Timed out waiting for ' + extension + ' download');
}

async function representativeProjectProof(page) {
  for (const fixture of releaseFixtures) {
    await page.evaluate((envelope) => {
      sessionStorage.setItem('phase18-browser-fixture', JSON.stringify(envelope));
    }, fixture.envelope);
    await page.reload({ waitUntil: 'networkidle2' });
    await openVisual(page);

    await page.click('[data-dock-tab="generated"]');
    await page.waitForSelector('[data-visual-live-code]', { visible: true });
    const syncText = await page.$eval(
      '[data-visual-live-code] .apx-live-sync-state',
      (node) => node.textContent || '',
    );
    if (!/synced/i.test(syncText)) {
      throw new Error(fixture.id + ': linked canonical code is not synced');
    }

    await page.click('[data-visual-generate-code]');
    await page.waitForSelector('[data-visual-code-modal]', { visible: true });
    const quality = await page.$eval(
      '[data-visual-code-modal] .apx-phase15-code-quality',
      (node) => node.textContent || '',
    );
    if (!/Canonical export/i.test(quality)) {
      throw new Error(fixture.id + ': generated-code modal is not canonical');
    }
    await page.click('[data-visual-code-modal-close]');
    await page.waitForSelector('[data-visual-code-modal]', { hidden: true });

    await page.click('[data-visual-preview-modal-trigger]');
    await page.waitForSelector('[data-visual-preview-modal]', { visible: true });
    await page.waitForFunction(() => {
      const modal = document.querySelector('[data-visual-preview-modal]');
      return Boolean(modal?.querySelector('img, audio, video')) ||
        Boolean(modal?.textContent?.includes('Preview unavailable'));
    }, { timeout: 90000 });

    const previewState = await page.$eval(
      '[data-visual-preview-modal]',
      (node) => ({
        failed: node.textContent?.includes('Preview unavailable') ?? false,
        media: Boolean(node.querySelector('img, audio, video')),
      }),
    );
    if (previewState.failed || !previewState.media) {
      throw new Error(fixture.id + ': production Preview path produced no authoritative artifact');
    }
    await page.click('[data-visual-preview-modal-close]');
    await page.waitForSelector('[data-visual-preview-modal]', { hidden: true });
    console.log('[studio-visual:phase18-browser] representative UI PASS ' + fixture.id);
  }
}

async function desktopReleaseProof(page) {
  const requiredTools = [
    'canvas','images','text','charts','shapes','paths','components',
    'assets','gif','audio','video','advanced',
  ];
  for (const tool of requiredTools) {
    const selector = '[data-feature-tool="' + tool + '"]';
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    await page.waitForFunction(
      (value) => document.querySelector('[data-feature-tool="' + value + '"]')?.getAttribute('data-active') === 'true',
      {},
      tool,
    );
  }

  await page.click('[data-feature-tool="canvas"]');

  for (const tab of ['style','transform','effects','data','advanced']) {
    const selector = '[data-inspector-tab="' + tab + '"]';
    const exists = await page.$(selector);
    if (!exists) throw new Error('Inspector tab missing: ' + tab);
    await page.click(selector);
  }

  for (const tab of ['generated','diagnostics','assets','history']) {
    const selector = '[data-dock-tab="' + tab + '"]';
    await page.waitForSelector(selector);
    await page.click(selector);
    await page.waitForFunction(
      (value) => document.querySelector('[data-dock-tab="' + value + '"]')?.getAttribute('data-active') === 'true',
      {},
      tab,
    );
  }

  // Timeline is deliberately contextual: activating GIF/audio/video must expose it.
  await page.click('[data-feature-tool="gif"]');
  await page.waitForSelector('[data-dock-tab="timeline"]', { visible: true });
  await page.waitForFunction(
    () => document.querySelector('[data-dock-tab="timeline"]')?.getAttribute('data-active') === 'true',
  );
  await page.click('[data-feature-tool="canvas"]');
  await page.click('[data-dock-tab="generated"]');

  const downloads = fs.mkdtempSync(path.join(os.tmpdir(), 'apexify-phase18-'));
  const cdp = await page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

  await page.waitForSelector('[data-visual-preview-modal-trigger]:not([disabled])', { visible: true });
  await page.click('[data-visual-preview-modal-trigger]');
  await page.waitForSelector('[data-visual-preview-modal]', { visible: true });
  await page.waitForFunction(() => {
    const modal = document.querySelector('[data-visual-preview-modal]');
    return Boolean(modal?.querySelector('img, audio, video')) ||
      Boolean(modal?.textContent?.includes('Preview unavailable'));
  }, { timeout: 30000 });
  const previewError = await page.$eval(
    '[data-visual-preview-modal]',
    (node) => node.textContent?.includes('Preview unavailable') ?? false,
  );
  if (previewError) throw new Error('Top Preview modal failed to render the default Visual Project');

  const previewName = '[data-visual-preview-modal] .apx-vmodal-subbar input';
  await page.click(previewName);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type('Phase 18 Release Proof');
  const zoomBefore = await page.$eval('[data-visual-preview-modal] .apx-vmodal-zoom', (node) => node.textContent);
  await page.click('[data-visual-preview-modal] button[title="Zoom in"]');
  const zoomAfter = await page.$eval('[data-visual-preview-modal] .apx-vmodal-zoom', (node) => node.textContent);
  if (zoomBefore === zoomAfter) throw new Error('Preview modal zoom control did not update');

  const beforePreviewDownload = new Set(fs.readdirSync(downloads));
  await page.click('[data-visual-preview-modal] .apx-vmodal-primary');
  await waitForDownload(downloads, '.png', beforePreviewDownload).catch(async () => {
    // Advanced formats are valid; require any completed Preview download if not PNG.
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const files = fs.readdirSync(downloads).filter((name) => !name.endsWith('.crdownload'));
      if (files.some((name) => !beforePreviewDownload.has(name))) return;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error('Preview download produced no file');
  });
  await page.click('[data-visual-preview-modal-close]');
  await page.waitForSelector('[data-visual-preview-modal]', { hidden: true });

  await page.click('[data-visual-generate-code]');
  await page.waitForSelector('[data-visual-code-modal]', { visible: true });
  const sourceText = await page.$eval('[data-visual-code-modal]', (node) => node.textContent || '');
  if (!/Generated Code|Apexify/.test(sourceText)) throw new Error('Generate Code modal has no generated source surface');

  const fileInput = '[data-visual-code-modal] .apx-vmodal-subbar input[type="text"], [data-visual-code-modal] .apx-vmodal-subbar input:not([type])';
  await page.click(fileInput);
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type('phase18-release.ts');
  const beforeCodeDownload = new Set(fs.readdirSync(downloads));
  await page.click('[data-visual-code-modal] .apx-vmodal-primary');
  await waitForDownload(downloads, '.ts', beforeCodeDownload);
  await page.click('[data-visual-code-modal-close]');
  await page.waitForSelector('[data-visual-code-modal]', { hidden: true });

  const exportDetails = 'details.apx-pre4-export';
  await page.click(exportDetails + ' > summary');
  await page.waitForSelector('[data-phase15-single-file-export]', { visible: true });
  const beforeSingle = new Set(fs.readdirSync(downloads));
  await page.click('[data-phase15-single-file-export]');
  await waitForDownload(downloads, '.ts', beforeSingle);

  // The export menu remains open after the single-file download; keep it open
  // and exercise the project bundle action from the same menu state.
  await page.waitForSelector('[data-phase15-project-export]', { visible: true });
  const beforeBundle = new Set(fs.readdirSync(downloads));
  await page.click('[data-phase15-project-export]');
  await waitForDownload(downloads, '.zip', beforeBundle);

  if (!(await page.$('.apx-pre4-layers'))) throw new Error('Layers/context panel missing');
  if (!(await page.$('.apx-pre4-inspector'))) throw new Error('Inspector missing');
  if (!(await page.$('[data-visual-live-code]'))) throw new Error('Live Code dock missing');

  fs.rmSync(downloads, { recursive: true, force: true });
}

for (const [name, width, height] of matrix) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument(() => {
    if (!sessionStorage.getItem('phase18-browser-initialized')) {
      localStorage.clear();
      localStorage.setItem('apexify-theme', 'dark');
      sessionStorage.setItem('phase18-browser-initialized', '1');
    }
    const fixture = sessionStorage.getItem('phase18-browser-fixture');
    if (fixture) {
      localStorage.setItem('apexify-visual-autosave-v2', fixture);
      sessionStorage.removeItem('phase18-browser-fixture');
    }
  });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await openVisual(page);
  await noOverflow(page, name);
  await audit(page, name);

  if (name === 'desktop') {
    await desktopReleaseProof(page);
    await representativeProjectProof(page);
    await noOverflow(page, name + '-post-proof');
  }

  if (pageErrors.length) throw new Error(name + ': page errors ' + JSON.stringify(pageErrors));
  await page.close();
}

await browser.close();
console.log('[studio-visual:phase18-browser] PASS');
