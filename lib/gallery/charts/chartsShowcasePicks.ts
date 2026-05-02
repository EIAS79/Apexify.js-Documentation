/**
 * Curated chart renders for **this repo's static PNG build** (`npm run gallery:build`), distilled from `charts-showcase.ts` patterns.
 * Consumers use **`apexify.js`** only; gallery modal snippets inline the same options in `chartsShowcaseGalleryItems.ts`.
 */
import { ApexPainter } from 'apexify.js';

type Painter = InstanceType<typeof ApexPainter>;

const POSITIONS = [
  'top',
  'bottom',
  'left',
  'right',
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
] as const;
export type LegendPos = (typeof POSITIONS)[number];

/** Legend callout: near-opaque ink so text stays readable on noisy gradients / noiseBg */
export const chartsLegendPanel = {
  textColor: '#f8fafc',
  /** Darker than slate-900 @ 0.92 ? avoids washed-out panels over grain */
  backgroundColor: 'rgba(2, 6, 23, 0.94)',
  borderColor: 'rgba(248, 250, 252, 0.28)',
} as const;

/** Default chart legend corner for gallery exports */
export const chartsLegendPosition = 'top-right' as const;

/** Matches charts-showcase "readable ticks + legends on slate" */
export const chartsShowcaseAppearance = {
  backgroundGradient: {
    type: 'linear' as const,
    startX: 0,
    startY: 0,
    endX: 900,
    endY: 700,
    colors: [
      { stop: 0, color: '#0f172a' },
      { stop: 0.55, color: '#1e293b' },
      { stop: 1, color: '#020617' },
    ],
  },
  axisColor: '#94a3b8',
  axisWidth: 2,
  arrowSize: 10,
  noiseBg: { intensity: 0.03 },
};

export const chartsAxisLight = {
  labelColor: '#f1f5f9',
  color: '#cbd5e1',
  tickFontSize: 11,
  tickColor: '#f8fafc',
};

export const PIE_SLICES_CHARTSHOWCASE = [
  { label: 'Edge', value: 34, color: '#38bdf8', stroke: { color: '#0f172a', width: 2 } },
  { label: 'Origin', value: 28, color: '#a78bfa', stroke: { color: '#0f172a', width: 2 } },
  { label: 'Warm path', value: 22, color: '#fb7185', stroke: { color: '#0f172a', width: 2 } },
  { label: 'Cold tail', value: 16, color: '#34d399', stroke: { color: '#0f172a', width: 2 } },
] as const;

export const BAR_STANDARD_CS = [
  { label: 'Jan', value: 42, xStart: 1, xEnd: 2, color: '#38bdf8' },
  { label: 'Feb', value: 58, xStart: 2.5, xEnd: 3.5, color: '#a78bfa' },
  { label: 'Mar', value: 35, xStart: 4, xEnd: 5, color: '#fb7185' },
  { label: 'Apr', value: 71, xStart: 5.5, xEnd: 6.5, color: '#34d399' },
];

export const BAR_LEGEND_ENTRIES_CS = BAR_STANDARD_CS.map((b) => ({
  label: b.label,
  color: b.color,
}));

export const BAR_GROUPED_CS = [
  {
    label: 'Q1',
    xStart: 1,
    xEnd: 2,
    values: [
      { value: 22, color: '#38bdf8', label: 'Alpha' },
      { value: 18, color: '#a78bfa', label: 'Beta' },
    ],
  },
  {
    label: 'Q2',
    xStart: 3,
    xEnd: 4,
    values: [
      { value: 30, color: '#38bdf8', label: 'Alpha' },
      { value: 25, color: '#a78bfa', label: 'Beta' },
    ],
  },
];

export const GROUP_LEGEND_CS = [
  { label: 'Alpha', color: '#38bdf8' },
  { label: 'Beta', color: '#a78bfa' },
];

export const BAR_WATERFALL_CS = [
  { label: 'Opening', value: 120, xStart: 1, xEnd: 2, color: '#64748b' },
  { label: 'Growth', value: 35, xStart: 2.5, xEnd: 3.5, color: '#34d399' },
  { label: 'Costs', value: -28, xStart: 4, xEnd: 5, color: '#fb7185' },
  { label: 'Tax', value: -12, xStart: 5.5, xEnd: 6.5, color: '#f97316' },
];

export const WATERFALL_LEGEND_CS = BAR_WATERFALL_CS.map((b) => ({
  label: b.label,
  color: b.color ?? '#94a3b8',
}));

export const HB_STANDARD_CS = [
  { label: 'North', value: 82 },
  { label: 'South', value: 64 },
  { label: 'East', value: 91 },
  { label: 'West', value: 73 },
];

export const HB_COLORS_CS = ['#38bdf8', '#a78bfa', '#fb7185', '#34d399'] as const;
export const HB_LEGEND_CS = HB_STANDARD_CS.map((b, i) => ({
  label: b.label,
  color: HB_COLORS_CS[i],
}));

export const HB_GROUPED_CS = [
  {
    label: 'Team A',
    values: [
      { value: 55, color: '#38bdf8', label: 'X' },
      { value: 40, color: '#a78bfa', label: 'Y' },
    ],
  },
  {
    label: 'Team B',
    values: [
      { value: 48, color: '#38bdf8', label: 'X' },
      { value: 52, color: '#a78bfa', label: 'Y' },
    ],
  },
];

export function pieLegendsStandard(position: LegendPos) {
  return {
    standard: {
      show: true as const,
      position,
      fontSize: 13,
      textColor: chartsLegendPanel.textColor,
      backgroundColor: chartsLegendPanel.backgroundColor,
      borderColor: chartsLegendPanel.borderColor,
      padding: 10,
    },
  };
}

/** Bar / horizontalBar / line `legend` helper (`show`, `entries`, styling). */
export function axisLegend(
  position: LegendPos,
  entries: { label: string; color?: string }[],
  extras?: Record<string, unknown>
) {
  return {
    show: true as const,
    position,
    entries,
    fontSize: 13,
    textColor: chartsLegendPanel.textColor,
    backgroundColor: chartsLegendPanel.backgroundColor,
    borderColor: chartsLegendPanel.borderColor,
    padding: 10,
    ...extras,
  };
}

const BAR_DIMS = {
  width: 880,
  height: 640,
  padding: { top: 56, right: 56, bottom: 56, left: 72 },
};

const HB_DIMS = {
  width: 880,
  height: 560,
  padding: { top: 56, right: 56, bottom: 56, left: 88 },
};

export async function renderShowcasePieConnected(painter: Painter) {
  return painter.createChart('pie', [...PIE_SLICES_CHARTSHOWCASE], {
    type: 'pie',
    dimensions: { width: 800, height: 800, padding: { top: 52, right: 52, bottom: 52, left: 52 } },
    appearance: chartsShowcaseAppearance,
    labels: {
      title: { text: 'Pie ? connected legend (lines to slices)', fontSize: 22, color: '#f8fafc' },
      showValues: false,
      showLabels: false,
    },
    legends: {
      connected: {
        show: true,
        fontSize: 12,
        textColor: chartsLegendPanel.textColor,
        backgroundColor: chartsLegendPanel.backgroundColor,
        borderColor: chartsLegendPanel.borderColor,
        padding: 10,
        lineColor: 'rgba(248, 250, 252, 0.75)',
        lineWidth: 1.5,
      },
    },
  });
}

export async function renderShowcaseBarGrouped(painter: Painter) {
  return painter.createChart('bar', [...BAR_GROUPED_CS], {
    type: 'grouped',
    dimensions: BAR_DIMS,
    appearance: chartsShowcaseAppearance,
    axes: {
      x: { ...chartsAxisLight, label: 'Quarter', range: { min: 0, max: 8 } },
      y: { ...chartsAxisLight, label: 'Amount', range: { min: 0, max: 65 } },
    },
    labels: { title: { text: 'Bar grouped ? legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: axisLegend(chartsLegendPosition, GROUP_LEGEND_CS),
    bars: { groupSpacing: 6, segmentSpacing: 4 },
  });
}

export async function renderShowcaseBarWaterfall(painter: Painter) {
  return painter.createChart('bar', [...BAR_WATERFALL_CS], {
    type: 'waterfall',
    waterfall: { initialValue: 0 },
    dimensions: BAR_DIMS,
    appearance: chartsShowcaseAppearance,
    axes: {
      x: { ...chartsAxisLight, label: 'Step', range: { min: 0, max: 8 } },
      y: { ...chartsAxisLight, label: 'Balance', range: { min: -20, max: 140 } },
    },
    labels: { title: { text: 'Bar waterfall ? legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: axisLegend(chartsLegendPosition, WATERFALL_LEGEND_CS),
  });
}

export async function renderShowcaseBarLollipop(painter: Painter) {
  return painter.createChart('bar', [...BAR_STANDARD_CS], {
    type: 'lollipop',
    dimensions: BAR_DIMS,
    appearance: chartsShowcaseAppearance,
    axes: {
      x: { ...chartsAxisLight, label: 'Period', range: { min: 0, max: 8 } },
      y: { ...chartsAxisLight, label: 'Units', range: { min: 0, max: 85 } },
    },
    labels: { title: { text: 'Bar lollipop ? legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: axisLegend(chartsLegendPosition, BAR_LEGEND_ENTRIES_CS),
    bars: { lineWidth: 2.5, dotSize: 11 },
  });
}

export async function renderShowcaseHBarStacked(painter: Painter) {
  return painter.createChart('horizontalBar', [...HB_GROUPED_CS], {
    type: 'stacked',
    dimensions: HB_DIMS,
    appearance: chartsShowcaseAppearance,
    axes: {
      x: { ...chartsAxisLight, label: 'Total', range: { min: 0, max: 110 } },
      y: { ...chartsAxisLight, label: 'Team' },
    },
    labels: { title: { text: 'H-bar stacked ? legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: axisLegend(chartsLegendPosition, GROUP_LEGEND_CS),
  });
}

export async function renderShowcaseLineRichBottom(painter: Painter) {
  const series = [
    {
      label: 'Revenue',
      color: '#38bdf8',
      lineWidth: 3,
      lineStyle: 'solid' as const,
      smoothness: 'bezier' as const,
      marker: { type: 'circle' as const, size: 8, show: true, filled: true },
      area: { type: 'below' as const, color: '#38bdf8', opacity: 0.14, show: true },
      data: [
        { x: 1, y: 14 },
        { x: 2, y: 22 },
        { x: 3, y: 19 },
        { x: 4, y: 28 },
        { x: 5, y: 31 },
      ],
    },
    {
      label: 'Costs',
      color: '#fb7185',
      lineWidth: 2.5,
      lineStyle: 'dashed' as const,
      smoothness: 'bezier' as const,
      marker: { type: 'square' as const, size: 7, show: true, filled: true },
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 12 },
        { x: 3, y: 15 },
        { x: 4, y: 14 },
        { x: 5, y: 18 },
      ],
    },
    {
      label: 'Guide',
      color: '#a78bfa',
      lineWidth: 2,
      lineStyle: 'dotted' as const,
      smoothness: 'none' as const,
      marker: { type: 'diamond' as const, size: 6, show: true },
      correlation: {
        type: 'linear' as const,
        show: true,
        color: '#c4b5fd',
        lineWidth: 1.5,
        lineStyle: 'dashdot' as const,
      },
      data: [
        { x: 1, y: 11 },
        { x: 2, y: 13 },
        { x: 3, y: 16 },
        { x: 4, y: 17 },
        { x: 5, y: 20 },
      ],
    },
  ];

  return painter.createChart('line', series, {
    dimensions: { width: 920, height: 640, padding: { top: 56, right: 56, bottom: 64, left: 72 } },
    appearance: {
      ...chartsShowcaseAppearance,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: 'rgba(148, 163, 184, 0.45)',
    },
    axes: {
      x: { ...chartsAxisLight, label: 'Week', range: { min: 0.5, max: 5.5 } },
      y: { ...chartsAxisLight, label: 'kUSD', range: { min: 0, max: 38 } },
    },
    labels: {
      title: {
        text: 'Line ? areas + markers + regression ? framed ? legend top-right',
        fontSize: 19,
        color: '#f8fafc',
      },
    },
    legend: {
      show: true,
      position: chartsLegendPosition,
      fontSize: 13,
      textColor: chartsLegendPanel.textColor,
      backgroundColor: chartsLegendPanel.backgroundColor,
      borderColor: chartsLegendPanel.borderColor,
      padding: 10,
      wrapText: true,
      maxWidth: 280,
    },
    grid: { show: true, color: 'rgba(148, 163, 184, 0.12)', width: 1 },
  });
}

export async function renderShowcaseComparisonPieBar(painter: Painter) {
  return painter.createComparisonChart({
    layout: 'sideBySide',
    spacing: 36,
    dimensions: { width: 1680, height: 820, padding: { top: 72, right: 48, bottom: 48, left: 48 } },
    appearance: chartsShowcaseAppearance,
    generalTitle: {
      text: 'Comparison ? pie + bar ? legends top-right',
      fontSize: 22,
      color: '#f8fafc',
    },
    chart1: {
      type: 'pie',
      data: [...PIE_SLICES_CHARTSHOWCASE],
      title: { text: 'Share', fontSize: 16, color: '#f1f5f9' },
      options: {
        appearance: chartsShowcaseAppearance,
        labels: { title: { text: '', fontSize: 14, color: '#f8fafc' }, showValues: true },
        legends: pieLegendsStandard(chartsLegendPosition),
      },
    },
    chart2: {
      type: 'bar',
      barType: 'standard',
      data: [...BAR_STANDARD_CS],
      title: { text: 'Throughput', fontSize: 16, color: '#f1f5f9' },
      options: {
        appearance: chartsShowcaseAppearance,
        axes: {
          x: { ...chartsAxisLight, label: 'Period', range: { min: 0, max: 8 } },
          y: { ...chartsAxisLight, label: 'Units', range: { min: 0, max: 85 } },
        },
        labels: { title: { text: '', fontSize: 14, color: '#f8fafc' } },
        legend: axisLegend(chartsLegendPosition, BAR_LEGEND_ENTRIES_CS),
      },
    },
  });
}

export const SHOWCASE_PICK_FILENAMES = [
  'gallery-chartshowcase-pie-connected.png',
  'gallery-chartshowcase-bar-grouped.png',
  'gallery-chartshowcase-bar-waterfall.png',
  'gallery-chartshowcase-bar-lollipop.png',
  'gallery-chartshowcase-hbar-stacked.png',
  'gallery-chartshowcase-line-rich.png',
  'gallery-chartshowcase-line-all-styles.png',
  'gallery-chartshowcase-combo-grouped-lines.png',
  'gallery-chartshowcase-comparison-pie-bar.png',
] as const;

export async function renderAllShowcasePicks(painter: Painter): Promise<Map<string, Buffer>> {
  const { renderShowcaseLineAllStyles, renderShowcaseComboGroupedLines } = await import('./chartsShowcaseMoreRenders');
  const m = new Map<string, Buffer>();
  m.set(SHOWCASE_PICK_FILENAMES[0], await renderShowcasePieConnected(painter));
  m.set(SHOWCASE_PICK_FILENAMES[1], await renderShowcaseBarGrouped(painter));
  m.set(SHOWCASE_PICK_FILENAMES[2], await renderShowcaseBarWaterfall(painter));
  m.set(SHOWCASE_PICK_FILENAMES[3], await renderShowcaseBarLollipop(painter));
  m.set(SHOWCASE_PICK_FILENAMES[4], await renderShowcaseHBarStacked(painter));
  m.set(SHOWCASE_PICK_FILENAMES[5], await renderShowcaseLineRichBottom(painter));
  m.set(SHOWCASE_PICK_FILENAMES[6], await renderShowcaseLineAllStyles(painter));
  m.set(SHOWCASE_PICK_FILENAMES[7], await renderShowcaseComboGroupedLines(painter));
  m.set(SHOWCASE_PICK_FILENAMES[8], await renderShowcaseComparisonPieBar(painter));
  return m;
}