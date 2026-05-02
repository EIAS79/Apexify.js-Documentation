/**
 * Chart showcase cards — thumbnails are static files under `public/gallery-outputs/images/`.
 * Modal snippets import **only** `apexify.js` — same story as `extraAdvanceSnippets.ts`.
 */
import type { AdvanceGalleryCard } from '../core/galleryTypes';

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
      axisColor: '#e2e8f0',
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
        textColor: '#f8fafc',
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        borderColor: 'rgba(248, 250, 252, 0.28)',
        padding: 10,
        lineColor: 'rgba(248, 250, 252, 0.78)',
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
      axisColor: '#e2e8f0',
      axisWidth: 2,
      arrowSize: 10,
      noiseBg: { intensity: 0.03 },
    },
    axes: {
      x: {
        label: 'Quarter',
        labelColor: '#f8fafc',
        range: { min: 0, max: 8 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
      y: {
        label: 'Amount',
        labelColor: '#f8fafc',
        range: { min: 0, max: 65 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
    },
    labels: { title: { text: 'Bar grouped · legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'top-right',
      entries: [
        { label: 'Alpha', color: '#38bdf8' },
        { label: 'Beta', color: '#a78bfa' },
      ],
      fontSize: 12,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
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
      axisColor: '#e2e8f0',
      axisWidth: 2,
      arrowSize: 10,
      noiseBg: { intensity: 0.03 },
    },
    axes: {
      x: {
        label: 'Step',
        labelColor: '#f8fafc',
        range: { min: 0, max: 8 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
      y: {
        label: 'Balance',
        labelColor: '#f8fafc',
        range: { min: -20, max: 140 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
    },
    labels: { title: { text: 'Bar waterfall · legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'top-right',
      entries: data.map((b) => ({ label: b.label, color: b.color ?? '#94a3b8' })),
      fontSize: 12,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
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
      axisColor: '#e2e8f0',
      axisWidth: 2,
      arrowSize: 10,
      noiseBg: { intensity: 0.03 },
    },
    axes: {
      x: {
        label: 'Period',
        labelColor: '#f8fafc',
        range: { min: 0, max: 8 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
      y: {
        label: 'Units',
        labelColor: '#f8fafc',
        range: { min: 0, max: 85 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
    },
    labels: { title: { text: 'Bar lollipop · legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'top-right',
      entries: data.map((b) => ({ label: b.label, color: b.color })),
      fontSize: 12,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
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
      axisColor: '#e2e8f0',
      axisWidth: 2,
      arrowSize: 10,
      noiseBg: { intensity: 0.03 },
    },
    axes: {
      x: {
        label: 'Total',
        labelColor: '#f8fafc',
        range: { min: 0, max: 110 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
      y: {
        label: 'Team',
        labelColor: '#f8fafc',
        color: '#e2e8f0',
        tickFontSize: 12,
      },
    },
    labels: { title: { text: 'H-bar stacked · legend top-right', fontSize: 20, color: '#f8fafc' } },
    legend: {
      show: true,
      position: 'top-right',
      entries: [
        { label: 'Alpha', color: '#38bdf8' },
        { label: 'Beta', color: '#a78bfa' },
      ],
      fontSize: 12,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
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
    axisColor: '#e2e8f0',
    axisWidth: 2,
    arrowSize: 10,
    noiseBg: { intensity: 0.03 },
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  };

  const axis = {
    labelColor: '#f8fafc' as const,
    color: '#e2e8f0' as const,
    tickFontSize: 12,
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
        text: 'Line · areas + markers + regression · framed · legend top-right',
        fontSize: 19,
        color: '#f8fafc',
      },
    },
    legend: {
      show: true,
      position: 'top-right',
      fontSize: 12,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
      wrapText: true,
      maxWidth: 280,
    },
    grid: { show: true, color: 'rgba(148, 163, 184, 0.12)', width: 1 },
  });
}

return await main();
`;

const COMBO_GROUPED_LINES_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  return painter.createComboChart({
    bars: [
      {
        label: 'Q1',
        xStart: 1,
        xEnd: 2,
        values: [
          { value: 42, color: '#38bdf8', label: 'SKU A' },
          { value: 28, color: '#818cf8', label: 'SKU B' },
        ],
      },
      {
        label: 'Q2',
        xStart: 3,
        xEnd: 4,
        values: [
          { value: 48, color: '#38bdf8', label: 'SKU A' },
          { value: 34, color: '#818cf8', label: 'SKU B' },
        ],
      },
      {
        label: 'Q3',
        xStart: 5,
        xEnd: 6,
        values: [
          { value: 36, color: '#38bdf8', label: 'SKU A' },
          { value: 41, color: '#818cf8', label: 'SKU B' },
        ],
      },
    ],
    barsType: 'grouped',
    lines: [
      {
        label: 'Margin %',
        color: '#f472b6',
        lineWidth: 3,
        smoothness: 'bezier',
        yAxis: 'secondary',
        marker: { type: 'circle', size: 7, show: true, filled: true },
        data: [
          { x: 1.5, y: 62 },
          { x: 3.5, y: 71 },
          { x: 5.5, y: 68 },
        ],
      },
      {
        label: 'Floor (bar scale)',
        color: '#34d399',
        lineWidth: 2,
        lineStyle: 'dashed',
        smoothness: 'none',
        yAxis: 'primary',
        marker: { type: 'square', size: 6, show: true, filled: false },
        data: [
          { x: 1.5, y: 52 },
          { x: 3.5, y: 58 },
          { x: 5.5, y: 55 },
        ],
      },
    ],
    dimensions: {
      width: 960,
      height: 640,
      padding: { top: 56, right: 56, bottom: 76, left: 76 },
    },
    appearance: {
      backgroundGradient: {
        type: 'linear',
        startX: 0,
        startY: 0,
        endX: 960,
        endY: 640,
        colors: [
          { stop: 0, color: '#0f172a' },
          { stop: 0.55, color: '#1e293b' },
          { stop: 1, color: '#020617' },
        ],
      },
      axisColor: '#e2e8f0',
      axisWidth: 2,
      arrowSize: 10,
      noiseBg: { intensity: 0.032 },
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(148, 163, 184, 0.35)',
    },
    axes: {
      x: {
        label: 'Quarter',
        labelColor: '#f8fafc',
        range: { min: 0, max: 8 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
      y: {
        label: 'Volume (k)',
        labelColor: '#f8fafc',
        range: { min: 0, max: 100 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
      ySecondary: {
        label: 'Margin %',
        labelColor: '#fdf4ff',
        range: { min: 40, max: 90 },
        color: '#fda4af',
        tickFontSize: 12,
      },
    },
    labels: {
      title: {
        text: 'Combo · grouped bars + dual-axis lines · createComboChart',
        fontSize: 19,
        color: '#f8fafc',
      },
    },
    legend: {
      show: true,
      position: 'top-right',
      fontSize: 12,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
      wrapText: true,
      maxWidth: 300,
      spacing: 10,
    },
    grid: { show: true, color: 'rgba(148, 163, 184, 0.1)', width: 1 },
    barStyle: { groupSpacing: 8 },
    secondaryYAxis: { show: true },
  });
}

return await main();
`;

const LINE_ALL_LINE_STYLES_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];

  const band = (base: number, spread: number[]) =>
    x.map((xi, i) => ({ x: xi, y: base + spread[i] }));

  const series = [
    {
      label: 'solid · bezier',
      color: '#38bdf8',
      lineWidth: 2.5,
      lineStyle: 'solid' as const,
      smoothness: 'bezier' as const,
      marker: { type: 'circle' as const, size: 5, show: true, filled: true },
      data: band(10, [0, 3, 2, 5, 6, 4, 7, 8]),
    },
    {
      label: 'dashed · bezier',
      color: '#a78bfa',
      lineWidth: 2.25,
      lineStyle: 'dashed' as const,
      smoothness: 'bezier' as const,
      marker: { type: 'square' as const, size: 5, show: true, filled: true },
      data: band(22, [0, 2, 4, 3, 5, 6, 5, 7]),
    },
    {
      label: 'dotted · spline',
      color: '#fb7185',
      lineWidth: 2,
      lineStyle: 'dotted' as const,
      smoothness: 'spline' as const,
      marker: { type: 'triangle' as const, size: 6, show: true, filled: true },
      data: band(34, [1, 2, 2, 4, 5, 4, 6, 7]),
    },
    {
      label: 'dashdot',
      color: '#fbbf24',
      lineWidth: 2,
      lineStyle: 'dashdot' as const,
      smoothness: 'none' as const,
      marker: { type: 'diamond' as const, size: 5, show: true },
      data: band(46, [0, 1, 3, 2, 4, 5, 4, 6]),
    },
    {
      label: 'longdash',
      color: '#34d399',
      lineWidth: 2,
      lineStyle: 'longdash' as const,
      smoothness: 'bezier' as const,
      marker: { type: 'cross' as const, size: 6, show: true },
      data: band(58, [2, 3, 2, 4, 6, 5, 7, 8]),
    },
    {
      label: 'shortdash',
      color: '#22d3ee',
      lineWidth: 2,
      lineStyle: 'shortdash' as const,
      smoothness: 'none' as const,
      marker: { type: 'circle' as const, size: 4, show: true, filled: false },
      data: band(70, [1, 2, 3, 2, 4, 3, 5, 6]),
    },
    {
      label: 'dashdotdot',
      color: '#e879f9',
      lineWidth: 2,
      lineStyle: 'dashdotdot' as const,
      smoothness: 'bezier' as const,
      data: band(82, [0, 2, 1, 3, 4, 3, 5, 6]),
    },
    {
      label: 'step',
      color: '#94a3b8',
      lineWidth: 2.25,
      lineStyle: 'step' as const,
      smoothness: 'none' as const,
      data: [
        { x: 1, y: 96 },
        { x: 2, y: 96 },
        { x: 3, y: 102 },
        { x: 4, y: 102 },
        { x: 5, y: 108 },
        { x: 6, y: 108 },
        { x: 7, y: 104 },
        { x: 8, y: 104 },
      ],
    },
    {
      label: 'stepline',
      color: '#f97316',
      lineWidth: 2.25,
      lineStyle: 'stepline' as const,
      smoothness: 'none' as const,
      data: [
        { x: 1, y: 118 },
        { x: 2, y: 122 },
        { x: 3, y: 122 },
        { x: 4, y: 116 },
        { x: 5, y: 116 },
        { x: 6, y: 124 },
        { x: 7, y: 124 },
        { x: 8, y: 120 },
      ],
    },
  ];

  return painter.createChart('line', series, {
    dimensions: { width: 980, height: 760, padding: { top: 52, right: 52, bottom: 92, left: 72 } },
    appearance: {
      backgroundGradient: {
        type: 'linear' as const,
        startX: 0,
        startY: 0,
        endX: 980,
        endY: 760,
        colors: [
          { stop: 0, color: '#0f172a' },
          { stop: 0.55, color: '#1e293b' },
          { stop: 1, color: '#020617' },
        ],
      },
      axisColor: '#e2e8f0',
      axisWidth: 2,
      arrowSize: 10,
      noiseBg: { intensity: 0.028 },
      borderRadius: 14,
      borderWidth: 2,
      borderColor: 'rgba(148, 163, 184, 0.4)',
    },
    axes: {
      x: {
        label: 'Index',
        labelColor: '#f8fafc',
        range: { min: 0.5, max: 8.5 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
      y: {
        label: 'Value',
        labelColor: '#f8fafc',
        range: { min: 0, max: 130 },
        color: '#e2e8f0',
        tickFontSize: 12,
      },
    },
    labels: {
      title: {
        text: 'Line · all LineStyle presets + smoothness · legend top-right',
        fontSize: 18,
        color: '#f8fafc',
      },
    },
    legend: {
      show: true,
      position: 'top-right',
      fontSize: 10,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
      wrapText: true,
      maxWidth: 300,
      spacing: 7,
    },
    grid: { show: true, color: 'rgba(148, 163, 184, 0.11)', width: 1 },
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
    axisColor: '#e2e8f0',
    axisWidth: 2,
    arrowSize: 10,
    noiseBg: { intensity: 0.03 },
  };

  const axis = {
    labelColor: '#f8fafc' as const,
    color: '#e2e8f0' as const,
    tickFontSize: 12,
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
      text: 'Comparison · pie + bar · legends top-right',
      fontSize: 22,
      color: '#f8fafc',
    },
    chart1: {
      type: 'pie',
      data: pieSlices,
      title: { text: 'Share', fontSize: 16, color: '#f1f5f9' },
      options: {
        appearance,
        labels: { title: { text: '', fontSize: 14, color: '#f8fafc' }, showValues: true },
        legends: {
          standard: {
            show: true,
            position: 'top-right',
            fontSize: 12,
            textColor: '#f8fafc',
            backgroundColor: 'rgba(2, 6, 23, 0.94)',
            borderColor: 'rgba(248, 250, 252, 0.28)',
            padding: 10,
          },
        },
      },
    },
    chart2: {
      type: 'bar',
      barType: 'standard',
      data: barData,
      title: { text: 'Throughput', fontSize: 16, color: '#f1f5f9' },
      options: {
        appearance,
        axes: {
          x: { ...axis, label: 'Period', range: { min: 0, max: 8 } },
          y: { ...axis, label: 'Units', range: { min: 0, max: 85 } },
        },
        labels: {
          title: { text: '', fontSize: 14, color: '#f8fafc' },
          valueLabelDefaults: { show: true, fontSize: 12, defaultColor: '#f8fafc' },
        },
        legend: {
          show: true,
          position: 'top-right',
          entries: barData.map((b) => ({ label: b.label, color: b.color })),
          fontSize: 12,
          textColor: '#f8fafc',
          backgroundColor: 'rgba(2, 6, 23, 0.94)',
          borderColor: 'rgba(248, 250, 252, 0.28)',
          padding: 10,
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
      '**`type: \'grouped\'`** with **`legend`** (`show`, **`entries`**, styling) and **`bars.groupSpacing`** / **`segmentSpacing`**.\n\n**Takeaway:** Multi-segment columns with a **`top-right`** legend panel—**`apexify.js`** only.',
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
      '**`createChart(\'horizontalBar\', …, { type: \'stacked\' })`** with stacked **`values`** per category.\n\n**Takeaway:** **`top-right`** **`legend`** keeps callouts clear of category labels.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-hbar-stacked.png',
    code: { ts: HBAR_STACKED_TS, js: toJs(HBAR_STACKED_TS) },
  },
  {
    id: 'advance-chartshowcase-line-rich',
    title: 'Line · areas, markers, regression',
    category: 'advance',
    description:
      '**Multi-series line** with **`area`**, mixed **`lineStyle`**, **`correlation`** (linear fit), framed **`appearance`**, grid, and **`top-right`** legend (**`wrapText`**).\n\n**Takeaway:** Dense panel with brighter **`axes.*.labelColor`** and **`axes.*.color`** so ticks stay readable on dark chrome.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-line-rich.png',
    featured: true,
    code: { ts: LINE_RICH_TS, js: toJs(LINE_RICH_TS) },
  },
  {
    id: 'advance-chartshowcase-line-all-styles',
    title: 'Line · all styles & markers',
    category: 'advance',
    description:
      'One **`createChart(\'line\', …)`** panel showcasing **`LineStyle`** (**`solid`**, **`dashed`**, **`dotted`**, **`dashdot`**, **`longdash`**, **`shortdash`**, **`dashdotdot`**, **`step`**, **`stepline`**) with **`smoothness`** (**`none`**, **`bezier`**, **`spline`**) and mixed **`marker`** types. Corner **`legend`** (**`top-right`**) uses **`wrapText`** / **`maxWidth`** (Apexify **5.3.16+** legend layout).\n\n**Takeaway:** Reference sheet for line aesthetics + readable wrapped legend.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-line-all-styles.png',
    featured: true,
    code: { ts: LINE_ALL_LINE_STYLES_TS, js: toJs(LINE_ALL_LINE_STYLES_TS) },
  },
  {
    id: 'advance-chartshowcase-combo-grouped-lines',
    title: 'Combo · grouped bars + lines',
    category: 'advance',
    description:
      '**`painter.createComboChart`** — **`barsType: \'grouped\'`** with **`values`** segments, plus **`lines`** on **`yAxis: \'primary\'`** vs **`\'secondary\'`** (dual Y). **`legend`** (**`top-right`**) + **`grid`** + **`barStyle.groupSpacing`** with a high-contrast legend panel on the slate **`appearance`**.\n\n**Takeaway:** Bars + trends in one canvas; axis tinting follows series when colors omitted.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-combo-grouped-lines.png',
    featured: true,
    code: { ts: COMBO_GROUPED_LINES_TS, js: toJs(COMBO_GROUPED_LINES_TS) },
  },
  {
    id: 'advance-chartshowcase-comparison-pie-bar',
    title: 'Comparison · pie + bar',
    category: 'advance',
    description:
      '**`createComparisonChart`** — pie + bar panels both use **`legends`** / **`legend`** at **`top-right`** for consistent scanning; shared **`appearance`** and **`generalTitle`**.\n\n**Takeaway:** One wide export, **`apexify.js`** API only.',
    thumbnail: '/gallery-outputs/images/gallery-chartshowcase-comparison-pie-bar.png',
    featured: true,
    code: { ts: COMPARISON_TS, js: toJs(COMPARISON_TS) },
  },
];
