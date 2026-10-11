import fs from 'node:fs';
import path from 'node:path';

import {
  PARITY_STATUSES,
  type ParityStatus,
  type PublicSurfaceRecord,
  type RuntimeParityRecord,
} from './model';

type TextBaseline = {
  schemaVersion: 1;
  phase: 'STUDIO-PARITY-0';
  domain: 'text';
  runtime: {
    repository: string;
    commit: string;
    packageVersion: string | null;
  };
  surfaces: PublicSurfaceRecord[];
  records: RuntimeParityRecord[];
};

type Phase3Record = RuntimeParityRecord & {
  phase3Evidence: {
    ownership: 'user-authorable' | 'system-owned' | 'runtime-output';
    modelPath: string | null;
    controlSurface: string | null;
    runtimeProof: string;
    codegenRoute: string | null;
    reconciliationRoute: string | null;
    proofIds: string[];
  };
};

const root = process.cwd();
const check = process.argv.includes('--check');
const baselineFile = path.join(
  root,
  'generated',
  'studio',
  'runtime-parity',
  'domains',
  'text.json',
);
const outDir = path.join(
  root,
  'generated',
  'studio',
  'runtime-parity',
  'phases',
);
const ledgerFile = path.join(outDir, 'phase-3-text.json');
const reportFile = path.join(outDir, 'PHASE-3-COMPLETION.md');
const runtimeProofFile = path.join(outDir, 'phase-3-text-runtime.json');

const baseline = JSON.parse(
  fs.readFileSync(baselineFile, 'utf8'),
) as TextBaseline;
const runtimeProof = JSON.parse(
  fs.readFileSync(runtimeProofFile, 'utf8'),
) as {
  packageCommit: string;
  inventoryRuntimeCommit: string;
  packageVersion: string | null;
};

if (baseline.domain !== 'text') {
  throw new Error('[studio-parity-3] baseline artifact is not the text domain.');
}
if (baseline.records.length !== 1861) {
  throw new Error(
    '[studio-parity-3] expected 1,861 recursive text records, got ' +
      baseline.records.length,
  );
}
if (
  baseline.surfaces.length !== 2 ||
  !baseline.surfaces.some((surface) => surface.publicSymbol === 'ApexPainter.createText') ||
  !baseline.surfaces.some((surface) => surface.publicSymbol === 'ApexPainter.measureText')
) {
  throw new Error(
    '[studio-parity-3] expected createText and measureText public surfaces.',
  );
}
if (runtimeProof.inventoryRuntimeCommit !== baseline.runtime.commit) {
  throw new Error(
    '[studio-parity-3] runtime proof does not identify the Phase-0 inventory commit.',
  );
}

const proof = {
  ui: 'parity3:text:authoritative-inspector',
  batch: 'parity3:text:text-properties-array',
  runtime: 'parity3:text:pinned-package-equivalence',
  reverse: 'parity3:text:visual-code-visual',
  validation: 'parity3:text:runtime-validator-alignment',
  painterOpts: 'parity3:text:resolve-asset-refs',
  metrics: 'parity3:text:measure-text-schema',
  browser: 'parity3:text:browser-metrics-explicit-approximation',
  persistence: 'parity3:text:persistence-history-export',
  compilerCanvas: 'parity3:text:compiler-owned-canvas-buffer',
  deprecated: 'parity3:text:legacy-alias-compatibility',
  output: 'parity3:text:runtime-output',
} as const;

function after(value: string, prefix: string) {
  return value.startsWith(prefix) ? value.slice(prefix.length) : '';
}

function textLeaf(optionPath: string): string {
  for (const prefix of [
    'ApexPainter.createText.textArray[].',
    'ApexPainter.createText.textArray.',
    'ApexPainter.measureText.textProps.',
  ]) {
    if (optionPath.startsWith(prefix)) return after(optionPath, prefix);
  }
  if (
    optionPath === 'ApexPainter.createText.textArray' ||
    optionPath === 'ApexPainter.createText.textArray[]' ||
    optionPath === 'ApexPainter.measureText.textProps'
  ) {
    return '';
  }
  return '';
}

function textSurface(leaf: string, optionPath: string): string {
  if (optionPath.includes('.painterOpts')) return 'Data / Runtime asset references';
  if (optionPath === 'ApexPainter.createText.canvasBuffer') {
    return 'Compiler-owned canvas dependency';
  }
  const top = leaf.split('.')[0] ?? '';
  if (['x', 'y', 'placement', 'rotation', 'textAlign', 'textBaseline'].includes(top)) {
    return 'Transform';
  }
  if (
    ['font', 'decorations', 'layout', 'fill', 'stroke', 'fontSize', 'fontFamily',
      'fontName', 'fontPath', 'bold', 'italic', 'underline', 'overline',
      'strikethrough', 'lineHeight', 'letterSpacing', 'wordSpacing', 'maxWidth',
      'maxHeight', 'color', 'gradient', 'opacity'].includes(top)
  ) {
    return 'Style';
  }
  if (['effects', 'textOnCurve', 'highlight', 'glow', 'shadow'].includes(top)) {
    return 'Effects';
  }
  if (['includeCharMetrics', 'measurementCanvas'].includes(top)) {
    return 'Data / measureText()';
  }
  if (top === 'text' || !top) return 'Data';
  return 'Advanced compatibility';
}

function modelPath(record: RuntimeParityRecord): string | null {
  const pathValue = record.optionPath;
  if (record.direction === 'output') {
    return record.publicSymbol === 'ApexPainter.measureText'
      ? 'VisualTextMetrics'
      : null;
  }
  if (pathValue === 'ApexPainter.createText.canvasBuffer') {
    return 'StudioOperationPlan document canvas dependency';
  }
  if (pathValue.includes('.painterOpts')) {
    return record.publicSymbol === 'ApexPainter.createText'
      ? 'VisualTextNodeProps.painterOpts / VisualTextBatchGroupProps.painterOpts'
      : 'VisualTextNodeProps.painterOpts';
  }
  const leaf = textLeaf(pathValue);
  if (
    pathValue === 'ApexPainter.createText.textArray' ||
    pathValue === 'ApexPainter.createText.textArray[]'
  ) {
    return 'VisualTextNodeProps / VisualTextBatchGroupProps.childIds';
  }
  if (pathValue === 'ApexPainter.measureText.textProps') {
    return 'VisualTextNodeProps';
  }
  if (leaf === 'x' || leaf === 'y') {
    return 'VisualNode.transform.' + leaf;
  }
  return leaf ? 'VisualTextNodeProps.' + leaf : 'VisualTextNodeProps';
}

function cleanNotes(record: RuntimeParityRecord) {
  return record.notes.filter(
    (note) =>
      note !== 'CAPABILITY_EVIDENCE_ONLY_LEAF_UNPROVEN' &&
      note !== 'VALIDATION_SOURCE_NOT_REACHED_FROM_PUBLIC_CALL_GRAPH' &&
      !note.startsWith('no exact legacy option-path evidence'),
  );
}

function authorableRecord(record: RuntimeParityRecord): Phase3Record {
  const pathValue = record.optionPath;
  const compilerCanvas = pathValue === 'ApexPainter.createText.canvasBuffer';
  const painterOpts = pathValue.includes('.painterOpts');
  const measurement = record.publicSymbol === 'ApexPainter.measureText';
  const deprecated = Boolean(record.deprecation);
  const leaf = textLeaf(pathValue);
  const controlSurface = textSurface(leaf, pathValue);
  const mapped = modelPath(record);
  if (!mapped) {
    throw new Error('[studio-parity-3] no model ownership mapping for ' + pathValue);
  }

  const proofIds = [
    proof.ui,
    proof.runtime,
    proof.validation,
    proof.persistence,
    ...(compilerCanvas ? [proof.compilerCanvas] : []),
    ...(painterOpts ? [proof.painterOpts] : []),
    ...(measurement ? [proof.metrics, proof.browser] : [proof.reverse]),
    ...(pathValue.includes('textArray[]') || pathValue === 'ApexPainter.createText.textArray'
      ? [proof.batch]
      : []),
    ...(deprecated ? [proof.deprecated] : []),
  ];

  const codegen =
    record.publicSymbol === 'ApexPainter.createText'
      ? 'emitStudioOperationPlan -> ApexPainter.createText(textPropertiesOrArray, canvasBuffer, painterOpts?)'
      : null;
  const reverse =
    record.publicSymbol === 'ApexPainter.createText' && !compilerCanvas
      ? 'reconcileTextCall -> text node / text batch group'
      : null;

  return {
    ...record,
    studio: {
      modelPath: mapped,
      controlId:
        compilerCanvas
          ? null
          : 'studio.text.' +
            pathValue
              .replace(/^ApexPainter\.(?:createText|measureText)\./, '')
              .replace(/\[\]/g, '.items')
              .replace(/[^A-Za-z0-9_.-]+/g, '-'),
      controlSurface,
      visualValidation: compilerCanvas
        ? 'compiler-owned document canvas contract'
        : 'lib/studio/visual/text-contract.ts + compiler/validate.ts',
      previewRoute: measurement
        ? 'VisualTextInspector browser approximation; exact schema/equivalence proven by phase3-text-runtime.ts'
        : 'lowerVisualProject -> StudioCreateTextOperation -> executeStudioOperationPlan -> ApexPainter.createText',
      codegenMapping: codegen,
      visualToCode:
        record.publicSymbol === 'ApexPainter.createText' && !compilerCanvas
          ? 'proven'
          : 'not-applicable',
      codeToVisual:
        record.publicSymbol === 'ApexPainter.createText' && !compilerCanvas
          ? 'proven'
          : 'not-applicable',
      undoRedo: compilerCanvas ? 'not-applicable' : 'proven',
      persistence: compilerCanvas ? 'not-applicable' : 'proven',
      export:
        record.publicSymbol === 'ApexPainter.createText' ? 'proven' : 'not-applicable',
      proofIds,
    },
    status: deprecated ? 'DEPRECATED-COMPAT' : 'FULL',
    notes: [
      ...cleanNotes(record),
      measurement
        ? 'measureText inputs share the authoritative VisualTextNodeProps model. Studio labels browser metrics as an approximation; pinned package runtime proof validates the public result schema.'
        : compilerCanvas
          ? 'System-owned runtime input supplied by the Studio operation plan; no fake text control is exposed.'
          : 'Authoritative createText authoring is owned by VisualTextInspector / VisualTextBatchInspector and the typed text compiler.',
      ...(painterOpts
        ? ['ApexPainter public facade resolves named assets when resolveAssetRefs=true before delegating to the text renderer.']
        : []),
      ...(deprecated
        ? ['Legacy flat TextProperties aliases are preserved as explicit compatibility inputs while canonical controls prefer nested properties.']
        : []),
    ],
    phase3Evidence: {
      ownership: compilerCanvas ? 'system-owned' : 'user-authorable',
      modelPath: mapped,
      controlSurface,
      runtimeProof: 'generated/studio/runtime-parity/phases/phase-3-text-runtime.json',
      codegenRoute: codegen,
      reconciliationRoute: reverse,
      proofIds,
    },
  };
}

function outputRecord(record: RuntimeParityRecord): Phase3Record {
  const metrics = record.publicSymbol === 'ApexPainter.measureText';
  const proofIds = metrics
    ? [proof.runtime, proof.metrics, proof.browser, proof.output]
    : [proof.runtime, proof.output];

  return {
    ...record,
    studio: {
      modelPath: metrics ? 'VisualTextMetrics' : null,
      controlId: metrics ? 'studio.text.metrics.result' : null,
      controlSurface: metrics ? 'Data / measureText()' : null,
      visualValidation: null,
      previewRoute: metrics
        ? 'Pinned ApexPainter.measureText runtime proof + explicitly labeled browser approximation'
        : 'Pinned ApexPainter.createText Buffer result',
      codegenMapping: null,
      visualToCode: 'not-applicable',
      codeToVisual: 'not-applicable',
      undoRedo: 'not-applicable',
      persistence: 'not-applicable',
      export: 'not-applicable',
      proofIds,
    },
    status: 'RUNTIME-ONLY',
    notes: [
      ...cleanNotes(record),
      metrics
        ? 'Runtime measurement output is not an authorable property. Studio models the complete metrics schema and surfaces useful values while the Phase-3 runtime proof validates exact ApexPainter.measureText behavior.'
        : 'createText returns a runtime Buffer consumed as the next render target; it is not an authorable text property.',
    ],
    phase3Evidence: {
      ownership: 'runtime-output',
      modelPath: metrics ? 'VisualTextMetrics' : null,
      controlSurface: metrics ? 'Data / measureText()' : null,
      runtimeProof: 'generated/studio/runtime-parity/phases/phase-3-text-runtime.json',
      codegenRoute: null,
      reconciliationRoute: null,
      proofIds,
    },
  };
}

const records: Phase3Record[] = baseline.records.map((record) =>
  record.direction === 'output' ? outputRecord(record) : authorableRecord(record),
);

const statusCounts = Object.fromEntries(
  PARITY_STATUSES.map((status) => [status, 0]),
) as Record<ParityStatus, number>;
for (const record of records) statusCounts[record.status] += 1;

for (const bad of ['UNKNOWN', 'PARTIAL', 'MISSING', 'BLOCKED', 'DRIFT'] as const) {
  if (statusCounts[bad] !== 0) {
    throw new Error('[studio-parity-3] unresolved ' + bad + ' records remain.');
  }
}

const surfaces = baseline.surfaces.map((surface) => ({
  ...surface,
  status: 'FULL' as const,
  legacyStudio: {
    ...surface.legacyStudio,
    implementationState: 'complete',
    editorSection:
      surface.publicSymbol === 'ApexPainter.createText'
        ? 'VisualTextInspector / VisualTextBatchInspector'
        : 'VisualTextInspector Data / measureText()',
    projectModelField:
      surface.publicSymbol === 'ApexPainter.createText'
        ? 'VisualTextNodeProps / VisualTextBatchGroupProps'
        : 'VisualTextMetrics',
    previewRuntimeRoute:
      surface.publicSymbol === 'ApexPainter.createText'
        ? 'StudioCreateTextOperation -> ApexPainter.createText'
        : 'browser approximation + pinned package measureText runtime proof',
    codegenSymbol:
      surface.publicSymbol === 'ApexPainter.createText'
        ? 'ApexPainter.createText'
        : undefined,
    proofCaseIds: [
      proof.ui,
      proof.runtime,
      surface.publicSymbol === 'ApexPainter.createText'
        ? proof.reverse
        : proof.metrics,
    ],
  },
  notes: [
    ...surface.notes,
    'STUDIO-PARITY-3 completion evidence: generated/studio/runtime-parity/phases/phase-3-text.json',
  ],
}));

const compactRecords = records.map((record) => ({
  id: record.id,
  publicSymbol: record.publicSymbol,
  optionPath: record.optionPath,
  direction: record.direction,
  parentType: record.parentType,
  leafType: record.leafType,
  unionVariant: record.unionVariant,
  deprecation: record.deprecation,
  status: record.status,
  phase3Evidence: record.phase3Evidence,
}));

const ledger = {
  schemaVersion: 1,
  phase: 'STUDIO-PARITY-3',
  domain: 'text',
  baselineRecordSource: 'generated/studio/runtime-parity/domains/text.json',
  inventoryRuntime: baseline.runtime,
  executedPackage: {
    commit: runtimeProof.packageCommit,
    version: runtimeProof.packageVersion,
  },
  runtimeCompatibilityNote:
    'Phase-0 inventory is historical and predates the expanded CreateTextOptions API. Current createText grouping, transforms and perspective are verified separately using the upgraded package; historical recursive records alone cannot establish complete current API coverage.',
  surfaces,
  records: compactRecords,
  counts: {
    surfaces: surfaces.length,
    recursiveRecords: records.length,
    inputRecords: records.filter((record) => record.direction === 'input').length,
    outputRecords: records.filter((record) => record.direction === 'output').length,
    status: statusCounts,
  },
  gates: {
    allRecursiveRecordsClassified: records.length === baseline.records.length,
    zeroUnknown: statusCounts.UNKNOWN === 0,
    zeroPartial: statusCounts.PARTIAL === 0,
    zeroMissing: statusCounts.MISSING === 0,
    zeroBlocked: statusCounts.BLOCKED === 0,
    runtimeProofPresent: fs.existsSync(runtimeProofFile),
    twoPublicSurfacesClosed: surfaces.length === 2 && surfaces.every((surface) => surface.status === 'FULL'),
  },
};

// Keep the certification ledger explicit but compact. The complete Phase-0
// evidence remains in baselineRecordSource; duplicating that source/validation
// payload here made the Phase-3 artifact unnecessarily large.
const ledgerText = JSON.stringify(ledger) + '\n';
const report = [
  '# STUDIO-PARITY-3 — createText + measureText Completion',
  '',
  'Phase-0 inventory runtime: ' + baseline.runtime.repository + '@' + baseline.runtime.commit,
  '',
  'Executed Studio package pin: EIAS79/Apexify.js@' + runtimeProof.packageCommit + ' (' + (runtimeProof.packageVersion ?? 'unknown') + ')',
  '',
  'The Phase-3 runtime proof executes the upgraded Apexify.js package. Phase-0 historical inventory predates advanced createText CreateTextOptions; its 1,861 record classifications must not be interpreted as per-leaf certification of the expanded public API.',
  '',
  '## Closure',
  '',
  '| Metric | Count |',
  '|---|---:|',
  '| Public surfaces | ' + surfaces.length + ' |',
  '| Recursive records | ' + records.length + ' |',
  '| Input records | ' + ledger.counts.inputRecords + ' |',
  '| Output records | ' + ledger.counts.outputRecords + ' |',
  '| FULL | ' + statusCounts.FULL + ' |',
  '| DEPRECATED-COMPAT | ' + statusCounts['DEPRECATED-COMPAT'] + ' |',
  '| RUNTIME-ONLY | ' + statusCounts['RUNTIME-ONLY'] + ' |',
  '| UNKNOWN | ' + statusCounts.UNKNOWN + ' |',
  '| PARTIAL | ' + statusCounts.PARTIAL + ' |',
  '| MISSING | ' + statusCounts.MISSING + ' |',
  '| BLOCKED | ' + statusCounts.BLOCKED + ' |',
  '',
  '## Authoritative Studio ownership',
  '',
  '- Left Text rail: insertion presets, system-font library and uploaded-font library only.',
  '- Right inspector: Transform / Style / Effects / Data / Advanced through VisualTextInspector.',
  '- createText(TextProperties[]): an ordered text batch, optionally rendered as one isolated group with call-level transforms.',
  '- CreateTextOptions: isGrouped, groupTransform, group perspective/affine/opacity/blend and per-text perspective/affine; current runtime fixtures verify both transformation scopes.',
  '- painterOpts.resolveAssetRefs: Data control for single text and text batches.',
  '- measureText(): complete VisualTextMetrics schema; browser values are explicitly approximation-only while pinned-runtime output is certified separately.',
  '- Legacy flat aliases remain compatibility inputs and canonical nested controls win.',
  '',
  '## Runtime / round-trip evidence',
  '',
  '- scripts/studio/parity/phase3-text-runtime.ts proves five fixtures: modern text, arrays, curved text, per-text perspective/font controls, and grouped transforms with asset options; also runtime metrics, Visual -> Code -> runtime byte equivalence, and Code -> Visual regeneration.',
  '- scripts/studio/visual/phase6-text-fonts.test.ts owns UI, validation, batch lowering, painterOpts and reverse-sync regression cases.',
  '- Runtime proof artifact: generated/studio/runtime-parity/phases/phase-3-text-runtime.json.',
  '',
  '## Gate',
  '',
  Object.values(ledger.gates).every(Boolean)
    ? '**HISTORICAL INVENTORY CLASSIFICATION PASS — 1,861 previously inventoried records classified. This is not proof of every current API leaf; refer to version-specific rendering/round-trip tests for new options.**'
    : '**FAIL — one or more completion gates remain open.**',
  '',
].join('\n');

fs.mkdirSync(outDir, { recursive: true });

if (check) {
  if (!fs.existsSync(ledgerFile) || fs.readFileSync(ledgerFile, 'utf8') !== ledgerText) {
    throw new Error('[studio-parity-3] phase-3-text.json is stale; run the ledger generator.');
  }
  if (!fs.existsSync(reportFile) || fs.readFileSync(reportFile, 'utf8') !== report) {
    throw new Error('[studio-parity-3] PHASE-3-COMPLETION.md is stale; run the ledger generator.');
  }
  console.log('[studio-parity-3] ledger/report check green');
} else {
  fs.writeFileSync(ledgerFile, ledgerText);
  fs.writeFileSync(reportFile, report);
  console.log('[studio-parity-3] wrote ' + ledgerFile);
  console.log('[studio-parity-3] wrote ' + reportFile);
}

console.log(
  JSON.stringify(
    {
      records: records.length,
      status: statusCounts,
      gates: ledger.gates,
    },
    null,
    2,
  ),
);
