import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RAW = path.join(ROOT, '.doc11-lighthouse');
const OUT = path.join(ROOT, 'generated', 'verification', 'doc-11');
fs.mkdirSync(OUT, { recursive: true });
if (!fs.existsSync(RAW)) throw new Error('[DOC-11 Lighthouse] .doc11-lighthouse directory missing');

const thresholds = {
  performance: 0.90,
  accessibility: 0.95,
  bestPractices: 0.95,
  seo: 0.95,
  lcpMs: 2500,
  cls: 0.10,
  inpMs: 200,
  labTbtGuardMs: 200,
};
const rows = [];
const failures = [];

for (const name of fs.readdirSync(RAW).filter((value) => value.endsWith('.json')).sort()) {
  const report = JSON.parse(fs.readFileSync(path.join(RAW, name), 'utf8'));
  const audit = (id) => report.audits?.[id]?.numericValue ?? null;
  const inp = audit('interaction-to-next-paint') ?? audit('experimental-interaction-to-next-paint');
  const row = {
    name,
    url: report.finalDisplayedUrl ?? report.finalUrl ?? report.requestedUrl,
    formFactor: name.includes('mobile') ? 'mobile' : 'desktop',
    scores: {
      performance: report.categories?.performance?.score ?? null,
      accessibility: report.categories?.accessibility?.score ?? null,
      bestPractices: report.categories?.['best-practices']?.score ?? null,
      seo: report.categories?.seo?.score ?? null,
    },
    webVitals: {
      lcpMs: audit('largest-contentful-paint'),
      cls: audit('cumulative-layout-shift'),
      inpMs: inp,
      tbtMs: audit('total-blocking-time'),
    },
  };
  const checks = [
    ['performance', row.scores.performance, thresholds.performance],
    ['accessibility', row.scores.accessibility, thresholds.accessibility],
    ['bestPractices', row.scores.bestPractices, thresholds.bestPractices],
    ['seo', row.scores.seo, thresholds.seo],
  ];
  for (const [metric, value, target] of checks) {
    if (value == null || value < target) failures.push(`${name}: ${metric} ${value} < ${target}`);
  }
  if (row.webVitals.lcpMs == null || row.webVitals.lcpMs > thresholds.lcpMs) failures.push(`${name}: LCP ${row.webVitals.lcpMs}ms > ${thresholds.lcpMs}ms`);
  if (row.webVitals.cls == null || row.webVitals.cls > thresholds.cls) failures.push(`${name}: CLS ${row.webVitals.cls} > ${thresholds.cls}`);
  if (row.webVitals.inpMs != null) {
    if (row.webVitals.inpMs > thresholds.inpMs) failures.push(`${name}: INP ${row.webVitals.inpMs}ms > ${thresholds.inpMs}ms`);
  } else if (row.webVitals.tbtMs == null || row.webVitals.tbtMs > thresholds.labTbtGuardMs) {
    failures.push(`${name}: Lighthouse does not expose INP and lab TBT guard ${row.webVitals.tbtMs}ms > ${thresholds.labTbtGuardMs}ms`);
  }
  rows.push(row);
}

if (!rows.length) failures.push('no Lighthouse reports found');
const inpMeasured = rows.filter((row) => row.webVitals.inpMs != null).length;
const inpStatus = inpMeasured === rows.length
  ? 'PASS'
  : 'PASS WITH MEASURED JUSTIFICATION';
const status = failures.length ? 'FAIL' : 'PASS';
const evidence = {
  schemaVersion: 1,
  phase: 'DOC-11',
  status,
  methodology: 'Lighthouse CLI production-mode lab runs on the same GitHub Actions Ubuntu/Chrome runner. INP is evaluated when emitted; otherwise Total Blocking Time <=200 ms is enforced as a lab responsiveness guard because stable field INP requires real-user event data.',
  thresholds,
  inp: {
    status: failures.some((message) => message.includes('INP') || message.includes('TBT')) ? 'FAIL' : inpStatus,
    measuredReports: inpMeasured,
    totalReports: rows.length,
    justification: inpMeasured === rows.length ? null : 'INP is a field responsiveness metric and is not emitted by every Lighthouse lab report. DOC-11 therefore records the limitation explicitly and gates TBT at <=200 ms instead of fabricating INP data.',
  },
  reports: rows,
  failures,
};
fs.writeFileSync(path.join(OUT, 'lighthouse-cwv.json'), `${JSON.stringify(evidence, null, 2)}\n`);
if (failures.length) {
  console.error('[DOC-11 Lighthouse] FAIL', failures);
  process.exit(1);
}
console.log(`[DOC-11 Lighthouse] PASS reports=${rows.length} inpMeasured=${inpMeasured}`);
