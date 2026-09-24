import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  PHASE16_DOMAIN_EVIDENCE,
  PHASE16_DOMAIN_EVIDENCE_BY_DOMAIN,
  isAuthorableVisualCapability,
  uniqueSorted,
} from '../../../lib/studio/visual/feature-completeness';
import { generateVisualProjectCode, generateVisualProjectPreviewCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import {
  PHASE16_PROOF_PROJECTS,
  PHASE16_PROOF_PROJECT_DESCRIPTORS,
} from './phase16-proof-projects';
import type { VisualCapabilityRow } from '../../../lib/studio/visual/capability';

const root = process.cwd();

type Matrix = {
  rows: VisualCapabilityRow[];
  summary: {
    complete: boolean;
    unclassifiedCount: number;
    duplicateCapabilities: string[];
  };
  optionCoverage: {
    complete: boolean;
    unclassifiedOptionPaths: number;
  };
};

function matrix(): Matrix {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'generated/studio/visual-capability-matrix.json'), 'utf8'),
  ) as Matrix;
}

test('Phase 16 evidence registry exactly covers every authorable Visual capability domain', () => {
  const value = matrix();
  assert.equal(value.summary.complete, true);
  assert.equal(value.summary.unclassifiedCount, 0);
  assert.deepEqual(value.summary.duplicateCapabilities, []);
  assert.equal(value.optionCoverage.complete, true);
  assert.equal(value.optionCoverage.unclassifiedOptionPaths, 0);

  const authorableDomains = uniqueSorted(
    value.rows.filter(isAuthorableVisualCapability).map((row) => row.domain),
  );
  const evidenceDomains = uniqueSorted(PHASE16_DOMAIN_EVIDENCE.map((entry) => entry.domain));
  assert.deepEqual(evidenceDomains, authorableDomains);

  for (const row of value.rows.filter(isAuthorableVisualCapability)) {
    const evidence = PHASE16_DOMAIN_EVIDENCE_BY_DOMAIN.get(row.domain);
    assert.ok(evidence, `missing Phase-16 evidence for ${row.capability}`);
    assert.equal(row.implementationState, 'implemented', row.capability);
    assert.equal(row.phaseOwner, evidence.phaseOwner, row.capability);
    assert.ok(row.editorSection, `${row.capability}: missing editor section`);
    assert.ok(row.controlSchemaId, `${row.capability}: missing control schema`);
    assert.ok(row.projectModelField, `${row.capability}: missing project-model field`);
    assert.ok(row.codegen?.symbol, `${row.capability}: missing generated-code mapping`);
    assert.ok(row.previewRuntimeRoute, `${row.capability}: missing Preview runtime route`);
    assert.ok(row.proofCaseIds.length > 0, `${row.capability}: missing proof case IDs`);
    assert.ok(evidence.permanentUiLocations.length > 0, `${row.capability}: missing permanent UI home`);
  }
});

test('Phase 16 evidence files are repository-backed and proof-project descriptors cover every domain', () => {
  const proofIds = new Set(PHASE16_PROOF_PROJECT_DESCRIPTORS.map((project) => project.id));
  const proofDomains = new Set(PHASE16_PROOF_PROJECT_DESCRIPTORS.flatMap((project) => project.domains));

  for (const evidence of PHASE16_DOMAIN_EVIDENCE) {
    for (const file of [
      ...evidence.controlEvidenceFiles,
      ...evidence.codegenEvidenceFiles,
      ...evidence.previewEvidenceFiles,
      ...evidence.regressionTestFiles,
    ]) {
      const absolute = path.join(root, ...file.split('/'));
      assert.equal(fs.existsSync(absolute), true, `${evidence.domain}: missing ${file}`);
      assert.ok(fs.statSync(absolute).size > 0, `${evidence.domain}: empty ${file}`);
    }
    for (const proofId of evidence.representativeProofProjectIds) {
      assert.equal(proofIds.has(proofId), true, `${evidence.domain}: unknown proof ${proofId}`);
    }
    assert.equal(proofDomains.has(evidence.domain), true, `${evidence.domain}: not covered by a proof project`);
  }
});

test('Phase 16 representative projects produce canonical user code and Preview code', () => {
  for (const proof of PHASE16_PROOF_PROJECTS) {
    const project = proof.build();
    const generated = generateVisualProjectCode(project);
    const preview = generateVisualProjectPreviewCode(project);

    assert.equal(generated.language, 'typescript', proof.id);
    assert.equal(preview.language, 'typescript', proof.id);
    assert.ok(generated.source.trim().length > 0, `${proof.id}: empty generated code`);
    assert.ok(preview.source.trim().length > 0, `${proof.id}: empty Preview code`);
    assert.match(generated.source, /apexify\.js/, `${proof.id}: user code must target public Apexify.js`);
    assert.match(preview.source, /apexify\.js/, `${proof.id}: Preview code must target public Apexify.js`);
    assert.doesNotMatch(generated.source, /\/api\/gallery\/run|StudioOperationRuntime/, `${proof.id}: Studio harness leaked into user code`);
  }
});

test('Phase 16 canonical generated code reconciles back into every representative Visual Project', () => {
  for (const proof of PHASE16_PROOF_PROJECTS) {
    const project = proof.build();
    const canonical = generateVisualProjectCode(project).source;
    const result = reconcileVisualProjectFromCode(structuredClone(project), canonical);
    assert.equal(result.ok, true, `${proof.id}: canonical source failed reconciliation${result.ok ? '' : ` — ${result.error}`}`);
    if (!result.ok) continue;

    const regenerated = generateVisualProjectCode(result.project).source;
    assert.equal(regenerated, canonical, `${proof.id}: canonical source drifted after reconciliation`);
  }
});
