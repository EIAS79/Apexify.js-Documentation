import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import {
  CHART_FAMILIES,
  CHART_FAMILY_OPTION_MATRIX,
  PHASE8_LINKED_CODE_CLASSIFICATION,
  chartPropsRecord,
  defaultChartNodeProps,
  type VisualChartFamily,
} from '../../../lib/studio/visual/chart-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

function projectWithChart(family: VisualChartFamily) {
  const project = createVisualProject({
    id: 'project_chart_' + family.toLowerCase(),
    name: 'Phase 8 ' + family,
    width: 960,
    height: 640,
    now: '2026-09-22T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };
  const props = defaultChartNodeProps(family);
  const chart = createVisualNode('chart', chartPropsRecord(props), {
    id: 'chart_' + family.toLowerCase(),
    name: family + ' proof',
  });
  chart.transform = {
    x: 110,
    y: 90,
    width: family === 'comparison' || family === 'combo' ? 760 : 640,
    height: family === 'combo' ? 420 : 400,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
  };
  project.document.nodes[chart.id] = chart;
  project.document.rootNodeIds = [chart.id];
  project.editor = { ...project.editor, selectedNodeIds: [chart.id] };
  return project;
}

test('Phase 8 exposes every required chart family and option matrix', () => {
  assert.deepEqual(CHART_FAMILIES, [
    'pie',
    'donut',
    'bar',
    'horizontalBar',
    'line',
    'scatter',
    'radar',
    'polarArea',
    'comparison',
    'combo',
  ]);

  for (const family of CHART_FAMILIES) {
    assert.ok(
      CHART_FAMILY_OPTION_MATRIX[family].length >= 10,
      family + ' must expose a meaningful option matrix',
    );
  }

  assert.deepEqual(
    new Set(Object.values(PHASE8_LINKED_CODE_CLASSIFICATION)),
    new Set(['fully-reversible', 'safely-normalized']),
  );
});

test('Phase 8 validates, lowers and emits every chart family with buffer reuse', () => {
  for (const family of CHART_FAMILIES) {
    const project = projectWithChart(family);
    const validation = validateVisualProject(project);
    assert.equal(
      validation.ok,
      true,
      family + ': ' + JSON.stringify(validation.issues),
    );

    const plan = lowerVisualProject(project);
    const kinds = plan.operations.map((operation) => operation.kind);
    assert.equal(kinds[0], 'create-canvas');
    assert.equal(kinds[kinds.length - 1], 'create-image');

    if (family === 'comparison') {
      assert.ok(kinds.includes('create-comparison-chart'));
    } else if (family === 'combo') {
      assert.ok(kinds.includes('create-combo-chart'));
    } else {
      assert.ok(kinds.includes('create-chart'));
    }

    const compose = plan.operations.find(
      (operation) =>
        operation.kind === 'create-image' &&
        operation.sourceNodeId === 'chart_' + family.toLowerCase(),
    );
    assert.ok(compose && compose.kind === 'create-image');
    if (!compose || compose.kind !== 'create-image') continue;
    assert.equal(typeof compose.properties.source, 'object');
    assert.equal(
      (compose.properties.source as { $studioTarget: string }).$studioTarget,
      'chart_' + family.toLowerCase() + '_chart_buffer',
    );

    const source = generateVisualProjectCode(project).source;
    assert.match(source, /createCanvas\(/);
    assert.match(source, /createImage\(/);
    if (family === 'comparison') {
      assert.match(source, /createComparisonChart\(/);
    } else if (family === 'combo') {
      assert.match(source, /createComboChart\(/);
    } else {
      assert.match(source, /createChart\(/);
    }
  }
});

test('Phase 8 executes chart buffers before document composition', async () => {
  const project = projectWithChart('combo');
  const calls: string[] = [];
  const buffer = (value: number) => new Uint8Array([value]);

  const result = await executeStudioOperationPlan(lowerVisualProject(project), {
    async createCanvas() {
      calls.push('canvas');
      return { buffer: buffer(1) };
    },
    async createComboChart() {
      calls.push('combo');
      return buffer(2);
    },
    async createImage(properties, base) {
      calls.push('image:' + String(properties.source instanceof Uint8Array));
      assert.deepEqual(Array.from(base), [1]);
      assert.ok(properties.source instanceof Uint8Array);
      assert.deepEqual(Array.from(properties.source as Uint8Array), [2]);
      return buffer(3);
    },
  });

  assert.deepEqual(calls, ['canvas', 'combo', 'image:true']);
  assert.deepEqual(Array.from(result as Uint8Array), [3]);
});

test('Phase 8 generated chart code round-trips back into the same semantic family', () => {
  for (const family of CHART_FAMILIES) {
    const project = projectWithChart(family);
    const generated = generateVisualProjectCode(project);
    const reconciled = reconcileVisualProjectFromCode(project, generated.source);
    assert.equal(
      reconciled.ok,
      true,
      family + ': ' + (reconciled.ok ? '' : reconciled.error),
    );
    if (!reconciled.ok) continue;

    const charts = Object.values(reconciled.project.document.nodes).filter(
      (node) => node.kind === 'chart',
    );
    assert.equal(charts.length, 1);
    assert.equal(charts[0].props.family, family);
    assert.equal(
      reconciled.project.document.rootNodeIds.filter((id) =>
        reconciled.project.document.nodes[id]?.kind === 'chart',
      ).length,
      1,
    );
  }
});

test('Phase 8 rejects malformed chart data', () => {
  const project = projectWithChart('pie');
  const node = project.document.nodes.chart_pie;
  node.props.data = [{ label: 'Broken', value: 'not-a-number' }];
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'chart-slice'));
});

test('Phase 8 permanent Studio UI exposes Charts, Data, Style and Advanced authoring', () => {
  const studio = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );
  const chartUi = fs.readFileSync(
    'components/studio/visual/VisualChartAuthoring.tsx',
    'utf8',
  );

  assert.match(studio, /\['charts', ChartBarIcon, 'Charts'\]/);
  assert.match(studio, /activeTool === 'charts'/);
  assert.match(studio, /<ChartFamilyPicker onInsert=\{insertChart\}/);
  assert.match(studio, /<VisualChartInspector/);
  assert.match(chartUi, /data-visual-charts-context/);
  assert.match(chartUi, /data-chart-family-picker/);
  assert.match(chartUi, /data-chart-data-table/);
  assert.match(chartUi, /data-chart-title-style/);
  assert.match(chartUi, /data-chart-legend/);
  assert.match(chartUi, /data-chart-grid/);
  assert.match(chartUi, /data-chart-axes/);
  assert.match(chartUi, /data-chart-option-matrix/);
  assert.match(chartUi, /data-comparison-options/);
  assert.match(chartUi, /data-combo-options/);

  for (const family of CHART_FAMILIES) {
    assert.match(chartUi, new RegExp('data-chart-insert=\\{family\\}'));
    assert.ok(chartUi.includes('CHART_FAMILIES.map'));
    assert.ok(chartUi.includes(family) || family === 'horizontalBar');
  }
});
