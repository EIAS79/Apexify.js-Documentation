import fs from 'node:fs';
import path from 'node:path';
import {
  PHASE16_DOMAIN_EVIDENCE,
  PHASE16_DOMAIN_EVIDENCE_BY_DOMAIN,
  capabilityFromOptionId,
  isAuthorableVisualCapability,
  optionFamilyRoot,
  uniqueSorted,
} from '../../../lib/studio/visual/feature-completeness';
import type { VisualCapabilityRow } from '../../../lib/studio/visual/capability';
import { PHASE16_PROOF_PROJECT_DESCRIPTORS } from './phase16-proof-projects';

type Matrix = {
  source: { packagePin: string | null; implementationComplete: boolean };
  rows: VisualCapabilityRow[];
  summary: { complete: boolean; unclassifiedCount: number; duplicateCapabilities: string[] };
  optionCoverage: { totalOptionPaths: number; complete: boolean };
};
type Options = { total: number; options: Array<{ id: string; path: string }> };
type Failure = { code: string; subject: string; detail: string };

const root = process.cwd();
const check = process.argv.includes('--check');
const matrixPath = path.join(root, 'generated/studio/visual-capability-matrix.json');
const optionsPath = path.join(root, 'generated/docs-doc4', 'option-inventory.json');
const reportPath = path.join(root, 'generated/studio/phase16-feature-completeness.json');
const reportMdPath = path.join(root, 'generated/studio/phase16-feature-completeness.md');
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;
const file = (relative: string) => path.join(root, ...relative.split('/'));
const failures: Failure[] = [];
const fail = (code: string, subject: string, detail: string) => failures.push({ code, subject, detail });
const has = (files: readonly string[], patterns: readonly RegExp[]) => files.some((relative) => {
  if (!fs.existsSync(file(relative))) return false;
  const source = fs.readFileSync(file(relative), 'utf8');
  return patterns.some((pattern) => pattern.test(source));
});

if (!fs.existsSync(matrixPath)) throw new Error('Run npm run studio:visual:capabilities first.');
if (!fs.existsSync(optionsPath)) throw new Error('Run npm run docs:generate:doc4 first.');
const matrix = read<Matrix>(matrixPath);
const options = read<Options>(optionsPath);

if (!matrix.summary.complete || !matrix.optionCoverage.complete || !matrix.source.implementationComplete) {
  fail('upstream-matrix-incomplete', 'visual-capability-matrix', 'Phase-0/base capability evidence is incomplete.');
}
if (matrix.summary.unclassifiedCount || matrix.summary.duplicateCapabilities.length) {
  fail('upstream-classification-invalid', 'visual-capability-matrix', `unclassified=${matrix.summary.unclassifiedCount}, duplicates=${matrix.summary.duplicateCapabilities.length}`);
}
if (options.total !== options.options.length || options.total !== matrix.optionCoverage.totalOptionPaths) {
  fail('option-count-mismatch', 'option-inventory', `declared=${options.total}, rows=${options.options.length}, matrix=${matrix.optionCoverage.totalOptionPaths}`);
}

const authorable = matrix.rows.filter(isAuthorableVisualCapability);
const authorableDomains = uniqueSorted(authorable.map((row) => row.domain));
const rows = new Map(matrix.rows.map((row) => [row.capability, row] as const));
const proofIds = new Set(PHASE16_PROOF_PROJECT_DESCRIPTORS.map((project) => project.id));
const proofDomains = new Set(PHASE16_PROOF_PROJECT_DESCRIPTORS.flatMap((project) => [...project.domains]));

for (const evidence of PHASE16_DOMAIN_EVIDENCE) {
  const evidenceFiles = [...evidence.controlEvidenceFiles, ...evidence.codegenEvidenceFiles, ...evidence.previewEvidenceFiles, ...evidence.regressionTestFiles];
  for (const relative of evidenceFiles) {
    if (!fs.existsSync(file(relative)) || fs.statSync(file(relative)).size === 0) fail('missing-evidence-file', evidence.domain, relative);
  }
