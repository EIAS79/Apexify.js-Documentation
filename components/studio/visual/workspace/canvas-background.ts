import type { VisualCanvasConfig } from '@/lib/studio/visual/model';

export function canvasArtboardBackground(canvas: VisualCanvasConfig): string {
  if (canvas.transparentBase) return 'transparent';
  if (canvas.colorBg !== undefined) return canvas.colorBg || '#000000';
  const gradient = canvas.gradientBg;
  if (gradient?.colors?.length) {
    const stops = gradient.colors
      .map((item) => item.color + ' ' + Math.round(item.stop * 100) + '%')
      .join(', ');
    if (gradient.type === 'conic') return 'conic-gradient(from ' + (gradient.startAngle ?? 0) + 'deg, ' + stops + ')';
    if (gradient.type === 'radial') return 'radial-gradient(circle, ' + stops + ')';
    return 'linear-gradient(' + (gradient.rotate ?? 90) + 'deg, ' + stops + ')';
  }
  return '#000000';
}
