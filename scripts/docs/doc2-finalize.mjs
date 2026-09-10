import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.doc2-runtime-evidence');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8'));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

const build = readJson('build-bundle.json');
const browser = readJson('browser.json');
const desktop = readJson('lighthouse-desktop.json');
const mobile = readJson('lighthouse-mobile.json');

function lighthouseSummary(report) {
  return {
    performance: round((report.categories.performance.score ?? 0) * 100),
    accessibility: round((report.categories.accessibility.score ?? 0) * 100),
    bestPractices: round((report.categories['best-practices'].score ?? 0) * 100),
    seo: round((report.categories.seo.score ?? 0) * 100),
    lcpMs: round(report.audits['largest-contentful-paint'].numericValue ?? 0, 3),
    cls: round(report.audits['cumulative-layout-shift'].numericValue ?? 0, 6),
    tbtMs: round(report.audits['total-blocking-time'].numericValue ?? 0, 3),
  };
}

const afterDesktop = lighthouseSummary(desktop);
const afterMobile = lighthouseSummary(mobile);
const baseline = {
  desktop: { performance: 67, accessibility: 92, bestPractices: 96, seo: 100, lcpMs: 1067.17015, cls: 0.8891731202128843, tbtMs: 213.60995 },
  mobile: { performance: 62, accessibility: 96, bestPractices: 96, seo: 100, lcpMs: 4824.8772, cls: 0, tbtMs: 891 },
};
const delta = (after, before) => Object.fromEntries(Object.keys(after).map((key) => [key, round(after[key] - before[key], key === 'cls' ? 6 : 3)]));

const perf = {
  schemaVersion: 1,
  phase: 'DOC-2',
  methodology: 'same GitHub Actions Ubuntu 24.04 / Node 24 production-server controls; one Lighthouse desktop and one mobile sample for DOC-2 closure; browser PerformanceObserver measurements recorded separately',
  baseline,
  after: { desktop: afterDesktop, mobile: afterMobile },
  delta: { desktop: delta(afterDesktop, baseline.desktop), mobile: delta(afterMobile, baseline.mobile) },
  browserStates: browser.states.map((state) => ({ name: state.name, lcpMs: round(state.perf?.lcp ?? 0, 3), cls: round(state.perf?.cls ?? 0, 6), transferredJsBytes: state.transferredJsBytes, transferredCssBytes: state.transferredCssBytes, requestCount: state.requestCount })),
};

const bundles = {
  schemaVersion: 1,
  phase: 'DOC-2',
  baseline: build.baseline,
  after: build.after,
  delta: build.delta,
  methodology: build.methodology,
};

const accessibility = {
  schemaVersion: 1,
  phase: 'DOC-2',
  states: browser.states.map((state) => ({
    name: state.name,
    serious: state.axe.filter((violation) => violation.impact === 'serious').length,
    critical: state.axe.filter((violation) => violation.impact === 'critical').length,
    violations: state.axe,
    shellSmallTargetCount: state.shellSmallTargets.length,
    duplicateIds: state.duplicateIds,
  })),
  drawerStates: ['navDrawerAxe', 'tocDrawerAxe', 'siteDrawerAxe'].map((key) => ({ key, violations: browser.interactions[key] ?? [] })),
  keyboard: Object.fromEntries(Object.entries(browser.interactions).filter(([key, value]) => typeof value === 'boolean' && /Focus|skip|Navigation|DeepLink|Redirect/i.test(key))),
};

const visuals = {
  schemaVersion: 1,
  phase: 'DOC-2',
  screenshots: browser.states.map((state) => ({ name: state.name, viewport: `${state.width}x${state.height}`, theme: state.resolvedTheme, reducedMotion: Boolean(state.reduced), file: state.screenshot })),
};

const outputs = {
  'performance-comparison.json': perf,
  'bundle-comparison.json': bundles,
  'accessibility-runtime.json': accessibility,
  'visual-evidence.json': visuals,
};
for (const [name, value] of Object.entries(outputs)) fs.writeFileSync(path.join(OUT, name), `${JSON.stringify(value, null, 2)}\n`);
const files = fs.readdirSync(OUT).filter((name) => name.endsWith('.json') && name !== 'runtime-index.json').sort();
const index = {
  schemaVersion: 1,
  phase: 'DOC-2',
  files: files.map((name) => ({ name, sha256: sha256(fs.readFileSync(path.join(OUT, name), 'utf8')) })),
};
fs.writeFileSync(path.join(OUT, 'runtime-index.json'), `${JSON.stringify(index, null, 2)}\n`);

const failures = [];
if (browser.failures.length) failures.push(...browser.failures);
if (afterDesktop.performance < baseline.desktop.performance) failures.push(`desktop Lighthouse performance regressed ${baseline.desktop.performance} -> ${afterDesktop.performance}`);
if (afterMobile.performance < baseline.mobile.performance) failures.push(`mobile Lighthouse performance regressed ${baseline.mobile.performance} -> ${afterMobile.performance}`);
if (afterDesktop.accessibility < baseline.desktop.accessibility) failures.push(`desktop Lighthouse accessibility regressed ${baseline.desktop.accessibility} -> ${afterDesktop.accessibility}`);
if (afterMobile.accessibility < baseline.mobile.accessibility) failures.push(`mobile Lighthouse accessibility regressed ${baseline.mobile.accessibility} -> ${afterMobile.accessibility}`);
if (build.after.routedManifestJsBytes > build.baseline.routedManifestJsBytes * 1.05) failures.push(`routed manifest JS increased more than 5%: ${build.baseline.routedManifestJsBytes} -> ${build.after.routedManifestJsBytes}`);
if (build.after.buildWallMs > build.baseline.buildWallMs * 1.25) failures.push(`clean build exceeded +25% tolerance: ${build.baseline.buildWallMs} -> ${build.after.buildWallMs}`);

console.log('[doc2-finalize] ' + JSON.stringify({ desktop: afterDesktop, mobile: afterMobile, build: build.after, failures: failures.length }));
if (failures.length) throw new Error(`[doc2-finalize] closure regressions:\n${failures.join('\n')}`);
