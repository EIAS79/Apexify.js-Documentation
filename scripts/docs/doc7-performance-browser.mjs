import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const chrome = process.env.CHROME_PATH;
if (!chrome) throw new Error('[doc7-performance] CHROME_PATH required');
const currentBase = process.env.DOC7_BASE_URL || 'http://127.0.0.1:3000';
const baselineBase = process.env.DOC7_BASELINE_URL || 'http://127.0.0.1:3001';
const root = process.cwd();
const outDir = path.join(root, 'generated', 'docs-doc7', 'runtime');
const currentBuild = JSON.parse(fs.readFileSync(path.join(outDir, 'current-build.json'), 'utf8'));
const baselineBuild = JSON.parse(fs.readFileSync(path.join(outDir, 'baseline-build.json'), 'utf8'));

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function measure(baseUrl, route) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.__doc7Perf = { cls: 0, lcp: 0, longTasks: [] };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__doc7Perf.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length) window.__doc7Perf.lcp = entries[entries.length - 1].startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__doc7Perf.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
      }).observe({ type: 'longtask', buffered: true });
    } catch {}
  });

  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle2' });
  if (!response || response.status() !== 200) throw new Error(`[doc7-performance] ${baseUrl}${route} status ${response?.status()}`);
  await new Promise((resolve) => setTimeout(resolve, 800));

  let interactionResponseMs = null;
  if (route === '/gallery') {
    interactionResponseMs = await page.evaluate(async () => {
      const button = document.querySelector('button[aria-label="Open search"]');
      if (!(button instanceof HTMLButtonElement)) return null;
      const start = performance.now();
      button.click();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return performance.now() - start;
    });
  }

  const metrics = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    const transfer = (entry) => entry.transferSize || entry.encodedBodySize || 0;
    const byType = (predicate) => resources.filter(predicate).reduce((sum, entry) => sum + transfer(entry), 0);
    const navigation = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? 0;
    const longTasks = window.__doc7Perf?.longTasks ?? [];
    const loadBlockingMs = longTasks.reduce((sum, entry) => sum + Math.max(0, entry.duration - 50), 0);
    return {
      requestCount: resources.length + 1,
      jsTransferBytes: byType((entry) => /\.js(?:\?|$)/.test(entry.name)),
      cssTransferBytes: byType((entry) => /\.css(?:\?|$)/.test(entry.name)),
      imageTransferBytes: byType((entry) => entry.initiatorType === 'img' || /\.(?:png|jpe?g|webp|avif|svg)(?:\?|$)/i.test(entry.name)),
      mediaTransferBytes: byType((entry) => ['video', 'audio'].includes(entry.initiatorType) || /\.(?:gif|mp4|webm|wav|mp3|m4a|ogg)(?:\?|$)/i.test(entry.name)),
      lcpMs: Number((window.__doc7Perf?.lcp ?? 0).toFixed(3)),
      cls: Number((window.__doc7Perf?.cls ?? 0).toFixed(5)),
      fcpMs: Number(fcp.toFixed(3)),
      domContentLoadedMs: Number((navigation?.domContentLoadedEventEnd ?? 0).toFixed(3)),
      loadBlockingMs: Number(loadBlockingMs.toFixed(3)),
    };
  });
  metrics.interactionResponseMs = interactionResponseMs == null ? null : Number(interactionResponseMs.toFixed(3));
  await page.close();
  return metrics;
}

function delta(before, after) {
  if (before === 0) return after === 0 ? 0 : null;
  return Number((((after - before) / before) * 100).toFixed(2));
}

try {
  const baseline = { home: await measure(baselineBase, '/'), gallery: await measure(baselineBase, '/gallery') };
  const current = { home: await measure(currentBase, '/'), gallery: await measure(currentBase, '/gallery') };

  const evidence = {
    schemaVersion: 1,
    phase: 'DOC-7',
    methodology: 'Same-runner production servers with cache disabled. LCP/CLS use Chromium PerformanceObserver; transfer/request values use Resource Timing. interactionResponseMs is a two-animation-frame Gallery search-open lab proxy, not INP. loadBlockingMs is long-task blocking above 50 ms, not field TBT/INP.',
    baselineBuild,
    currentBuild,
    baseline,
    current,
    deltaPercent: {
      homepageFirstLoadJs: delta(baselineBuild.homepageFirstLoadJsBytes, currentBuild.homepageFirstLoadJsBytes),
      galleryFirstLoadJs: delta(baselineBuild.galleryFirstLoadJsBytes, currentBuild.galleryFirstLoadJsBytes),
      homepageJsTransfer: delta(baseline.home.jsTransferBytes, current.home.jsTransferBytes),
      galleryJsTransfer: delta(baseline.gallery.jsTransferBytes, current.gallery.jsTransferBytes),
      css: delta(baselineBuild.cssBytes, currentBuild.cssBytes),
      lcpHome: delta(baseline.home.lcpMs, current.home.lcpMs),
      lcpGallery: delta(baseline.gallery.lcpMs, current.gallery.lcpMs),
      clsHome: delta(baseline.home.cls, current.home.cls),
      clsGallery: delta(baseline.gallery.cls, current.gallery.cls),
      interactionGallery: baseline.gallery.interactionResponseMs == null || current.gallery.interactionResponseMs == null ? null : delta(baseline.gallery.interactionResponseMs, current.gallery.interactionResponseMs),
      requestsHome: delta(baseline.home.requestCount, current.home.requestCount),
      requestsGallery: delta(baseline.gallery.requestCount, current.gallery.requestCount),
      buildTime: delta(baselineBuild.buildWallMs, currentBuild.buildWallMs),
    },
    targets: { lcpMs: 2500, cls: 0.1, interactionProxyMs: 200 },
  };

  const failures = [];
  for (const [route, metrics] of Object.entries(current)) {
    if (!(metrics.lcpMs > 0)) failures.push(`${route} LCP was not measurable`);
    if (metrics.lcpMs >= 4000) failures.push(`${route} LCP ${metrics.lcpMs} ms is a major regression threshold breach`);
    if (metrics.cls >= 0.1) failures.push(`${route} CLS ${metrics.cls} breaches 0.1`);
  }
  if (current.gallery.interactionResponseMs == null) failures.push('Gallery interaction proxy was not measurable');
  else if (current.gallery.interactionResponseMs >= 200) failures.push(`Gallery interaction proxy ${current.gallery.interactionResponseMs} ms breaches 200 ms`);
  if (currentBuild.homepageFirstLoadJsBytes > baselineBuild.homepageFirstLoadJsBytes * 1.25 + 50_000) failures.push('Homepage route JS has a major unexplained regression');
  if (currentBuild.galleryFirstLoadJsBytes > baselineBuild.galleryFirstLoadJsBytes * 1.25 + 75_000) failures.push('Gallery route JS has a major unexplained regression');
  if (current.home.jsTransferBytes > baseline.home.jsTransferBytes * 1.35 + 75_000) failures.push('Homepage transferred JS has a major unexplained regression');
  if (current.gallery.jsTransferBytes > baseline.gallery.jsTransferBytes * 1.35 + 100_000) failures.push('Gallery transferred JS has a major unexplained regression');

  fs.writeFileSync(path.join(outDir, 'performance-comparison.json'), `${JSON.stringify({ ...evidence, failures }, null, 2)}\n`);
  console.log('[doc7-performance]', JSON.stringify({ deltaPercent: evidence.deltaPercent, targets: evidence.targets, failures }));
  if (failures.length) throw new Error(`[doc7-performance] ${failures.join('; ')}`);
} finally {
  await browser.close();
}
