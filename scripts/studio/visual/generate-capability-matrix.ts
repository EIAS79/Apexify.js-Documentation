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

const root = process.cwd();
const check = process.argv.includes('--check');
const sourceFile = path.join(root, 'generated', 'studio', 'capability-matrix.json');
const outFile = path.join(root, 'generated', 'studio', 'visual-capability-matrix.json');

function domainFor(capability: string): string | null {
  if (capability === 'ApexPainter.animate') return 'animation';
  if (capability.startsWith('ApexPainter.assets.')) return 'assets';
  if (capability.startsWith('ApexPainter.components.')) return 'components';
  if (capability.startsWith('ApexPainter.createAudio.')) return 'audio';
  if (/^ApexPainter\\.create(?:Combo|Comparison)?Chart$/.test(capability)) return 'chart';
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
    /^ApexPainter\\.create(?:Combo|Comparison)?Chart$/.test(capability) ||
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

const rows = base.capabilityProofs
  .map((proof): VisualCapabilityRow & { classification: VisualCapabilityClassification | null } => {
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
            : 'planned',
    };
  })
  .sort((a, b) => a.capability.localeCompare(b.capability));

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
};

if (!artifact.summary.complete) {
  console.error('[studio-visual] capability matrix incomplete');
  if (!base.implementationComplete) console.error('base Studio capability matrix is incomplete');
  if (unclassifiedCapabilities.length) {
    console.error('unclassified capabilities:', unclassifiedCapabilities.join(', '));
  }
  if (duplicateCapabilities.length) {
    console.error('duplicate capabilities:', duplicateCapabilities.join(', '));
  }
  process.exitCode = 1;
}

const expected = JSON.stringify(artifact, null, 2) + '\n';

if (check) {
  if (!fs.existsSync(outFile)) {
    console.error('[studio-visual] missing generated/studio/visual-capability-matrix.json');
    process.exit(1);
  }
  if (fs.readFileSync(outFile, 'utf8') !== expected) {
    console.error('[studio-visual] stale generated/studio/visual-capability-matrix.json');
    process.exit(1);
  }
  console.log('[studio-visual] CHECK PASS (' + rows.length + ' capabilities, 0 unclassified)');
} else {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, expected);
  console.log('[studio-visual] wrote generated/studio/visual-capability-matrix.json (' + rows.length + ' capabilities)');
}
