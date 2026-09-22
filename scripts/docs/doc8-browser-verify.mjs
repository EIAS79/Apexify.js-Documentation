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
    const collapsed = await page.waitForSelector('[data-post-doc12-workbench="collapsed"]');
    if (!collapsed) throw new Error(`${name}: deferred workbench collapsed state missing`);
    if (await page.$('[data-doc8-primitive="editor"]')) {
      throw new Error(`${name}: editor primitive mounted before workbench activation`);
    }

    const activated = await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === 'Show code & preview');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    });
    if (!activated) throw new Error(`${name}: Show code & preview activation control missing`);
    await page.waitForSelector('[data-post-doc12-workbench]:not([data-post-doc12-workbench="collapsed"])', { timeout: 30000 });

    for (const primitive of ['editor', 'preview', 'diagnostics', 'workspace']) {
      if (!(await page.$(`[data-doc8-primitive="${primitive}"]`))) {
        throw new Error(`${name}: shared ${primitive} primitive missing`);
      }
    }
    const truth = await page.$eval('[data-doc8-primitive="preview"]', (element) => element.textContent || '');
    if (!truth.includes('Verified output')) throw new Error(`${name}: verified preview truth label missing`);
    const diagnosticText = await page.$eval('[data-doc8-primitive="diagnostics"]', (element) => element.textContent || '');
    if (!diagnosticText.includes('DOC-5 verified output')) throw new Error(`${name}: provenance diagnostic missing`);

    const workbenchControls = await page.evaluate(() => [...document.querySelectorAll('[data-post-doc12-workbench] button')].map((node) => node.textContent?.trim()));
    for (const required of ['Copy code', 'Reset', 'Open in Studio']) {
      if (!workbenchControls.includes(required)) throw new Error(`${name}: ${required} workbench control missing`);
    }
    const copied = await page.evaluate(() => {
      const button = [...document.querySelectorAll('[data-post-doc12-workbench] button')].find((node) => node.textContent?.trim() === 'Copy code');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    });
    if (!copied) throw new Error(`${name}: Copy code control could not be activated`);
    await page.waitForFunction(() => typeof window.__doc8Clipboard === 'string' && window.__doc8Clipboard.length > 0);

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
    if (!bodyText.includes('@apexify/web')) {
      throw new Error(`${name}: Studio browser-direct runtime disclosure missing`);
    }
    if (!bodyText.includes('auto')) {
      throw new Error(`${name}: Studio automatic runtime routing disclosure missing`);
    }
  }

  if (kind === 'ordinary') {
    if (await page.$('[data-doc8-representative-playground], [data-post-doc12-workbench]')) {
      throw new Error(`${name}: ordinary route unexpectedly mounted DOC-8 playground/workbench`);
    }
    if (await page.$('[data-doc8-primitive="editor"]')) {
      throw new Error(`${name}: ordinary route unexpectedly mounted editor primitive`);
    }
  }

  // Keyboard/focus checks above may scroll controls into view. Reset before the
  // document-wide axe pass so fixed/sticky chrome does not partially cover
  // otherwise valid off-screen targets and create false target-size failures.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addScriptTag({ content: axeSource });
  const axeViolations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    }));
  });
  if (axeViolations.length) throw new Error(`${name}: axe ${JSON.stringify(axeViolations)}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error(`${name}: horizontal overflow`);

  let reducedMotionOk = true;
  if (reduced) {
    reducedMotionOk = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[data-doc8-primitive], [data-doc8-representative-playground] *, [data-post-doc12-workbench] *')];
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
      scripts: scripts.map((entry) => ({
        path: new URL(entry.name).pathname,
        bytes: entry.transferSize || entry.encodedBodySize || 0,
      })).sort((a, b) => b.bytes - a.bytes),
    };
  });
  await page.close();
  return result;
}

async function runStudioSmoke(name, code, {
  files = [],
  minOutputs = 1,
  expectedMimes = [],
} = {}) {
  const response = await fetch(`${base}/api/gallery/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      lang: 'ts',
      context: 'studio',
      files,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`${name}: Studio runner returned non-JSON HTTP ${response.status}`);
  }

  if (!response.ok || !data?.ok) {
    throw new Error(`${name}: Studio execution failed HTTP ${response.status}: ${data?.error || 'unknown error'}`);
  }
  if (data.runtime !== 'same-origin-isolated') {
    throw new Error(`${name}: expected same-origin-isolated runtime, got ${JSON.stringify(data.runtime)}`);
  }

  const outputs = Array.isArray(data.outputs) ? data.outputs : [];
  if (outputs.length < minOutputs) {
    throw new Error(`${name}: expected at least ${minOutputs} outputs, got ${outputs.length}`);
  }

  for (const mime of expectedMimes) {
    if (!outputs.some((output) => output?.mime === mime)) {
      throw new Error(`${name}: missing expected output mime ${mime}; got ${outputs.map((output) => output?.mime).join(', ')}`);
    }
  }

  return {
    name,
    elapsedMs: data.elapsedMs ?? null,
    outputCount: outputs.length,
    mimes: outputs.map((output) => output?.mime).filter(Boolean),
  };
}

const workspaceSmokeCode = `import { ApexPainter } from 'apexify.js';
import { makeCanvasConfig } from './helper.ts';

async function main() {
  const painter = new ApexPainter({ type: 'buffer' });
  const canvas = await painter.createCanvas(makeCanvasConfig());
  return [canvas.buffer, { workspace: 'ok', files: 2 }];
}

return await main();`;

const workspaceSmokeFiles = [{
  name: 'helper.ts',
  language: 'ts',
  source: `export function makeCanvasConfig() {
  return { width: 128, height: 72, colorBg: '#17315f' };
}`,
}];

const sceneSmokeCode = `import { ApexPainter } from 'apexify.js';

async function main() {
  const painter = new ApexPainter({ type: 'buffer' });
  painter.assets.loadPalette('brand', {
    bg: '#08111f',
    panel: '#17213a',
    accent: '#60a5fa',
    text: '#f8fafc',
  });

  const scene = painter.createScene({ width: 320, height: 180 });
  scene.setBackground({ colorBg: '$brand.bg' });
  scene.addLayers([
    ...painter.components.card.toLayers({
      x: 20, y: 20, width: 280, height: 138,
      radius: 16,
      background: '$brand.panel',
      borderColor: '$brand.accent',
      borderWidth: 2,
      title: 'Studio full runtime',
      titleColor: '$brand.text',
      titleFontSize: 22,
      body: 'Scene + components + named assets',
      bodyColor: '$brand.text',
      bodyFontSize: 14,
      padding: 18,
    }),
  ]);

  return scene.render({ resolveAssetRefs: true });
}

return await main();`;

const gifSmokeCode = `import { ApexPainter } from 'apexify.js';

async function main() {
  const painter = new ApexPainter({ type: 'buffer' });
  const first = await painter.createCanvas({ width: 128, height: 72, colorBg: '#0b1020' });
  const second = await painter.createCanvas({ width: 128, height: 72, colorBg: '#5b21b6' });

  return painter.createGIF([
    { buffer: first.buffer, duration: 120 },
    { buffer: second.buffer, duration: 120 },
  ], {
    outputFormat: 'buffer',
    width: 128,
    height: 72,
    repeat: 0,
    quality: 10,
    delay: 120,
  });
}

return await main();`;

const videoSmokeCode = `import { ApexPainter } from 'apexify.js';

async function main() {
  const painter = new ApexPainter({ type: 'buffer' });
  const first = await painter.createCanvas({ width: 128, height: 72, colorBg: '#0b1020' });
  const second = await painter.createCanvas({ width: 128, height: 72, colorBg: '#2563eb' });

  return painter.createVideo({
    source: first.buffer,
    createFromFrames: {
      frames: [first.buffer, second.buffer, first.buffer],
      outputPath: 'studio-smoke.mp4',
      fps: 2,
      format: 'mp4',
      quality: 'medium',
    },
  });
}

return await main();`;

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
  if (availability.enabled !== true || availability.mode !== 'same-origin-isolated') {
    throw new Error(`production isolated execution boundary mismatch: ${JSON.stringify(availability)}`);
  }

  const runtimeSmokes = [];
  runtimeSmokes.push(await runStudioSmoke('workspace-multi-output', workspaceSmokeCode, {
    files: workspaceSmokeFiles,
    minOutputs: 2,
    expectedMimes: ['image/png', 'application/json'],
  }));
  runtimeSmokes.push(await runStudioSmoke('scene-components-assets', sceneSmokeCode, {
    expectedMimes: ['image/png'],
  }));
  runtimeSmokes.push(await runStudioSmoke('gif', gifSmokeCode, {
    expectedMimes: ['image/gif'],
  }));
  runtimeSmokes.push(await runStudioSmoke('video', videoSmokeCode, {
    expectedMimes: ['video/mp4'],
  }));

  const deniedNetwork = await fetch(`${base}/api/gallery/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: 'studio',
      lang: 'ts',
      code: `async function main() {
  await fetch('https://example.com/');
  return 'network-should-be-denied';
}
return await main();`,
    }),
  });
  if (deniedNetwork.status !== 422) {
    throw new Error(`isolated Studio network access should fail with 422, got ${deniedNetwork.status}`);
  }

  routeEvidence.push({
    name: 'studio-runtime-smokes',
    route: '/api/gallery/run',
    width: 0,
    height: 0,
    theme: 'n/a',
    reduced: false,
    runtimeSmokes,
    networkDeniedStatus: deniedNetwork.status,
  });

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
    unsandboxedProductionExecution: false,
    productionMode: 'same-origin-isolated',
    publicUserSourceExecution: true,
    arbitraryNetworkAccess: false,
    mediaSubprocessPolicy: 'fixed-ffmpeg-proxy-only',
  },
  performance: performanceEvidence,
};
fs.writeFileSync(path.join(outDir, 'browser.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log('[doc8-browser] PASS', JSON.stringify(evidence));