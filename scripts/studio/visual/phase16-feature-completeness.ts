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
  if (!evidence.permanentUiLocations.length) fail('missing-ui-home', evidence.domain, 'No permanent UI location.');
  if (!has(evidence.codegenEvidenceFiles, [/emitStudioOperationPlan/, /NativeSource/, /generateVisualProjectCode/])) fail('missing-codegen-evidence', evidence.domain, evidence.codegenEvidenceFiles.join(', '));
  if (!has(evidence.previewEvidenceFiles, [/renderVisualPreview/, /PreviewSource/, /generateVisualProjectPreviewCode/])) fail('missing-preview-evidence', evidence.domain, evidence.previewEvidenceFiles.join(', '));
  if (!has(evidence.regressionTestFiles, [/generateVisualProjectCode/])) fail('missing-codegen-regression', evidence.domain, evidence.regressionTestFiles.join(', '));
  if (!has(evidence.regressionTestFiles, [/reconcileVisualProjectFromCode/])) fail('missing-reconcile-regression', evidence.domain, evidence.regressionTestFiles.join(', '));
  for (const projectId of evidence.representativeProofProjectIds) if (!proofIds.has(projectId)) fail('unknown-proof-project', evidence.domain, projectId);
}
for (const domain of authorableDomains) {
  if (!PHASE16_DOMAIN_EVIDENCE_BY_DOMAIN.has(domain)) fail('unmapped-domain', domain, 'No Phase-16 evidence registry entry.');
  if (!proofDomains.has(domain)) fail('domain-without-proof', domain, 'No representative Phase-16 proof project.');
}
for (const evidence of PHASE16_DOMAIN_EVIDENCE) if (!authorableDomains.includes(evidence.domain)) fail('stale-domain', evidence.domain, 'No authorable capability uses this evidence.');

const capabilityCoverage = matrix.rows.map((row) => {
  const active = isAuthorableVisualCapability(row);
  const evidence = PHASE16_DOMAIN_EVIDENCE_BY_DOMAIN.get(row.domain);
  const phase = Number(/STUDIO-VISUAL-(\d+)/.exec(row.phaseOwner)?.[1]);
  const reverseSync = active ? (phase <= 8 ? 'reversible' : 'normalized') : 'excluded';
  const issues: string[] = [];
  if (active) {
    if (!evidence) issues.push('domain-evidence');
    if (row.implementationState !== 'implemented') issues.push('implementation');
    if (!row.editorSection) issues.push('editor-section');
    if (!row.controlSchemaId) issues.push('control-schema');
    if (!row.projectModelField) issues.push('project-field');
    if (!row.codegen?.symbol) issues.push('codegen');
    if (!row.previewRuntimeRoute) issues.push('preview-route');
    if (!row.proofCaseIds.length) issues.push('proof-case');
    if (evidence?.phaseOwner !== row.phaseOwner) issues.push('phase-owner');
  }
  for (const issue of issues) fail(`capability-${issue}`, row.capability, `domain=${row.domain}, phase=${row.phaseOwner}`);
  return { capability: row.capability, domain: row.domain, classification: row.classification, phaseOwner: row.phaseOwner, authorable: active, authoringMode: active ? evidence?.authoringMode ?? null : null, ui: active ? evidence?.permanentUiLocations ?? [] : [], reverseSync, codegen: Boolean(row.codegen), preview: row.previewRuntimeRoute, complete: issues.length === 0 };
});

const families = new Map<string, { capability: string | null; domain: string; family: string; authoring: string; paths: number }>();
let authorableOptionPaths = 0;
for (const option of options.options) {
  const capability = capabilityFromOptionId(option.id);
  const row = capability ? rows.get(capability) : undefined;
  const family = optionFamilyRoot(option.path);
  const evidence = row ? PHASE16_DOMAIN_EVIDENCE_BY_DOMAIN.get(row.domain) : undefined;
  const authoring = !row ? 'not-studio-surface' : !isAuthorableVisualCapability(row) ? 'excluded' : evidence?.authoringMode ?? 'missing';
  const key = `${capability ?? 'unknown'}::${family}::${authoring}`;
  const current = families.get(key);
  if (current) current.paths += 1;
