import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { groupNodes } from '../../../lib/studio/visual/editor';
import {
  imageBatchGroupPropsRecord,
  imagePropsRecord,
  visualImageBatchGroupProps,
  visualImageProps,
} from '../../../lib/studio/visual/image-contract';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import type { VisualNode } from '../../../lib/studio/visual/model';

function baseProject() {
  return createVisualProject({
    id: 'project_parity2_image',
    name: 'Phase 2 image rebuild',
    width: 720,
    height: 480,
    now: '2026-10-05T00:00:00.000Z',
  });
}

function imageNode(
  id: string,
  source: string,
  x: number,
  y: number,
) {
  const node = createVisualNode(
    'image',
    imagePropsRecord({
      source,
      fit: 'cover',
      align: 'center',
    }),
    { id, name: id },
  );
  node.transform = {
    x,
    y,
    width: 180,
    height: 120,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
  return node;
}

test('STUDIO-PARITY-2 accepts the complete runtime distortion variants', () => {
  const variants = [
    {
      type: 'perspective' as const,
      points: [
        { x: 0, y: 0 },
        { x: 180, y: 0 },
        { x: 180, y: 120 },
        { x: 0, y: 120 },
      ],
      interpolation: 'bicubic' as const,
      edgeMode: 'mirror' as const,
    },
    {
      type: 'warp' as const,
      controlPoints: [
        {
          from: { x: 50, y: 50 },
          to: { x: 60, y: 45 },
          radius: 32,
          strength: 1.2,
          falloff: 'gaussian' as const,
        },
      ],
      interpolation: 'bilinear' as const,
      edgeMode: 'clamp' as const,
    },
    {
      type: 'bulge' as const,
      centerX: 90,
      centerY: 60,
      radius: 50,
      intensity: 0.3,
    },
    {
      type: 'pinch' as const,
      centerX: 90,
      centerY: 60,
      radius: 50,
      intensity: -0.25,
    },
    {
      type: 'twirl' as const,
      centerX: 90,
      centerY: 60,
      radius: 70,
      angle: 35,
    },
    {
      type: 'wave' as const,
      amplitudeX: 8,
      amplitudeY: 5,
      wavelengthX: 48,
      wavelengthY: 36,
      phaseX: 15,
      phaseY: 25,
      edgeMode: 'wrap' as const,
    },
  ];

  for (const distortion of variants) {
    const project = baseProject();
    const node = imageNode('image_' + distortion.type, 'https://example.com/a.png', 20, 20);
    node.props = imagePropsRecord({
      ...visualImageProps(node),
      distortion,
    });
    project.document.nodes[node.id] = node;
    project.document.rootNodeIds = [node.id];
    const validation = validateVisualProject(project);
    assert.equal(
      validation.ok,
      true,
      distortion.type + ': ' + JSON.stringify(validation.issues),
    );
  }
});

test('STUDIO-PARITY-2 enforces warp exclusivity and runtime mesh dimensions', () => {
  const invalidWarp = baseProject();
  const warpNode = imageNode('warp_invalid', 'https://example.com/a.png', 0, 0);
  warpNode.props = imagePropsRecord({
    ...visualImageProps(warpNode),
    distortion: {
      type: 'warp',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      controlPoints: [
        {
          from: { x: 1, y: 1 },
          to: { x: 2, y: 2 },
        },
      ],
    },
  });
  invalidWarp.document.nodes[warpNode.id] = warpNode;
  invalidWarp.document.rootNodeIds = [warpNode.id];
  const invalid = validateVisualProject(invalidWarp);
  assert.equal(invalid.ok, false);
  assert.ok(
    invalid.issues.some((issue) => issue.code === 'image-distortion-warp-mode'),
  );

  const modern = baseProject();
  const meshNode = imageNode('mesh_modern', 'https://example.com/a.png', 0, 0);
  meshNode.props = imagePropsRecord({
    ...visualImageProps(meshNode),
    meshWarp: {
      gridX: 2,
      gridY: 2,
      interpolation: 'bicubic',
      edgeMode: 'mirror',
      controlPoints: Array.from({ length: 3 }, (_, y) =>
        Array.from({ length: 3 }, (_, x) => ({ x: x * 90, y: y * 60 })),
      ),
    },
  });
  modern.document.nodes[meshNode.id] = meshNode;
  modern.document.rootNodeIds = [meshNode.id];
  assert.equal(
    validateVisualProject(modern).ok,
    true,
    JSON.stringify(validateVisualProject(modern).issues),
  );

  const legacy = structuredClone(modern);
  const legacyNode = legacy.document.nodes.mesh_modern;
  legacyNode.props = imagePropsRecord({
    ...visualImageProps(legacyNode),
    meshWarp: {
      gridX: 2,
      gridY: 2,
      interpolation: 'nearest',
      edgeMode: 'transparent',
      controlPoints: [
        [{ x: 0, y: 0 }, { x: 180, y: 0 }],
        [{ x: 0, y: 120 }, { x: 180, y: 120 }],
      ],
    },
  });
  assert.equal(
    validateVisualProject(legacy).ok,
    true,
    JSON.stringify(validateVisualProject(legacy).issues),
  );
});

test('STUDIO-PARITY-2 owns createImage painterOpts through plan code and reverse sync', () => {
  const project = baseProject();
  const node = imageNode('image_refs', '$heroImage', 40, 30);
  node.props = imagePropsRecord({
    ...visualImageProps(node),
    painterOpts: { resolveAssetRefs: true },
  });
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];

  const plan = lowerVisualProject(project);
  const operation = plan.operations.find(
    (item) => item.kind === 'create-image',
  );
  assert.ok(operation && operation.kind === 'create-image');
  if (!operation || operation.kind !== 'create-image') return;
  assert.deepEqual(operation.painterOpts, { resolveAssetRefs: true });

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /createImage\([\s\S]*undefined,[\s\S]*resolveAssetRefs: true/);

  const empty = baseProject();
  const reconciled = reconcileVisualProjectFromCode(empty, source);
  assert.equal(reconciled.ok, true);
  if (!reconciled.ok) return;
  const restoredId = reconciled.project.document.rootNodeIds[0]!;
  const restored = reconciled.project.document.nodes[restoredId];
  assert.ok(restored);
  assert.deepEqual(visualImageProps(restored).painterOpts, {
    resolveAssetRefs: true,
  });
});

test('STUDIO-PARITY-2 lowers image-only groups as one ImageProperties array call', () => {
  let project = baseProject();
  const first = imageNode('image_a', 'https://example.com/a.png', 20, 30);
  const second = imageNode('image_b', 'https://example.com/b.png', 240, 70);
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [first.id, second.id];

  project = groupNodes(project, [first.id, second.id], 'group_images', 'Image group');
  const group = project.document.nodes.group_images;
  group.props = imageBatchGroupPropsRecord({
    imageBatch: true,
    createOptions: {
      isGrouped: true,
      groupTransform: {
        rotation: 8,
        scaleX: 1.1,
        scaleY: 0.9,
        opacity: 0.8,
        filterOrder: 'post',
        effects: { filmGrain: { intensity: 0.12 } },
      },
    },
    painterOpts: { resolveAssetRefs: true },
  });

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  const imageOps = plan.operations.filter((item) => item.kind === 'create-image');
  assert.equal(imageOps.length, 1);
  const operation = imageOps[0]!;
  assert.equal(operation.kind, 'create-image');
  if (operation.kind !== 'create-image') return;
  assert.ok(Array.isArray(operation.properties));
  assert.equal(operation.properties.length, 2);
  assert.equal(operation.options?.isGrouped, true);
  assert.equal(operation.options?.groupTransform?.rotation, 8);
  assert.deepEqual(operation.painterOpts, { resolveAssetRefs: true });

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /createImage\(\s*\[/);
  assert.match(source, /isGrouped: true/);
  assert.match(source, /groupTransform:/);
  assert.match(source, /resolveAssetRefs: true/);
});

test('STUDIO-PARITY-2 canonical image arrays reverse-sync back into one image group', () => {
  let project = baseProject();
  const first = imageNode('image_a', 'https://example.com/a.png', 20, 30);
  const second = imageNode('image_b', 'https://example.com/b.png', 240, 70);
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [first.id, second.id];
  project = groupNodes(project, [first.id, second.id], 'group_images', 'Image group');
  project.document.nodes.group_images.props = imageBatchGroupPropsRecord({
    imageBatch: true,
    createOptions: {
      isGrouped: true,
      groupTransform: { scaleX: 1, scaleY: 1, opacity: 1 },
    },
  });

  const source = generateVisualProjectCode(project).source;
  const empty = baseProject();
  const reconciled = reconcileVisualProjectFromCode(empty, source);
  assert.equal(reconciled.ok, true);
  if (!reconciled.ok) return;

  assert.equal(reconciled.project.document.rootNodeIds.length, 1);
  const restoredGroup =
    reconciled.project.document.nodes[
      reconciled.project.document.rootNodeIds[0]!
    ];
  assert.equal(restoredGroup.kind, 'group');
  const batch = visualImageBatchGroupProps(restoredGroup);
  assert.ok(batch);
  assert.equal(batch?.createOptions.isGrouped, true);
  assert.equal(restoredGroup.childIds?.length, 2);
  for (const childId of restoredGroup.childIds ?? []) {
    const child: VisualNode = reconciled.project.document.nodes[childId]!;
    assert.ok(child?.kind === 'image' || child?.kind === 'shape');
    assert.equal(child.parentId, restoredGroup.id);
  }

  assert.equal(
    generateVisualProjectCode(reconciled.project).source,
    source,
  );
});

test('STUDIO-PARITY-2 rebuilt inspector owns selected image authoring without raw JSON', () => {
  const inspector = fs.readFileSync(
    'components/studio/visual/VisualImageInspector.tsx',
    'utf8',
  );
  const shell = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );

  assert.match(shell, /VisualImageInspector/);
  assert.match(shell, /VisualImageBatchInspector/);
  assert.match(inspector, /data-image-v2-inspector/);
  assert.match(inspector, /data-image-v2-batch-inspector/);
  assert.match(inspector, /twirl/);
  assert.match(inspector, /wave/);
  assert.match(inspector, /Liquify handles/);
  assert.match(inspector, /data-image-v2-mesh-warp/);
  assert.match(inspector, /data-image-v2-resolve-asset-refs/);
  assert.match(inspector, /No raw JSON escape hatch required/);
  assert.doesNotMatch(inspector, /Complete ImageProperties \/ CreateImageOptions/);

  const imagesStart = shell.indexOf("if (activeTool === 'images')");
  const assetsStart = shell.indexOf("return (", imagesStart + 100);
  const imageContext = shell.slice(imagesStart, assetsStart > imagesStart ? assetsStart : undefined);
  assert.doesNotMatch(imageContext, /distortion|meshWarp|filterIntensity|groupTransform/);
});


test('STUDIO-PARITY-2 preserves image-array batching without forcing isGrouped', () => {
  let project = baseProject();
  const first = imageNode('image_seq_a', 'https://example.com/a.png', 10, 20);
  const second = imageNode('image_seq_b', 'https://example.com/b.png', 220, 20);
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [first.id, second.id];
  project = groupNodes(
    project,
    [first.id, second.id],
    'group_seq',
    'Sequential image batch',
  );
  project.document.nodes.group_seq.props = imageBatchGroupPropsRecord({
    imageBatch: true,
    createOptions: {},
  });

  const plan = lowerVisualProject(project);
  const imageOps = plan.operations.filter((item) => item.kind === 'create-image');
  assert.equal(imageOps.length, 1);
  const operation = imageOps[0]!;
  assert.equal(operation.kind, 'create-image');
  if (operation.kind !== 'create-image') return;
  assert.ok(Array.isArray(operation.properties));
  assert.equal(operation.options, undefined);

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /createImage\(\s*\[/);
  assert.doesNotMatch(source, /isGrouped:/);

  const reconciled = reconcileVisualProjectFromCode(baseProject(), source);
  assert.equal(reconciled.ok, true);
  if (!reconciled.ok) return;
  const root =
    reconciled.project.document.nodes[
      reconciled.project.document.rootNodeIds[0]!
    ];
  const batch = visualImageBatchGroupProps(root);
  assert.ok(batch);
  assert.equal(batch?.createOptions.isGrouped, undefined);
});


test('STUDIO-PARITY-2 resolves generated mask buffers and preserves stroke shadow gradient transforms', () => {
  const project = baseProject();
  const maskSource = imageNode(
    'mask_source',
    'https://example.com/mask.png',
    0,
    0,
  );
  const target = imageNode(
    'masked_target',
    'https://example.com/target.png',
    220,
    40,
  );
  target.props = imagePropsRecord({
    ...visualImageProps(target),
    mask: {
      source: { $generated: maskSource.id },
      mode: 'luminance',
    },
    stroke: {
      width: 3,
      borderRadius: 8,
      borderPosition: 'all',
      roundedCorners: 'all',
      gradient: {
        type: 'linear',
        startX: 0,
        startY: 0,
        endX: 180,
        endY: 0,
        rotate: 12,
        pivotX: 90,
        pivotY: 60,
        colors: [
          { stop: 0, color: '#ffffff' },
          { stop: 1, color: '#2563eb' },
        ],
      },
    },
    shadow: {
      offsetX: 4,
      offsetY: 6,
      blur: 8,
      borderRadius: 8,
      borderPosition: 'all',
      roundedCorners: 'all',
      gradient: {
        type: 'radial',
        startX: 90,
        startY: 60,
        startRadius: 0,
        endX: 90,
        endY: 60,
        endRadius: 80,
        rotate: 5,
        pivotX: 90,
        pivotY: 60,
        colors: [
          { stop: 0, color: '#000000' },
          { stop: 1, color: '#475569' },
        ],
      },
    },
  });

  project.document.nodes[maskSource.id] = maskSource;
  project.document.nodes[target.id] = target;
  project.document.rootNodeIds = [maskSource.id, target.id];

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  const imageOps = plan.operations.filter(
    (operation) => operation.kind === 'create-image',
  );
  assert.equal(imageOps.length, 2);
  const second = imageOps[1]!;
  assert.equal(second.kind, 'create-image');
  if (second.kind !== 'create-image' || Array.isArray(second.properties)) return;
  assert.deepEqual(
    (second.properties.mask as { source: unknown }).source,
    { $studioTarget: imageOps[0]!.target },
  );

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /mask:/);
  assert.match(source, /rotate: 12/);
  assert.match(source, /pivotX: 90/);
  assert.doesNotMatch(source, /\$generated/);

  const reconciled = reconcileVisualProjectFromCode(baseProject(), source);
  assert.equal(reconciled.ok, true);
  if (!reconciled.ok) return;
  assert.equal(
    generateVisualProjectCode(reconciled.project).source,
    source,
  );
});


test('STUDIO-PARITY-2 resolves generated buffers inside groupTransform masks', () => {
  let project = baseProject();
  const maskSource = imageNode(
    'batch_mask_source',
    'https://example.com/mask.png',
    0,
    0,
  );
  const first = imageNode(
    'batch_mask_a',
    'https://example.com/a.png',
    80,
    40,
  );
  const second = imageNode(
    'batch_mask_b',
    'https://example.com/b.png',
    280,
    40,
  );
  project.document.nodes[maskSource.id] = maskSource;
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [maskSource.id, first.id, second.id];

  project = groupNodes(
    project,
    [first.id, second.id],
    'batch_mask_group',
    'Masked image batch',
  );
  project.document.nodes.batch_mask_group.props =
    imageBatchGroupPropsRecord({
      imageBatch: true,
      createOptions: {
        isGrouped: true,
        groupTransform: {
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          mask: {
            source: { $generated: maskSource.id },
            mode: 'alpha',
          },
        },
      },
    });

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  const imageOps = plan.operations.filter(
    (operation) => operation.kind === 'create-image',
  );
  assert.equal(imageOps.length, 2);
  const batch = imageOps[1]!;
  assert.equal(batch.kind, 'create-image');
  if (batch.kind !== 'create-image') return;
  assert.deepEqual(
    batch.options?.groupTransform?.mask?.source,
    { $studioTarget: imageOps[0]!.target },
  );

  const source = generateVisualProjectCode(project).source;
  assert.doesNotMatch(source, /\$generated/);

  const reconciled = reconcileVisualProjectFromCode(baseProject(), source);
  assert.equal(reconciled.ok, true);
  if (!reconciled.ok) return;
  assert.equal(
    generateVisualProjectCode(reconciled.project).source,
    source,
  );
});
