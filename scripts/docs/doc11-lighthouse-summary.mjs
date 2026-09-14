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
  labTbtDiagnosticMsInclusive: 200,
};

const rows = [];
const failures = [];
const referenceDeviations = [];

function scoredAuditDiagnostics(report, categoryId) {
  const category = report.categories?.[categoryId];
  if (!category) return [];
  return (category.auditRefs ?? [])
    .filter((ref) => (ref.weight ?? 0) > 0)
    .map((ref) => {
      const audit = report.audits?.[ref.id];
      return {
        id: ref.id,
        weight: ref.weight,
        score: audit?.score ?? null,
        scoreDisplayMode: audit?.scoreDisplayMode ?? null,
        title: audit?.title ?? null,
        displayValue: audit?.displayValue ?? null,
        explanation: audit?.explanation ?? null,
        details: audit?.details?.items ? audit.details.items.slice(0, 10) : null,
      };
    })
    .filter((audit) => audit.score != null && audit.score < 1);
}

function routeDeviation(row, message) {
  if (row.standardDocsPage) failures.push(message);
  else referenceDeviations.push(message);
}

for (const name of fs.readdirSync(RAW).filter((value) => value.endsWith('.json')).sort()) {
  const report = JSON.parse(fs.readFileSync(path.join(RAW, name), 'utf8'));
  const audit = (id) => report.audits?.[id]?.numericValue ?? null;
  const inp = audit('interaction-to-next-paint') ?? audit('experimental-interaction-to-next-paint');
  const formFactor = name.includes('mobile') ? 'mobile' : 'desktop';
  const performanceTarget = formFactor === 'mobile' ? thresholds.performanceMobile : thresholds.performanceDesktop;
  const standardDocsPage = name.startsWith('docs-');
  const row = {
    name,
    url: report.finalDisplayedUrl ?? report.finalUrl ?? report.requestedUrl,
    formFactor,
    standardDocsPage,
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
    diagnostics: {
      performance: scoredAuditDiagnostics(report, 'performance'),
      accessibility: scoredAuditDiagnostics(report, 'accessibility'),
      bestPractices: scoredAuditDiagnostics(report, 'best-practices'),
      seo: scoredAuditDiagnostics(report, 'seo'),
    },
  };

  const checks = [
    ['performance', row.scores.performance, row.targets.performance],
    ['accessibility', row.scores.accessibility, row.targets.accessibility],
    ['bestPractices', row.scores.bestPractices, row.targets.bestPractices],
    ['seo', row.scores.seo, row.targets.seo],
  ];
  for (const [metric, value, target] of checks) {
    if (value == null || value < target) {
      routeDeviation(row, `${name}: ${metric} ${value} < ${target}`);
    }
  }

  if (row.webVitals.lcpMs == null || row.webVitals.lcpMs >= thresholds.lcpMsExclusive) {
    routeDeviation(row, `${name}: LCP ${row.webVitals.lcpMs}ms is not < ${thresholds.lcpMsExclusive}ms`);
  }
  if (row.webVitals.cls == null || row.webVitals.cls >= thresholds.clsExclusive) {
    routeDeviation(row, `${name}: CLS ${row.webVitals.cls} is not < ${thresholds.clsExclusive}`);
  }
  if (row.webVitals.inpMs != null) {
    if (row.webVitals.inpMs >= thresholds.inpMsExclusive) {
      routeDeviation(row, `${name}: INP ${row.webVitals.inpMs}ms is not < ${thresholds.inpMsExclusive}ms`);
    }
  } else if (row.webVitals.tbtMs == null || row.webVitals.tbtMs > thresholds.labTbtDiagnosticMsInclusive) {
    referenceDeviations.push(`${name}: Lighthouse did not expose field INP; lab TBT diagnostic is ${row.webVitals.tbtMs}ms (reference <= ${thresholds.labTbtDiagnosticMsInclusive}ms)`);
  }
  rows.push(row);
}

if (!rows.length) failures.push('no Lighthouse reports found');
const inpMeasured = rows.filter((row) => row.webVitals.inpMs != null).length;
const status = failures.length ? 'FAIL' : 'PASS';
const evidence = {
  schemaVersion: 4,
  phase: 'DOC-11',
  status,
  methodology: 'Lighthouse CLI production-mode lab runs on the same GitHub Actions Ubuntu/Chrome runner. The roadmap binds Lighthouse category targets specifically to standard docs pages: Performance >=0.90 mobile and >=0.95 desktop, Accessibility 1.00, Best Practices >=0.95, and SEO 1.00. Other representative surfaces are measured and retained as reference deviations. LCP <2.5 s and CLS <0.1 are hard-gated on the representative standard docs page and measured on every other representative surface. INP <200 ms is enforced only when an actual INP value is emitted. Lighthouse lab runs do not normally provide field INP, so TBT is retained as a diagnostic and is not falsely substituted for INP. This preserves the roadmap requirement for measured evidence and explicit deviation justification without inventing a field metric.',
  thresholds,
  lighthouseCategoryScope: 'standard docs pages',
  coreVitalsHardGateScope: 'representative standard docs page; other representative surfaces are measured deviations',
  referenceDeviations,
  inp: {
    status: inpMeasured === rows.length ? 'MEASURED' : 'FIELD VERIFICATION REQUIRED',
    measuredReports: inpMeasured,
    totalReports: rows.length,
    justification: inpMeasured === rows.length ? null : 'INP is a field interaction metric and was not emitted by these Lighthouse lab reports. DOC-11 therefore records lab TBT only as a diagnostic and does not relabel or gate it as measured INP.',
  },
  reports: rows,
  failures,
};
fs.writeFileSync(path.join(OUT, 'lighthouse-cwv.json'), `${JSON.stringify(evidence, null, 2)}\n`);

if (failures.length) {
  console.error('[DOC-11 Lighthouse] FAIL', failures);
  process.exit(1);
}
console.log(`[DOC-11 Lighthouse] PASS reports=${rows.length} inpMeasured=${inpMeasured} referenceDeviations=${referenceDeviations.length}`);
