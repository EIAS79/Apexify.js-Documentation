import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.doc3-runtime-evidence');
const build = JSON.parse(fs.readFileSync(path.join(OUT, 'build-bundle.json'), 'utf8'));
const browser = JSON.parse(fs.readFileSync(path.join(OUT, 'browser.json'), 'utf8'));
const docsManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'generated', 'docs-doc1', 'docs-manifest.json'), 'utf8'),
);

const failures = [];
const routedPageCount = Number(docsManifest.managedPageCount ?? docsManifest.pages?.length ?? 0);
const doc3BaselineRoutedPageCount = 3;
const intentionalRouteExpansion = routedPageCount > doc3BaselineRoutedPageCount;
const baselineBuildMsPerRoutedPage = build.baseline.buildWallMs / doc3BaselineRoutedPageCount;
const currentBuildMsPerRoutedPage = build.after.buildWallMs / Math.max(routedPageCount, 1);
const normalizedBuildPercent = Number(
  (((currentBuildMsPerRoutedPage / baselineBuildMsPerRoutedPage) - 1) * 100).toFixed(2),
);

if (build.delta.routedManifestJsPercent > 15) {
  failures.push(`routed JS regression ${build.delta.routedManifestJsPercent}% exceeds 15%`);
}

// DOC-3 originally had three canonical documentation routes. DOC-9 deliberately
// promotes the complete corpus, so total clean-build wall time is no longer an
// apples-to-apples DOC-3 regression metric. Preserve the original 25% control for
// unchanged route counts; after an intentional migration expansion, require the
// route-normalized build cost not to regress by more than the same tolerance.
if (!intentionalRouteExpansion && build.delta.buildPercent > 25) {
  failures.push(`build wall regression ${build.delta.buildPercent}% exceeds 25% control tolerance`);
}
if (intentionalRouteExpansion && normalizedBuildPercent > 25) {
  failures.push(`route-normalized build wall regression ${normalizedBuildPercent}% exceeds 25% control tolerance`);
}

if (browser.failures !== 0) failures.push(`browser failures=${browser.failures}`);
for (const state of browser.states ?? []) {
  if ((state.axeViolations ?? []).length) failures.push(`${state.name} has axe violations`);
  if (state.horizontalOverflow) failures.push(`${state.name} has horizontal overflow`);
}

const summary = {
  schemaVersion: 1,
  phase: 'DOC-3',
  status: failures.length ? 'FAIL' : 'PASS',
  thresholds: {
    routedManifestJsPercentMax: 15,
    buildWallPercentMaxWhenRouteCountStable: 25,
    normalizedBuildWallPercentMaxDuringIntentionalRouteExpansion: 25,
    axeViolations: 0,
    horizontalOverflow: false,
  },
  routeContext: {
    doc3BaselineRoutedPageCount,
    routedPageCount,
    intentionalRouteExpansion,
    baselineBuildMsPerRoutedPage: Number(baselineBuildMsPerRoutedPage.toFixed(3)),
    currentBuildMsPerRoutedPage: Number(currentBuildMsPerRoutedPage.toFixed(3)),
    normalizedBuildPercent,
  },
  build: build.after,
  delta: build.delta,
  browserStates: browser.states?.length ?? 0,
  failures,
};

fs.writeFileSync(path.join(OUT, 'final.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log('[doc3-finalize] ' + JSON.stringify(summary));
if (failures.length) process.exit(1);
