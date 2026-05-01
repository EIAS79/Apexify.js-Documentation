/**
 * Writes PNG previews under `public/gallery-outputs/` for advance chart demos, comparison/collage, crossweave, pipeline BGs, and chart-showcase picks.
 * Run via root `npm run gallery:build` (`tsx index.ts`). Keep chart configs aligned with `extraAdvanceSnippets.ts`,
 * `chartsShowcaseGalleryItems.ts`, `chartsShowcasePicks.ts`, and `canvasBackgroundShowcasePicks.ts`.
 */
import fs from 'fs';
import path from 'path';
import { ApexPainter } from 'apexify.js';
import { renderAllCanvasBackgroundPipelinePicks } from './canvasBackgroundShowcasePicks';
import { renderAllShowcasePicks } from './chartsShowcasePicks';

const ROOT = path.join(process.cwd(), 'public', 'gallery-outputs');

function write(relPath: string, buf: Buffer) {
  const dest = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

export async function writeGalleryStaticOutputs(): Promise<void> {
  const painter = new ApexPainter();

  const donutSlices = [
    { label: 'Edge', value: 34, color: '#38bdf8', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Origin', value: 28, color: '#a78bfa', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Warm path', value: 22, color: '#fb7185', stroke: { color: '#0f172a', width: 2 } },
    { label: 'Cold tail', value: 16, color: '#34d399', stroke: { color: '#0f172a', width: 2 } },
  ];

  const donut = await painter.createChart('pie', donutSlices, {
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
        position: 'bottom',
        fontSize: 15,
        textColor: '#cbd5e1',
      },
    },
  });
  write(path.join('images', 'chart-donut-luminous.png'), donut);

  const barData = [
    { label: 'Q1', value: 42, xStart: 0, xEnd: 1, color: '#38bdf8' },
    { label: 'Q2', value: 58, xStart: 1, xEnd: 2, color: '#818cf8' },
    { label: 'Q3', value: 49, xStart: 2, xEnd: 3, color: '#c084fc' },
    { label: 'Q4', value: 71, xStart: 3, xEnd: 4, color: '#f472b6' },
  ];

  const barChart = await painter.createChart('bar', barData, {
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
        labelColor: '#cbd5e1',
        range: { min: 0, max: 4, step: 1 },
        color: '#94a3b8',
        tickFontSize: 12,
      },
      y: {
        label: 'Revenue index',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 80, step: 20 },
        color: '#94a3b8',
        tickFontSize: 12,
      },
    },
    labels: {
      title: { text: 'Quarterly bar · appearance stack', fontSize: 22, color: '#f8fafc' },
    },
    legend: { show: false },
    grid: { show: true, color: 'rgba(148,163,184,0.1)', width: 1 },
  });
  write(path.join('images', 'chart-bar-quarterly.png'), barChart);

  const hBarData = [
    { label: 'Edge', value: 165, color: '#22d3ee', labelColor: '#e2e8f0', valueColor: '#f8fafc' },
    { label: 'Region', value: 132, color: '#a78bfa', labelColor: '#e2e8f0', valueColor: '#f8fafc' },
    { label: 'Batch', value: 98, color: '#fb7185', labelColor: '#e2e8f0', valueColor: '#f8fafc' },
    { label: 'Stream', value: 184, color: '#34d399', labelColor: '#e2e8f0', valueColor: '#f8fafc' },
  ];

  const hBar = await painter.createChart('horizontalBar', hBarData, {
    type: 'standard',
    dimensions: { width: 760, height: 440, padding: { top: 44, right: 52, bottom: 48, left: 96 } },
    appearance: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(99, 102, 241, 0.35)',
      axisColor: '#94a3b8',
    },
    axes: {
      x: {
        label: 'Requests / s',
        labelColor: '#e2e8f0',
        range: { min: 0, max: 200, step: 50 },
        color: '#94a3b8',
        tickColor: '#e2e8f0',
        tickFontSize: 12,
      },
      y: {
        label: 'Route',
        labelColor: '#e2e8f0',
        color: '#94a3b8',
        tickColor: '#e2e8f0',
        tickFontSize: 12,
      },
    },
    labels: {
      title: { text: 'Horizontal bars · axis styling', fontSize: 21, color: '#f1f5f9' },
      barLabelDefaults: {
        show: true,
        fontSize: 13,
        defaultColor: '#e2e8f0',
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
  write(path.join('images', 'chart-hbar-routes.png'), hBar);

  const dualLine = [
    {
      label: 'Shipped',
      color: '#38bdf8',
      lineWidth: 3,
      smoothness: 'bezier' as const,
      marker: { show: true, type: 'circle' as const, size: 8, filled: true },
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
      lineStyle: 'dashed' as const,
      smoothness: 'bezier' as const,
      marker: { show: true, type: 'square' as const, size: 7, filled: false },
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

  const lineChart = await painter.createChart('line', dualLine, {
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
      axisColor: '#94a3b8',
    },
    axes: {
      x: {
        label: 'Sprint',
        labelColor: '#cbd5e1',
        range: { min: 1, max: 6, step: 1 },
        color: '#94a3b8',
        tickFontSize: 13,
      },
      y: {
        label: 'Features',
        labelColor: '#cbd5e1',
        range: { min: 0, max: 48, step: 12 },
        color: '#94a3b8',
        tickFontSize: 13,
      },
    },
    labels: {
      title: { text: 'Dual series · markers · dashed plan', fontSize: 21, color: '#f8fafc' },
    },
    legend: { show: true, position: 'bottom', fontSize: 13, textColor: '#e2e8f0' },
    grid: { show: true, color: 'rgba(148,163,184,0.12)', width: 1 },
  });
  write(path.join('images', 'chart-line-dual-target.png'), lineChart);

  const donutSlicesComparison = [
    { label: 'API', value: 38, color: '#22d3ee' },
    { label: 'Workers', value: 27, color: '#c084fc' },
    { label: 'Cache', value: 22, color: '#f472b6' },
    { label: 'Other', value: 13, color: '#94a3b8' },
  ];

  const lineSeriesComparison = [
    {
      label: 'p99 ms',
      color: '#38bdf8',
      lineWidth: 3,
      smoothness: 'bezier' as const,
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
        type: 'below' as const,
        color: 'rgba(56, 189, 248, 0.18)',
        opacity: 1,
      },
    },
  ];

  const comparisonDonutLine = await painter.createComparisonChart({
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
      data: donutSlicesComparison,
      options: {
        type: 'donut',
        dimensions: { width: 520, height: 520, padding: { top: 36, right: 36, bottom: 36, left: 36 } },
        appearance: {
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          noiseBg: { intensity: 0.02 },
        },
        labels: {
          title: { text: 'Share · donut panel', fontSize: 20, color: '#e2e8f0' },
        },
        legends: {
          standard: { show: true, position: 'bottom', fontSize: 13, textColor: '#cbd5e1' },
        },
      },
      title: { text: ' ', fontSize: 1, color: '#020617' },
    },
    chart2: {
      type: 'line',
      data: lineSeriesComparison,
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
          axisColor: '#94a3b8',
        },
        axes: {
          x: {
            label: 'Week',
            labelColor: '#cbd5e1',
            range: { min: 1, max: 8, step: 1 },
            color: '#94a3b8',
            tickFontSize: 13,
          },
          y: {
            label: 'Latency',
            labelColor: '#cbd5e1',
            range: { min: 40, max: 130, step: 15 },
            color: '#94a3b8',
            tickFontSize: 13,
          },
        },
        labels: {
          title: { text: 'Trend · line + area', fontSize: 20, color: '#f1f5f9' },
        },
        legend: { show: true, position: 'bottom', fontSize: 13, textColor: '#e2e8f0' },
        grid: { show: true, color: 'rgba(148, 163, 184, 0.12)', width: 1 },
      },
      title: { text: ' ', fontSize: 1, color: '#020617' },
    },
  });
  write(path.join('images', 'comparison-donut-line.png'), comparisonDonutLine);

  const collageW = 960;
  const collageH = 540;
  const { buffer: collageBase } = await painter.createCanvas({
    width: collageW,
    height: collageH,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: collageW,
      endY: collageH,
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
          startX: collageW * 0.78,
          startY: collageH * 0.22,
          startRadius: 0,
          endX: collageW * 0.72,
          endY: collageH * 0.28,
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

  const collageShapes = [
    {
      source: 'rectangle' as const,
      x: 72,
      y: 96,
      width: 380,
      height: 200,
      shape: {
        fill: true,
        gradient: {
          type: 'linear' as const,
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
      source: 'circle' as const,
      x: collageW - 260,
      y: 72,
      width: 176,
      height: 176,
      shape: { fill: true, color: '#f472b6', radius: 88 },
      stroke: { width: 3, color: '#fef08a', opacity: 1, borderRadius: 'circular' as const },
      shadow: {
        color: 'rgba(244, 114, 182, 0.45)',
        offsetY: 18,
        blur: 36,
        opacity: 1,
        borderRadius: 'circular' as const,
      },
    },
    {
      source: 'triangle' as const,
      x: collageW * 0.42,
      y: collageH * 0.42,
      width: 140,
      height: 140,
      rotation: 12,
      shape: { fill: true, color: '#34d399' },
      stroke: { width: 2, color: '#064e3b', opacity: 0.9 },
      shadow: { color: 'rgba(0,0,0,0.45)', offsetY: 14, blur: 22, opacity: 1 },
    },
    {
      source: 'star' as const,
      x: 120,
      y: collageH - 240,
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

  let collageBuf = await painter.createImage(collageShapes, collageBase);
  collageBuf = await painter.createText(
    [
      {
        text: 'Hidden composition stack',
        x: collageW / 2,
        y: 52,
        font: { family: 'Arial', size: 34 },
        bold: true,
        gradient: {
          type: 'linear',
          startX: 240,
          startY: 40,
          endX: collageW - 240,
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
        x: collageW / 2,
        y: collageH - 36,
        font: { family: 'Arial', size: 16 },
        color: 'rgba(226, 232, 240, 0.88)',
        textAlign: 'center',
        textBaseline: 'middle',
      },
    ],
    collageBuf
  );
  write(path.join('images', 'shape-collage-prism.png'), collageBuf);

  const { buffer: textBase } = await painter.createCanvas({
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

  const textPlaque = await painter.createText(
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
    textBase
  );
  write(path.join('images', 'advance-text-glow-plaque.png'), textPlaque);

  const crossweave = await painter.createCanvas({
    width: 960,
    height: 540,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 960,
      endY: 540,
      rotate: 48,
      colors: [
        { stop: 0, color: '#020617' },
        { stop: 0.55, color: '#0f172a' },
        { stop: 1, color: '#1e1b4b' },
      ],
    },
    patternBg: {
      type: 'crosses',
      color: 'rgba(148, 163, 184, 0.14)',
      secondaryColor: 'rgba(15, 23, 42, 0.45)',
      size: 8,
      spacing: 26,
      rotation: 8,
      blendMode: 'soft-light',
      opacity: 0.55,
    },
    noiseBg: { intensity: 0.038 },
    borderRadius: 18,
    stroke: {
      width: 1,
      color: 'rgba(99, 102, 241, 0.35)',
      borderRadius: 18,
    },
    shadow: {
      color: 'rgba(0, 0, 0, 0.45)',
      offsetY: 22,
      blur: 48,
      opacity: 0.82,
      borderRadius: 18,
    },
  });
  write(path.join('backgrounds', 'bg-crossweave-noir.png'), crossweave.buffer);

  const canvasBgPipeline = await renderAllCanvasBackgroundPipelinePicks(painter);
  for (const [filename, buf] of canvasBgPipeline) {
    write(path.join('backgrounds', filename), buf);
  }

  const showcasePicks = await renderAllShowcasePicks(painter);
  for (const [filename, buf] of showcasePicks) {
    write(path.join('images', filename), buf);
  }
}
