import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import type { VisualProject } from '../../../lib/studio/visual/model';
import {
  defaultImageNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';
import {
  defaultTextNodeProps,
  textPropsRecord,
} from '../../../lib/studio/visual/text-contract';
import {
  defaultPathNodeProps,
  pathPropsRecord,
} from '../../../lib/studio/visual/path-pixel-contract';
import {
  chartPropsRecord,
  defaultChartNodeProps,
} from '../../../lib/studio/visual/chart-contract';
import { capturePhase9Component } from '../../../lib/studio/visual/scene-component-contract';
import {
  createPhase11Frame,
  defaultPhase11Timeline,
  setPhase11Timeline,
} from '../../../lib/studio/visual/gif-animation-contract';
import {
  defaultPhase12Timeline,
  setPhase12Timeline,
} from '../../../lib/studio/visual/audio-authoring-contract';
import {
  defaultPhase13Timeline,
  setPhase13Timeline,
} from '../../../lib/studio/visual/video-authoring-contract';
import { ensurePhase14Authoring } from '../../../lib/studio/visual/advanced-authoring-contract';
import type { Phase16ProofProjectDescriptor } from '../../../lib/studio/visual/feature-completeness';

export type Phase16ProofProject = Phase16ProofProjectDescriptor & {
  build: () => VisualProject;
};

function base(id: string, name: string): VisualProject {
  const project = createVisualProject({
    id,
    name,
    width: 640,
    height: 360,
    now: '2026-09-24T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };
  return project;
}

function canvasProject(): VisualProject {
  return base('phase16-canvas', 'Phase 16 canvas proof');
}

function imageProject(): VisualProject {
  const project = base('phase16-image', 'Phase 16 image proof');
  const node = createVisualNode(
    'image',
    imagePropsRecord(defaultImageNodeProps('https://example.com/phase16.png')),
    { id: 'phase16-image-node', name: 'Image' },
  );
  node.transform = { x: 40, y: 30, width: 240, height: 160, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function textProject(): VisualProject {
  const project = base('phase16-text', 'Phase 16 text proof');
  const node = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('Phase 16 completeness')),
    { id: 'phase16-text-node', name: 'Text' },
  );
  node.transform = { x: 40, y: 30, width: 340, height: 90, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function pathProject(): VisualProject {
  const project = base('phase16-path-pixels-detect', 'Phase 16 path pixels detect proof');
  const props = defaultPathNodeProps('path');
  props.commands = [
    { type: 'moveTo', x: 20, y: 20 },
    { type: 'lineTo', x: 180, y: 100 },
  ];
  const node = createVisualNode('path', pathPropsRecord(props), {
    id: 'phase16-path-node',
    name: 'Path',
  });
  node.transform = { x: 20, y: 20, width: 220, height: 140, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function chartProject(): VisualProject {
  const project = base('phase16-chart', 'Phase 16 chart proof');
  const node = createVisualNode(
    'chart',
    chartPropsRecord(defaultChartNodeProps('bar')),
    { id: 'phase16-chart-node', name: 'Chart' },
  );
  node.transform = { x: 40, y: 30, width: 480, height: 260, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function sceneProject(): VisualProject {
  const project = base('phase16-scene-components', 'Phase 16 scene component proof');
  const node = createVisualNode(
    'image',
    imagePropsRecord(defaultImageNodeProps('https://example.com/component.png')),
    { id: 'phase16-component-image', name: 'Component image' },
  );
  node.transform = { x: 40, y: 30, width: 240, height: 160, opacity: 1, visible: true };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return capturePhase9Component(project, [node.id], 'Phase 16 component').project;
}

function imageEffectsProject(): VisualProject {
  const project = imageProject();
  project.id = 'phase16-image-effects';
  project.name = 'Phase 16 image effects proof';
  const node = project.document.nodes['phase16-image-node'];
  node.props = imagePropsRecord({
    ...defaultImageNodeProps('https://example.com/phase16.png'),
    utilityStack: [{
      id: 'phase16-resize',
      type: 'resize',
      size: { width: 320 },
      maintainAspectRatio: true,
      outputFormat: 'png',
    }],
  });
  return project;
}

function gifProject(): VisualProject {
  const project = base('phase16-gif-animation', 'Phase 16 GIF animation proof');
  const timeline = defaultPhase11Timeline(project, 'phase16-gif');
  timeline.frames = [{
    ...createPhase11Frame(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z8AARQAFAgH9a6YAAAAASUVORK5CYII=',
    ),
    id: 'phase16-frame',
  }];
  return setPhase11Timeline(project, timeline);
}

function audioProject(): VisualProject {
  return setPhase12Timeline(
    base('phase16-audio', 'Phase 16 audio proof'),
    defaultPhase12Timeline(),
  );
}

function videoProject(): VisualProject {
  return setPhase13Timeline(
    base('phase16-video', 'Phase 16 video proof'),
    defaultPhase13Timeline(),
  );
}

function advancedProject(): VisualProject {
  return ensurePhase14Authoring(base('phase16-advanced', 'Phase 16 advanced proof'));
}

export const PHASE16_PROOF_PROJECTS: readonly Phase16ProofProject[] = [
  { id: 'phase16-canvas', phase: 4, domains: ['canvas'], description: 'Canvas and background authoring', build: canvasProject },
  { id: 'phase16-image', phase: 5, domains: ['image'], description: 'Image, shape and asset-backed visual insertion', build: imageProject },
  { id: 'phase16-text', phase: 6, domains: ['text'], description: 'Text and font authoring', build: textProject },
  { id: 'phase16-path-pixels-detect', phase: 7, domains: ['path', 'pixels', 'detect'], description: 'Path, pixel and detection toolchain', build: pathProject },
  { id: 'phase16-chart', phase: 8, domains: ['chart'], description: 'Chart authoring', build: chartProject },
  { id: 'phase16-scene-components', phase: 9, domains: ['scene', 'components', 'template', 'assets'], description: 'Scenes, components, templates and named assets', build: sceneProject },
  { id: 'phase16-image-effects', phase: 10, domains: ['image-utils'], description: 'Ordered image utility/effect stack', build: imageEffectsProject },
  { id: 'phase16-gif-animation', phase: 11, domains: ['gif', 'animation'], description: 'GIF and animation timeline', build: gifProject },
  { id: 'phase16-audio', phase: 12, domains: ['audio'], description: 'Audio authoring timeline', build: audioProject },
  { id: 'phase16-video', phase: 13, domains: ['video'], description: 'Video authoring timeline', build: videoProject },
  { id: 'phase16-advanced', phase: 14, domains: ['batch-chain', 'plugins', 'output', 'rendering'], description: 'Advanced operations, plugins, rendering and output', build: advancedProject },
] as const;

export const PHASE16_PROOF_PROJECT_DESCRIPTORS: readonly Phase16ProofProjectDescriptor[] =
  PHASE16_PROOF_PROJECTS.map(({ build: _build, ...descriptor }) => descriptor);
