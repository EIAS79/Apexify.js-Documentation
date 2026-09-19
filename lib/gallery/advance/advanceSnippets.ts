/**
 * “Advance” gallery cards — charts (`appearance` / donut), `createComparisonChart`, and multi-pass `createImage` + `createText`.
 * Extra bar / line / comparison / text demos live in `extraAdvanceSnippets.ts`; curated chart-showcase picks in `chartsShowcaseGalleryItems.ts`.
 * Previews: static PNGs under `public/gallery-outputs/images/`.
 */
import type { AdvanceGalleryCard } from '../core/galleryTypes';
import { chartsShowcaseGalleryItems } from '../charts/chartsShowcaseGalleryItems';
import { extraAdvanceGalleryItems } from './extraAdvanceSnippets';

const DONUT_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const slices = [
    { label: 'Edge', value: 34, color: '#38bdf8', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Origin', value: 28, color: '#a78bfa', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Warm path', value: 22, color: '#fb7185', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Cold tail', value: 16, color: '#34d399', stroke: { color: '#0f172a', width: 2 } },
  ];

  const chart = await painter.createChart('pie', slices, {
    type: 'donut',
    dimensions: {
      width: 820,
      height: 820,
      padding: { top: 56, right: 56, bottom: 56, left: 56 },
    },
    appearance: {
      backgroundGradient: {
        type: 'radial',
        colors: [
          { stop: 0, color: '#1e293b' },
          { stop: 0.55, color: '#0f172a' },
          { stop: 1, color: '#020617' },
        ],
        startX: 410,
        startY: 410,
        startRadius: 0,
        endX: 410,
        endY: 410,
        endRadius: 520,
      },
      bgLayers: [
        {
          type: 'gradient',
          blendMode: 'screen',
          opacity: 0.35,
          value: {
            type: 'linear',
            startX: 0,
            startY: 0,
            endX: 820,
            endY: 820,
            colors: [
              { stop: 0, color: 'rgba(56, 189, 248, 0.2)' },
              { stop: 0.5, color: 'rgba(244, 114, 182, 0.12)' },
              { stop: 1, color: 'rgba(167, 139, 250, 0.18)' },
            ],
          },
        },
      ],
      patternBg: {
        type: 'dots',
        color: 'rgba(248, 250, 252, 0.08)',
        secondaryColor: 'rgba(15, 23, 42, 0.35)',
        size: 4,
        spacing: 22,
        rotation: 18,
        blendMode: 'overlay',
        opacity: 0.55,
      },
      noiseBg: { intensity: 0.045 },
    },
    labels: {
      title: {
        text: 'Donut · ChartAppearanceExtended',
        fontSize: 26,
        color: '#f8fafc',
      },
    },
    legends: {
      standard: {
        show: true,
        position: 'top-right',
        fontSize: 15,
        textColor: '#f8fafc',
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        borderColor: 'rgba(248, 250, 252, 0.28)',
        padding: 10,
      },
    },
  });

  return chart;
}

return await main();
`;

const DONUT_JS = DONUT_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const COMPARISON_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const donutSlices = [
    { label: 'API', value: 38, color: '#22d3ee' },
    { label: 'Workers', value: 27, color: '#c084fc' },
    { label: 'Cache', value: 22, color: '#f472b6' },
    { label: 'Other', value: 13, color: '#94a3b8' },
  ];

  const lineSeries = [
    {
      label: 'p99 ms',
      color: '#38bdf8',
      lineWidth: 3,
      smoothness: 'bezier',
      data: [
        { x: 1, y: 118 },
        { x: 2, y: 96 },
        { x: 3, y: 88 },
        { x: 4, y: 72 },
        { x: 5, y: 61 },
        { x: 6, y: 54 },
        { x: 7, y: 49 },
        { x: 8, y: 46 },
      ],
      area: {
        show: true,
        type: 'below',
        color: 'rgba(56, 189, 248, 0.18)',
        opacity: 1,
      },
    },
  ];

  const composite = await painter.createComparisonChart({
    layout: 'sideBySide',
    spacing: 28,
    appearance: {
      backgroundGradient: {
        type: 'linear',
        rotate: 128,
        colors: [
          { stop: 0, color: '#020617' },
          { stop: 1, color: '#1e1b4b' },
        ],
      },
      patternBg: {
        type: 'grid',
        color: 'rgba(148, 163, 184, 0.07)',
        opacity: 0.45,
        size: 28,
        rotation: 8,
        blendMode: 'soft-light',
      },
      noiseBg: { intensity: 0.038 },
    },
    chart1: {
      type: 'pie',
      data: donutSlices,
      options: {
        type: 'donut',
        dimensions: { width: 520, height: 520, padding: { top: 36, right: 36, bottom: 36, left: 36 } },
        appearance: {
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          noiseBg: { intensity: 0.02 },
        },
        labels: {
          title: { text: 'Share · donut panel', fontSize: 20, color: '#f1f5f9' },
        },
        legends: {
          standard: {
            show: true,
            position: 'top-right',
            fontSize: 13,
            textColor: '#f8fafc',
            backgroundColor: 'rgba(2, 6, 23, 0.94)',
            borderColor: 'rgba(248, 250, 252, 0.28)',
            padding: 10,
          },
        },
      },
      title: { text: ' ', fontSize: 1, color: '#020617' },
    },
    chart2: {
      type: 'line',
      data: lineSeries,
      options: {
        dimensions: {
          width: 560,
          height: 520,
          padding: { top: 26, right: 22, bottom: 34, left: 42 },
        },
        appearance: {
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: 'rgba(148, 163, 184, 0.35)',
          axisColor: '#e2e8f0',
        },
        axes: {
          x: {
            label: 'Week',
            labelColor: '#f8fafc',
            range: { min: 1, max: 8, step: 1 },
            color: '#e2e8f0',
            tickFontSize: 13,
          },
          y: {
            label: 'Latency',
            labelColor: '#f8fafc',
            range: { min: 40, max: 130, step: 15 },
            color: '#e2e8f0',
            tickFontSize: 13,
          },
        },
        labels: {
          title: { text: 'Trend · line + area', fontSize: 20, color: '#f8fafc' },
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
        grid: { show: true, color: 'rgba(148, 163, 184, 0.12)', width: 1 },
      },
      title: { text: ' ', fontSize: 1, color: '#020617' },
    },
  });

  return composite;
}

return await main();
`;

const COMPARISON_JS = COMPARISON_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const COLLAGE_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const W = 960;
  const H = 540;

  const { buffer } = await painter.createCanvas({
    width: W,
    height: H,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: W,
      endY: H,
      colors: [
        { stop: 0, color: '#020617' },
        { stop: 0.45, color: '#1e1b4b' },
        { stop: 1, color: '#312e81' },
      ],
    },
    bgLayers: [
      {
        type: 'gradient',
        blendMode: 'screen',
        opacity: 0.25,
        value: {
          type: 'radial',
          colors: [
            { stop: 0, color: 'rgba(251, 191, 36, 0.35)' },
            { stop: 1, color: 'transparent' },
          ],
          startX: W * 0.78,
          startY: H * 0.22,
          startRadius: 0,
          endX: W * 0.72,
          endY: H * 0.28,
          endRadius: 280,
        },
      },
    ],
    patternBg: {
      type: 'hexagons',
      color: 'rgba(226, 232, 240, 0.06)',
      secondaryColor: 'rgba(99, 102, 241, 0.08)',
      size: 18,
      spacing: 10,
      rotation: 12,
      blendMode: 'overlay',
      opacity: 0.45,
    },
    noiseBg: { intensity: 0.035 },
  });

  const shapes = [
    {
      source: 'rectangle',
      x: 72,
      y: 96,
      width: 380,
      height: 200,
      shape: {
        fill: true,
        gradient: {
          type: 'linear',
          startX: 72,
          startY: 96,
          endX: 452,
          endY: 296,
          colors: [
            { stop: 0, color: 'rgba(56, 189, 248, 0.35)' },
            { stop: 1, color: 'rgba(167, 139, 250, 0.25)' },
          ],
        },
      },
      stroke: { width: 2, color: 'rgba(248, 250, 252, 0.35)', opacity: 1, borderRadius: 22 },
      shadow: {
        color: 'rgba(0, 0, 0, 0.55)',
        offsetY: 24,
        blur: 42,
        opacity: 0.9,
        borderRadius: 22,
      },
      opacity: 0.92,
    },
    {
      source: 'circle',
      x: W - 260,
      y: 72,
      width: 176,
      height: 176,
      shape: { fill: true, color: '#f472b6', radius: 88 },
      stroke: { width: 3, color: '#fef08a', opacity: 1, borderRadius: 'circular' },
      shadow: {
        color: 'rgba(244, 114, 182, 0.45)',
        offsetY: 18,
        blur: 36,
        opacity: 1,
        borderRadius: 'circular',
      },
    },
    {
      source: 'triangle',
      x: W * 0.42,
      y: H * 0.42,
      width: 140,
      height: 140,
      rotation: 12,
      shape: { fill: true, color: '#34d399' },
      stroke: { width: 2, color: '#064e3b', opacity: 0.9 },
      shadow: { color: 'rgba(0,0,0,0.45)', offsetY: 14, blur: 22, opacity: 1 },
    },
    {
      source: 'star',
      x: 120,
      y: H - 240,
      width: 200,
      height: 200,
      rotation: -8,
      shape: {
        fill: true,
        color: '#fde047',
        innerRadius: 36,
        outerRadius: 92,
      },
      stroke: { width: 3, color: '#422006', opacity: 1 },
      shadow: { color: 'rgba(0,0,0,0.5)', offsetY: 20, blur: 30, opacity: 1 },
    },
  ];

  let buf = await painter.createImage(shapes, buffer);

  buf = await painter.createText(
    [
      {
        text: 'Hidden composition stack',
        x: W / 2,
        y: 52,
        font: { family: 'Arial', size: 34 },
        bold: true,
        gradient: {
          type: 'linear',
          startX: 240,
          startY: 40,
          endX: W - 240,
          endY: 72,
          colors: [
            { stop: 0, color: '#bae6fd' },
            { stop: 0.5, color: '#fde047' },
            { stop: 1, color: '#fbcfe8' },
          ],
        },
        textAlign: 'center',
        textBaseline: 'middle',
        stroke: { color: '#0f172a', width: 3, opacity: 0.85 },
        shadow: {
          color: 'rgba(0,0,0,0.55)',
          offsetY: 10,
          blur: 22,
          opacity: 1,
        },
      },
      {
        text: 'createCanvas → createImage (rectangle · circle · triangle · star) → createText',
        x: W / 2,
        y: H - 36,
        font: { family: 'Arial', size: 16 },
        color: 'rgba(226, 232, 240, 0.88)',
        textAlign: 'center',
        textBaseline: 'middle',
      },
    ],
    buf
  );

  return buf;
}

return await main();
`;

const COLLAGE_JS = COLLAGE_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const REMOTE_IMAGE_POSTER_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const W = 960;
  const H = 540;

  const { buffer } = await painter.createCanvas({
    width: W,
    height: H,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: W,
      endY: H,
      colors: [
        { stop: 0, color: '#07111f' },
        { stop: 0.48, color: '#13233d' },
        { stop: 1, color: '#1e3a5f' },
      ],
    },
    bgLayers: [
      {
        type: 'gradient',
        blendMode: 'screen',
        opacity: 0.42,
        value: {
          type: 'radial',
          startX: 760,
          startY: 100,
          startRadius: 0,
          endX: 760,
          endY: 100,
          endRadius: 330,
          colors: [
            { stop: 0, color: 'rgba(125, 211, 252, 0.32)' },
            { stop: 1, color: 'transparent' },
          ],
        },
      },
      {
        type: 'gradient',
        blendMode: 'screen',
        opacity: 0.24,
        value: {
          type: 'radial',
          startX: 120,
          startY: 470,
          startRadius: 0,
          endX: 120,
          endY: 470,
          endRadius: 280,
          colors: [
            { stop: 0, color: 'rgba(244, 114, 182, 0.28)' },
            { stop: 1, color: 'transparent' },
          ],
        },
      },
    ],
    patternBg: {
      type: 'dots',
      color: 'rgba(226, 232, 240, 0.12)',
      size: 3,
      spacing: 24,
      opacity: 0.34,
    },
    noiseBg: { intensity: 0.025 },
  });

  const remoteImages = [
    {
      source: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85',
      x: 54,
      y: 112,
      width: 520,
      height: 354,
      fit: 'cover',
      align: 'center',
      borderRadius: 28,
      rotation: -2.2,
      opacity: 0.98,
      stroke: { width: 2, color: 'rgba(255,255,255,0.42)', opacity: 1 },
      shadow: { color: 'rgba(0,0,0,0.55)', offsetY: 24, blur: 42, opacity: 1 },
    },
    {
      source: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85',
      x: 610,
      y: 118,
      width: 286,
      height: 184,
      fit: 'cover',
      align: 'center',
      borderRadius: 22,
      rotation: 3.2,
      stroke: { width: 2, color: 'rgba(255,255,255,0.35)', opacity: 1 },
      shadow: { color: 'rgba(0,0,0,0.45)', offsetY: 18, blur: 34, opacity: 1 },
    },
    {
      source: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85',
      x: 628,
      y: 326,
      width: 268,
      height: 150,
      fit: 'cover',
      align: 'center',
      borderRadius: 22,
      rotation: -2.4,
      stroke: { width: 2, color: 'rgba(255,255,255,0.32)', opacity: 1 },
      shadow: { color: 'rgba(0,0,0,0.42)', offsetY: 16, blur: 30, opacity: 1 },
    },
  ];

  let buf = await painter.createImage(remoteImages, buffer);

  buf = await painter.createText(
    [
      {
        text: 'REMOTE IMAGE ATLAS',
        x: 54,
        y: 46,
        font: { family: 'Arial', size: 16, weight: 700 },
        color: 'rgba(186, 230, 253, 0.9)',
        textBaseline: 'middle',
      },
      {
        text: 'Three URLs. One canvas.',
        x: 54,
        y: 78,
        font: { family: 'Arial', size: 30 },
        bold: true,
        color: '#f8fafc',
        textBaseline: 'middle',
        shadow: { color: 'rgba(0,0,0,0.5)', offsetY: 6, blur: 14, opacity: 1 },
      },
      {
        text: 'createCanvas → createImage(HTTP sources) → createText',
        x: W - 54,
        y: H - 28,
        font: { family: 'Arial', size: 14 },
        color: 'rgba(226, 232, 240, 0.78)',
        textAlign: 'right',
        textBaseline: 'middle',
      },
    ],
    buf
  );

  return buf;
}

return await main();
`;

const REMOTE_IMAGE_POSTER_JS = REMOTE_IMAGE_POSTER_TS.replace(
  /^import \\{ ApexPainter \\} from 'apexify\\.js';\\n\\n/,
  ''
);

const coreAdvanceGalleryItems: AdvanceGalleryCard[] = [
  {
    id: 'advance-chart-donut-glow',
    title: 'Donut chart · patterned chart canvas',
    category: 'advance',
    description:
      '**Donut chart on the dedicated pie pipeline.** Built with `createChart(\'pie\', …, { type: \'donut\' })` using a radial **`appearance.backgroundGradient`**, layered **`bgLayers`**, dot **`patternBg`**, and **`noiseBg`**—the same stacking model as canvas backgrounds in the docs.\n\n**Takeaway:** One place to learn how themed chart panels stay coherent with hero backgrounds, without image assets.',
    thumbnail: '/gallery-outputs/images/chart-donut-luminous.png',
    featured: true,
    code: { ts: DONUT_TS, js: DONUT_JS },
  },
  {
    id: 'advance-comparison-donut-line',
    title: 'Comparison canvas · donut vs line',
    category: 'advance',
    description:
      '**Side-by-side comparison layout.** `createComparisonChart` renders a donut (`pie`) panel next to a line chart under one shared **`appearance`**—gradient base, grid **`patternBg`**, and **`noiseBg`** so both plots feel like one surface.\n\n**Takeaway:** Shows **`layout: \'sideBySide\'`** with mixed chart kinds and matching chrome; ideal for before/after or metric-vs-trend storytelling.',
    thumbnail: '/gallery-outputs/images/comparison-donut-line.png',
    featured: true,
    code: { ts: COMPARISON_TS, js: COMPARISON_JS },
  },
  {
    id: 'advance-shape-collage',
    title: 'Vector collage · stars & gradients',
    category: 'advance',
    description:
      '**Vector collage from pure drawing APIs.** Starts with **`createCanvas`** and **`patternBg.hexagons`**, then **`createImage`** stacks **`rectangle`** (gradient fill), **`circle`**, **`triangle`**, and **`star`** geometry with explicit inner/outer radius.\n\n**Takeaway:** Finishes with **`createText`** using gradient fills and stroke for poster-style lettering—useful when you need crisp PNG output without design tools.',
    thumbnail: '/gallery-outputs/images/shape-collage-prism.png',
    code: { ts: COLLAGE_TS, js: COLLAGE_JS },
  },
  {
    id: 'advance-remote-image-atlas',
    title: 'Remote image atlas · URL-only sources',
    category: 'advance',
    description:
      '**A complete remote-image composition.** Every `createImage` layer uses a public HTTPS image URL—no local bitmap source—over a layered `createCanvas` gradient, dot pattern, and noise texture.\n\n**Takeaway:** Demonstrates `fit: \'cover\'`, alignment, rotation, rounded corners, strokes, shadows, and text finishing in one composition. Public Studio previews fetch these assets directly in the browser, so normal CORS rules still apply.',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    code: { ts: REMOTE_IMAGE_POSTER_TS, js: REMOTE_IMAGE_POSTER_JS },
  },
];

export const advanceGalleryItems: AdvanceGalleryCard[] = [
  ...coreAdvanceGalleryItems,
  ...extraAdvanceGalleryItems,
  ...chartsShowcaseGalleryItems,
];
