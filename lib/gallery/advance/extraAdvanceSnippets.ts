/**
 * Additional advance gallery cards — bar, horizontalBar, line, typography plaque.
 * Previews: static PNGs under `public/gallery-outputs/images/`.
 */
import type { AdvanceGalleryCard } from '../core/galleryTypes';

const BAR_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const barData = [
    { label: 'Q1', value: 42, xStart: 0, xEnd: 1, color: '#38bdf8' },
    { label: 'Q2', value: 58, xStart: 1, xEnd: 2, color: '#818cf8' },
    { label: 'Q3', value: 49, xStart: 2, xEnd: 3, color: '#c084fc' },
    { label: 'Q4', value: 71, xStart: 3, xEnd: 4, color: '#f472b6' },
  ];

  return painter.createChart('bar', barData, {
    type: 'standard',
    dimensions: { width: 720, height: 480, padding: { top: 48, right: 40, bottom: 52, left: 52 } },
    appearance: {
      backgroundGradient: {
        type: 'linear',
        rotate: 110,
        colors: [
          { stop: 0, color: '#0f172a' },
          { stop: 1, color: '#172554' },
        ],
      },
      patternBg: {
        type: 'dots',
        color: 'rgba(248,250,252,0.06)',
        size: 3,
        spacing: 20,
        opacity: 0.5,
        blendMode: 'overlay',
      },
      noiseBg: { intensity: 0.028 },
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.25)',
    },
    axes: {
      x: {
        label: 'Quarter',
        labelColor: '#f1f5f9',
        range: { min: 0, max: 4, step: 1 },
        color: '#cbd5e1',
        tickFontSize: 12,
      },
      y: {
        label: 'Revenue index',
        labelColor: '#f1f5f9',
        range: { min: 0, max: 80, step: 20 },
        color: '#cbd5e1',
        tickFontSize: 12,
      },
    },
    labels: {
      title: { text: 'Quarterly bar · appearance stack', fontSize: 22, color: '#f8fafc' },
    },
    legend: { show: false },
    grid: { show: true, color: 'rgba(148,163,184,0.1)', width: 1 },
  });
}

return await main();
`;

const HBAR_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const lanes = [
    { label: 'Edge', value: 165, color: '#22d3ee', labelColor: '#f1f5f9', valueColor: '#f8fafc' },
    { label: 'Region', value: 132, color: '#a78bfa', labelColor: '#f1f5f9', valueColor: '#f8fafc' },
    { label: 'Batch', value: 98, color: '#fb7185', labelColor: '#f1f5f9', valueColor: '#f8fafc' },
    { label: 'Stream', value: 184, color: '#34d399', labelColor: '#f1f5f9', valueColor: '#f8fafc' },
  ];

  return painter.createChart('horizontalBar', lanes, {
    type: 'standard',
    dimensions: { width: 760, height: 440, padding: { top: 44, right: 52, bottom: 48, left: 96 } },
    appearance: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.35)',
      axisColor: '#cbd5e1',
    },
    axes: {
      x: {
        label: 'Requests / s',
        labelColor: '#f1f5f9',
        range: { min: 0, max: 200, step: 50 },
        color: '#cbd5e1',
        tickFontSize: 12,
      },
      y: {
        label: 'Route',
        labelColor: '#f1f5f9',
        color: '#cbd5e1',
        tickFontSize: 12,
      },
    },
    labels: {
      title: { text: 'Horizontal bars · axis styling', fontSize: 21, color: '#f1f5f9' },
      barLabelDefaults: {
        show: true,
        fontSize: 13,
        defaultColor: '#f1f5f9',
      },
      valueLabelDefaults: {
        show: true,
        fontSize: 12,
        defaultColor: '#f8fafc',
      },
    },
    legend: { show: false },
    grid: { show: true, color: 'rgba(148,163,184,0.12)', width: 1 },
  });
}

return await main();
`;

const LINE_DUAL_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const dualLine = [
    {
      label: 'Shipped',
      color: '#38bdf8',
      lineWidth: 3,
      smoothness: 'bezier',
      marker: { show: true, type: 'circle', size: 8, filled: true },
      data: [
        { x: 1, y: 18 },
        { x: 2, y: 26 },
        { x: 3, y: 22 },
        { x: 4, y: 34 },
        { x: 5, y: 41 },
        { x: 6, y: 38 },
      ],
    },
    {
      label: 'Planned',
      color: '#64748b',
      lineWidth: 2,
      lineStyle: 'dashed',
      smoothness: 'bezier',
      marker: { show: true, type: 'square', size: 7, filled: false },
      data: [
        { x: 1, y: 20 },
        { x: 2, y: 24 },
        { x: 3, y: 28 },
        { x: 4, y: 30 },
        { x: 5, y: 36 },
        { x: 6, y: 42 },
      ],
    },
  ];

  return painter.createChart('line', dualLine, {
    dimensions: { width: 780, height: 460, padding: { top: 36, right: 28, bottom: 42, left: 48 } },
    appearance: {
      backgroundGradient: {
        type: 'linear',
        rotate: 135,
        colors: [
          { stop: 0, color: '#020617' },
          { stop: 1, color: '#1e1b4b' },
        ],
      },
      noiseBg: { intensity: 0.03 },
      borderRadius: 14,
      axisColor: '#e2e8f0',
    },
    axes: {
      x: {
        label: 'Sprint',
        labelColor: '#f8fafc',
        range: { min: 1, max: 6, step: 1 },
        color: '#e2e8f0',
        tickFontSize: 13,
      },
      y: {
        label: 'Features',
        labelColor: '#f8fafc',
        range: { min: 0, max: 48, step: 12 },
        color: '#e2e8f0',
        tickFontSize: 13,
      },
    },
    labels: {
      title: { text: 'Dual series · markers · dashed plan', fontSize: 21, color: '#f8fafc' },
    },
    legend: {
      show: true,
      position: 'top-right',
      fontSize: 13,
      textColor: '#f8fafc',
      backgroundColor: 'rgba(2, 6, 23, 0.94)',
      borderColor: 'rgba(248, 250, 252, 0.28)',
      padding: 10,
    },
    grid: { show: true, color: 'rgba(148,163,184,0.12)', width: 1 },
  });
}

return await main();
`;

const TEXT_GLOW_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const { buffer } = await painter.createCanvas({
    width: 960,
    height: 360,
    gradientBg: {
      type: 'radial',
      colors: [
        { stop: 0, color: '#1e293b' },
        { stop: 1, color: '#020617' },
      ],
      startX: 480,
      startY: 180,
      startRadius: 0,
      endX: 480,
      endY: 180,
      endRadius: 520,
    },
    noiseBg: { intensity: 0.042 },
    borderRadius: 20,
    stroke: {
      width: 1,
      color: 'rgba(148, 163, 184, 0.35)',
      borderRadius: 20,
    },
  });

  return painter.createText(
    [
      {
        text: 'Apexify.js',
        x: 480,
        y: 168,
        font: { family: 'Arial', size: 52 },
        bold: true,
        textAlign: 'center',
        textBaseline: 'middle',
        gradient: {
          type: 'linear',
          startX: 280,
          startY: 140,
          endX: 680,
          endY: 200,
          colors: [
            { stop: 0, color: '#38bdf8' },
            { stop: 0.5, color: '#c084fc' },
            { stop: 1, color: '#fb7185' },
          ],
        },
        stroke: { color: '#0f172a', width: 2, opacity: 0.85 },
        shadow: {
          color: 'rgba(0,0,0,0.55)',
          offsetY: 8,
          blur: 28,
          opacity: 1,
        },
      },
      {
        text: 'Gradient lettering · stroke · shadow — createText',
        x: 480,
        y: 238,
        font: { family: 'Arial', size: 17 },
        color: 'rgba(203, 213, 225, 0.92)',
        textAlign: 'center',
        textBaseline: 'middle',
      },
    ],
    buffer
  );
}

return await main();
`;

const toJs = (ts: string) => ts.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

export const extraAdvanceGalleryItems: AdvanceGalleryCard[] = [
  {
    id: 'advance-chart-bar-quarterly',
    title: 'Bar chart · quarterly index',
    category: 'advance',
    description:
      '**Vertical bars** via `createChart(\'bar\')`. Standard slots use **`xStart` / `xEnd`**, with **`appearance`** gradient + dot **`patternBg`**, axes, and grid—matching the bar-chart **`ChartAppearanceExtended`** story.\n\n**Takeaway:** Baseline before grouped, stacked, or waterfall variants.',
    thumbnail: '/gallery-outputs/images/chart-bar-quarterly.png',
    featured: true,
    code: { ts: BAR_TS, js: toJs(BAR_TS) },
  },
  {
    id: 'advance-chart-hbar-routes',
    title: 'Horizontal bar · route throughput',
    category: 'advance',
    description:
      '**`createChart(\'horizontalBar\')`** with **`labelColor` / `valueColor`** on each row plus **`axes.*.labelColor`**, **`axes.*.color`**, and **`labels.barLabelDefaults`** / **`valueLabelDefaults`** so category names, numerics, and values stay legible on dark panels.\n\n**Takeaway:** Use explicit light ink whenever **`appearance.backgroundColor`** is deep navy—defaults alone can resolve to near-black.',
    thumbnail: '/gallery-outputs/images/chart-hbar-routes.png',
    code: { ts: HBAR_TS, js: toJs(HBAR_TS) },
  },
  {
    id: 'advance-chart-line-dual-target',
    title: 'Line chart · dual series & markers',
    category: 'advance',
    description:
      '**Two `line` series**—smooth **`bezier`** strokes, **`circle`** vs **`square`** markers, dashed “plan” track, and **`top-right`** **`legend`**.\n\n**Takeaway:** Shows how **`lineStyle`** and per-series **`marker`** configs read together on a dark **`appearance`** field.',
    thumbnail: '/gallery-outputs/images/chart-line-dual-target.png',
    featured: true,
    code: { ts: LINE_DUAL_TS, js: toJs(LINE_DUAL_TS) },
  },
  {
    id: 'advance-text-glow-plaque',
    title: 'Typography plaque · gradient logotype',
    category: 'advance',
    description:
      '**No charts—pure type.** Radial **`createCanvas`** plate plus **`createText`** headline using **`gradient`** fill, **`stroke`**, and **`shadow`**, with a caption line.\n\n**Takeaway:** Useful when showcasing branding strips or exportable badges beside heavier demos.',
    thumbnail: '/gallery-outputs/images/advance-text-glow-plaque.png',
    code: { ts: TEXT_GLOW_TS, js: toJs(TEXT_GLOW_TS) },
  },
];
