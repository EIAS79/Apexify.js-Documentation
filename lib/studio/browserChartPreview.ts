'use client';

import { paintBrowserCanvasBackground } from './browserCanvasPaint';

export type BrowserChartValue =
  | null
  | boolean
  | number
  | string
  | BrowserChartValue[]
  | { [key: string]: BrowserChartValue };

type R = { [key: string]: BrowserChartValue };

function rec(value: BrowserChartValue | undefined): value is R {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function num(value: BrowserChartValue | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function str(value: BrowserChartValue | undefined, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}
function bool(value: BrowserChartValue | undefined, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function gradient(
  ctx: CanvasRenderingContext2D,
  config: R,
  width: number,
  height: number,
): CanvasGradient {
  const type = str(config.type, 'linear');
  let g: CanvasGradient;
  if (type === 'radial') {
    g = ctx.createRadialGradient(
      num(config.startX, width / 2),
      num(config.startY, height / 2),
      Math.max(0, num(config.startRadius, 0)),
      num(config.endX, width / 2),
      num(config.endY, height / 2),
      Math.max(1, num(config.endRadius, Math.max(width, height) / 2)),
    );
  } else {
    const rotate = num(config.rotate, Number.NaN);
    if (Number.isFinite(rotate)) {
      const rad = rotate * Math.PI / 180;
      const cx = width / 2;
      const cy = height / 2;
      const reach = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
      const dx = Math.cos(rad) * reach * .5;
      const dy = Math.sin(rad) * reach * .5;
      g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    } else {
      g = ctx.createLinearGradient(
        num(config.startX, 0),
        num(config.startY, 0),
        num(config.endX, width),
        num(config.endY, height),
      );
    }
  }

  const stops = Array.isArray(config.colors) ? config.colors : [];
  if (!stops.length) {
    g.addColorStop(0, '#111827');
    g.addColorStop(1, '#334155');
  } else {
    for (const stop of stops) {
      if (!rec(stop)) continue;
      g.addColorStop(clamp(num(stop.stop, 0), 0, 1), str(stop.color, '#fff'));
    }
  }
  return g;
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  appearance: R,
  width: number,
  height: number,
) {
  ctx.fillStyle = str(appearance.backgroundColor, '#0f172a');
  ctx.fillRect(0, 0, width, height);

  if (rec(appearance.backgroundGradient)) {
    ctx.fillStyle = gradient(ctx, appearance.backgroundGradient, width, height);
    ctx.fillRect(0, 0, width, height);
  }

  const layers = Array.isArray(appearance.bgLayers) ? appearance.bgLayers : [];
  for (const layer of layers) {
    if (!rec(layer) || str(layer.type, '') !== 'gradient' || !rec(layer.value)) continue;
    ctx.save();
    ctx.globalAlpha = clamp(num(layer.opacity, 1), 0, 1);
    try {
      ctx.globalCompositeOperation = str(layer.blendMode, 'source-over') as GlobalCompositeOperation;
    } catch {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = gradient(ctx, layer.value, width, height);
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const borderWidth = Math.max(0, num(appearance.borderWidth, 0));
  if (borderWidth > 0) {
    ctx.save();
    ctx.strokeStyle = str(appearance.borderColor, 'rgba(148,163,184,.4)');
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
    ctx.restore();
  }
}

function makeLayout(options: R, width: number, height: number) {
  const dimensions = rec(options.dimensions) ? options.dimensions : {};
  const padding = rec(dimensions.padding) ? dimensions.padding : {};
  const labels = rec(options.labels) ? options.labels : {};
  const title = rec(labels.title) ? labels.title : {};
  const titleText = str(title.text, '');
  const titleSize = Math.max(11, num(title.fontSize, 20));
  const left = Math.max(34, num(padding.left, 52));
  const right = Math.max(18, num(padding.right, 24));
  const top = Math.max(18, num(padding.top, titleText ? titleSize + 30 : 28));
  const bottom = Math.max(30, num(padding.bottom, 46));
  return {
    left,
    right,
    top,
    bottom,
    plotX: left,
    plotY: top,
    plotW: Math.max(20, width - left - right),
    plotH: Math.max(20, height - top - bottom),
    title,
    titleText,
    titleSize,
  };
}

function drawTitle(ctx: CanvasRenderingContext2D, layout: ReturnType<typeof makeLayout>) {
  if (!layout.titleText) return;
  ctx.save();
  ctx.fillStyle = str(layout.title.color, '#f8fafc');
  ctx.font = '700 ' + layout.titleSize + 'px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(layout.titleText, layout.left, 12);
  ctx.restore();
}

function axisRange(axis: R, values: number[], fallbackMin: number, fallbackMax: number) {
  const range = rec(axis.range) ? axis.range : {};
  let min = num(range.min, values.length ? Math.min(...values) : fallbackMin);
  let max = num(range.max, values.length ? Math.max(...values) : fallbackMax);
  if (!Number.isFinite(min)) min = fallbackMin;
  if (!Number.isFinite(max)) max = fallbackMax;
  if (min === max) {
    min -= 1;
    max += 1;
  }
  return { min, max, step: num(range.step, (max - min) / 5) };
}

function drawCartesianFrame(
  ctx: CanvasRenderingContext2D,
  options: R,
  layout: ReturnType<typeof makeLayout>,
  xValues: number[],
  yValues: number[],
) {
  const axes = rec(options.axes) ? options.axes : {};
  const xAxis = rec(axes.x) ? axes.x : {};
  const yAxis = rec(axes.y) ? axes.y : {};
  const xr = axisRange(xAxis, xValues, 0, Math.max(1, xValues.length - 1));
  const yr = axisRange(yAxis, yValues, 0, Math.max(1, ...yValues));
  const grid = rec(options.grid) ? options.grid : {};
  const gridShow = bool(grid.show, true);
  const gridColor = str(grid.color, 'rgba(148,163,184,.16)');
  const axisColor = str(yAxis.color, str(xAxis.color, '#cbd5e1'));

  const mapX = (value: number) =>
    layout.plotX + ((value - xr.min) / (xr.max - xr.min)) * layout.plotW;
  const mapY = (value: number) =>
    layout.plotY + layout.plotH - ((value - yr.min) / (yr.max - yr.min)) * layout.plotH;

  ctx.save();
  ctx.font = Math.max(10, num(yAxis.tickFontSize, 11)) + 'px Arial';
  ctx.textBaseline = 'middle';

  const yStep = yr.step > 0 ? yr.step : (yr.max - yr.min) / 5;
  let guard = 0;
  for (let value = yr.min; value <= yr.max + yStep * .25 && guard < 32; value += yStep, guard += 1) {
    const y = mapY(value);
    if (gridShow) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = Math.max(.5, num(grid.width, 1));
      ctx.beginPath();
      ctx.moveTo(layout.plotX, y);
      ctx.lineTo(layout.plotX + layout.plotW, y);
      ctx.stroke();
    }
    ctx.fillStyle = str(yAxis.labelColor, axisColor);
    ctx.textAlign = 'right';
    ctx.fillText(Number(value.toFixed(4)).toString(), layout.plotX - 8, y);
  }

  const xStep = xr.step > 0 ? xr.step : (xr.max - xr.min) / 5;
  guard = 0;
  for (let value = xr.min; value <= xr.max + xStep * .25 && guard < 32; value += xStep, guard += 1) {
    const x = mapX(value);
    if (gridShow) {
      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(x, layout.plotY);
      ctx.lineTo(x, layout.plotY + layout.plotH);
      ctx.stroke();
    }
    ctx.fillStyle = str(xAxis.labelColor, axisColor);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(Number(value.toFixed(4)).toString(), x, layout.plotY + layout.plotH + 7);
  }

  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(layout.plotX, layout.plotY);
  ctx.lineTo(layout.plotX, layout.plotY + layout.plotH);
  ctx.lineTo(layout.plotX + layout.plotW, layout.plotY + layout.plotH);
  ctx.stroke();

  if (typeof xAxis.label === 'string') {
    ctx.fillStyle = str(xAxis.labelColor, axisColor);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '600 ' + Math.max(10, num(xAxis.tickFontSize, 12)) + 'px Arial';
    ctx.fillText(xAxis.label, layout.plotX + layout.plotW / 2, layout.plotY + layout.plotH + layout.bottom - 4);
  }

  if (typeof yAxis.label === 'string') {
    ctx.save();
    ctx.translate(13, layout.plotY + layout.plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = str(yAxis.labelColor, axisColor);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '600 ' + Math.max(10, num(yAxis.tickFontSize, 12)) + 'px Arial';
    ctx.fillText(yAxis.label, 0, 0);
    ctx.restore();
  }

  ctx.restore();
  return { mapX, mapY };
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  entries: Array<{ label: string; color: string }>,
  options: R,
  width: number,
) {
  if (!entries.length) return;
  const legend = rec(options.legend)
    ? options.legend
    : rec(options.legends) && rec(options.legends.standard)
      ? options.legends.standard
      : {};
  if (legend.show === false) return;

  const fontSize = Math.max(10, num(legend.fontSize, 11));
  let x = width - 18;
  const y = 18;
  ctx.save();
  ctx.font = fontSize + 'px Arial';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';

  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i];
    const labelW = ctx.measureText(entry.label).width;
    ctx.fillStyle = str(legend.textColor, '#e2e8f0');
    ctx.fillText(entry.label, x, y);
    x -= labelW + 7;
    ctx.fillStyle = entry.color;
    ctx.fillRect(x - 10, y - 4, 9, 8);
    x -= 16;
  }
  ctx.restore();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  data: BrowserChartValue[],
  options: R,
  width: number,
  layout: ReturnType<typeof makeLayout>,
) {
  const series = data.filter(rec);
  const points = series.flatMap((s) => Array.isArray(s.data) ? s.data.filter(rec) : []);
  const frame = drawCartesianFrame(
    ctx,
    options,
    layout,
    points.map((p) => num(p.x, 0)),
    points.map((p) => num(p.y, 0)),
  );

  for (const seriesItem of series) {
    const values = Array.isArray(seriesItem.data) ? seriesItem.data.filter(rec) : [];
    if (!values.length) continue;
    const color = str(seriesItem.color, '#6f86ff');
    const lineWidth = Math.max(1, num(seriesItem.lineWidth, 2.5));

    if (rec(seriesItem.area) && bool(seriesItem.area.show, true) && str(seriesItem.area.type, 'none') !== 'none') {
      ctx.save();
      ctx.beginPath();
      values.forEach((point, index) => {
        const x = frame.mapX(num(point.x, index));
        const y = frame.mapY(num(point.y, 0));
        if (index === 0) ctx.moveTo(x, layout.plotY + layout.plotH);
        ctx.lineTo(x, y);
      });
      const last = values[values.length - 1];
      ctx.lineTo(frame.mapX(num(last.x, values.length - 1)), layout.plotY + layout.plotH);
      ctx.closePath();
      ctx.globalAlpha = clamp(num(seriesItem.area.opacity, .22), 0, 1);
      ctx.fillStyle = str(seriesItem.area.color, color);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    values.forEach((point, index) => {
      const x = frame.mapX(num(point.x, index));
      const y = frame.mapY(num(point.y, 0));
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const marker = rec(seriesItem.marker) ? seriesItem.marker : {};
    if (marker.show !== false) {
      ctx.fillStyle = str(marker.color, color);
      const radius = Math.max(2, num(marker.size, 6) / 2);
      for (const point of values) {
        ctx.beginPath();
        ctx.arc(frame.mapX(num(point.x, 0)), frame.mapY(num(point.y, 0)), radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawLegend(
    ctx,
    series.map((s) => ({ label: str(s.label, 'Series'), color: str(s.color, '#6f86ff') })),
    options,
    width,
  );
}

function drawScatter(
  ctx: CanvasRenderingContext2D,
  data: BrowserChartValue[],
  options: R,
  width: number,
  layout: ReturnType<typeof makeLayout>,
) {
  const initial = data.filter(rec);
  const normalized: R[] = initial.some((s) => Array.isArray(s.data))
    ? initial
    : [{ label: 'Series', color: '#6f86ff', data: initial }];
  const points = normalized.flatMap((s) => Array.isArray(s.data) ? s.data.filter(rec) : []);
  const frame = drawCartesianFrame(
    ctx,
    options,
    layout,
    points.map((p) => num(p.x, 0)),
    points.map((p) => num(p.y, 0)),
  );

  for (const series of normalized) {
    const color = str(series.color, '#6f86ff');
    const values = Array.isArray(series.data) ? series.data.filter(rec) : [];
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = clamp(num(series.opacity, .92), 0, 1);
    for (const point of values) {
      const radius = Math.max(2, num(point.size, 7) / 2);
      ctx.beginPath();
      ctx.arc(frame.mapX(num(point.x, 0)), frame.mapY(num(point.y, 0)), radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawLegend(
    ctx,
    normalized.map((s) => ({ label: str(s.label, 'Series'), color: str(s.color, '#6f86ff') })),
    options,
    width,
  );
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  rows: BrowserChartValue[],
  options: R,
  width: number,
  layout: ReturnType<typeof makeLayout>,
  horizontal: boolean,
) {
  const data = rows.filter(rec);
  if (!data.length) return;
  const values = data.map((row) => num(row.value, 0));
  const maxValue = Math.max(1, ...values.map((value) => Math.abs(value)));
  const gap = 10;

  ctx.save();
  ctx.font = '11px Arial';

  if (!horizontal) {
    const band = layout.plotW / data.length;
    const barWidth = Math.max(4, band - gap);
    const baseline = layout.plotY + layout.plotH;
    const grid = rec(options.grid) ? options.grid : {};
    if (bool(grid.show, true)) {
      ctx.strokeStyle = str(grid.color, 'rgba(148,163,184,.16)');
      for (let i = 0; i <= 4; i += 1) {
        const y = layout.plotY + layout.plotH * i / 4;
        ctx.beginPath();
        ctx.moveTo(layout.plotX, y);
        ctx.lineTo(layout.plotX + layout.plotW, y);
        ctx.stroke();
      }
    }

    data.forEach((row, index) => {
      const h = Math.abs(num(row.value, 0)) / maxValue * layout.plotH;
      const x = layout.plotX + index * band + (band - barWidth) / 2;
      const y = baseline - h;
      ctx.fillStyle = str(row.color, '#6f86ff');
      ctx.fillRect(x, y, barWidth, h);
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(str(row.label, String(index + 1)), x + barWidth / 2, baseline + 7);
    });
  } else {
    const band = layout.plotH / data.length;
    const barHeight = Math.max(4, band - gap);
    data.forEach((row, index) => {
      const w = Math.abs(num(row.value, 0)) / maxValue * layout.plotW;
      const y = layout.plotY + index * band + (band - barHeight) / 2;
      ctx.fillStyle = str(row.color, '#6f86ff');
      ctx.fillRect(layout.plotX, y, w, barHeight);
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(str(row.label, String(index + 1)), layout.plotX - 8, y + barHeight / 2);
    });
  }

  ctx.restore();
  drawLegend(
    ctx,
    data.map((row) => ({ label: str(row.label, 'Value'), color: str(row.color, '#6f86ff') })),
    options,
    width,
  );
}

function drawPie(
  ctx: CanvasRenderingContext2D,
  rows: BrowserChartValue[],
  options: R,
  width: number,
  height: number,
  layout: ReturnType<typeof makeLayout>,
) {
  const data = rows.filter(rec);
  const total = data.reduce((sum, row) => sum + Math.max(0, num(row.value, 0)), 0);
  if (total <= 0) return;

  const cx = layout.plotX + layout.plotW * .5;
  const cy = layout.plotY + layout.plotH * .5;
  const radius = Math.max(20, Math.min(layout.plotW, layout.plotH) * .36);
  const donut = str(options.type, 'pie') === 'donut';
  const inner = donut ? Math.max(12, num(options.donutInnerRadius, radius * .55)) : 0;
  let angle = -Math.PI / 2;

  for (const row of data) {
    const value = Math.max(0, num(row.value, 0));
    const next = angle + value / total * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, next);
    ctx.closePath();
    ctx.fillStyle = rec(row.gradient) ? gradient(ctx, row.gradient, width, height) : str(row.color, '#6f86ff');
    ctx.globalAlpha = clamp(num(row.opacity, 1), 0, 1);
    ctx.fill();
    angle = next;
  }
  ctx.globalAlpha = 1;

  if (inner > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawLegend(
    ctx,
    data.map((row) => ({ label: str(row.label, 'Slice'), color: str(row.color, '#6f86ff') })),
    options,
    width,
  );
}

function drawRadarOrPolar(
  ctx: CanvasRenderingContext2D,
  rows: BrowserChartValue[],
  options: R,
  width: number,
  layout: ReturnType<typeof makeLayout>,
  polar: boolean,
) {
  const data = rows.filter(rec);
  if (!data.length) return;
  const cx = layout.plotX + layout.plotW / 2;
  const cy = layout.plotY + layout.plotH / 2;
  const radius = Math.min(layout.plotW, layout.plotH) * .38;
  const max = Math.max(1, ...data.map((row) => Math.abs(num(row.value, 0))));

  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,.2)';
  for (let ring = 1; ring <= 4; ring += 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * ring / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (polar) {
    let angle = -Math.PI / 2;
    const slice = Math.PI * 2 / data.length;
    for (const row of data) {
      const r = radius * Math.abs(num(row.value, 0)) / max;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.globalAlpha = .78;
      ctx.fillStyle = str(row.color, '#6f86ff');
      ctx.fill();
      angle += slice;
    }
  } else {
    ctx.beginPath();
    data.forEach((row, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / data.length;
      const r = radius * Math.abs(num(row.value, 0)) / max;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (!index) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.globalAlpha = .28;
    ctx.fillStyle = '#6f86ff';
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#8ea2ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  drawLegend(
    ctx,
    data.map((row) => ({ label: str(row.label, 'Value'), color: str(row.color, '#6f86ff') })),
    options,
    width,
  );
}

export function renderBrowserChart(
  typeValue: BrowserChartValue,
  dataValue: BrowserChartValue,
  optionsValue: BrowserChartValue,
): HTMLCanvasElement | null {
  const type = typeof typeValue === 'string' ? typeValue : '';
  const data = Array.isArray(dataValue) ? dataValue : [];
  const options = rec(optionsValue) ? optionsValue : {};
  const dimensions = rec(options.dimensions) ? options.dimensions : {};
  const width = Math.round(clamp(num(dimensions.width, 720), 160, 2400));
  const height = Math.round(clamp(num(dimensions.height, 440), 120, 1800));

  if (!type || !data.length) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  const appearance = rec(options.appearance) ? options.appearance : {};
  paintBrowserCanvasBackground(
    ctx,
    {
      colorBg: appearance.backgroundColor ?? '#0f172a',
      gradientBg: appearance.backgroundGradient ?? null,
      bgLayers: appearance.bgLayers ?? [],
      patternBg: appearance.patternBg ?? null,
      noiseBg: appearance.noiseBg ?? null,
      borderRadius: appearance.borderRadius ?? 0,
      stroke: {
        width: appearance.borderWidth ?? 0,
        color: appearance.borderColor ?? 'rgba(148,163,184,.4)',
        borderRadius: appearance.borderRadius ?? 0,
      },
    },
    width,
    height,
  );
  const layout = makeLayout(options, width, height);
  drawTitle(ctx, layout);

  if (type === 'line') drawLine(ctx, data, options, width, layout);
  else if (type === 'scatter') drawScatter(ctx, data, options, width, layout);
  else if (type === 'bar') drawBars(ctx, data, options, width, layout, false);
  else if (type === 'horizontalBar') drawBars(ctx, data, options, width, layout, true);
  else if (type === 'pie') drawPie(ctx, data, options, width, height, layout);
  else if (type === 'radar') drawRadarOrPolar(ctx, data, options, width, layout, false);
  else if (type === 'polarArea') drawRadarOrPolar(ctx, data, options, width, layout, true);
  else return null;

  return canvas;
}
