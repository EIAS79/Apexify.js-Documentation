import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc6');
const RUNTIME = path.join(OUT, 'runtime');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(OUT, relative), 'utf8'));
const readRuntime = (name) => JSON.parse(fs.readFileSync(path.join(RUNTIME, name), 'utf8'));
const coverage = read('search-coverage.json');
const completion = read('completion-query-matrix.json');
const canonical = read('canonical-link-verification.json');
const related = read('related-content-coverage.json');
const dependency = read('dependency-audit.json');
const performance = readRuntime('performance.json');
const bundle = readRuntime('bundle-comparison.json');
const browser = readRuntime('browser.json');
const accessibility = readRuntime('accessibility.json');
const keyboard = readRuntime('keyboard.json');
const failures = [];
const check = (value, message) => { if (!value) failures.push(message); };

check(coverage.docs.indexed === coverage.docs.total, 'documentation coverage incomplete');
check(coverage.apiSymbols.indexed === coverage.apiSymbols.total, 'API symbol coverage incomplete');
check(coverage.apiOptions.indexed === coverage.apiOptions.total, 'API option coverage incomplete');
check(coverage.apiTypes.indexed === coverage.apiTypes.total, 'API type coverage incomplete');
check(coverage.examples.indexed === coverage.examples.total, 'example coverage incomplete');
check(coverage.galleryMetadata.accounted === coverage.galleryMetadata.total, 'Gallery metadata coverage incomplete');
check(completion.passedApplicable === true, 'completion query matrix failed');
check(canonical.missingCanonicalHref.length === 0, 'missing canonical search hrefs');
check(canonical.duplicateCanonicalRecords.length === 0, 'duplicate canonical search records');
check(related.selfLinks === 0 && related.duplicateTargets === 0, 'related-content integrity failure');
check(dependency.addedRuntimeDependencies.length === 0 && dependency.externalSearchServices.length === 0, 'dependency discipline failure');
check(performance.build.pass === true, 'clean build performance gate failed');
check(performance.query.pass === true, 'search P95 performance gate failed');
check(bundle.fullSearchIndexClientBytes === 0 && bundle.eagerFullIndexOnOrdinaryRoutes === false, 'search index leaked into ordinary client bundles');
check(browser.status === 'PASS', 'browser verification failed');
check(accessibility.status === 'PASS', 'accessibility verification failed');
check(keyboard.status === 'PASS', 'keyboard verification failed');
check(process.env.DOC6_PRIOR_PHASE_VERIFIED === '1', 'prior DOC-1 through DOC-5 regression gate not attested by CI sequence');
check(process.env.DOC6_BASE_DOCS_VERIFIED === '1', 'existing documentation integrity gate not attested by CI sequence');

const prior = {
  schemaVersion: 1,
  phase: 'DOC-6',
  docs1Through5: process.env.DOC6_PRIOR_PHASE_VERIFIED === '1' ? 'PASS' : 'UNVERIFIED',
  existingDocsIntegrity: process.env.DOC6_BASE_DOCS_VERIFIED === '1' ? 'PASS' : 'UNVERIFIED',
  commands: ['npm run docs:verify:doc5', 'npm run verify:docs', 'npm run typecheck'],
  phase15Started: false,
};
fs.writeFileSync(path.join(RUNTIME, 'prior-phase-regression.json'), `${JSON.stringify(prior, null, 2)}\n`);
const finalization = {
  schemaVersion: 1,
  phase: 'DOC-6',
  status: failures.length ? 'FAIL' : 'PASS',
  failures,
  gates: {
    coverage: failures.every((item) => !item.includes('coverage')),
    discoveryQueries: completion.passedApplicable,
    canonicalLinks: canonical.missingCanonicalHref.length === 0 && canonical.duplicateCanonicalRecords.length === 0,
    relatedContent: related.selfLinks === 0 && related.duplicateTargets === 0,
    performance: performance.build.pass && performance.query.pass,
    bundleIsolation: bundle.fullSearchIndexClientBytes === 0 && bundle.eagerFullIndexOnOrdinaryRoutes === false,
    browser: browser.status,
    accessibility: accessibility.status,
    keyboard: keyboard.status,
    priorPhases: prior.docs1Through5,
  },
};
fs.writeFileSync(path.join(RUNTIME, 'finalization.json'), `${JSON.stringify(finalization, null, 2)}\n`);
console.log('[doc6-finalize]', JSON.stringify(finalization));
if (failures.length) throw new Error(`DOC-6 finalization failed: ${failures.join('; ')}`);
