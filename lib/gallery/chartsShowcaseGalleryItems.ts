/**
 * Gallery cards whose previews are built via `chartsShowcasePicks.ts` (repo-internal DRY for PNG build).
 * Modal snippets import **only** `apexify.js` — same story as `extraAdvanceSnippets.ts`.
 */
import type { AdvanceGalleryCard } from './galleryTypes';

const toJs = (ts: string) => ts.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const PIE_CONNECTED_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const slices = [
    { label: 'Edge', value: 34, color: '#38bdf8', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Origin', value: 28, color: '#a78bfa', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Warm path', value: 22, color: '#fb7185', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Cold tail', value: 16, color: '#34d399', stroke: { color: '#0f172a', width: 2 } },
  ];

  return painter.createChart('pie', slices, {
    type: 'pie',
    dimensions: { width: 800, height: 800, padding: { top: 52, right: 52, bottom: 52, left: 52 } },
    appearance: {
      backgroundGradient: {
        type: 'linear',
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
    },
    labels: {
      title: { text: 'Pie · connected legend (lines to slices)', fontSize: 22, color: '#f8fafc' },
      showValues: false,
      showLabels: false,
    },
    legends: {
      connected: {
        show: true,
        fontSize: 12,
        textColor: '#e2e8f0',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        borderColor: 'rgba(148, 163, 184, 0.35)',
        lineColor: '#64748b',
        lineWidth: 1.5,
      },
    },
  });
}

return await main();
`;

const BAR_GROUPED_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const data = [
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

  return painter.createChart('bar', data, {
    type: 'grouped',
    dimensions: { width: 880, height: 640, padding: { top: 56, right: 56, bottom: 56, left: 72 } },
    appearance: {
      backgroundGradient: {
        type: 'linear',
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
    },
    axes: {
      x: {
        label: 'Quarter',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 8 },
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
      y: {
        label: 'Amount',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 65 },
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
    },
    labels: { title: { text: 'Bar grouped · legend bottom', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'bottom',
      entries: [
        { label: 'Alpha', color: '#38bdf8' },
        { label: 'Beta', color: '#a78bfa' },
      ],
      fontSize: 13,
      textColor: '#e2e8f0',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
    },
    bars: { groupSpacing: 6, segmentSpacing: 4 },
  });
}

return await main();
`;

const BAR_WATERFALL_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const data = [
    { label: 'Opening', value: 120, xStart: 1, xEnd: 2, color: '#64748b' },
    { label: 'Growth', value: 35, xStart: 2.5, xEnd: 3.5, color: '#34d399' },
    { label: 'Costs', value: -28, xStart: 4, xEnd: 5, color: '#fb7185' },
    { label: 'Tax', value: -12, xStart: 5.5, xEnd: 6.5, color: '#f97316' },
  ];

  return painter.createChart('bar', data, {
    type: 'waterfall',
    waterfall: { initialValue: 0 },
    dimensions: { width: 880, height: 640, padding: { top: 56, right: 56, bottom: 56, left: 72 } },
    appearance: {
      backgroundGradient: {
        type: 'linear',
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
    },
    axes: {
      x: {
        label: 'Step',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 8 },
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
      y: {
        label: 'Balance',
        labelColor: '#cbd5e1',
        range: { min: -20, max: 140 },
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
    },
    labels: { title: { text: 'Bar waterfall · legend bottom', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'bottom',
      entries: data.map((b) => ({ label: b.label, color: b.color ?? '#94a3b8' })),
      fontSize: 13,
      textColor: '#e2e8f0',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
    },
  });
}

return await main();
`;

const BAR_LOLLIPOP_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const data = [
    { label: 'Jan', value: 42, xStart: 1, xEnd: 2, color: '#38bdf8' },
    { label: 'Feb', value: 58, xStart: 2.5, xEnd: 3.5, color: '#a78bfa' },
    { label: 'Mar', value: 35, xStart: 4, xEnd: 5, color: '#fb7185' },
    { label: 'Apr', value: 71, xStart: 5.5, xEnd: 6.5, color: '#34d399' },
  ];

  return painter.createChart('bar', data, {
    type: 'lollipop',
    dimensions: { width: 880, height: 640, padding: { top: 56, right: 56, bottom: 56, left: 72 } },
    appearance: {
      backgroundGradient: {
        type: 'linear',
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
    },
    axes: {
      x: {
        label: 'Period',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 8 },
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
      y: {
        label: 'Units',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 85 },
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
    },
    labels: { title: { text: 'Bar lollipop · legend bottom', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'bottom',
      entries: data.map((b) => ({ label: b.label, color: b.color })),
      fontSize: 13,
      textColor: '#e2e8f0',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
    },
    bars: { lineWidth: 2.5, dotSize: 11 },
  });
}

return await main();
`;

const HBAR_STACKED_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const data = [
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

  return painter.createChart('horizontalBar', data, {
    type: 'stacked',
    dimensions: { width: 880, height: 560, padding: { top: 56, right: 56, bottom: 56, left: 88 } },
    appearance: {
      backgroundGradient: {
        type: 'linear',
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
    },
    axes: {
      x: {
        label: 'Total',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 110 },
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
      y: {
        label: 'Team',
        labelColor: '#cbd5e1',
        color: '#94a3b8',
        tickFontSize: 11,
        tickColor: '#e2e8f0',
      },
    },
    labels: { title: { text: 'H-bar stacked · legend bottom', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'bottom',
      entries: [
        { label: 'Alpha', color: '#38bdf8' },
        { label: 'Beta', color: '#a78bfa' },
      ],
      fontSize: 13,
      textColor: '#e2e8f0',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
    },
  });
}

return await main();
`;

const LINE_RICH_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const appearance = {
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
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  };

  const axis = {
    labelColor: '#cbd5e1' as const,
    color: '#94a3b8' as const,
    tickFontSize: 11,
    tickColor: '#e2e8f0' as const,
  };

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
    appearance,
    axes: {
      x: { ...axis, label: 'Week', range: { min: 0.5, max: 5.5 } },
      y: { ...axis, label: 'kUSD', range: { min: 0, max: 38 } },
    },
    labels: {
      title: {
        text: 'Line · areas + markers + regression · framed · legend bottom',
        fontSize: 19,
        color: '#f8fafc',
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: 13,
      textColor: '#e2e8f0',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
    },
    grid: { show: true, color: 'rgba(148, 163, 184, 0.12)', width: 1 },
  });
}

return await main();
`;

const COMPARISON_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const appearance = {
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

  const axis = {
    labelColor: '#cbd5e1' as const,
    color: '#94a3b8' as const,
    tickFontSize: 11,
    tickColor: '#e2e8f0' as const,
  };

  const pieSlices = [
    { label: 'Edge', value: 34, color: '#38bdf8', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Origin', value: 28, color: '#a78bfa', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Warm path', value: 22, color: '#fb7185', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Cold tail', value: 16, color: '#34d399', stroke: { color: '#0f172a', width: 2 } },
  ];

  const barData = [
    { label: 'Jan', value: 42, xStart: 1, xEnd: 2, color: '#38bdf8' },
    { label: 'Feb', value: 58, xStart: 2.5, xEnd: 3.5, color: '#a78bfa' },
    { label: 'Mar', value: 35, xStart: 4, xEnd: 5, color: '#fb7185' },
    { label: 'Apr', value: 71, xStart: 5.5, xEnd: 6.5, color: '#34d399' },
  ];

  return painter.createComparisonChart({
    layout: 'sideBySide',
    spacing: 36,
    dimensions: { width: 1680, height: 820, padding: { top: 72, right: 48, bottom: 48, left: 48 } },
    appearance,
    generalTitle: {
      text: 'Comparison · side-by-side · pie (standard legend) + bar (legend)',
      fontSize: 22,
      color: '#f8fafc',
    },
    chart1: {
      type: 'pie',
      data: pieSlices,
      title: { text: 'Share', fontSize: 16, color: '#e2e8f0' },
      options: {
        appearance,
        labels: { title: { text: '', fontSize: 14, color: '#f8fafc' }, showValues: true },
        legends: {
          standard: {
            show: true,
            position: 'bottom',
            fontSize: 13,
            textColor: '#e2e8f0',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderColor: 'rgba(148, 163, 184, 0.35)',
          },
        },
      },
    },
    chart2: {
      type: 'bar',
      barType: 'standard',
      data: barData,
      title: { text: 'Throughput', fontSize: 16, color: '#e2e8f0' },
      options: {
        appearance,
        axes: {
          x: { ...axis, label: 'Period', range: { min: 0, max: 8 } },
          y: { ...axis, label: 'Units', range: { min: 0, max: 85 } },
        },
        labels: { title: { text: '', fontSize: 14, color: '#f8fafc' } },
        legend: {
          show: true,
          position: 'bottom',
          entries: barData.map((b) => ({ label: b.label, color: b.color })),
          fontSize: 13,
          textColor: '#e2e8f0',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          borderColor: 'rgba(148, 163, 184, 0.35)',
        },
      },
    },
  });
}

return await main();
`;

export const chartsShowcaseGalleryItems: AdvanceGalleryCard[] = [
  {
    id: 'advance-chartshowcase-pie-connected',
    title: 'Pie · connected legend',
    category: 'advance',
    description:
      '**`legends.connected`** draws leader lines from legend rows into slices—distinct from **`legends.standard`** on pie charts.\n\n**Takeaway:** Uses **`createChart(\'pie\', …)`** from **`apexify.js`** only; preview PNG matches this config.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-pie-connected.png',
    featured: true,
    code: { ts: PIE_CONNECTED_TS, js: toJs(PIE_CONNECTED_TS) },
  },
  {
    id: 'advance-chartshowcase-bar-grouped',
    title: 'Bar · grouped + axis legend',
    category: 'advance',
    description:
      '**`type: \'grouped\'`** with **`legend`** (`show`, **`entries`**, styling) and **`bars.groupSpacing`** / **`segmentSpacing`**.\n\n**Takeaway:** Multi-segment columns with a bottom legend—**`apexify.js`** only.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-bar-grouped.png',
    code: { ts: BAR_GROUPED_TS, js: toJs(BAR_GROUPED_TS) },
  },
  {
    id: 'advance-chartshowcase-bar-waterfall',
    title: 'Bar · waterfall',
    category: 'advance',
    description:
      '**`type: \'waterfall\'`** with **`waterfall.initialValue`** plus signed steps and **`legend.entries`** derived from the same rows.\n\n**Takeaway:** P&L-style deltas on the shared slate **`appearance`**.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-bar-waterfall.png',
    code: { ts: BAR_WATERFALL_TS, js: toJs(BAR_WATERFALL_TS) },
  },
  {
    id: 'advance-chartshowcase-bar-lollipop',
    title: 'Bar · lollipop',
    category: 'advance',
    description:
      '**`type: \'lollipop\'`** over interval bars—**`bars.lineWidth`** and **`dotSize`** tuned for crisp PNG export.\n\n**Takeaway:** Same **`axes`** / **`legend`** story as filled bars, lighter geometry.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-bar-lollipop.png',
    code: { ts: BAR_LOLLIPOP_TS, js: toJs(BAR_LOLLIPOP_TS) },
  },
  {
    id: 'advance-chartshowcase-hbar-stacked',
    title: 'Horizontal bar · stacked',
    category: 'advance',
    description:
      '**`createChart(\'horizontalBar\', …, { type: \'stacked\' })`** with stacked **`values`** per category.\n\n**Takeaway:** Bottom **`legend`** matches the vertical grouped-bar pattern.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-hbar-stacked.png',
    code: { ts: HBAR_STACKED_TS, js: toJs(HBAR_STACKED_TS) },
  },
  {
    id: 'advance-chartshowcase-line-rich',
    title: 'Line · areas, markers, regression',
    category: 'advance',
    description:
      '**Multi-series line** with **`area`**, mixed **`lineStyle`**, **`correlation`** (linear fit), framed **`appearance`**, grid, and bottom legend.\n\n**Takeaway:** Dense panel while **`tickColor`** keeps axes readable on dark chrome.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-line-rich.png',
    featured: true,
    code: { ts: LINE_RICH_TS, js: toJs(LINE_RICH_TS) },
  },
  {
    id: 'advance-chartshowcase-comparison-pie-bar',
    title: 'Comparison · pie + bar',
    category: 'advance',
    description:
      '**`createComparisonChart`** — pie with **`legends.standard`** beside **`bar`** (`standard`) with **`legend`**; shared **`appearance`** and **`generalTitle`**.\n\n**Takeaway:** One wide export, **`apexify.js`** API only.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-comparison-pie-bar.png',
    featured: true,
    code: { ts: COMPARISON_TS, js: toJs(COMPARISON_TS) },
  },
];
