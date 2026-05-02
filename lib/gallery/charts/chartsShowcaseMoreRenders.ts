/**
 * Extra chart PNG renders for `gallery:build` — kept separate to avoid circular imports with `chartsShowcasePicks.ts`.
 */
import type { ApexPainter } from 'apexify.js';
import {
  chartsAxisLight,
  chartsLegendPanel,
  chartsLegendPosition,
  chartsShowcaseAppearance,
} from './chartsShowcasePicks';

type Painter = InstanceType<typeof ApexPainter>;

export async function renderShowcaseComboGroupedLines(painter: Painter) {
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
      ...chartsShowcaseAppearance,
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
      position: chartsLegendPosition,
      fontSize: 12,
      textColor: chartsLegendPanel.textColor,
      backgroundColor: chartsLegendPanel.backgroundColor,
      borderColor: chartsLegendPanel.borderColor,
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

export async function renderShowcaseLineAllStyles(painter: Painter) {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const band = (base: number, spread: number[]) => x.map((xi, i) => ({ x: xi, y: base + spread[i] }));

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
      ...chartsShowcaseAppearance,
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
      position: chartsLegendPosition,
      fontSize: 11,
      textColor: chartsLegendPanel.textColor,
      backgroundColor: chartsLegendPanel.backgroundColor,
      borderColor: chartsLegendPanel.borderColor,
      padding: 10,
      wrapText: true,
      maxWidth: 300,
      spacing: 7,
    },
    grid: { show: true, color: 'rgba(148, 163, 184, 0.11)', width: 1 },
  });
}
