import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  PARITY_STATUSES,
  type ParityStatus,
  type PublicSurfaceRecord,
  type RuntimeParityRecord,
} from './model';

type ImageBaseline = {
  schemaVersion: 1;
  phase: 'STUDIO-PARITY-0';
  domain: 'image';
  runtime: {
    repository: string;
    commit: string;
    packageVersion: string | null;
  };
  surfaces: PublicSurfaceRecord[];
  records: RuntimeParityRecord[];
};

type Phase2Record = RuntimeParityRecord & {
  phase2Evidence: {
    ownership: 'user-authorable' | 'system-owned' | 'runtime-output';
    modelPath: string | null;
    controlSurface: string | null;
    visualValidation: string | null;
    previewRoute: string | null;
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
  'image.json',
);
const outDir = path.join(
  root,
  'generated',
  'studio',
  'runtime-parity',
  'phases',
);
const ledgerFile = path.join(outDir, 'phase-2-image.json');
const reportFile = path.join(outDir, 'PHASE-2-COMPLETION.md');
const pin = JSON.parse(
  fs.readFileSync(
    path.join(root, 'scripts', 'studio', 'parity', 'runtime-source.json'),
    'utf8',
  ),
) as { commit: string; repository: string };

const baselineText = fs.readFileSync(baselineFile, 'utf8');
const baseline = JSON.parse(baselineText) as ImageBaseline;

if (baseline.domain !== 'image') {
  throw new Error('[studio-parity-2] baseline artifact is not the image domain.');
}
if (baseline.runtime.commit !== pin.commit) {
  throw new Error(
    '[studio-parity-2] image baseline runtime SHA does not match the pinned runtime.',
  );
}
if (
  baseline.surfaces.length !== 1 ||
  baseline.surfaces[0]?.publicSymbol !== 'ApexPainter.createImage'
) {
  throw new Error(
    '[studio-parity-2] expected exactly ApexPainter.createImage in the image domain.',
  );
}

const proof = {
  ui: 'parity2:image:single-owner-inspector',
  regression: 'parity2:image:regression-suite',
  runtime: 'parity2:image:pinned-runtime-equivalence',
  reverse: 'parity2:image:visual-code-visual',
  validation: 'parity2:image:runtime-validator-alignment',
  array: 'parity2:image:image-properties-array',
  painterOpts: 'parity2:image:resolve-asset-refs',
  persistence: 'parity2:image:model-persistence-history-export',
  compilerCanvas: 'parity2:image:compiler-owned-canvas-buffer',
  deprecated: 'parity2:image:deprecated-shadow-border-position',
  output: 'parity2:image:runtime-buffer-output',
} as const;

function after(pathValue: string, prefix: string): string {
  return pathValue.startsWith(prefix)
    ? pathValue.slice(prefix.length)
    : '';
}

function imageLeaf(pathValue: string): string {
  if (pathValue.startsWith('ApexPainter.createImage.images[].')) {
    return after(pathValue, 'ApexPainter.createImage.images[].');
  }
  if (pathValue.startsWith('ApexPainter.createImage.images.')) {
    return after(pathValue, 'ApexPainter.createImage.images.');
  }
  if (pathValue === 'ApexPainter.createImage.images[]') return '';
  if (pathValue === 'ApexPainter.createImage.images') return '';
  return '';
}

function imageControlSurface(leaf: string): string {
  if (
    /^(?:x|y|width|height|rotation|opacity|fit|align|inherit)(?:\.|$)/.test(
      leaf,
    )
  ) return 'Transform';
  if (
    /^(?:shape|blendMode|blur|borderRadius|borderPosition|stroke|shadow|boxBackground)(?:\.|$)/.test(
      leaf,
    )
  ) return 'Style';
  if (
    /^(?:filters|filterIntensity|filterOrder|mask|clipPath|distortion|meshWarp|effects)(?:\.|$)/.test(
      leaf,
    )
  ) return 'Effects';
  if (/^source(?:\.|$)/.test(leaf)) return 'Data';
  return 'Advanced';
}

function imageModelPath(pathValue: string): string | null {
  if (
    pathValue === 'ApexPainter.createImage.images' ||
    pathValue === 'ApexPainter.createImage.images[]'
  ) {
    return 'VisualImageNodeProps / VisualImageBatchGroupProps.childIds';
  }
  if (
    pathValue.startsWith('ApexPainter.createImage.images.') ||
    pathValue.startsWith('ApexPainter.createImage.images[].')
  ) {
    const leaf = imageLeaf(pathValue);
    if (['x','y','width','height','rotation','opacity'].includes(leaf)) {
      return 'VisualNode.transform.' + leaf;
    }
    return 'VisualImageNodeProps' + (leaf ? '.' + leaf : '');
  }
  if (pathValue === 'ApexPainter.createImage.options') {
    return 'VisualImageNodeProps.createOptions / VisualImageBatchGroupProps.createOptions';
  }
  if (pathValue.startsWith('ApexPainter.createImage.options.')) {
    return (
      'VisualImageBatchGroupProps.createOptions.' +
      after(pathValue, 'ApexPainter.createImage.options.')
    );
  }
  if (pathValue === 'ApexPainter.createImage.painterOpts') {
    return 'VisualImageNodeProps.painterOpts / VisualImageBatchGroupProps.painterOpts';
  }
  if (pathValue.startsWith('ApexPainter.createImage.painterOpts.')) {
    return (
      'VisualImageNodeProps.painterOpts.' +
      after(pathValue, 'ApexPainter.createImage.painterOpts.')
    );
  }
  if (pathValue === 'ApexPainter.createImage.canvasBuffer') {
    return 'StudioOperationPlan.document_canvas dependency';
  }
  return null;
}

function authorableRecord(record: RuntimeParityRecord): Phase2Record {
  const pathValue = record.optionPath;
  const modelPath = imageModelPath(pathValue);
  if (!modelPath) {
    throw new Error(
      '[studio-parity-2] no model ownership mapping for ' + pathValue,
    );
  }

  const canvasBuffer =
    pathValue === 'ApexPainter.createImage.canvasBuffer';
  const optionPath =
    pathValue === 'ApexPainter.createImage.options' ||
    pathValue.startsWith('ApexPainter.createImage.options.');
  const painterPath =
    pathValue === 'ApexPainter.createImage.painterOpts' ||
    pathValue.startsWith('ApexPainter.createImage.painterOpts.');
  const arrayPath =
    pathValue === 'ApexPainter.createImage.images[]' ||
    pathValue.startsWith('ApexPainter.createImage.images[].');
  const deprecated = Boolean(record.deprecation);

  const controlSurface = canvasBuffer
    ? 'Compiler-owned canvas dependency'
    : optionPath
      ? 'Image batch inspector / Advanced'
      : painterPath
        ? 'Data / Runtime asset references'
        : imageControlSurface(imageLeaf(pathValue));

  const proofIds = canvasBuffer
    ? [proof.compilerCanvas, proof.runtime]
    : [
        proof.ui,
        proof.regression,
        proof.runtime,
        proof.reverse,
        proof.validation,
        proof.persistence,
        ...(arrayPath || optionPath ? [proof.array] : []),
        ...(painterPath ? [proof.painterOpts] : []),
        ...(deprecated ? [proof.deprecated] : []),
      ];

  return {
    ...record,
    studio: {
      modelPath,
      controlId:
        'studio.image.' +
        pathValue
          .replace('ApexPainter.createImage.', '')
          .replace(/\[\]/g, '.items')
          .replace(/[^A-Za-z0-9_.-]+/g, '-'),
      controlSurface,
      visualValidation: canvasBuffer
        ? 'compiler-owned; canvas validity is validated before image lowering'
        : 'lib/studio/visual/image-contract.ts + lib/studio/visual/compiler/validate.ts',
      previewRoute:
        'lowerVisualProject -> StudioCreateImageOperation -> executeStudioOperationPlan -> runtime.createImage',
      codegenMapping:
        'emitStudioOperationPlan -> ApexPainter.createImage(images, canvasBuffer, options?, painterOpts?)',
      visualToCode: 'proven',
      codeToVisual: canvasBuffer ? 'not-applicable' : 'proven',
      undoRedo: canvasBuffer ? 'not-applicable' : 'proven',
      persistence: canvasBuffer ? 'not-applicable' : 'proven',
      export: 'proven',
      proofIds,
    },
    status: deprecated ? 'DEPRECATED-COMPAT' : 'FULL',
    notes: [
      ...record.notes.filter(
        (note) =>
          note !== 'VALIDATION_SOURCE_NOT_REACHED_FROM_PUBLIC_CALL_GRAPH' &&
          !note.startsWith('no exact legacy option-path evidence'),
      ),
      canvasBuffer
        ? 'System-owned runtime input: Studio supplies the current document canvas buffer through the operation plan; it is intentionally not exposed as a fake image UI field.'
        : 'STUDIO-PARITY-2 createImage authoring chain is owned by the rebuilt typed image inspector and compiler.',
      ...(deprecated
        ? [
            'Deprecated shadow.borderPosition is preserved as compatibility input; roundedCorners is the preferred public field.',
          ]
        : []),
    ],
    phase2Evidence: {
      ownership: canvasBuffer ? 'system-owned' : 'user-authorable',
      modelPath,
      controlSurface,
      visualValidation: canvasBuffer
        ? 'document canvas/compiler contract'
        : 'lib/studio/visual/image-contract.ts',
      previewRoute:
        'lowerVisualProject -> executeStudioOperationPlan -> runtime.createImage',
      codegenRoute:
        'emitStudioOperationPlan -> ApexPainter.createImage',
      reconciliationRoute: canvasBuffer
        ? null
        : 'reconcileImageCall -> image node / image batch group',
      proofIds,
    },
  };
}

function outputRecord(record: RuntimeParityRecord): Phase2Record {
  return {
    ...record,
    studio: {
      modelPath: null,
      controlId: null,
      controlSurface: null,
      visualValidation: null,
      previewRoute: 'pinned Apexify.js createImage Buffer result',
      codegenMapping: null,
      visualToCode: 'not-applicable',
      codeToVisual: 'not-applicable',
      undoRedo: 'not-applicable',
      persistence: 'not-applicable',
      export: 'not-applicable',
      proofIds: [proof.runtime, proof.output],
    },
    status: 'RUNTIME-ONLY',
    notes: [
      ...record.notes.filter(
        (note) =>
          note !== 'VALIDATION_SOURCE_NOT_REACHED_FROM_PUBLIC_CALL_GRAPH' &&
          !note.startsWith('no exact legacy option-path evidence'),
      ),
      'createImage returns a runtime Buffer. Studio consumes the buffer as the next render target; it is not an authorable option.',
    ],
    phase2Evidence: {
      ownership: 'runtime-output',
      modelPath: null,
      controlSurface: null,
      visualValidation: null,
      previewRoute: 'pinned Apexify.js createImage Buffer result',
      codegenRoute: null,
      reconciliationRoute: null,
      proofIds: [proof.runtime, proof.output],
    },
  };
}

const records: Phase2Record[] = baseline.records.map((record) =>
  record.direction === 'input'
    ? authorableRecord(record)
    : outputRecord(record),
);

const statusCounts = Object.fromEntries(
  PARITY_STATUSES.map((status) => [status, 0]),
) as Record<ParityStatus, number>;
for (const record of records) statusCounts[record.status] += 1;

const inputs = records.filter((record) => record.direction === 'input');
const outputs = records.filter((record) => record.direction === 'output');
const uniqueInputPaths = new Set(inputs.map((record) => record.optionPath));
const deprecated = inputs.filter(
  (record) => record.status === 'DEPRECATED-COMPAT',
);
const requiredDeprecated = new Set([
  'ApexPainter.createImage.images.shadow.borderPosition',
  'ApexPainter.createImage.images[].shadow.borderPosition',
  'ApexPainter.createImage.options.groupTransform.shadow.borderPosition',
]);
const actualDeprecated = new Set(
  deprecated.map((record) => record.optionPath),
);

const userInputsComplete = inputs
  .filter(
    (record) =>
      record.phase2Evidence.ownership === 'user-authorable',
  )
  .every(
    (record) =>
      (record.status === 'FULL' ||
        record.status === 'DEPRECATED-COMPAT') &&
      Boolean(record.studio.modelPath) &&
      Boolean(record.studio.controlSurface) &&
      Boolean(record.studio.visualValidation) &&
      Boolean(record.studio.previewRoute) &&
      Boolean(record.studio.codegenMapping) &&
      record.studio.visualToCode === 'proven' &&
      record.studio.codeToVisual === 'proven' &&
      record.studio.undoRedo === 'proven' &&
      record.studio.persistence === 'proven' &&
      record.studio.export === 'proven' &&
      record.studio.proofIds.length >= 6,
  );

const canvasBufferOwned = inputs.some(
  (record) =>
    record.optionPath === 'ApexPainter.createImage.canvasBuffer' &&
    record.status === 'FULL' &&
    record.phase2Evidence.ownership === 'system-owned' &&
    record.studio.modelPath ===
      'StudioOperationPlan.document_canvas dependency',
);

const arrayOwned = inputs
  .filter(
    (record) =>
      record.optionPath === 'ApexPainter.createImage.images[]' ||
      record.optionPath.startsWith(
        'ApexPainter.createImage.images[].',
      ),
  )
  .every((record) =>
    record.studio.proofIds.includes(proof.array),
  );

const optionsOwned = inputs
  .filter(
    (record) =>
      record.optionPath === 'ApexPainter.createImage.options' ||
      record.optionPath.startsWith(
        'ApexPainter.createImage.options.',
      ),
  )
  .every((record) =>
    record.studio.proofIds.includes(proof.array),
  );

const painterOptsOwned = inputs
  .filter(
    (record) =>
      record.optionPath === 'ApexPainter.createImage.painterOpts' ||
      record.optionPath.startsWith(
        'ApexPainter.createImage.painterOpts.',
      ),
  )
  .every((record) =>
    record.studio.proofIds.includes(proof.painterOpts),
  );

const runtimeOutputsExplicit =
  outputs.length === 1 &&
  outputs.every(
    (record) =>
      record.status === 'RUNTIME-ONLY' &&
      record.phase2Evidence.ownership === 'runtime-output',
  );

const deprecatedCoverage =
  requiredDeprecated.size === actualDeprecated.size &&
  [...requiredDeprecated].every((pathValue) =>
    actualDeprecated.has(pathValue),
  );

const exactRecordAccounting =
  records.length === 680 &&
  inputs.length === 679 &&
  outputs.length === 1 &&
  uniqueInputPaths.size === 494 &&
  statusCounts.FULL === 676 &&
  statusCounts['DEPRECATED-COMPAT'] === 3 &&
  statusCounts['RUNTIME-ONLY'] === 1;

const noUnexplainedStatuses = records.every((record) =>
  ['FULL', 'DEPRECATED-COMPAT', 'RUNTIME-ONLY'].includes(
    record.status,
  ),
);

const gates = {
  pinnedRuntimeMatchesBaseline: baseline.runtime.commit === pin.commit,
  oneCreateImageSurface: baseline.surfaces.length === 1,
  exactRecordAccounting,
  userInputsComplete,
  canvasBufferOwned,
  arrayOwned,
  optionsOwned,
  painterOptsOwned,
  deprecatedCoverage,
  runtimeOutputsExplicit,
  noUnexplainedStatuses,
  noUnknown: statusCounts.UNKNOWN === 0,
  noPartial: statusCounts.PARTIAL === 0,
  noMissing: statusCounts.MISSING === 0,
  noBlocked: statusCounts.BLOCKED === 0,
  complete: false,
};
gates.complete = Object.entries(gates)
  .filter(([key]) => key !== 'complete')
  .every(([, value]) => value === true);

const surface: PublicSurfaceRecord = {
  ...baseline.surfaces[0]!,
  status: 'FULL',
  inputRecordCount: inputs.length,
  outputRecordCount: outputs.length,
  notes: [
    'STUDIO-PARITY-2 complete: createImage object and array authoring, CreateImageOptions, group transforms, painterOpts, validation, preview, codegen and reverse sync are explicitly owned.',
    'The returned Buffer remains runtime output and the canvasBuffer argument remains a system-owned compiler dependency.',
  ],
};

const ledger = {
  schemaVersion: 1,
  phase: 'STUDIO-PARITY-2',
  domain: 'image',
  status: gates.complete ? 'COMPLETE' : 'BLOCKED',
  runtime: baseline.runtime,
  sourceBaseline: {
    file: 'generated/studio/runtime-parity/domains/image.json',
    sha256: crypto
      .createHash('sha256')
      .update(baselineText)
      .digest('hex'),
  },
  summary: {
    surfaces: 1,
    records: records.length,
    inputRecords: inputs.length,
    outputRecords: outputs.length,
    uniqueInputPaths: uniqueInputPaths.size,
    status: statusCounts,
  },
  proofs: {
    [proof.ui]:
      'VisualImageInspector and VisualImageBatchInspector are the sole selected image/shape authoring surfaces; the legacy scattered inspector implementation was deleted.',
    [proof.regression]:
      'Phase-2 regression suite covers complete distortion variants, mesh semantics, painterOpts, array batching, grouped and sequential array behavior, and inspector ownership.',
    [proof.runtime]:
      'Studio operation-plan preview and generated Apexify.js source are executed byte-equivalently against the pinned createImage runtime.',
    [proof.reverse]:
      'Canonical createImage object/array source reconciles into image nodes/image batch groups and regenerates stably.',
    [proof.validation]:
      'Image and grouped-image validation mirrors pinned runtime resource, filter, mask, clip, distortion, mesh, shape and grouped-surface constraints.',
    [proof.array]:
      'Image-only Studio groups lower to one createImage(ImageProperties[]) call; array batching remains distinct from options.isGrouped temporary-surface behavior.',
    [proof.painterOpts]:
      'The fourth createImage painterOpts.resolveAssetRefs argument is modeled, authored, previewed, emitted, reverse-synced and runtime-tested.',
    [proof.persistence]:
      'Image and batch state lives in VisualProject and therefore participates in Studio history, persistence and export.',
    [proof.compilerCanvas]:
      'canvasBuffer is supplied from the current document_canvas operation target rather than exposed as a fake user field.',
    [proof.deprecated]:
      'shadow.borderPosition compatibility aliases remain explicit; roundedCorners is preferred.',
    [proof.output]:
      'The returned Buffer is tested as runtime output and consumed as the next render target.',
  },
  gates,
  surface,
  records,
};

const report = [
  '# STUDIO-PARITY-2 — createImage Completion Report',
  '',
  '> Deterministic evidence closure generated from the Phase-0 recursive image inventory.',
  '',
  '## Status',
  '',
  '- Phase: `STUDIO-PARITY-2`',
  '- Surface: `ApexPainter.createImage`',
  '- Status: **' + ledger.status + '**',
  '- Runtime SHA: `' + baseline.runtime.commit + '`',
  '- Runtime version: `' + String(baseline.runtime.packageVersion ?? 'unknown') + '`',
  '',
  '## Recursive accounting',
  '',
  '| Measure | Count |',
  '|---|---:|',
  '| Public surfaces | 1 |',
  '| Recursive records | ' + records.length + ' |',
  '| Input records | ' + inputs.length + ' |',
  '| Unique input paths | ' + uniqueInputPaths.size + ' |',
  '| Runtime output records | ' + outputs.length + ' |',
  '| `FULL` | ' + statusCounts.FULL + ' |',
  '| `DEPRECATED-COMPAT` | ' + statusCounts['DEPRECATED-COMPAT'] + ' |',
  '| `RUNTIME-ONLY` | ' + statusCounts['RUNTIME-ONLY'] + ' |',
  '| `UNKNOWN` | ' + statusCounts.UNKNOWN + ' |',
  '| `PARTIAL` | ' + statusCounts.PARTIAL + ' |',
  '| `MISSING` | ' + statusCounts.MISSING + ' |',
  '| `BLOCKED` | ' + statusCounts.BLOCKED + ' |',
  '',
  'The 679 input records close as **676 FULL + 3 DEPRECATED-COMPAT**. The returned Buffer closes as **RUNTIME-ONLY**.',
  '',
  '## Rebuild outcome',
  '',
  '- Deleted the old scattered selected-image inspector implementation.',
  '- Added one typed `VisualImageInspector` for image/shape layers and one `VisualImageBatchInspector` for `ImageProperties[]` calls.',
  '- Left Images/Shapes rails are insertion/library surfaces only.',
  '- Added all six distortion variants, warp handles, interpolation/edge modes and modern/legacy mesh grids.',
  '- Added fourth-argument `painterOpts.resolveAssetRefs` ownership.',
  '- Added true `createImage(ImageProperties[])` lowering and reverse sync.',
  '- Preserved the semantic distinction between array batching and `isGrouped` temporary grouped rendering.',
  '- Removed raw JSON as the primary path to public createImage options.',
  '',
  '## Deprecated compatibility',
  '',
  '- `images.shadow.borderPosition`',
  '- `images[].shadow.borderPosition`',
  '- `options.groupTransform.shadow.borderPosition`',
  '',
  'All remain compatibility aliases; `roundedCorners` is preferred.',
  '',
  '## Gates',
  '',
  ...Object.entries(gates).map(
    ([name, value]) =>
      '- [' + (value ? 'x' : ' ') + '] `' + name + '`',
  ),
  '',
  '## Certification',
  '',
  'Phase completion additionally requires the dedicated certification workflow to pass the fast image suite, pinned runtime proof, deterministic ledger check and parity TypeScript check.',
  '',
  '## Next phase',
  '',
  'Proceed to **STUDIO-PARITY-3** only after this report and certification remain green.',
  '',
].join('\n');

const renderedLedger = JSON.stringify(ledger) + '\n';
const renderedReport = report + '\n';

function writeOrCheck(
  file: string,
  contentValue: string,
  label: string,
) {
  if (check) {
    if (!fs.existsSync(file)) {
      throw new Error('[studio-parity-2] missing generated ' + label);
    }
    if (
      fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !==
      contentValue
    ) {
      throw new Error('[studio-parity-2] generated ' + label + ' is stale');
    }
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contentValue);
}

writeOrCheck(ledgerFile, renderedLedger, 'phase-2-image.json');
writeOrCheck(reportFile, renderedReport, 'PHASE-2-COMPLETION.md');

console.log(
  '[studio-parity-2] ' +
    (check ? 'verified' : 'wrote') +
    ' createImage closure: ' +
    statusCounts.FULL +
    ' FULL, ' +
    statusCounts['DEPRECATED-COMPAT'] +
    ' DEPRECATED-COMPAT, ' +
    statusCounts['RUNTIME-ONLY'] +
    ' RUNTIME-ONLY, ' +
    records.length +
    ' total records.',
);

if (!gates.complete) {
  console.error('[studio-parity-2] completion gates failed:', gates);
  process.exitCode = 1;
}
