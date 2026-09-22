import type {
  VisualNode,
  VisualProjectIssue,
  VisualValue,
} from './model';

export type VisualChartFamily =
  | 'pie'
  | 'donut'
  | 'bar'
  | 'horizontalBar'
  | 'line'
  | 'scatter'
  | 'radar'
  | 'polarArea'
  | 'comparison'
  | 'combo';

export type VisualStandaloneChartFamily = Exclude<
  VisualChartFamily,
  'comparison' | 'combo'
>;

export type VisualChartSyncClassification =
  | 'fully-reversible'
  | 'safely-normalized'
  | 'code-only';

export interface VisualChartNodeProps {
  family: VisualChartFamily;
  data?: VisualValue[];
  options: Record<string, VisualValue>;
}

export const CHART_FAMILIES: readonly VisualChartFamily[] = [
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
] as const;

export const STANDALONE_CHART_FAMILIES: readonly VisualStandaloneChartFamily[] = [
  'pie',
  'donut',
  'bar',
  'horizontalBar',
  'line',
  'scatter',
  'radar',
  'polarArea',
] as const;

export const PHASE8_LINKED_CODE_CLASSIFICATION = {
  'createChart': 'fully-reversible',
  'createComparisonChart': 'fully-reversible',
  'createComboChart': 'fully-reversible',
  'chart-buffer-reuse': 'safely-normalized',
} as const satisfies Record<string, VisualChartSyncClassification>;

export const CHART_COMMON_OPTION_PATHS = [
  'dimensions.width',
  'dimensions.height',
  'dimensions.padding.top',
  'dimensions.padding.right',
  'dimensions.padding.bottom',
  'dimensions.padding.left',
  'appearance.backgroundColor',
  'appearance.backgroundGradient',
  'appearance.customBg',
  'appearance.bgLayers',
  'appearance.patternBg',
  'appearance.noiseBg',
  'appearance.border',
  'appearance.shadow',
  'labels.title.text',
  'labels.title.fontSize',
  'labels.title.color',
  'labels.title.gradient',
  'labels.title.textStyle',
  'legend.show',
  'legend.entries',
  'legend.position',
  'legend.spacing',
  'legend.fontSize',
  'legend.backgroundColor',
  'legend.backgroundGradient',
  'legend.borderColor',
  'legend.textColor',
  'legend.textGradient',
  'legend.textStyle',
  'legend.padding',
  'legend.maxWidth',
  'legend.wrapText',
  'legend.fit',
  'legend.minWidth',
  'legend.width',
  'grid.show',
  'grid.color',
  'grid.width',
] as const;

export const CHART_FAMILY_OPTION_MATRIX: Record<
  VisualChartFamily,
  readonly string[]
> = {
  pie: [
    'dimensions.width',
    'dimensions.height',
    'dimensions.padding',
    'appearance',
    'type',
    'labels.title',
    'labels.sliceLabels',
    'labels.valueLabels',
    'labels.showValues',
    'labels.showLabels',
    'legends.standard',
    'legends.connected',
    'slices.opacity',
    'slices.shadow',
    'slices.stroke',
  ],
  donut: [
    'dimensions.width',
    'dimensions.height',
    'dimensions.padding',
    'appearance',
    'type',
    'donutInnerRadius',
    'labels.title',
    'labels.sliceLabels',
    'labels.valueLabels',
    'labels.showValues',
    'labels.showLabels',
    'legends.standard',
    'legends.connected',
    'slices.opacity',
    'slices.shadow',
    'slices.stroke',
  ],
  bar: [
    ...CHART_COMMON_OPTION_PATHS,
    'type',
    'axes.x.label',
    'axes.x.range',
    'axes.x.tickValues',
    'axes.x.tickCount',
    'axes.x.showTickLabels',
    'axes.x.showTickMarks',
    'axes.y.label',
    'axes.y.range',
    'axes.y.tickValues',
    'axes.y.tickCount',
    'axes.y.showTickLabels',
    'axes.y.showTickMarks',
    'bars.minWidth',
    'bars.groupSpacing',
    'bars.opacity',
    'bars.shadow',
    'bars.stroke',
    'labels.barLabelDefaults',
    'labels.valueLabelDefaults',
  ],
  horizontalBar: [
    ...CHART_COMMON_OPTION_PATHS,
    'type',
    'axes.x.label',
    'axes.x.range',
    'axes.x.tickValues',
    'axes.x.tickCount',
    'axes.y.label',
    'axes.y.range',
    'axes.y.tickValues',
    'axes.y.tickCount',
    'bars.minHeight',
    'bars.groupSpacing',
    'bars.opacity',
    'bars.shadow',
    'bars.stroke',
    'labels.barLabelDefaults',
    'labels.valueLabelDefaults',
  ],
  line: [
    ...CHART_COMMON_OPTION_PATHS,
    'axes.x',
    'axes.y',
    'lineStyle',
    'lineSmoothness',
    'lineWidth',
    'marker',
    'pointLabels',
    'correlation',
    'errorBars',
  ],
  scatter: [
    ...CHART_COMMON_OPTION_PATHS,
    'axes.x',
    'axes.y',
    'marker',
    'pointLabels',
    'correlation',
    'errorBars',
  ],
  radar: [
    'dimensions.width',
    'dimensions.height',
    'dimensions.padding',
    'appearance',
    'radar.categories',
    'radar.maxValue',
    'radar.gridLevels',
    'radar.labelMarginRatio',
    'radar.fill',
    'radar.showPoints',
    'radar.pointRadius',
    'radar.gridColor',
    'radar.gridWidth',
    'radar.axisLabelFontSize',
    'radar.axisLabelColor',
    'radar.opacity',
    'labels.title',
    'legend',
    'data[].values',
    'data[].fillOpacity',
    'data[].lineWidth',
    'data[].opacity',
  ],
  polarArea: [
    ...CHART_COMMON_OPTION_PATHS,
    'scale',
    'polar.innerRadiusRatio',
    'polar.labelBandRatio',
    'polar.sliceStrokeWidth',
    'polar.sliceStrokeColor',
    'polar.startAngleDeg',
    'polar.opacity',
  ],
  comparison: [
    'dimensions.width',
    'dimensions.height',
    'dimensions.padding',
    'appearance',
    'layout',
    'spacing',
    'generalTitle',
    'chart1.type',
    'chart1.data',
    'chart1.options',
    'chart1.title',
    'chart1.barType',
    'chart1.lineStyle',
    'chart1.lineSmoothness',
    'chart2.type',
    'chart2.data',
    'chart2.options',
    'chart2.title',
    'chart2.barType',
    'chart2.lineStyle',
    'chart2.lineSmoothness',
  ],
  combo: [
    'bars',
    'lines',
    'barsType',
    'dimensions.width',
    'dimensions.height',
    'dimensions.padding',
    'appearance',
    'axes.x',
    'axes.y',
    'axes.ySecondary',
    'opacity',
    'labels.title',
    'labels.barLabelDefaults',
    'labels.valueLabelDefaults',
    'labels.pointLabelDefaults',
    'legend',
    'grid',
    'barStyle',
    'secondaryYAxis.show',
  ],
};

const palette = [
  '#38bdf8',
  '#a78bfa',
  '#fb7185',
  '#34d399',
  '#fbbf24',
  '#60a5fa',
];

export function defaultStandaloneChartNodeProps(
  family: VisualStandaloneChartFamily,
): VisualChartNodeProps {
  const options: Record<string, VisualValue> = {
    dimensions: { width: 640, height: 400 },
    appearance: { backgroundColor: '#0f172a' },
    labels: {
      title: {
        text:
          family === 'horizontalBar'
            ? 'Horizontal bar chart'
            : family + ' chart',
        fontSize: 22,
        color: '#f8fafc',
      },
    },
  };

  if (family === 'pie' || family === 'donut' || family === 'polarArea') {
    const data = [
      { label: 'Alpha', value: 42, color: palette[0] },
      { label: 'Beta', value: 31, color: palette[1] },
      { label: 'Gamma', value: 27, color: palette[2] },
    ] as unknown as VisualValue[];
    if (family === 'pie' || family === 'donut') {
      options.type = family === 'donut' ? 'donut' : 'pie';
      if (family === 'donut') options.donutInnerRadius = 72;
      options.legends = {
        standard: {
          show: true,
          position: 'bottom',
          textColor: '#e2e8f0',
        },
      };
      options.slices = { opacity: 1 };
    }
    if (family === 'polarArea') {
      options.scale = 'area';
      options.polar = { innerRadiusRatio: 0.12, startAngleDeg: -90 };
      options.legend = {
        show: true,
        position: 'bottom',
        textColor: '#e2e8f0',
      };
    }
    return { family, data, options };
  }

  if (family === 'bar' || family === 'horizontalBar') {
    return {
      family,
      data: [
        { label: 'Q1', xStart: 0, xEnd: 1, value: 36, color: palette[0] },
        { label: 'Q2', xStart: 1, xEnd: 2, value: 58, color: palette[1] },
        { label: 'Q3', xStart: 2, xEnd: 3, value: 45, color: palette[2] },
      ] as unknown as VisualValue[],
      options: {
        ...options,
        type: 'standard',
        axes: {
          x: { label: 'Quarter' },
          y: { label: 'Value', range: { min: 0, max: 70 } },
        },
        legend: {
          show: true,
          position: 'bottom',
          textColor: '#e2e8f0',
        },
        grid: {
          show: true,
          color: 'rgba(148,163,184,0.18)',
          width: 1,
        },
        bars: {},
      },
    };
  }

  if (family === 'radar') {
    return {
      family,
      data: [
        {
          label: 'Current',
          color: palette[0],
          values: [78, 88, 64, 91, 73],
        },
      ] as unknown as VisualValue[],
      options: {
        ...options,
        radar: {
          categories: ['Speed', 'Quality', 'Reach', 'Depth', 'Ease'],
          gridLevels: 5,
          fill: true,
          showPoints: true,
        },
        legend: {
          show: true,
          position: 'bottom',
          textColor: '#e2e8f0',
        },
      },
    };
  }

  const seriesData = [
    { x: 0, y: 18 },
    { x: 1, y: 32 },
    { x: 2, y: 25 },
    { x: 3, y: 48 },
    { x: 4, y: 41 },
  ];

  return {
    family,
    data: [
      {
        label: family === 'scatter' ? 'Observations' : 'Series A',
        color: palette[0],
        data: seriesData,
      },
    ] as unknown as VisualValue[],
    options: {
      ...options,
      axes: {
        x: { label: 'X', range: { min: 0, max: 4 } },
        y: { label: 'Y', range: { min: 0, max: 60 } },
      },
      legend: {
        show: true,
        position: 'bottom',
        textColor: '#e2e8f0',
      },
      grid: {
        show: true,
        color: 'rgba(148,163,184,0.18)',
        width: 1,
      },
      ...(family === 'line' ? { lines: { opacity: 1 } } : { points: { opacity: 1 } }),
    },
  };
}

export function defaultChartNodeProps(family: VisualChartFamily = 'bar'): VisualChartNodeProps {
  if (family === 'comparison') {
    const left = defaultStandaloneChartNodeProps('bar');
    const right = defaultStandaloneChartNodeProps('line');
    return {
      family,
      options: {
        dimensions: { width: 760, height: 400 },
        layout: 'sideBySide',
        spacing: 18,
        appearance: { backgroundColor: '#0f172a' },
        generalTitle: { text: 'Comparison', fontSize: 22, color: '#f8fafc' },
        chart1: { type: 'bar', data: left.data ?? [], options: left.options, title: { text: 'Bars' } },
        chart2: { type: 'line', data: right.data ?? [], options: right.options, title: { text: 'Line' } },
      },
    };
  }

  if (family === 'combo') {
    const bar = defaultStandaloneChartNodeProps('bar');
    const line = defaultStandaloneChartNodeProps('line');
    return {
      family,
      options: {
        dimensions: { width: 760, height: 420 },
        bars: bar.data ?? [],
        lines: (line.data ?? []).map((series) => ({
          ...(series as Record<string, VisualValue>),
          yAxis: 'secondary',
        })) as unknown as VisualValue,
        barsType: 'standard',
        appearance: { backgroundColor: '#0f172a' },
        axes: {
          x: { label: 'Quarter' },
          y: { label: 'Bars', range: { min: 0, max: 70 } },
          ySecondary: { label: 'Line', range: { min: 0, max: 60 } },
        },
        labels: { title: { text: 'Combo chart', fontSize: 22, color: '#f8fafc' } },
        legend: { show: true, position: 'bottom', textColor: '#e2e8f0' },
        grid: { show: true, color: 'rgba(148,163,184,0.18)', width: 1 },
        secondaryYAxis: { show: true },
      },
    };
  }

  return defaultStandaloneChartNodeProps(family);
}

export function visualChartProps(node: VisualNode): VisualChartNodeProps {
  return structuredClone(node.props) as unknown as VisualChartNodeProps;
}

export function chartPropsRecord(props: VisualChartNodeProps): Record<string, VisualValue> {
  return structuredClone(props) as unknown as Record<string, VisualValue>;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function issue(
  issues: VisualProjectIssue[],
  code: string,
  path: string,
  message: string,
) {
  issues.push({ severity: 'error', code, path, message });
}

function validateDimensions(
  issues: VisualProjectIssue[],
  options: Record<string, unknown>,
  path: string,
) {
  const dimensions = record(options.dimensions);
  if (!dimensions) return;
  for (const key of ['width', 'height'] as const) {
    const value = dimensions[key];
    if (value !== undefined && (!finite(value) || value <= 0 || value > 16384)) {
      issue(issues, 'chart-dimensions', path + '.dimensions.' + key, 'Chart ' + key + ' must be a finite positive number no greater than 16384.');
    }
  }
}

function validateStandaloneData(
  family: VisualStandaloneChartFamily,
  data: unknown,
  issues: VisualProjectIssue[],
  path: string,
) {
  if (!Array.isArray(data) || data.length === 0) {
    issue(issues, 'chart-data', path + '.data', 'Chart data must be a non-empty array.');
    return;
  }

  if (family === 'pie' || family === 'donut' || family === 'polarArea') {
    data.forEach((item, index) => {
      const row = record(item);
      if (!row || typeof row.label !== 'string' || !finite(row.value)) {
        issue(issues, 'chart-slice', path + '.data.' + index, 'Slice data requires a string label and finite numeric value.');
      }
    });
    return;
  }

  if (family === 'bar' || family === 'horizontalBar') {
    data.forEach((item, index) => {
      const row = record(item);
      if (!row || typeof row.label !== 'string') {
        issue(issues, 'chart-bar-label', path + '.data.' + index, 'Bar data requires a string label.');
        return;
      }
      const segments = Array.isArray(row.values) ? row.values : null;
      if (!finite(row.value) && !segments?.length) {
        issue(issues, 'chart-bar-value', path + '.data.' + index, 'Bar data requires value or a non-empty values array.');
      }
      if (row.xStart !== undefined && !finite(row.xStart)) issue(issues, 'chart-bar-range', path + '.data.' + index + '.xStart', 'xStart must be finite.');
      if (row.xEnd !== undefined && !finite(row.xEnd)) issue(issues, 'chart-bar-range', path + '.data.' + index + '.xEnd', 'xEnd must be finite.');
      segments?.forEach((segment, segmentIndex) => {
        const part = record(segment);
        if (!part || !finite(part.value)) {
          issue(issues, 'chart-bar-segment', path + '.data.' + index + '.values.' + segmentIndex, 'Bar segment requires finite value.');
        }
      });
    });
    return;
  }

  if (family === 'radar') {
    data.forEach((series, seriesIndex) => {
      const value = record(series);
      if (
        !value ||
        typeof value.label !== 'string' ||
        !Array.isArray(value.values) ||
        value.values.length < 3
      ) {
        issue(
          issues,
          'chart-radar-series',
          path + '.data.' + seriesIndex,
          'Radar series requires label and at least three numeric values.',
        );
        return;
      }
      value.values.forEach((point, pointIndex) => {
        if (!finite(point)) {
          issue(
            issues,
            'chart-radar-value',
            path + '.data.' + seriesIndex + '.values.' + pointIndex,
            'Radar values must be finite numbers.',
          );
        }
      });
    });
    return;
  }

  data.forEach((series, seriesIndex) => {
    const value = record(series);
    if (!value || typeof value.label !== 'string' || !Array.isArray(value.data) || !value.data.length) {
      issue(issues, 'chart-series', path + '.data.' + seriesIndex, 'Series requires label and a non-empty data array.');
      return;
    }
    value.data.forEach((point, pointIndex) => {
      const item = record(point);
      if (!item || !finite(item.x) || !finite(item.y)) {
        issue(issues, 'chart-point', path + '.data.' + seriesIndex + '.data.' + pointIndex, 'Chart point requires finite x and y values.');
      }
    });
  });
}

export function validateVisualChartNode(
  node: VisualNode,
  issues: VisualProjectIssue[],
) {
  if (node.kind !== 'chart') return;
  const path = 'document.nodes.' + node.id;
  const props = visualChartProps(node);

  if (!CHART_FAMILIES.includes(props.family)) {
    issue(issues, 'chart-family', path + '.props.family', 'Unsupported chart family.');
    return;
  }
  const options = record(props.options);
  if (!options) {
    issue(issues, 'chart-options', path + '.props.options', 'Chart options must be an object.');
    return;
  }
  validateDimensions(issues, options, path + '.props.options');

  if (props.family === 'radar') {
    const radar = record(options.radar);
    const categories = radar && Array.isArray(radar.categories) ? radar.categories : [];
    if (
      categories.length < 3 ||
      categories.some((category) => typeof category !== 'string')
    ) {
      issue(
        issues,
        'chart-radar-categories',
        path + '.props.options.radar.categories',
        'Radar chart requires at least three string categories.',
      );
    }
    const radarData = Array.isArray(props.data) ? props.data : [];
    radarData.forEach((series, index) => {
      const value = record(series);
      if (
        value &&
        Array.isArray(value.values) &&
        categories.length &&
        value.values.length !== categories.length
      ) {
        issue(
          issues,
          'chart-radar-cardinality',
          path + '.props.data.' + index + '.values',
          'Radar series values must match radar.categories length.',
        );
      }
    });
  }

  if (props.family === 'comparison') {
    for (const key of ['chart1', 'chart2'] as const) {
      const chart = record(options[key]);
      if (!chart || typeof chart.type !== 'string' || !STANDALONE_CHART_FAMILIES.includes(chart.type as VisualStandaloneChartFamily)) {
        issue(issues, 'comparison-chart', path + '.props.options.' + key, 'Comparison chart requires a supported chart type.');
        continue;
      }
      validateStandaloneData(chart.type as VisualStandaloneChartFamily, chart.data, issues, path + '.props.options.' + key);
      if (!record(chart.options)) issue(issues, 'comparison-options', path + '.props.options.' + key + '.options', 'Comparison sub-chart options must be an object.');
    }
    return;
  }

  if (props.family === 'combo') {
    if (!Array.isArray(options.bars) || options.bars.length === 0) {
      issue(issues, 'combo-bars', path + '.props.options.bars', 'Combo chart requires non-empty bars.');
    } else {
      validateStandaloneData('bar', options.bars, issues, path + '.props.options');
    }
    if (!Array.isArray(options.lines) || options.lines.length === 0) {
      issue(issues, 'combo-lines', path + '.props.options.lines', 'Combo chart requires non-empty lines.');
    } else {
      validateStandaloneData('line', options.lines, issues, path + '.props.options');
    }
    return;
  }

  validateStandaloneData(props.family, props.data, issues, path + '.props');
}

export function chartTitle(props: VisualChartNodeProps): string {
  const options = props.options as Record<string, unknown>;
  if (props.family === 'comparison') {
    const title = record(options.generalTitle);
    return typeof title?.text === 'string' ? title.text : 'Comparison chart';
  }
  const labels = record(options.labels);
  const title = record(labels?.title);
  return typeof title?.text === 'string'
    ? title.text
    : props.family === 'combo'
      ? 'Combo chart'
      : props.family + ' chart';
}
