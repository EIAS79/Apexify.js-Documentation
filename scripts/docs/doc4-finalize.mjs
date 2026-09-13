import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.doc4-runtime-evidence');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const build = read(path.join(OUT, 'build-bundle.json'));
const browser = read(path.join(OUT, 'browser.json'));
const coverage = read(path.join(ROOT, 'generated', 'docs-doc4', 'api-coverage.json'));
const options = read(path.join(ROOT, 'generated', 'docs-doc4', 'option-coverage.json'));
const rep = read(path.join(ROOT, 'generated', 'docs-doc4', 'representative-api.json'));
const docsManifest = read(path.join(ROOT, 'generated', 'docs-doc1', 'docs-manifest.json'));

const failures = [];
const routedPageCount = Number(docsManifest.managedPageCount ?? docsManifest.pages?.length ?? 0);
const baselineRoutedPageCount = 3;
const intentionalRouteExpansion = routedPageCount > baselineRoutedPageCount;
const baselineBuildPerRoute = build.baseline.buildWallMs / baselineRoutedPageCount;
const currentBuildPerRoute = build.after.buildWallMs / Math.max(routedPageCount, 1);
const normalizedBuildPercent = Number((((currentBuildPerRoute / baselineBuildPerRoute) - 1) * 100).toFixed(2));

if (!intentionalRouteExpansion && build.delta.buildPercent > 35) {
  failures.push(`build regression ${build.delta.buildPercent}% > 35%`);
}
if (intentionalRouteExpansion && normalizedBuildPercent > 35) {
  failures.push(`route-normalized build regression ${normalizedBuildPercent}% > 35%`);
}
if (build.after.complexApiRouteJsBytes > 1_400_000) failures.push(`API routed JS ${build.after.complexApiRouteJsBytes} > 1.4MB budget`);
if (build.after.optionSearchIslandJsBytes > 250_000) failures.push(`OptionTable island ${build.after.optionSearchIslandJsBytes} > 250KB`);
if (build.after.typeExplorerIslandJsBytes > 250_000) failures.push(`TypeExplorer island ${build.after.typeExplorerIslandJsBytes} > 250KB`);
if (build.after.extractionMs > 30_000) failures.push(`extraction ${build.after.extractionMs}ms > 30s`);
if (coverage.missingPublicExports.length || coverage.staleDocumentedExports.length || coverage.signatureMismatches.length) failures.push('API coverage drift');
if (options.missing.length || options.total !== options.documented) failures.push('option coverage drift');
if (!Object.values(rep.completion).every(Boolean)) failures.push('representative API incomplete');
if (browser.failures !== 0 || browser.states.some((s) => s.axeViolations.length || s.horizontalOverflow)) failures.push('browser/accessibility failure');

const evidence = {
  schemaVersion: 1,
  phase: 'DOC-4',
  status: failures.length ? 'FAILED' : 'PASS',
  failures,
  routeContext: {
    baselineRoutedPageCount,
    routedPageCount,
    intentionalRouteExpansion,
    normalizedBuildPercent,
  },
  metrics: {
    build: build.after,
    delta: build.delta,
    coverage: {
      exports: coverage.publicExportsTotal,
      members: coverage.publicMembersTotal,
      options: coverage.optionPathsTotal,
    },
    representativeOptions: rep.optionCount,
    browserStates: browser.states.length,
  },
};
fs.writeFileSync(path.join(OUT, 'final.json'), `${JSON.stringify(evidence, null, 2)}\n`);
if (failures.length) throw new Error(`[doc4-finalize] ${failures.join('; ')}`);
console.log('[doc4-finalize] PASS ' + JSON.stringify(evidence.metrics));
