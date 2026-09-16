import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc12');
const failures = [];
const read = (name) => JSON.parse(fs.readFileSync(path.join(OUT, name), 'utf8'));
const exists = (name) => fs.existsSync(path.join(OUT, name));
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();

const required = [
  'package-candidate.json','external-links.json','identity.json','release-inputs.json','ci-contract.json','content-integrity.json','route-integrity.json',
  'redirect-verification.json','link-integrity.json','heading-integrity.json','api-coverage.json','option-coverage.json',
  'signature-verification.json','source-link-verification.json','example-coverage.json','example-execution.json',
  'gallery-verification.json','search-verification.json','architecture-audit.json','content-audit.json','duplication-audit.json',
  'dead-code-audit.json','client-js-audit.json','dependency-audit.json','old-links-audit.json','accessibility.json','mobile.json',
  'bundle-budgets.json','lighthouse.json','performance.json','future-phase-contract.json','generated-file-policy.json',
  'source-control-audit.json','privacy-audit.json','prior-phase-regression.json','quality-scorecard.json','verification-matrix.json',
  'release-decision.json','evidence-index.json','index.json'
];

for (const name of required) {
  if (!exists(name)) { failures.push(`${name}: missing`); continue; }
  let data;
  try { data = read(name); }
  catch (error) { failures.push(`${name}: invalid JSON (${error instanceof Error ? error.message : String(error)})`); continue; }
  if (data.schemaVersion !== 1) failures.push(`${name}: schemaVersion must be 1`);
  if (data.sourceSha !== sourceSha) failures.push(`${name}: stale sourceSha ${data.sourceSha ?? '<missing>'}; expected ${sourceSha}`);
  if (data.status === 'FAIL') failures.push(`${name}: status FAIL`);
}

if (!failures.length) {
  const decision = read('release-decision.json');
  if (decision.decision !== 'PASS') failures.push(`release-decision.json: decision ${decision.decision}`);
  if (!decision.inheritedExternalVerification || decision.inheritedExternalVerification.state !== 'EXTERNAL_VERIFICATION_PENDING') failures.push('release-decision.json: inherited DOC-11 field-INP status must remain explicit');

  const candidate = read('package-candidate.json');
  const externalLinks = read('external-links.json');
  const api = read('api-coverage.json');
  const options = read('option-coverage.json');
  const examples = read('example-execution.json');
  const content = read('content-integrity.json');
  const search = read('search-verification.json');
  const future = read('future-phase-contract.json');
  const sourceControl = read('source-control-audit.json');
  const privacy = read('privacy-audit.json');
  const lighthouse = read('lighthouse.json');
  const scorecard = read('quality-scorecard.json');

  if (externalLinks.status === 'FAIL') failures.push('controlled external link verification is FAIL');
  if (candidate.status !== 'PASS' || candidate.candidatePublicSurface?.exportsMatch !== true || candidate.candidatePublicSurface?.declarationsMatch !== true || candidate.examples?.total !== candidate.examples?.passed) failures.push('current package candidate verification is not PASS');
  if (api.status !== 'PASS') failures.push('API coverage is not PASS');
  if (options.status !== 'PASS') failures.push('option coverage is not PASS');
  if (examples.status !== 'PASS') failures.push('example execution is not PASS');
  if (content.status !== 'PASS' || Number(content.legacyOnlyCount) !== 0) failures.push('content completeness is not PASS');
  if (search.status !== 'PASS') failures.push('search verification is not PASS');
  if (future.status !== 'PASS') failures.push('future-phase contract is not PASS');
  if (sourceControl.status !== 'PASS') failures.push('source-control audit is not PASS');
  if (privacy.status !== 'PASS') failures.push('privacy audit is not PASS');
  if (lighthouse.status !== 'PASS') failures.push('repeated Lighthouse gate is not PASS');
  if (!(Number(scorecard.overall) >= 9.5)) failures.push(`quality scorecard overall below 9.5: ${scorecard.overall}`);

  const indexed = read('evidence-index.json');
  if (!Array.isArray(indexed.artifacts) || indexed.artifacts.length < 30) failures.push('evidence-index.json: unexpectedly incomplete artifact list');
  for (const item of indexed.artifacts ?? []) {
    const prefix = 'generated/docs-doc12/';
    if (typeof item.artifact !== 'string' || !item.artifact.startsWith(prefix)) { failures.push(`invalid evidence artifact path: ${item.artifact}`); continue; }
    const name = item.artifact.slice(prefix.length);
    const file = path.join(OUT, name);
    if (!fs.existsSync(file)) { failures.push(`indexed artifact missing: ${name}`); continue; }
    const actual = sha256(fs.readFileSync(file));
    if (actual !== item.checksum) failures.push(`checksum mismatch: ${name}`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.sourceSha !== sourceSha) failures.push(`indexed artifact stale: ${name}`);
  }
}

if (failures.length) {
  console.error('[DOC-12 release verify] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const index = read('index.json');
console.log(`[DOC-12 release verify] PASS source=${sourceSha} artifacts=${index.artifactCount}`);
