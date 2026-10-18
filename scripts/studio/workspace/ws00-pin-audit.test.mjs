import test from 'node:test';
import assert from 'node:assert/strict';
import { auditStudioPins, runCurrentRepositoryAudit } from './ws00-pin-audit.mjs';

const current = '379a5248f09ed39c1b1734fe104b6bd73a77857f';
const old = 'a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a';
const web = '5e0f5534762af7d9d358e83d774a38f931f720e0';
const dependency = 'github:EIAS79/Apexify.js#' + current;
function fixture() {
  return {
    pkg: { dependencies: { 'apexify.js': dependency } },
    lock: { packages: { '': { dependencies: { 'apexify.js': dependency } } } },
    executor: "const APEXIFY_PIN = '" + dependency + "';",
    webInstaller: "const sourceCommit = '" + web + "';",
    parityPin: { commit: old },
    historicReport: { runtime: { commit: old } },
  };
}
test('pin chain agrees without falsely declaring historical parity current', () => {
  const result = auditStudioPins(fixture());
  assert.equal(result.status, 'PACKAGE_PIN_CONSISTENT');
  assert.equal(result.currentFullRuntimeCommit, current);
  assert.equal(result.webSnapshotCommit, web);
  assert.equal(result.parityEvidenceStatus, 'STALE_REQUIRES_REBASE_AND_REEXECUTION');
  assert.equal(result.checks.filter(item => !item.ok).length, 0);
});
test('changing lockfile pin is a blocking package-pin drift', () => {
  const input = fixture();
  input.lock.packages[''].dependencies['apexify.js'] = 'github:EIAS79/Apexify.js#' + old;
  const result = auditStudioPins(input);
  assert.equal(result.status, 'PACKAGE_PIN_DRIFT');
  assert.equal(result.checks.find(item => item.id === 'lockfile-matches-package')?.ok, false);
});
test('unmatched executor pin is flagged even with a matching lockfile', () => {
  const input = fixture();
  input.executor = "const APEXIFY_PIN = 'github:EIAS79/Apexify.js#" + old + "';";
  const result = auditStudioPins(input);
  assert.equal(result.status, 'PACKAGE_PIN_DRIFT');
  assert.equal(result.checks.find(item => item.id === 'isolated-executor-matches-package')?.ok, false);
});
test('the report may be current only if audit scanner AND generated evidence match', () => {
  const input = fixture();
  input.parityPin.commit = current;
  let result = auditStudioPins(input);
  assert.equal(result.parityEvidenceStatus, 'STALE_REQUIRES_REBASE_AND_REEXECUTION');
  input.historicReport.runtime.commit = current;
  result = auditStudioPins(input);
  assert.equal(result.parityEvidenceStatus, 'CURRENT_PIN');
});
test('tracked repository pins can be inspected without installing any dependencies', () => {
  const result = runCurrentRepositoryAudit();
  assert.equal(result.status, 'PACKAGE_PIN_CONSISTENT');
  assert.equal(result.currentFullRuntimeCommit, current);
  assert.equal(result.parityEvidenceStatus, 'STALE_REQUIRES_REBASE_AND_REEXECUTION');
});
