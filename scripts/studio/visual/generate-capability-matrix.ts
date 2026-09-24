import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  VISUAL_CAPABILITY_CLASSIFICATIONS,
  type StudioExecutionRoute,
  type VisualCapabilityClassification,
  type VisualCapabilityRow,
} from '../../../lib/studio/visual/capability';

type BaseCapabilityProof = {
  capability: string;
  route: StudioExecutionRoute;
  status: string;
  proofCaseIds: string[];
  finalValidation: string;
};

type BaseCapabilityMatrix = {
  schemaVersion: number;
  packagePin: string | null;
  implementationComplete: boolean;
  capabilityProofs: BaseCapabilityProof[];
};

type DocsOptionInventory = {
  schemaVersion: number;
  total: number;
  options: Array<{
    id: string;
    path: string;
  }>;
};

type DocsArtifactIndex = {
  artifacts: Array<{
    file: string;
    sha256: string;
  }>;
};

const root = process.cwd();
const check = process.argv.includes('--check');
const sourceFile = path.join(root, 'generated', 'studio', 'capability-matrix.json');
const optionSourceFile = path.join(root, 'generated', 'docs-doc4', 'option-inventory.json');
const docsIndexFile = path.join(root, 'generated', 'docs-doc4', 'index.json');
const outFile = path.join(root, 'generated', 'studio', 'visual-capability-matrix.json');

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function domainFor(capability: string): string | null {
  if (capability === 'ApexPainter.animate') return 'animation';
  if (capability.startsWith('ApexPainter.assets.')) return 'assets';
  if (capability.startsWith('ApexPainter.components.')) return 'components';
  if (capability.startsWith('ApexPainter.createAudio.')) return 'audio';
  if (/^ApexPainter\.create(?:Combo|Comparison)?Chart$/.test(capability)) return 'chart';
  if (capability === 'ApexPainter.createCanvas') return 'canvas';
  if (capability === 'ApexPainter.createGIF' || capability === 'ApexPainter.renderSceneToGIF') return 'gif';
  if (capability === 'ApexPainter.createImage') return 'image';
  if (capability.startsWith('ApexPainter.image.')) return 'image-utils';
  if (capability === 'ApexPainter.createText' || capability === 'ApexPainter.measureText') return 'text';
  if (
    capability === 'ApexPainter.createScene' ||
    capability === 'ApexPainter.renderScene' ||
    capability === 'ApexPainter.validateSceneRenderInput' ||
    capability.startsWith('SceneBuilder.')
  ) return 'scene';
  if (capability === 'ApexPainter.createTemplate' || capability.startsWith('TemplateHandle.')) return 'template';
  if (capability.startsWith('ApexPainter.path2d.')) return 'path';
  if (capability.startsWith('ApexPainter.pixels.')) return 'pixels';
  if (capability.startsWith('ApexPainter.detect.')) return 'detect';
  if (
    capability === 'ApexPainter.createVideo' ||
    capability === 'ApexPainter.videoPipeline' ||
    capability === 'ApexPainter.renderSceneToVideoFrames' ||
    capability.startsWith('ApexPainter.video.') ||
    capability.startsWith('ApexPainter.extract') ||
    capability === 'ApexPainter.getVideoInfo' ||
    capability.startsWith('Video')
  ) return 'video';
  if (
    capability === 'ApexPainter.outPut' ||
    capability === 'ApexPainter.toOutput' ||
    capability === 'ApexPainter.outputFormat' ||
    capability === 'ApexPainter.save' ||
    capability === 'ApexPainter.saveMultiple' ||
    capability.startsWith('ApexPainter.output.')
  ) return 'output';
  if (capability.startsWith('ApexPainter.plugins.') || capability === 'ApexPainter.use') return 'plugins';
  if (capability === 'ApexPainter.batch' || capability === 'ApexPainter.chain') return 'batch-chain';
  if (capability === 'ApexPainter.prepareForRender') return 'rendering';
  return null;
}

const NON_AUTHORABLE = new Set<string>([
  'ApexPainter.image.validHex',
  'ApexPainter.createAudio.listPresets',
  'ApexPainter.createAudio.presetNames',
  'ApexPainter.plugins.get',
  'ApexPainter.plugins.has',
  'ApexPainter.plugins.isInstalled',
  'ApexPainter.plugins.list',
  'ApexPainter.plugins.listInstalled',
  'VideoOperations.describeOperation',
  'VideoPipeline.canRedo',
  'VideoPipeline.canUndo',
  'VideoPipeline.getLayers',
  'VideoPipeline.toJSON',
]);

function classificationFor(
  capability: string,
  route: StudioExecutionRoute,
  domain: string,
): VisualCapabilityClassification | null {
  if (route === 'host-persistence' || route === 'external-service') return 'hosted-runtime-exclusion';
  if (route === 'introspection' || NON_AUTHORABLE.has(capability)) return 'not-applicable';
  if (domain === 'output') return 'export-only';
  if (['animation', 'gif', 'audio', 'video'].includes(domain)) return 'timeline-operation';
  if (
    capability === 'ApexPainter.createCanvas' ||
    capability === 'ApexPainter.createImage' ||
    capability === 'ApexPainter.createText' ||
    /^ApexPainter\.create(?:Combo|Comparison)?Chart$/.test(capability) ||
    capability === 'ApexPainter.createScene' ||
    capability === 'ApexPainter.createTemplate' ||
    capability.startsWith('ApexPainter.components.')
  ) return 'visual-object';
  if (['image-utils', 'text', 'scene', 'template', 'path', 'pixels', 'detect'].includes(domain)) {
    return 'visual-operation';
  }
  if (['assets', 'plugins', 'batch-chain', 'rendering'].includes(domain)) return 'project-operation';
  return null;
}

function editorSectionFor(domain: string): string | null {
  const sections: Record<string, string> = {
    canvas: 'Canvas',
    image: 'Insert / Images',
    'image-utils': 'Image Effects',
    text: 'Text',
    chart: 'Charts',
    scene: 'Composition / Scenes',
    template: 'Composition / Templates',
    components: 'Insert / Components',
    assets: 'Assets',
    path: 'Path / Doodle',
    pixels: 'Pixels / Detection',
    detect: 'Pixels / Detection',
    animation: 'Timeline / Animation',
    gif: 'Timeline / GIF',
    audio: 'Timeline / Audio',
    video: 'Timeline / Video',
    output: 'Export',
    plugins: 'Advanced / Plugins',
    'batch-chain': 'Advanced / Operations',
    rendering: 'Advanced / Rendering',
  };
  return sections[domain] ?? null;
}

function phaseOwnerFor(domain: string): string {
  const owners: Record<string, string> = {
    canvas: 'STUDIO-VISUAL-4',
    image: 'STUDIO-VISUAL-5',
    text: 'STUDIO-VISUAL-6',
    path: 'STUDIO-VISUAL-7',
    pixels: 'STUDIO-VISUAL-7',
    detect: 'STUDIO-VISUAL-7',
    chart: 'STUDIO-VISUAL-8',
    scene: 'STUDIO-VISUAL-9',
    components: 'STUDIO-VISUAL-9',
    template: 'STUDIO-VISUAL-9',
    assets: 'STUDIO-VISUAL-9',
    'image-utils': 'STUDIO-VISUAL-10',
    animation: 'STUDIO-VISUAL-11',
    gif: 'STUDIO-VISUAL-11',
    audio: 'STUDIO-VISUAL-12',
    video: 'STUDIO-VISUAL-13',
    output: 'STUDIO-VISUAL-14',
    plugins: 'STUDIO-VISUAL-14',
    'batch-chain': 'STUDIO-VISUAL-14',
    rendering: 'STUDIO-VISUAL-14',
  };
  return owners[domain] ?? 'UNASSIGNED';
}

const IMPLEMENTED_PHASE_OWNERS = new Set([
  'STUDIO-VISUAL-4',
  'STUDIO-VISUAL-5',
  'STUDIO-VISUAL-6',
  'STUDIO-VISUAL-7',
  'STUDIO-VISUAL-8',
  'STUDIO-VISUAL-9',
  'STUDIO-VISUAL-10',
  'STUDIO-VISUAL-11',
  'STUDIO-VISUAL-12',
  'STUDIO-VISUAL-13',
]);

function projectFieldFor(
  classification: VisualCapabilityClassification,
  domain: string,
): string | null {
  if (classification === 'hosted-runtime-exclusion' || classification === 'not-applicable') return null;
  if (domain === 'assets') return 'assets';
  if (['animation', 'gif', 'audio', 'video'].includes(domain)) return 'timelines';
  if (domain === 'output') return 'outputs';
  if (['plugins', 'batch-chain', 'rendering'].includes(domain)) return 'operations';
  return 'document.nodes';
}

function previewRouteFor(
  classification: VisualCapabilityClassification,
  route: StudioExecutionRoute,
): 'browser' | 'full-runtime' | null {
  if (classification === 'hosted-runtime-exclusion' || classification === 'not-applicable') return null;
  return route === 'browser' ? 'browser' : 'full-runtime';
}

const base = JSON.parse(fs.readFileSync(sourceFile, 'utf8')) as BaseCapabilityMatrix;

if (!fs.existsSync(optionSourceFile)) {
  throw new Error(
    'DOC-4 option inventory is missing. Run npm run docs:generate:doc4 before Studio Visual verification.',
  );
}

const optionInventoryText = fs.readFileSync(optionSourceFile, 'utf8');
const optionInventory = JSON.parse(optionInventoryText) as DocsOptionInventory;
const docsArtifactIndex = JSON.parse(fs.readFileSync(docsIndexFile, 'utf8')) as DocsArtifactIndex;
const indexedOptionInventory = docsArtifactIndex.artifacts.find(
  (artifact) => artifact.file === 'option-inventory.json',
);
if (!indexedOptionInventory) {
  throw new Error('DOC-4 index does not declare option-inventory.json.');
}
const optionInventorySha256 = sha256(optionInventoryText);
const optionInventoryCurrent = optionInventorySha256 === indexedOptionInventory.sha256;

type DraftVisualCapabilityRow = Omit<VisualCapabilityRow, 'classification'> & {
  classification: VisualCapabilityClassification | null;
};

const rows: DraftVisualCapabilityRow[] = base.capabilityProofs
  .map((proof): DraftVisualCapabilityRow => {
    const domain = domainFor(proof.capability);
    const classification = domain ? classificationFor(proof.capability, proof.route, domain) : null;
    return {
      capability: proof.capability,
      sourceRoute: proof.route,
      classification,
      domain: domain ?? 'unclassified',
      editorSection: domain ? editorSectionFor(domain) : null,
      controlSchemaId:
        classification && classification !== 'hosted-runtime-exclusion' && classification !== 'not-applicable'
          ? 'studio.visual.controls.' + domain
          : null,
      projectModelField: classification && domain ? projectFieldFor(classification, domain) : null,
      previewRuntimeRoute: classification ? previewRouteFor(classification, proof.route) : null,
      codegen:
        classification && classification !== 'hosted-runtime-exclusion' && classification !== 'not-applicable'
          ? { strategy: 'direct-public-api', symbol: proof.capability }
          : null,
      proofCaseIds: [...proof.proofCaseIds],
      phaseOwner: domain ? phaseOwnerFor(domain) : 'UNASSIGNED',
      implementationState:
        classification === 'hosted-runtime-exclusion'
          ? 'excluded'
          : classification === 'not-applicable'
            ? 'not-applicable'
            : domain && IMPLEMENTED_PHASE_OWNERS.has(phaseOwnerFor(domain))
              ? 'implemented'
              : 'planned',
    };
  })
  .sort((a, b) => a.capability.localeCompare(b.capability));

const rowByCapability = new Map(rows.map((row) => [row.capability, row]));

const classifiedOptions = optionInventory.options.map((option) => {
  const separator = option.id.lastIndexOf('::');
  const memberId = separator >= 0 ? option.id.slice(0, separator) : '';
  const capability = memberId
    .replace(/^apexify\.js::/, '')
    .replace('#', '.');
  const parent = rowByCapability.get(capability);

  if (!parent) {
    return {
      id: option.id,
      classification: 'not-applicable' as const,
      domain: 'other-public-api',
      phaseOwner: 'NOT-STUDIO-SURFACE',
    };
  }

  const classification =
    parent.classification === 'hosted-runtime-exclusion' ||
    parent.classification === 'not-applicable'
      ? parent.classification
      : ('visual-property' as const);

  return {
    id: option.id,
    classification,
    domain: parent.domain,
    phaseOwner: parent.phaseOwner,
  };
});

const unclassifiedOptions = classifiedOptions.filter(
  (option) => !VISUAL_CAPABILITY_CLASSIFICATIONS.includes(option.classification),
);

const duplicateCapabilities = rows
  .map((row) => row.capability)
  .filter((value, index, all) => all.indexOf(value) !== index)
  .filter((value, index, all) => all.indexOf(value) === index);

const unclassifiedCapabilities = rows
  .filter((row) => row.classification === null || row.phaseOwner === 'UNASSIGNED')
  .map((row) => row.capability);

const byClassification = Object.fromEntries(
  VISUAL_CAPABILITY_CLASSIFICATIONS.map((classification) => [
    classification,
    rows.filter((row) => row.classification === classification).length,
  ]),
);

const domains = [...new Set(rows.map((row) => row.domain))].sort((a, b) => a.localeCompare(b));
const byDomain = Object.fromEntries(
  domains.map((domain) => [domain, rows.filter((row) => row.domain === domain).length]),
);

const optionCoverage = {
  sourceArtifact: 'generated/docs-doc4/option-inventory.json',
  sourceSchemaVersion: optionInventory.schemaVersion,
  sourceSha256: optionInventorySha256,
  indexedSha256: indexedOptionInventory.sha256,
  sourceInventoryCurrent: optionInventoryCurrent,
  totalOptionPaths: optionInventory.options.length,
  classifiedOptionPaths: classifiedOptions.length - unclassifiedOptions.length,
  unclassifiedOptionPaths: unclassifiedOptions.length,
  complete:
    optionInventoryCurrent &&
    optionInventory.total === optionInventory.options.length &&
    unclassifiedOptions.length === 0,
};

const artifact = {
  schemaVersion: 1,
  source: {
    artifact: 'generated/studio/capability-matrix.json',
    schemaVersion: base.schemaVersion,
    packagePin: base.packagePin,
    implementationComplete: base.implementationComplete,
    totalCapabilities: base.capabilityProofs.length,
  },
  classificationVocabulary: VISUAL_CAPABILITY_CLASSIFICATIONS,
  rows,
  summary: {
    totalCapabilities: rows.length,
    classifiedCapabilities: rows.length - unclassifiedCapabilities.length,
    unclassifiedCount: unclassifiedCapabilities.length,
    unclassifiedCapabilities,
    duplicateCapabilities,
    byClassification,
    byDomain,
    deterministic: true,
    complete:
      base.implementationComplete === true &&
      unclassifiedCapabilities.length === 0 &&
      duplicateCapabilities.length === 0,
  },
  optionCoverage,
};

if (!artifact.summary.complete || !artifact.optionCoverage.complete) {
  console.error('[studio-visual] capability matrix incomplete');
  if (!base.implementationComplete) console.error('base Studio capability matrix is incomplete');
  if (unclassifiedCapabilities.length) {
    console.error('unclassified capabilities:', unclassifiedCapabilities.join(', '));
  }
  if (duplicateCapabilities.length) {
    console.error('duplicate capabilities:', duplicateCapabilities.join(', '));
  }
  if (!optionInventoryCurrent) {
    console.error(
      'DOC-4 option inventory hash mismatch: expected ' +
        indexedOptionInventory.sha256 +
        ', got ' +
        optionInventorySha256,
    );
  }
  if (optionInventory.total !== optionInventory.options.length) {
    console.error(
      'DOC-4 option inventory count mismatch: declared ' +
        optionInventory.total +
        ', rows ' +
        optionInventory.options.length,
    );
  }
  if (unclassifiedOptions.length) {
    console.error(
      'unclassified option paths:',
      unclassifiedOptions.slice(0, 50).map((option) => option.id).join(', '),
    );
  }
  process.exitCode = 1;
}

const expected = JSON.stringify(artifact, null, 2) + '\n';

if (check) {
  console.log('[studio-visual] option coverage ' + JSON.stringify(artifact.optionCoverage));
  if (!fs.existsSync(outFile)) {
    console.error('[studio-visual] missing generated/studio/visual-capability-matrix.json');
    process.exit(1);
  }
  if (fs.readFileSync(outFile, 'utf8') !== expected) {
    console.error('[studio-visual] stale generated/studio/visual-capability-matrix.json');
    process.exit(1);
  }
  console.log(
    '[studio-visual] CHECK PASS (' +
      rows.length +
      ' capabilities + ' +
      classifiedOptions.length +
      ' option paths, 0 unclassified)',
  );
} else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, expected);
  console.log(
    '[studio-visual] wrote generated/studio/visual-capability-matrix.json (' +
      rows.length +
      ' capabilities + ' +
      classifiedOptions.length +
      ' option paths)',
  );
}
