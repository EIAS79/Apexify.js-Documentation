import puppeteer from 'puppeteer-core';

const base = process.env.STUDIO_VISUAL_BASE_URL || 'http://127.0.0.1:3000';
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('[studio-visual:phase17-browser] CHROME_PATH required');

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
  if (!response || response.status() >= 400) {
    throw new Error('Studio HTTP ' + response?.status());
  }
  await page.waitForSelector('[data-studio-shell]');
  const mode = await page.$eval('[data-studio-shell]', (node) => node.getAttribute('data-studio-mode'));
  if (mode !== 'visual') {
    await page.click('[data-studio-code-panel]:not([hidden]) [data-studio-mode-tab="visual"]');
  }
  await page.waitForSelector('[data-studio-visual-workspace][data-active="true"]');
}

async function assertNoOverflow(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error(label + ': horizontal overflow');
}

async function verifyDesktopHardening(page) {
  const layerSeparator = '[aria-label="Resize Layers panel"]';
  await page.waitForSelector(layerSeparator, { visible: true });
  const beforeLayers = Number(
    await page.$eval(layerSeparator, (node) => node.getAttribute('aria-valuenow')),
  );
  await page.focus(layerSeparator);
  await page.keyboard.press('ArrowRight');
  const afterLayers = Number(
    await page.$eval(layerSeparator, (node) => node.getAttribute('aria-valuenow')),
  );
  if (!(afterLayers > beforeLayers)) throw new Error('Layers separator keyboard resize failed');

  await page.click('[data-phase17-collapse-layers]');
  await page.waitForSelector('[data-studio-visual-workspace][data-phase17-layers-collapsed="true"]');
  await page.click('[data-phase17-show-layers]');
  await page.waitForFunction(
    () => !document.querySelector('[data-studio-visual-workspace]')?.hasAttribute('data-phase17-layers-collapsed'),
  );

  await page.click('[data-phase17-collapse-inspector]');
  await page.waitForSelector('[data-studio-visual-workspace][data-phase17-inspector-collapsed="true"]');
  await page.click('[data-phase17-show-inspector]');

  const dockSeparator = '[aria-label="Resize bottom dock and Timeline"]';
  await page.waitForSelector(dockSeparator, { visible: true });
  const beforeDock = Number(
    await page.$eval(dockSeparator, (node) => node.getAttribute('aria-valuenow')),
  );
  await page.focus(dockSeparator);
  await page.keyboard.press('ArrowUp');
  const afterDock = Number(
    await page.$eval(dockSeparator, (node) => node.getAttribute('aria-valuenow')),
  );
  if (!(afterDock > beforeDock)) throw new Error('Dock separator keyboard resize failed');

  await page.click('[data-feature-tool="gif"]');
  await page.waitForSelector('[data-dock-tab="timeline"][data-active="true"]', { visible: true });
  const dockCollapsed = await page.$eval('.apx-pre4-dock', (node) => node.getAttribute('data-collapsed'));
  if (dockCollapsed === 'true') throw new Error('Timeline did not expand the dock');

  await page.click('[data-dock-tab="generated"]');
  await page.waitForSelector('[data-visual-generate-code]:not([disabled])', { visible: true });
  await page.focus('[data-visual-generate-code]');
  await page.click('[data-visual-generate-code]');
  await page.waitForSelector('[data-visual-code-modal]', { visible: true });
  await page.waitForFunction(
    () => Boolean(document.activeElement?.closest?.('[data-visual-code-modal]')),
  );
  for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab');
  const escapedModal = await page.evaluate(
    () => !document.activeElement?.closest?.('[data-visual-code-modal]'),
  );
  if (escapedModal) throw new Error('Generated-code modal leaked keyboard focus');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[data-visual-code-modal]', { hidden: true });
  const restored = await page.evaluate(
    () => document.activeElement?.matches?.('[data-visual-generate-code]') ?? false,
  );
  if (!restored) throw new Error('Modal focus was not restored to the trigger');

  await page.click('[data-feature-tool="canvas"]');
  await page.select('[data-canvas-base-mode]', 'color');
  await page.click('[data-canvas-color-text]');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type('#234567');
  await page.keyboard.press('Tab');

  await page.waitForFunction(() => {
    const raw = localStorage.getItem('apexify-visual-autosave-v2');
    if (!raw) return false;
    try {
      const saved = JSON.parse(raw);
      return saved?.version === 2 && saved?.project?.document?.canvas?.colorBg === '#234567';
    } catch {
      return false;
    }
  });

  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-studio-visual-workspace][data-active="true"]');
  await page.waitForFunction(
    () => document.querySelector('[data-canvas-color-text]')?.value === '#234567',
  );

  await page.evaluate(() => {
    const raw = localStorage.getItem('apexify-visual-autosave-v2');
    if (!raw) throw new Error('Phase-17 autosave missing before stale-code test');
    const saved = JSON.parse(raw);
    saved.code.baseProjectSignature = 'v1-stale-project';
    saved.code.source = 'const stale = true;';
    localStorage.setItem('apexify-visual-autosave-v2', JSON.stringify(saved));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-phase15-code-conflict]', { visible: true });
  const conflict = await page.$eval('[data-phase15-code-conflict]', (node) => node.textContent || '');
  if (!/older Visual Project|stale/i.test(conflict)) {
    throw new Error('Stale recovered code was not quarantined');
  }

  await page.evaluate(() => {
    localStorage.setItem('apexify-visual-autosave-v2', '{corrupt-json');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-studio-visual-workspace][data-active="true"]');
  const corruptBackedUp = await page.evaluate(
    () => Object.keys(localStorage).some((key) => key.startsWith('apexify-visual-autosave-v2-corrupt-')),
  );
  if (!corruptBackedUp) throw new Error('Corrupt autosave was not backed up before recovery');
}

for (const [name, width, height] of matrix) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument(() => {
    if (!sessionStorage.getItem('phase17-browser-initialized')) {
      localStorage.clear();
      localStorage.setItem('apexify-theme', 'dark');
      sessionStorage.setItem('phase17-browser-initialized', '1');
    }
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await openVisual(page);
  await assertNoOverflow(page, name);

  if (name === 'desktop') {
    await verifyDesktopHardening(page);
    await assertNoOverflow(page, name + ' after hardening interactions');
  }

  if (errors.length) throw new Error(name + ': page errors: ' + JSON.stringify(errors));
  await page.close();
}

await browser.close();
console.log('[studio-visual:phase17-browser] PASS');
