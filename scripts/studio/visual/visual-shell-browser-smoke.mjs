import puppeteer from 'puppeteer-core';

const base = process.env.STUDIO_VISUAL_BASE_URL || 'http://127.0.0.1:3000';
const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('[studio-visual-shell] CHROME_PATH required');

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function verify(width, height) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width, height });
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
    localStorage.setItem('apexify-theme', 'dark');
  });

  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const response = await page.goto(base + '/studio', { waitUntil: 'networkidle2' });
  if (!response || response.status() >= 400) throw new Error('Studio HTTP ' + response?.status());

  await page.waitForSelector('[data-studio-shell][data-studio-mode="code"]');
  await page.waitForSelector('.cm-editor');

  const original = await page.$eval('.cm-content', (node) => node.textContent || '');
  if (!original.includes('ApexPainter')) throw new Error('Code Studio starter source missing');

  await page.click('[data-studio-code-panel]:not([hidden]) [data-studio-mode-tab="visual"]');
  await page.waitForSelector('[data-studio-shell][data-studio-mode="visual"]');
  await page.waitForSelector('[data-studio-visual-workspace]');

  const visualText = await page.$eval('[data-studio-visual-workspace]', (node) => node.textContent || '');
  for (const label of ['Apexify Studio', 'Canvas', 'Layers', 'Style', 'Transform', 'Code', 'Assets', 'Diagnostics', 'History', 'Visual workspace ready']) {
    if (!visualText.includes(label)) throw new Error('Visual shell missing ' + label);
  }

  if (width === 1440) {
    // Phase 4: real Canvas Inspector edits must propagate into the live linked code.
    await page.select('[data-canvas-base-mode]', 'color');
    await page.click('[data-canvas-color-text]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.type('#123456');
    await page.waitForFunction(() => {
      const content = document.querySelector('[data-visual-live-code] .cm-content')?.textContent || '';
      return content.includes('colorBg: "#123456"');
    });

    await page.click('[data-inspector-tab="transform"]');
    await page.click('[data-canvas-dimension="width"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.type('1024');
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => {
      const content = document.querySelector('[data-visual-live-code] .cm-content')?.textContent || '';
      return content.includes('width: 1024');
    });

    // Phase 5: Shapes is a real authoring surface. Inserting a native shape
    // must create a semantic layer, generate createImage(), and render through
    // the authoritative Apexify Web artboard frame.
    await page.click('[data-feature-tool="shapes"]');
    await page.waitForSelector('[data-visual-shapes-context]', { visible: true });
    await page.click('[data-shape-insert="rectangle"]');
    await page.waitForSelector('[data-visual-node][data-kind="shape"][data-selected="true"]', { visible: true });
    await page.waitForFunction(() => {
      const content = document.querySelector('[data-visual-live-code] .cm-content')?.textContent || '';
      return content.includes('createImage') && content.includes('source: "rectangle"');
    });
    await page.waitForSelector('[data-authoritative-apexify-frame]', { visible: true });

    // Phase 6: Text is a real authoring surface. Insert a text layer, prove
    // canonical createText() live code, then edit its content directly on the
    // artboard and verify the linked source changes automatically.
    await page.click('[data-feature-tool="text"]');
    await page.waitForSelector('[data-visual-text-context]', { visible: true });
    await page.click('[data-text-insert]');
    const selectedTextSelector = '[data-visual-node][data-kind="text"][data-selected="true"]';
    await page.waitForSelector(selectedTextSelector, { visible: true });
    await page.waitForFunction(() => {
      const content = document.querySelector('[data-visual-live-code] .cm-content')?.textContent || '';
      return content.includes('createText') && content.includes('text: "Text"');
    });
    await page.click(selectedTextSelector, { clickCount: 2 });
    await page.waitForSelector('[data-inline-text-editor]', { visible: true });
    await page.click('[data-inline-text-editor]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.type('Edited in Visual');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await page.waitForFunction(() => {
      const content = document.querySelector('[data-visual-live-code] .cm-content')?.textContent || '';
      return content.includes('createText') && content.includes('text: "Edited in Visual"');
    });
    await page.waitForSelector('[data-authoritative-apexify-frame]', { visible: true });

    await page.screenshot({ path: '/tmp/studio-visual-pre4.png', fullPage: false });
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) throw new Error(width + 'x' + height + ' horizontal overflow');

  await page.click('[data-studio-visual-panel]:not([hidden]) [data-studio-mode-tab="code"]');
  await page.waitForSelector('[data-studio-shell][data-studio-mode="code"]');

  const restored = await page.$eval('.cm-content', (node) => node.textContent || '');
  if (restored !== original) throw new Error('Code Studio session changed after mode round trip');

  // Generate Code now opens an in-place code modal instead of switching modes.
  await page.click('[data-studio-code-panel]:not([hidden]) [data-studio-mode-tab="visual"]');
  await page.waitForSelector('[data-studio-shell][data-studio-mode="visual"]');
  await page.waitForSelector('[data-visual-live-code]');
  await page.waitForSelector('[data-visual-generate-code]:not([disabled])', { visible: true });
  await page.click('[data-visual-generate-code]');
  await page.waitForSelector('[data-visual-code-modal]', { visible: true });
  await page.waitForFunction(() => {
    const content = document.querySelector('[data-visual-code-modal] .cm-content')?.textContent || '';
    return content.includes('createCanvas') &&
      (content.includes('createImage') || content.includes('return canvas.buffer'));
  });
  await page.click('[data-visual-code-modal-close]');

  // Top Preview opens a closable canvas modal.
  await page.waitForSelector('[data-visual-preview-modal-trigger]:not([disabled])', { visible: true });
  await page.click('[data-visual-preview-modal-trigger]');
  await page.waitForSelector('[data-visual-preview-modal]', { visible: true });
  await page.click('[data-visual-preview-modal-close]');

  // Desktop Export still preserves the explicit Visual → Code Studio handoff path.
  if (width >= 1000) {
    await page.click('.apx-vw-project-menu > summary');
    await page.waitForSelector('[data-visual-open-generated-code]:not([disabled])', { visible: true });
    await page.click('[data-visual-open-generated-code]');
    await page.waitForSelector('[data-studio-shell][data-studio-mode="code"]');

    await page.waitForFunction(() => {
      const panels = [...document.querySelectorAll('[data-studio-code-panel]:not([hidden]) .cm-content')];
      return panels.some((node) => {
        const content = node.textContent || '';
        return content.includes('createCanvas') &&
          (content.includes('createImage') || content.includes('return canvas.buffer'));
      });
    });
  }

  if (errors.length) throw new Error('page errors: ' + JSON.stringify(errors));

  await page.close();
}

await verify(1440, 900);
await verify(390, 844);

await browser.close();
console.log('[studio-visual-shell] PASS');
