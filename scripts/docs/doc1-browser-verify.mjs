import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.DOC1_BASE_URL ?? 'http://127.0.0.1:3000';
const CHROME_PATH = process.env.CHROME_PATH;
if (!CHROME_PATH) {
  throw new Error('[doc1-browser] CHROME_PATH is required');
}

const OUT_DIR = path.join(process.cwd(), '.doc1-runtime-evidence');
fs.mkdirSync(OUT_DIR, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(`[doc1-browser] ${message}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const errors = [];
const browserChecks = [];

try {
  for (const route of [
    ['/docs/getting-started', 'Start here'],
    ['/docs/node/canvas', 'Canvas'],
    ['/docs/node/canvas/size-and-coordinates', 'Canvas size'],
  ]) {
    const response = await fetch(`${BASE_URL}${route[0]}`);
    const html = await response.text();
    assert(response.status === 200, `${route[0]} returned ${response.status}`);
    assert(html.includes(route[1]), `${route[0]} HTML does not contain server-rendered article content`);
    assert(!html.includes('title: &quot;'), `${route[0]} leaked frontmatter into rendered HTML`);
    browserChecks.push({
      route: route[0],
      status: response.status,
      serverRenderedContent: true,
    });
  }

  const unknown = await fetch(`${BASE_URL}/docs/not-a-real-doc1-route`);
  assert(unknown.status === 404, `unknown routed doc returned ${unknown.status}, expected 404`);
  browserChecks.push({
    route: '/docs/not-a-real-doc1-route',
    status: unknown.status,
    unknownRoute404: true,
  });

  const page = await browser.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!text.includes('speed-insights')) errors.push(`console: ${text}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/docs/getting-started`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-doc-article] h1');

  const canonicalStart = await page.$eval(
    'link[rel="canonical"]',
    (element) => element.href,
  );
  assert(
    canonicalStart === 'https://apexifyjs.vercel.app/docs/getting-started',
    `unexpected canonical URL: ${canonicalStart}`,
  );

  const routedNavHrefs = await page.$$eval(
    '[data-doc1-route-sidebar] a[href^="/docs/"]',
    (links) => links.map((link) => link.getAttribute('href')),
  );
  assert(
    routedNavHrefs.includes('/docs/node/canvas'),
    'route sidebar does not expose canonical Canvas navigation',
  );

  await page.waitForSelector('#docs-toc-rail a[href^="#"]');
  const tocCount = await page.$$eval('#docs-toc-rail a[href^="#"]', (links) => links.length);
  assert(tocCount >= 3, `desktop TOC has only ${tocCount} entries`);

  const searchInput = await page.waitForSelector('#docs-sidebar-search-input');
  await searchInput.type('canvas');
  await page.waitForSelector(
    'button[data-search-href="/docs/node/canvas"]',
    { timeout: 10000 },
  );
  await page.click('button[data-search-href="/docs/node/canvas"]');
  await page.waitForFunction(
    () => window.location.pathname === '/docs/node/canvas',
    { timeout: 10000 },
  );
  await page.waitForSelector('[data-doc-article] h1');

  const nextHref = await page.$eval(
    '[data-doc1-pager] a[href="/docs/node/canvas/size-and-coordinates"]',
    (element) => element.getAttribute('href'),
  );
  assert(
    nextHref === '/docs/node/canvas/size-and-coordinates',
    'pager does not emit canonical adjacent route',
  );

  await page.goto(`${BASE_URL}/docs/node/canvas#signature-types`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('#signature-types');
  assert(
    new URL(page.url()).hash === '#signature-types',
    'canonical deep heading fragment was not retained',
  );

  await page.goto(
    `${BASE_URL}/docs#00-create-canvas-overview?h=signature-types`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.waitForFunction(
    () =>
      window.location.pathname === '/docs/node/canvas' &&
      window.location.hash === '#signature-types',
    { timeout: 10000 },
  );
  assert(
    new URL(page.url()).pathname === '/docs/node/canvas',
    `legacy Canvas hash did not canonicalize: ${page.url()}`,
  );

  await page.goto(`${BASE_URL}/docs#start-here`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(
    () => window.location.pathname === '/docs/getting-started',
    { timeout: 10000 },
  );

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/docs/node/canvas`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-doc-article] h1');

  const tocButton = await page.$('button[aria-label="On this page"]');
  assert(Boolean(tocButton), 'mobile On this page control is missing');

  await page.click('button[aria-label="Toggle docs navigation"]');
  await page.waitForSelector('[data-doc1-route-sidebar] #docs-sidebar-search-input');
  const mobileNavHref = await page.$eval(
    '[data-doc1-route-sidebar] a[href="/docs/getting-started"]',
    (element) => element.getAttribute('href'),
  );
  assert(mobileNavHref === '/docs/getting-started', 'mobile sidebar canonical link missing');

  await page.close();

  assert(
    errors.length === 0,
    `serious browser console/page errors: ${errors.join(' | ')}`,
  );

  const evidence = {
    schemaVersion: 1,
    browser: 'system Chrome/Chromium',
    baseUrl: BASE_URL,
    routeChecks: browserChecks,
    desktop: {
      viewport: '1440x1000',
      canonicalMetadata: true,
      routeSidebar: true,
      toc: true,
      searchToCanonicalRoute: true,
      pagerCanonicalRoute: true,
      canonicalDeepHeading: true,
      legacyHashRedirect: true,
    },
    mobile: {
      viewport: '390x844',
      article: true,
      sidebar: true,
      search: true,
      tocControl: true,
    },
    seriousConsoleErrors: errors,
    status: 'PASS',
  };

  fs.writeFileSync(
    path.join(OUT_DIR, 'browser.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  console.log('[doc1-browser] ' + JSON.stringify({
    status: evidence.status,
    routeChecks: evidence.routeChecks.length,
    seriousConsoleErrors: errors.length,
  }));
} finally {
  await browser.close();
}
