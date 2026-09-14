import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RAW = path.join(ROOT, '.doc11-lighthouse');
const OUT = path.join(ROOT, 'generated', 'verification', 'doc-11');
fs.mkdirSync(OUT, { recursive: true });
if (!fs.existsSync(RAW)) throw new Error('[DOC-11 Lighthouse] .doc11-lighthouse directory missing');

const thresholds = {
  performanceMobile: 0.90,
  performanceDesktop: 0.95,
  accessibility: 1.00,
  bestPractices: 0.95,
  seo: 1.00,
  lcpMsExclusive: 2500,
  clsExclusive: 0.10,
  inpMsExclusive: 200,
  labTbtGuardMsInclusive: 200,
};

const rows = [];
const failures = [];

for (const name of fs.readdirSync(RAW).filter((value) => value.endsWith('.json')).sort()) {
  const report = JSON.parse(fs.readFileSync(path.join(RAW, name), 'utf8'));
  const audit = (id) => report.audits?.[id]?.numericValue ?? null;
  const inp = audit('interaction-to-next-paint') ?? audit('experimental-interaction-to-next-paint');
  const formFactor = name.includes('mobile') ? 'mobile' : 'desktop';
  const performanceTarget = formFactor === 'mobile' ? thresholds.performanceMobile : thresholds.performanceDesktop;
  const row = {
    name,
    url: report.finalDisplayedUrl ?? report.finalUrl ?? report.requestedUrl,
    formFactor,
    targets: {
      performance: performanceTarget,
      accessibility: thresholds.accessibility,
      bestPractices: thresholds.bestPractices,
      seo: thresholds.seo,
    },
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
    ['performance', row.scores.performance, row.targets.performance],
    ['accessibility', row.scores.accessibility, row.targets.accessibility],
    ['bestPractices', row.scores.bestPractices, row.targets.bestPractices],
    ['seo', row.scores.seo, row.targets.seo],
  ];
  for (const [metric, value, target] of checks) {
    if (value == null || value < target) failures.push(`${name}: ${metric} ${value} < ${target}`);
  }

  if (row.webVitals.lcpMs == null || row.webVitals.lcpMs >= thresholds.lcpMsExclusive) {
    failures.push(`${name}: LCP ${row.webVitals.lcpMs}ms is not < ${thresholds.lcpMsExclusive}ms`);
  }
  if (row.webVitals.cls == null || row.webVitals.cls >= thresholds.clsExclusive) {
    failures.push(`${name}: CLS ${row.webVitals.cls} is not < ${thresholds.clsExclusive}`);
  }
  if (row.webVitals.inpMs != null) {
    if (row.webVitals.inpMs >= thresholds.inpMsExclusive) {
      failures.push(`${name}: INP ${row.webVitals.inpMs}ms is not < ${thresholds.inpMsExclusive}ms`);
    }
  } else if (row.webVitals.tbtMs == null || row.webVitals.tbtMs > thresholds.labTbtGuardMsInclusive) {
    failures.push(`${name}: Lighthouse did not expose INP and lab TBT guard ${row.webVitals.tbtMs}ms > ${thresholds.labTbtGuardMsInclusive}ms`);
  }
  rows.push(row);
}

if (!rows.length) failures.push('no Lighthouse reports found');
const inpMeasured = rows.filter((row) => row.webVitals.inpMs != null).length;
const inpStatus = inpMeasured === rows.length ? 'PASS' : 'PASS WITH MEASURED JUSTIFICATION';
const status = failures.length ? 'FAIL' : 'PASS';
const evidence = {
  schemaVersion: 2,
  phase: 'DOC-11',
  status,
  methodology: 'Lighthouse CLI production-mode lab runs on the same GitHub Actions Ubuntu/Chrome runner. Roadmap category targets are Performance >=0.90 mobile and >=0.95 desktop, Accessibility 1.00, Best Practices >=0.95, and SEO 1.00. Core Web Vitals gates are LCP <2.5 s, CLS <0.1, and INP <200 ms when Lighthouse emits INP. When lab Lighthouse does not emit INP, TBT <=200 ms is recorded and enforced only as a lab responsiveness proxy; it is not represented as measured INP.',
  thresholds,
  inp: {
    status: failures.some((message) => message.includes('INP') || message.includes('TBT')) ? 'FAIL' : inpStatus,
    measuredReports: inpMeasured,
    totalReports: rows.length,
    justification: inpMeasured === rows.length ? null : 'INP is fundamentally a field interaction metric and is not emitted by every Lighthouse lab report. DOC-11 records that limitation explicitly and gates TBT <=200 ms as a lab responsiveness proxy instead of fabricating INP data.',
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
