import type { VisualProject } from '../../../lib/studio/visual/model';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import {
  defaultImageNodeProps,
  defaultShapeNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';
import {
  defaultTextNodeProps,
  textPropsRecord,
} from '../../../lib/studio/visual/text-contract';
import {
  chartPropsRecord,
  defaultChartNodeProps,
} from '../../../lib/studio/visual/chart-contract';
import {
  defaultPathNodeProps,
  operationRecord,
  pathPropsRecord,
} from '../../../lib/studio/visual/path-pixel-contract';
import {
  bindPhase9Reference,
  capturePhase9Component,
  capturePhase9Template,
  createPhase9Scene,
  createPhase9Surface,
  registerPhase9NamedAsset,
} from '../../../lib/studio/visual/scene-component-contract';
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
import {
  defaultPhase14AdvancedState,
  ensurePhase14Authoring,
  setPhase14AdvancedState,
  setPhase14OutputSettings,
} from '../../../lib/studio/visual/advanced-authoring-contract';
import type { Phase18Coverage } from '../../../lib/studio/visual/final-release';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8Dwn4GBgYGJAQoAHgQCAfKf6qAAAAAASUVORK5CYII=';

export type Phase18ProofProject = {
  id: string;
  coverage: readonly Phase18Coverage[];
  expectMultipleArtifacts?: boolean;
  build: () => VisualProject;
};

function base(id: string, name: string, width = 640, height = 360) {
  const project = createVisualProject({
    id,
    name,
    width,
    height,
    now: '2026-09-24T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };
  return project;
}

function coreProject(): VisualProject {
  const project = base('phase18-core', 'Phase 18 Core');

  const shape = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('star'),
      shape: {
        ...defaultShapeNodeProps('star').shape,
        color: '#6f86ff',
        innerRadius: 24,
        outerRadius: 54,
      },
    }),
    { id: 'phase18_core_shape', name: 'Core Shape' },
  );
  shape.transform = {
    x: 40, y: 36, width: 130, height: 130,
    rotation: 8, opacity: 0.95, visible: true, locked: false, zIndex: 0,
  };

  const text = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Phase 18'),
      font: { size: 36, family: 'Arial', name: 'Arial' },
      fill: { color: '#f8fafc', opacity: 1 },
    }),
    { id: 'phase18_core_text', name: 'Core Text' },
  );
  text.transform = {
    x: 210, y: 54, width: 220, height: 64,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 1,
  };

  const chart = createVisualNode(
    'chart',
    chartPropsRecord(defaultChartNodeProps('bar')),
    { id: 'phase18_core_chart', name: 'Core Chart' },
  );
  chart.transform = {
    x: 350, y: 155, width: 245, height: 160,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 2,
  };

  const pathProps = defaultPathNodeProps('path');
  pathProps.commands = [
    { type: 'moveTo', x: 10, y: 90 },
    { type: 'lineTo', x: 70, y: 10 },
    { type: 'quadraticCurveTo', cpx: 120, cpy: 70, x: 175, y: 20 },
    { type: 'lineTo', x: 210, y: 95 },
    { type: 'closePath' },
  ];
  const path = createVisualNode('path', pathPropsRecord(pathProps), {
    id: 'phase18_core_path',
    name: 'Core Path',
  });
  path.transform = {
    x: 70, y: 190, width: 220, height: 110,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 3,
  };

  const doodleProps = defaultPathNodeProps('freehand');
  doodleProps.commands = [
    { type: 'moveTo', x: 0, y: 20 },
    { type: 'lineTo', x: 35, y: 5 },
    { type: 'lineTo', x: 70, y: 34 },
    { type: 'lineTo', x: 110, y: 8 },
  ];
  doodleProps.viewport = { width: 120, height: 42 };
  const doodle = createVisualNode('freehand', pathPropsRecord(doodleProps), {
    id: 'phase18_core_doodle',
    name: 'Core Doodle',
  });
  doodle.transform = {
    x: 190, y: 145, width: 120, height: 42,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 4,
  };

  project.document.nodes[shape.id] = shape;
  project.document.nodes[text.id] = text;
  project.document.nodes[chart.id] = chart;
  project.document.nodes[path.id] = path;
  project.document.nodes[doodle.id] = doodle;
  project.document.rootNodeIds = [shape.id, text.id, chart.id, path.id, doodle.id];

  project.operations.push(
    operationRecord(
      'pixel-operation',
      { type: 'manipulate', filter: 'contrast', intensity: 0.12, region: { x: 0, y: 0, width: 320, height: 180 } },
      { id: 'phase18_pixels', name: 'Pixel contrast' },
    ),
    operationRecord(
      'detection-operation',
      { type: 'pixelColor', x: 8, y: 8, resultName: 'releasePixel' },
      { id: 'phase18_pixel_probe', name: 'Pixel probe' },
    ),
    operationRecord(
      'detection-operation',
      {
        type: 'detectPath',
        pathNodeId: path.id,
        x: 140,
        y: 240,
        includeStroke: true,
        strokeWidth: 4,
        resultName: 'releasePathHit',
      },
      { id: 'phase18_path_probe', name: 'Path probe' },
    ),
  );

  return project;
}

function namedAssetProject(): VisualProject {
  let project = base('phase18-named-asset', 'Phase 18 Named Asset', 320, 220);
  const image = createVisualNode(
    'image',
    imagePropsRecord(defaultImageNodeProps(TINY_PNG)),
    { id: 'phase18_named_image', name: 'Named Asset Image' },
  );
  image.transform = {
    x: 42, y: 36, width: 96, height: 96,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 0,
  };
  project.document.nodes[image.id] = image;
  project.document.rootNodeIds = [image.id];
  const named = registerPhase9NamedAsset(project, {
    name: 'Release Badge',
    uri: TINY_PNG,
    mime: 'image/png',
  });
  project = bindPhase9Reference(named.project, image.id, 'props.source', {
    kind: 'asset',
    id: named.assetId,
  });
  return project;
}

function componentProject(): VisualProject {
  let project = base('phase18-component', 'Phase 18 Component', 420, 220);
  const text = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('Reusable component')),
    { id: 'phase18_component_text', name: 'Component Text' },
  );
  text.transform = {
    x: 70, y: 64, width: 250, height: 60,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 0,
  };
  project.document.nodes[text.id] = text;
  project.document.rootNodeIds = [text.id];
  project = capturePhase9Component(project, [text.id], 'Release Component').project;
  return project;
}

function templateProject(): VisualProject {
  let project = base('phase18-template', 'Phase 18 Template', 420, 260);
  const shape = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('rectangle'),
      shape: {
        ...defaultShapeNodeProps('rectangle').shape,
        color: '#4f7cff',
      },
      borderRadius: 16,
    }),
    { id: 'phase18_template_shape', name: 'Template Shape' },
  );
  shape.transform = {
    x: 90, y: 80, width: 220, height: 90,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 0,
  };
  project.document.nodes[shape.id] = shape;
  project.document.rootNodeIds = [shape.id];
  project = capturePhase9Template(project, [shape.id], 'Release Template').project;
  return project;
}

function sceneProject(): VisualProject {
  let project = base('phase18-scene', 'Phase 18 Scene', 520, 320);
  project = createPhase9Scene(project, {
    name: 'Release Scene',
    x: 30,
    y: 20,
    width: 430,
    height: 250,
  });
  const sceneId = project.editor?.selectedNodeIds?.[0];
  if (!sceneId) throw new Error('Phase 18 scene creation did not select the scene.');

  project = createPhase9Surface(project, {
    name: 'Nested Surface',
    x: 80,
    y: 70,
    width: 300,
    height: 150,
    parentId: sceneId,
  });
  const surfaceId = project.editor?.selectedNodeIds?.[0];
  if (!surfaceId) throw new Error('Phase 18 surface creation did not select the surface.');

  const text = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('Nested release surface')),
    { id: 'phase18_scene_text', name: 'Nested Scene Text' },
  );
  text.parentId = surfaceId;
  text.transform = {
    x: 120, y: 110, width: 240, height: 52,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 0,
  };
  project.document.nodes[text.id] = text;
  project.document.nodes[surfaceId]!.childIds = [
    ...(project.document.nodes[surfaceId]!.childIds ?? []),
    text.id,
  ];
  return project;
}

function imageEffectsProject(): VisualProject {
  const project = base('phase18-image-effects', 'Phase 18 Image Effects', 360, 240);

  const sourceShape = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('rectangle'),
      shape: {
        ...defaultShapeNodeProps('rectangle').shape,
        color: '#4f7cff',
      },
      borderRadius: 18,
    }),
    { id: 'phase18_effect_source', name: 'Effect Source' },
  );
  sourceShape.transform = {
    x: 28, y: 32, width: 140, height: 120,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 0,
  };

  const processed = createVisualNode(
    'image',
    imagePropsRecord({
      ...defaultImageNodeProps(''),
      source: { $generated: sourceShape.id },
      fit: 'contain',
      utilityStack: [
        {
          id: 'phase18-effects',
          type: 'effects',
          filters: [
            { type: 'contrast', value: 1.05 },
            { type: 'saturation', value: 1.08 },
          ],
        },
        {
          id: 'phase18-compress',
          type: 'compress',
          options: { quality: 88, format: 'webp', maxWidth: 180 },
        },
      ],
      utilityAnalyses: [
        { id: 'phase18-color-analysis', type: 'colorAnalysis' },
      ],
    }),
    { id: 'phase18_effect_result', name: 'Effect Result' },
  );
  processed.transform = {
    x: 186, y: 52, width: 140, height: 120,
    rotation: 0, opacity: 1, visible: true, locked: false, zIndex: 1,
  };

  project.document.nodes[sourceShape.id] = sourceShape;
  project.document.nodes[processed.id] = processed;
  project.document.rootNodeIds = [sourceShape.id, processed.id];
  return project;
}

function gifProject(): VisualProject {
  const project = base('phase18-gif', 'Phase 18 GIF', 64, 48);
  const timeline = defaultPhase11Timeline(project, 'phase18-gif-timeline');
  timeline.mode = 'animate';
  timeline.width = 64;
  timeline.height = 48;
  timeline.delay = 10;
  timeline.quality = 10;
  timeline.repeat = 0;
  timeline.frames = [
    { ...createPhase11Frame(TINY_PNG), id: 'phase18-gif-a', duration: 10 },
    { ...createPhase11Frame(TINY_PNG), id: 'phase18-gif-b', duration: 20 },
  ];
  return setPhase11Timeline(project, timeline);
}

function audioProject(): VisualProject {
  const project = base('phase18-audio', 'Phase 18 Audio', 64, 48);
  const timeline = defaultPhase12Timeline();
  timeline.mode = 'compose';
  timeline.sampleRate = 16000;
  timeline.channels = 2;
  timeline.masterGain = 0.8;
  timeline.seed = 'phase18-audio';
  timeline.compose.clips = [
    { id: 'phase18-audio-a', at: 0, source: { kind: 'preset', preset: 'beep' }, gain: 0.7, pan: -0.25 },
    { id: 'phase18-audio-b', at: 0.15, source: { kind: 'preset', preset: 'sparkle' }, gain: 0.5, pan: 0.25, fadeOut: 0.05 },
  ];
  return setPhase12Timeline(project, timeline);
}

function videoProject(): VisualProject {
  const project = base('phase18-video', 'Phase 18 Video', 96, 54);
  const timeline = defaultPhase13Timeline();
  timeline.mode = 'frames';
  timeline.frames.width = 96;
  timeline.frames.height = 54;
  timeline.frames.fps = 2;
  timeline.frames.quality = 'low';
  timeline.frames.items = [
    { id: 'phase18-video-a', source: { kind: 'solid', color: '#0b1020', label: 'APEX' } },
    { id: 'phase18-video-b', source: { kind: 'solid', color: '#2563eb', label: '18' } },
  ];
  return setPhase13Timeline(project, timeline);
}

function advancedProject(execution: 'chain' | 'batch'): VisualProject {
  let project = ensurePhase14Authoring(
    base('phase18-advanced-' + execution, 'Phase 18 Advanced ' + execution),
  );
  const state = defaultPhase14AdvancedState();
  project = setPhase14AdvancedState(project, {
    ...state,
    execution,
    batch: {
      ...state.batch,
      concurrency: 2,
    },
  });
  project = setPhase14OutputSettings(project, {
    strategy: execution === 'chain' ? 'toOutput' : 'direct',
    format: 'buffer',
    fileName: 'phase18-' + execution + '.png',
    sync: 'reversible',
  });
  return project;
}

export const PHASE18_PROOF_PROJECTS: readonly Phase18ProofProject[] = [
  {
    id: 'phase18-core',
    coverage: ['canvas','image-shape','text-font','chart','path-doodle','pixels-detection','generated-code-execution'],
    build: coreProject,
  },
  {
    id: 'phase18-scene',
    coverage: ['scene-nested-surface','generated-code-execution'],
    build: sceneProject,
  },
  {
    id: 'phase18-component',
    coverage: ['component','generated-code-execution'],
    build: componentProject,
  },
  {
    id: 'phase18-template',
    coverage: ['template','generated-code-execution'],
    build: templateProject,
  },
  {
    id: 'phase18-named-asset',
    coverage: ['named-assets','generated-code-execution'],
    build: namedAssetProject,
  },
  {
    id: 'phase18-image-effects',
    coverage: ['image-effects','generated-code-execution'],
    build: imageEffectsProject,
  },
  {
    id: 'phase18-gif',
    coverage: ['gif','animation','generated-code-execution'],
    build: gifProject,
  },
  {
    id: 'phase18-audio',
    coverage: ['audio','generated-code-execution'],
    build: audioProject,
  },
  {
    id: 'phase18-video',
    coverage: ['video','generated-code-execution'],
    build: videoProject,
  },
  {
    id: 'phase18-advanced-chain',
    coverage: ['batch-chain','output-conversion','generated-code-execution'],
    build: () => advancedProject('chain'),
  },
  {
    id: 'phase18-advanced-batch',
    coverage: ['batch-chain','multi-artifact-output','generated-code-execution'],
    expectMultipleArtifacts: true,
    build: () => advancedProject('batch'),
  },
] as const;
