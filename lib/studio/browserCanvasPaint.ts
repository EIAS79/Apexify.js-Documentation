'use client';

export type CanvasPreviewValue =
  | null
  | boolean
  | number
  | string
  | CanvasPreviewValue[]
  | { [key: string]: CanvasPreviewValue };

type R = { [key: string]: CanvasPreviewValue };

function rec(value: CanvasPreviewValue | undefined): value is R {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function num(value: CanvasPreviewValue | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function str(value: CanvasPreviewValue | undefined, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}
function bool(value: CanvasPreviewValue | undefined, fallback = false) {
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
  let output: CanvasGradient;

  if (type === 'radial') {
    output = ctx.createRadialGradient(
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
      const radians = rotate * Math.PI / 180;
      const cx = width / 2;
      const cy = height / 2;
      const reach = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
      const dx = Math.cos(radians) * reach * .5;
      const dy = Math.sin(radians) * reach * .5;
      output = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    } else {
      output = ctx.createLinearGradient(
        num(config.startX, 0),
        num(config.startY, 0),
        num(config.endX, width),
        num(config.endY, height),
      );
    }
  }

  const colors = Array.isArray(config.colors) ? config.colors : [];
  if (!colors.length) {
    output.addColorStop(0, '#111827');
    output.addColorStop(1, '#334155');
  } else {
    for (const stop of colors) {
      if (!rec(stop)) continue;
      output.addColorStop(clamp(num(stop.stop, 0), 0, 1), str(stop.color, '#ffffff'));
    }
  }
  return output;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(Math.max(0, radius), width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function paintNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,' + intensity + ')';
  let seed = 173;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const count = Math.min(7000, Math.round(width * height / 150));
  for (let i = 0; i < count; i += 1) {
    ctx.fillRect(Math.floor(next() * width), Math.floor(next() * height), 1, 1);
  }
  ctx.restore();
}

export function paintBrowserPattern(
  ctx: CanvasRenderingContext2D,
  pattern: R,
  width: number,
  height: number,
  defaultBlend: GlobalCompositeOperation = 'source-over',
) {
  const type = str(pattern.type, 'grid');
  const color = str(pattern.color, 'rgba(255,255,255,.16)');
  const secondary = str(pattern.secondaryColor, color);
  const spacing = Math.max(4, num(pattern.spacing, 24));
  const size = Math.max(1, num(pattern.size, 2));
  const offsetX = num(pattern.offsetX, 0);
  const offsetY = num(pattern.offsetY, 0);
  const rotation = num(pattern.rotation, 0) * Math.PI / 180;
  const margin = Math.hypot(width, height);
  const minX = -margin;
  const maxX = width + margin;
  const minY = -margin;
  const maxY = height + margin;

  ctx.save();
  ctx.globalAlpha *= clamp(num(pattern.opacity, 1), 0, 1);

  try {
    ctx.globalCompositeOperation = str(pattern.blendMode, defaultBlend) as GlobalCompositeOperation;
  } catch {
    ctx.globalCompositeOperation = defaultBlend;
  }

  ctx.translate(width / 2, height / 2);
  if (rotation) ctx.rotate(rotation);
  ctx.translate(-width / 2 + offsetX, -height / 2 + offsetY);

  const style = rec(pattern.gradient) ? gradient(ctx, pattern.gradient, width, height) : color;

  if (type === 'dots' || type === 'polka') {
    ctx.fillStyle = style;
    const radius = type === 'polka' ? Math.max(2, size * .58) : Math.max(1, size / 2);
    for (let y = minY; y <= maxY; y += spacing) {
      for (let x = minX; x <= maxX; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === 'hexagons') {
    const radius = Math.max(3, size);
    const stepX = radius * 1.5 + spacing;
    const stepY = radius * Math.sqrt(3) + spacing;
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(.7, Math.min(3, size / 8));
    let row = 0;
    for (let y = minY; y <= maxY; y += stepY, row += 1) {
      const rowOffset = row % 2 ? stepX / 2 : 0;
      for (let x = minX + rowOffset; x <= maxX; x += stepX) {
        ctx.beginPath();
        for (let side = 0; side < 6; side += 1) {
          const angle = Math.PI / 3 * side;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (side === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (type === 'waves') {
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(.8, size / 5);
    const amplitude = Math.max(2, size / 2);
    const period = Math.max(12, spacing * 2);
    for (let y = minY; y <= maxY; y += spacing) {
      ctx.beginPath();
      for (let x = minX; x <= maxX; x += 4) {
        const py = y + Math.sin(x / period * Math.PI * 2) * amplitude;
        if (x === minX) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }
  } else if (type === 'crosses') {
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(.8, size / 5);
    const arm = Math.max(2, size / 2);
    for (let y = minY; y <= maxY; y += spacing) {
      for (let x = minX; x <= maxX; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x - arm, y);
        ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm);
        ctx.lineTo(x, y + arm);
        ctx.stroke();
      }
    }
  } else if (type === 'checkerboard') {
    const cell = Math.max(4, size + spacing);
    let row = 0;
    for (let y = minY; y <= maxY; y += cell, row += 1) {
      let col = 0;
      for (let x = minX; x <= maxX; x += cell, col += 1) {
        ctx.fillStyle = (row + col) % 2 ? secondary : color;
        ctx.fillRect(x, y, cell, cell);
      }
    }
  } else if (type === 'diamonds') {
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(.8, size / 6);
    const radius = Math.max(3, size);
    for (let y = minY; y <= maxY; y += spacing + radius * 2) {
      for (let x = minX; x <= maxX; x += spacing + radius * 2) {
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x + radius, y);
        ctx.lineTo(x, y + radius);
        ctx.lineTo(x - radius, y);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (type === 'triangles') {
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(.8, size / 6);
    const h = Math.max(4, size * .9);
    for (let y = minY; y <= maxY; y += h + spacing) {
      for (let x = minX; x <= maxX; x += size * 2 + spacing) {
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + size, y - h);
        ctx.lineTo(x + size * 2, y + h);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (type === 'stars') {
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(.8, size / 7);
    const outer = Math.max(3, size);
    const inner = outer * .42;
    for (let y = minY; y <= maxY; y += spacing + outer * 2) {
      for (let x = minX; x <= maxX; x += spacing + outer * 2) {
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const radius = point % 2 ? inner : outer;
          const angle = point * Math.PI / 5 - Math.PI / 2;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (type === 'stripes') {
    const band = Math.max(2, size);
    let stripe = 0;
    for (let y = minY; y <= maxY; y += band + spacing, stripe += 1) {
      ctx.fillStyle = stripe % 2 ? secondary : color;
      ctx.fillRect(minX, y, maxX - minX, band);
    }
  } else if (type === 'diagonal') {
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(.8, size / 5);
    for (let x = minX - height; x <= maxX + height; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x + height + margin, maxY);
      ctx.stroke();
    }
  } else {
    ctx.lineWidth = Math.max(.5, size / 3);
    for (let x = minX; x <= maxX; x += spacing) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
      ctx.stroke();
    }
    for (let y = minY; y <= maxY; y += spacing) {
      ctx.strokeStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function paintBrowserCanvasBackground(
  ctx: CanvasRenderingContext2D,
  config: R,
  width: number,
  height: number,
) {
  if (!bool(config.transparentBase, false)) {
    ctx.fillStyle = str(config.colorBg, '#ffffff');
    ctx.fillRect(0, 0, width, height);
  }

  if (rec(config.gradientBg)) {
    ctx.fillStyle = gradient(ctx, config.gradientBg, width, height);
    ctx.fillRect(0, 0, width, height);
  }

  const layers = Array.isArray(config.bgLayers) ? config.bgLayers : [];
  for (const layer of layers) {
    if (!rec(layer)) continue;
    const layerBlend = str(layer.blendMode, 'source-over');
    ctx.save();
    ctx.globalAlpha *= clamp(num(layer.opacity, 1), 0, 1);
    try {
      ctx.globalCompositeOperation = layerBlend as GlobalCompositeOperation;
    } catch {
      ctx.globalCompositeOperation = 'source-over';
    }

    const type = str(layer.type, '');
    if (type === 'gradient' && rec(layer.value)) {
      ctx.fillStyle = gradient(ctx, layer.value, width, height);
      ctx.fillRect(0, 0, width, height);
    } else if (type === 'color') {
      ctx.fillStyle = str(layer.value, 'transparent');
      ctx.fillRect(0, 0, width, height);
    } else if (type === 'presetPattern' && rec(layer.pattern)) {
      paintBrowserPattern(ctx, layer.pattern, width, height, layerBlend as GlobalCompositeOperation);
    } else if (type === 'noise') {
      const intensity = clamp(num(layer.intensity, .08), 0, .18);
      if (intensity > 0) paintNoise(ctx, width, height, intensity);
    }
    ctx.restore();
  }

  if (rec(config.patternBg)) {
    paintBrowserPattern(ctx, config.patternBg, width, height, 'overlay');
  }

  if (rec(config.noiseBg)) {
    const intensity = clamp(num(config.noiseBg.intensity, .05), 0, .18);
    if (intensity > 0) paintNoise(ctx, width, height, intensity);
  }

  const stroke = rec(config.stroke) ? config.stroke : rec(config.canvasStroke) ? config.canvasStroke : null;
  if (stroke) {
    const lineWidth = Math.max(0, num(stroke.width, 1));
    if (lineWidth > 0) {
      ctx.save();
      ctx.globalAlpha *= clamp(num(stroke.opacity, 1), 0, 1);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = rec(stroke.gradient) ? gradient(ctx, stroke.gradient, width, height) : str(stroke.color, '#ffffff');

      const rawRadius = stroke.borderRadius;
      const radius =
        typeof rawRadius === 'number'
          ? rawRadius
          : str(rawRadius, '') === 'circular'
            ? Math.min(width, height) / 2
            : num(config.borderRadius, 0);

      roundedRect(
        ctx,
        lineWidth / 2,
        lineWidth / 2,
        Math.max(1, width - lineWidth),
        Math.max(1, height - lineWidth),
        radius,
      );
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function drawBrowserCanvasAsset(
  ctx: CanvasRenderingContext2D,
  item: R,
  asset: HTMLCanvasElement,
) {
  const x = num(item.x, 0);
  const y = num(item.y, 0);
  const width = Math.max(1, num(item.width, asset.width));
  const height = Math.max(1, num(item.height, asset.height));
  const radius = Math.max(0, num(item.borderRadius, 0));
  const shadow = rec(item.shadow) ? item.shadow : {};

  ctx.save();
  ctx.globalAlpha = clamp(num(item.opacity, 1), 0, 1);

  if (typeof item.blendMode === 'string') {
    try {
      ctx.globalCompositeOperation = item.blendMode as GlobalCompositeOperation;
    } catch {
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  if (typeof shadow.color === 'string') ctx.shadowColor = shadow.color;
  ctx.shadowBlur = Math.max(0, num(shadow.blur, 0));
  ctx.shadowOffsetX = num(shadow.offsetX, 0);
  ctx.shadowOffsetY = num(shadow.offsetY, 0);

  if (radius > 0) {
    roundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
  }

  ctx.drawImage(asset, x, y, width, height);
  ctx.restore();
}
