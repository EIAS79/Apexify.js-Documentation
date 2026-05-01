/**
 * Static PNG helpers for `canvas-background-showcase.ts`-style compositions (960×540 for gallery parity).
 */
import { ApexPainter } from 'apexify.js';

type Painter = InstanceType<typeof ApexPainter>;

const W = 960;
const H = 540;

function slateLinear() {
  return {
    type: 'linear' as const,
    startX: 0,
    startY: 0,
    endX: W,
    endY: H,
    rotate: 36,
    colors: [
      { stop: 0, color: '#020617' },
      { stop: 0.5, color: '#0f172a' },
      { stop: 1, color: '#1e1b4b' },
    ],
  };
}

export async function renderPipelineTransparentGradient(painter: Painter) {
  const { buffer } = await painter.createCanvas({
    width: W,
    height: H,
    transparentBase: true,
    bgLayers: [{ type: 'gradient', value: slateLinear(), opacity: 1 }],
  });
  return buffer;
}

export async function renderPipelineLayerDotsMultiply(painter: Painter) {
  const { buffer } = await painter.createCanvas({
    width: W,
    height: H,
    transparentBase: true,
    bgLayers: [
      { type: 'gradient', value: slateLinear(), opacity: 1 },
      {
        type: 'presetPattern',
        opacity: 1,
        blendMode: 'multiply',
        pattern: {
          type: 'dots',
          color: 'rgba(148, 163, 184, 0.55)',
          size: 10,
          spacing: 22,
          opacity: 1,
        },
      },
    ],
    noiseBg: { intensity: 0.035 },
  });
  return buffer;
}

export async function renderPipelineGradientGridCrosses(painter: Painter) {
  const { buffer } = await painter.createCanvas({
    width: W,
    height: H,
    gradientBg: slateLinear(),
    bgLayers: [
      {
        type: 'presetPattern',
        opacity: 0.85,
        blendMode: 'soft-light',
        pattern: {
          type: 'grid',
          color: 'rgba(148, 163, 184, 0.35)',
          secondaryColor: 'rgba(71, 85, 105, 0.25)',
          size: 6,
          spacing: 18,
          opacity: 0.9,
        },
      },
    ],
    patternBg: {
      type: 'crosses',
      color: 'rgba(226, 232, 240, 0.25)',
      secondaryColor: 'rgba(148, 163, 184, 0.18)',
      size: 7,
      spacing: 24,
      rotation: 6,
      blendMode: 'overlay',
      opacity: 0.65,
    },
    noiseBg: { intensity: 0.02 },
  });
  return buffer;
}

export async function renderPipelineColorStripes(painter: Painter) {
  const { buffer } = await painter.createCanvas({
    width: W,
    height: H,
    colorBg: '#0c1222',
    bgLayers: [
      {
        type: 'presetPattern',
        opacity: 0.7,
        blendMode: 'screen',
        pattern: {
          type: 'stripes',
          color: 'rgba(99, 102, 241, 0.25)',
          secondaryColor: 'rgba(139, 92, 246, 0.2)',
          size: 14,
          spacing: 20,
          opacity: 1,
        },
      },
    ],
    noiseBg: { intensity: 0.04 },
  });
  return buffer;
}

export async function renderPipelineFramedChrome(painter: Painter) {
  const { buffer } = await painter.createCanvas({
    width: W,
    height: H,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: W,
      endY: H,
      rotate: 48,
      colors: [
        { stop: 0, color: '#020617' },
        { stop: 0.55, color: '#0f172a' },
        { stop: 1, color: '#1e1b4b' },
      ],
    },
    patternBg: {
      type: 'crosses',
      color: 'rgba(148, 163, 184, 0.42)',
      secondaryColor: 'rgba(100, 116, 139, 0.28)',
      size: 8,
      spacing: 26,
      rotation: 8,
      blendMode: 'soft-light',
      opacity: 0.72,
    },
    noiseBg: { intensity: 0.038 },
    borderRadius: 14,
    stroke: {
      width: 1,
      color: 'rgba(99, 102, 241, 0.35)',
      borderRadius: 14,
    },
    shadow: {
      color: 'rgba(0, 0, 0, 0.45)',
      offsetY: 18,
      blur: 40,
      opacity: 0.82,
      borderRadius: 14,
    },
  });
  return buffer;
}

export const CANVAS_BG_PIPELINE_FILENAMES = [
  'bg-pipeline-transparent-gradient.png',
  'bg-pipeline-layer-dots-multiply.png',
  'bg-pipeline-gradient-grid-crosses.png',
  'bg-pipeline-color-stripes.png',
  'bg-pipeline-framed-chrome.png',
] as const;

export async function renderAllCanvasBackgroundPipelinePicks(painter: Painter): Promise<Map<string, Buffer>> {
  const m = new Map<string, Buffer>();
  m.set(CANVAS_BG_PIPELINE_FILENAMES[0], await renderPipelineTransparentGradient(painter));
  m.set(CANVAS_BG_PIPELINE_FILENAMES[1], await renderPipelineLayerDotsMultiply(painter));
  m.set(CANVAS_BG_PIPELINE_FILENAMES[2], await renderPipelineGradientGridCrosses(painter));
  m.set(CANVAS_BG_PIPELINE_FILENAMES[3], await renderPipelineColorStripes(painter));
  m.set(CANVAS_BG_PIPELINE_FILENAMES[4], await renderPipelineFramedChrome(painter));
  return m;
}
