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
