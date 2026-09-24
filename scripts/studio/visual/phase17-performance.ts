import { performance } from 'node:perf_hooks';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { normalizeVisualProject } from '../../../lib/studio/visual/compiler/normalize';
import {
  PHASE17_PERFORMANCE_BUDGETS,
  visualProjectSemanticSignature,
} from '../../../lib/studio/visual/hardening';
import {
  defaultTextNodeProps,
  textPropsRecord,
} from '../../../lib/studio/visual/text-contract';

function buildProject(layerCount: number) {
  const project = createVisualProject({
    id: 'phase17-profile-' + layerCount,
    name: 'Phase 17 profile ' + layerCount,
    width: 1440,
    height: 900,
    now: '2026-09-24T00:00:00.000Z',
  });
  for (let index = 0; index < layerCount; index += 1) {
    const node = createVisualNode(
      'text',
      textPropsRecord(defaultTextNodeProps('Layer ' + index)),
      { id: 'profile-text-' + index, name: 'Layer ' + index },
    );
    node.transform = {
      x: (index * 17) % 1200,
      y: (index * 11) % 760,
      width: 160,
      height: 36,
      opacity: 1,
      visible: true,
    };
    project.document.nodes[node.id] = node;
    project.document.rootNodeIds.push(node.id);
  }
  return project;
}

const layerCount = PHASE17_PERFORMANCE_BUDGETS.profileCodegenLayers;
const project = buildProject(layerCount);

const normalizeStart = performance.now();
const normalized = normalizeVisualProject(project);
const normalizeMs = performance.now() - normalizeStart;

const signatureStart = performance.now();
const signature = visualProjectSemanticSignature(normalized);
const signatureMs = performance.now() - signatureStart;

const codegenStart = performance.now();
const generated = generateVisualProjectCode(normalized);
const codegenMs = performance.now() - codegenStart;

const report = {
  phase: 'STUDIO-VISUAL-17',
  layerCount,
  normalizeMs: Number(normalizeMs.toFixed(2)),
  signatureMs: Number(signatureMs.toFixed(2)),
  codegenMs: Number(codegenMs.toFixed(2)),
  generatedBytes: Buffer.byteLength(generated.source),
  signature,
  softBudgetMs: PHASE17_PERFORMANCE_BUDGETS.profileSoftCodegenMs,
};

console.log('[studio-visual:phase17:profile] ' + JSON.stringify(report));

if (process.argv.includes('--check')) {
  if (!generated.source.includes('ApexPainter')) {
    throw new Error('Phase-17 profile codegen did not produce Apexify source.');
  }
  if (codegenMs > PHASE17_PERFORMANCE_BUDGETS.profileSoftCodegenMs) {
    throw new Error(
      'Phase-17 1000-layer codegen exceeded soft budget: ' +
        codegenMs.toFixed(2) +
        'ms > ' +
        PHASE17_PERFORMANCE_BUDGETS.profileSoftCodegenMs +
        'ms',
    );
  }
}
