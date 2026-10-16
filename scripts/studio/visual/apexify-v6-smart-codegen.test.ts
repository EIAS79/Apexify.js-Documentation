import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import { imagePropsRecord, defaultImageNodeProps } from '../../../lib/studio/visual/image-contract';
import { textPropsRecord, defaultTextNodeProps } from '../../../lib/studio/visual/text-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { optimizeApexifyV6Plan } from '../../../lib/studio/visual/codegen/apexify-v6-optimizer';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { phase15CleanGeneratedSource } from '../../../lib/studio/visual/export-contract';

function projectOf(types: Array<'image' | 'text'>) {
  const project = createVisualProject({
    id: 'v6_codegen_test',
    name: 'V6 Smart Layers',
    width: 640,
    height: 480,
    now: '2026-10-16T08:00:00.000Z',
  });
  for (const [index, type] of types.entries()) {
    const id = type + '_' + index;
    const node = type === 'image'
      ? createVisualNode('image', imagePropsRecord({
          ...defaultImageNodeProps('assets/' + id + '.png'),
          filters: [{ type: 'grayscale' }],
        }), { id, name: 'Layer ' + String(index) })
      : createVisualNode('text', textPropsRecord({
          ...defaultTextNodeProps('Label ' + String(index)),
        }), { id, name: 'Text ' + String(index) });
    node.transform = {
      x: index * 70 + 10, y: index * 40 + 12,
      width: 120, height: 60,
      visible: true, locked: false, zIndex: index,
    };
    project.document.nodes[id] = node;
    project.document.rootNodeIds.push(id);
  }
  return project;
}

test('v6 optimizer converts adjacent images with inline filters into one ordered createImage array', () => {
  const project = projectOf(['image', 'image', 'image']);
  const plan = lowerVisualProject(project);
  const optimized = optimizeApexifyV6Plan(plan);
  assert.equal(plan.operations.filter((op) => op.kind === 'create-image').length, 3);
  const images = optimized.operations.filter((op) => op.kind === 'create-image');
  assert.equal(images.length, 1);
  const batch = images[0]!;
  assert.equal(batch.kind, 'create-image');
  if (batch.kind !== 'create-image') return;
  assert.ok(Array.isArray(batch.properties));
  assert.deepEqual((batch.properties as Array<{ source: string }>).map((p) => p.source), [
    'assets/image_0.png', 'assets/image_1.png', 'assets/image_2.png',
  ]);
  assert.ok((batch.properties as Array<{ filters?: unknown[] }>).every((p) => p.filters?.length === 1));
  assert.deepEqual(batch.base, { $studioTarget: 'canvas', member: 'buffer' });
  assert.equal(batch.target, 'image_2');
  assert.deepEqual(optimized.result, plan.result);
  assert.equal(plan.operations.length, 4, 'optimization must not mutate the input plan');

  const code = generateVisualProjectCode(project).source;
  assert.equal((code.match(/\.createImage\(/g) ?? []).length, 1);
  assert.match(code, /createImage\(\s*\[/);
  assert.match(code, /filters:\s*\[/);
  assert.match(code, /apexify-v6:auto-batch:/);
  assert.doesNotMatch(code, /painter\.batch\(/);
});

test('v6 image batches reconcile without converting authored nodes to a group', () => {
  const project = projectOf(['image', 'image']);
  const canonical = generateVisualProjectCode(project).source;
  const restored = reconcileVisualProjectFromCode(project, canonical);
  assert.equal(restored.ok, true, restored.ok ? undefined : restored.error);
  if (!restored.ok) return;
  assert.deepEqual(restored.project.document.rootNodeIds, project.document.rootNodeIds);
  assert.ok(project.document.rootNodeIds.every((id) => restored.project.document.nodes[id]?.kind === 'image'));
  assert.equal(generateVisualProjectCode(restored.project).source, canonical);
  assert.deepEqual(restored.project.editor?.selectedNodeIds ?? [], project.editor?.selectedNodeIds ?? []);
});

test('v6 optimized image code stays editable without changing layer identities', () => {
  const project = projectOf(['image', 'image']);
  const code = generateVisualProjectCode(project).source;
  const edited = code.replace('assets/image_0.png', 'assets/replaced.png');
  assert.notEqual(edited, code);
  const result = reconcileVisualProjectFromCode(project, edited);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;
  assert.deepEqual(result.project.document.rootNodeIds, project.document.rootNodeIds);
  assert.equal(
    result.project.document.nodes.image_0?.props.source,
    'assets/replaced.png',
  );
  assert.equal((result.project.document.nodes.image_1?.props as { source?: string })?.source, 'assets/image_1.png');
  assert.match(generateVisualProjectCode(result.project).source, /assets\/replaced\.png/);
});

test('v6 optimized text array preserves individually editable text nodes', () => {
  const project = projectOf(['text', 'text']);
  const code = generateVisualProjectCode(project).source;
  assert.equal((code.match(/\.createText\(/g) ?? []).length, 1);
  assert.match(code, /createText\(\s*\[/);
  const edited = code.replace('Label 0', 'Edited label');
  const rebuilt = reconcileVisualProjectFromCode(project, edited);
  assert.equal(rebuilt.ok, true, rebuilt.ok ? undefined : rebuilt.error);
  if (!rebuilt.ok) return;
  assert.deepEqual(rebuilt.project.document.rootNodeIds, project.document.rootNodeIds);
  assert.equal(rebuilt.project.document.nodes.text_0?.kind, 'text');
  assert.equal(rebuilt.project.document.nodes.text_1?.kind, 'text');
  assert.equal((rebuilt.project.document.nodes.text_0?.props as { text?: string })?.text, 'Edited label');
});

test('v6 batches never cross an interleaved text/image boundary', () => {
  const project = projectOf(['image', 'text', 'image']);
  const code = generateVisualProjectCode(project).source;
  assert.equal((code.match(/\.createImage\(/g) ?? []).length, 2);
  assert.equal((code.match(/\.createText\(/g) ?? []).length, 1);
  assert.doesNotMatch(code, /apexify-v6:auto-batch/);
});

test('v6 optimizer preserves generated-buffer dependencies and explicit call options', () => {
  const project = projectOf(['image', 'image']);
  const second = project.document.nodes.image_1!;
  second.props = imagePropsRecord({
    ...defaultImageNodeProps(''),
    source: { $generated: 'image_0' },
  });
  const dependencyPlan = optimizeApexifyV6Plan(lowerVisualProject(project));
  assert.equal(dependencyPlan.operations.filter((op) => op.kind === 'create-image').length, 2);

  second.props = imagePropsRecord({
    ...defaultImageNodeProps('assets/image_1.png'),
    createOptions: { isGrouped: false },
  });
  const optionsPlan = optimizeApexifyV6Plan(lowerVisualProject(project));
  assert.equal(optionsPlan.operations.filter((op) => op.kind === 'create-image').length, 2);
});

test('v6 code source is stable and defensive about structural array edits', () => {
  const project = projectOf(['image', 'image']);
  const first = generateVisualProjectCode(project).source;
  assert.equal(first, generateVisualProjectCode(project).source);
  const edited = first.replace(/(\/\* apexify-v6:auto-batch:[^*]+ \*\/)/, '');
  assert.notEqual(edited, first);
  const noMetadata = reconcileVisualProjectFromCode(project, edited);
  // Removing the authoring identity marker explicitly opts into a native
  // createImage() group, rather than silently doing so during autosync.
  assert.equal(noMetadata.ok, true, noMetadata.ok ? undefined : noMetadata.error);
});

test('standalone v6 export strips Studio identity metadata but retains native arrays', () => {
  const code = generateVisualProjectCode(projectOf(['image', 'image'])).source;
  const exported = phase15CleanGeneratedSource(code);
  assert.doesNotMatch(exported, /apexify-v6:auto-batch/);
  assert.match(exported, /createImage\(\s*\[/);
  assert.match(exported, /\/\/ Image layers \(stacking order preserved\)/);
});
