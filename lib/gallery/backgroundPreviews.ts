/**
 * Server-only: renders whitelisted background thumbnails (imports native canvas via apexify).
 */
import { ApexPainter } from 'apexify.js';
import type { GalleryPreviewId } from './constants';

export type PreviewResult = { mime: 'image/png'; data: Buffer };

const W = 960;
const H = 540;

/** Pixel output must match `backgroundSnippets.ts` (same numbers). */
export async function runBackgroundPreview(id: GalleryPreviewId): Promise<PreviewResult> {
  const painter = new ApexPainter();
  switch (id) {
    case 'bg-chromatic-depth': {
      const canvas = await painter.createCanvas({
        width: W,
        height: H,
        gradientBg: {
          type: 'linear',
          colors: [
            { stop: 0, color: '#020617' },
            { stop: 0.45, color: '#0f172a' },
            { stop: 1, color: '#1e1b4b' },
          ],
          startX: 0,
          startY: 0,
          endX: W,
          endY: H,
          rotate: 32,
        },
        bgLayers: [
          {
            type: 'gradient',
            value: {
              type: 'radial',
              colors: [
                { stop: 0, color: 'rgba(99, 102, 241, 0.55)' },
                { stop: 0.45, color: 'rgba(79, 70, 229, 0.2)' },
                { stop: 1, color: 'transparent' },
              ],
              startX: W * 0.72,
              startY: H * 0.18,
              startRadius: 0,
              endX: W * 0.55,
              endY: H * 0.35,
              endRadius: 420,
            },
            opacity: 0.85,
            blendMode: 'screen',
          },
          {
            type: 'gradient',
            value: {
              type: 'radial',
              colors: [
                { stop: 0, color: 'rgba(236, 72, 153, 0.35)' },
                { stop: 1, color: 'transparent' },
              ],
              startX: W * 0.12,
              startY: H * 0.85,
              startRadius: 0,
              endX: W * 0.2,
              endY: H * 0.75,
              endRadius: 320,
            },
            opacity: 0.7,
            blendMode: 'soft-light',
          },
          { type: 'noise', intensity: 0.055, blendMode: 'overlay' },
        ],
        noiseBg: { intensity: 0.035 },
        borderRadius: 18,
        stroke: {
          width: 2,
          color: 'rgba(148, 163, 184, 0.25)',
          style: 'solid',
          borderRadius: 18,
        },
        shadow: {
          color: 'rgba(15, 23, 42, 0.9)',
          offsetX: 0,
          offsetY: 28,
          blur: 60,
          opacity: 0.85,
          borderRadius: 18,
        },
      });
      return { mime: 'image/png', data: canvas.buffer };
    }
    case 'bg-crt-ghost': {
      const canvas = await painter.createCanvas({
        width: W,
        height: H,
        gradientBg: {
          type: 'linear',
          colors: [
            { stop: 0, color: '#030806' },
            { stop: 0.55, color: '#052e16' },
            { stop: 1, color: '#022c22' },
          ],
          startX: 0,
          startY: H,
          endX: W,
          endY: 0,
        },
        bgLayers: [
          {
            type: 'gradient',
            value: {
              type: 'radial',
              colors: [
                { stop: 0, color: 'rgba(52, 211, 153, 0.45)' },
                { stop: 0.35, color: 'rgba(16, 185, 129, 0.12)' },
                { stop: 1, color: 'transparent' },
              ],
              startX: W * 0.5,
              startY: H * 0.48,
              startRadius: 0,
              endX: W * 0.5,
              endY: H * 0.5,
              endRadius: 380,
            },
            opacity: 0.9,
            blendMode: 'screen',
          },
          {
            type: 'gradient',
            value: {
              type: 'radial',
              colors: [
                { stop: 0, color: 'rgba(45, 212, 191, 0.2)' },
                { stop: 1, color: 'transparent' },
              ],
              startX: W * 0.85,
              startY: H * 0.12,
              startRadius: 0,
              endX: W * 0.75,
              endY: H * 0.2,
              endRadius: 200,
            },
            opacity: 0.75,
            blendMode: 'lighter',
          },
        ],
        patternBg: {
          type: 'dots',
          color: 'rgba(110, 231, 183, 0.14)',
          secondaryColor: 'rgba(6, 78, 59, 0.35)',
          size: 3,
          spacing: 14,
          rotation: 12,
          blendMode: 'overlay',
          opacity: 0.55,
        },
        noiseBg: { intensity: 0.11 },
        borderRadius: 12,
      });
      return { mime: 'image/png', data: canvas.buffer };
    }
    case 'bg-solstice-silk': {
      const canvas = await painter.createCanvas({
        width: W,
        height: H,
        gradientBg: {
          type: 'linear',
          colors: [
            { stop: 0, color: '#431407' },
            { stop: 0.35, color: '#9a3412' },
            { stop: 0.65, color: '#be185d' },
            { stop: 1, color: '#4c0519' },
          ],
          startX: 0,
          startY: H * 0.3,
          endX: W,
          endY: H * 0.85,
        },
        bgLayers: [
          {
            type: 'gradient',
            value: {
              type: 'conic',
              centerX: W * 0.55,
              centerY: H * 0.35,
              startAngle: 20,
              colors: [
                { stop: 0, color: 'rgba(253, 224, 71, 0.35)' },
                { stop: 0.25, color: 'rgba(251, 113, 133, 0.2)' },
                { stop: 0.5, color: 'rgba(167, 139, 250, 0.25)' },
                { stop: 0.75, color: 'rgba(253, 224, 71, 0.2)' },
                { stop: 1, color: 'rgba(253, 224, 71, 0.35)' },
              ],
            },
            opacity: 0.65,
            blendMode: 'soft-light',
          },
          { type: 'noise', intensity: 0.04, blendMode: 'screen' },
        ],
        noiseBg: { intensity: 0.025 },
        borderRadius: 16,
        stroke: {
          width: 1,
          color: 'rgba(255, 237, 213, 0.18)',
          style: 'solid',
          borderRadius: 16,
        },
      });
      return { mime: 'image/png', data: canvas.buffer };
    }
    case 'bg-hex-stage': {
      const canvas = await painter.createCanvas({
        width: W,
        height: H,
        gradientBg: {
          type: 'radial',
          colors: [
            { stop: 0, color: '#1e1b4b' },
            { stop: 0.55, color: '#0f172a' },
            { stop: 1, color: '#020617' },
          ],
          startX: W * 0.5,
          startY: H * 0.42,
          startRadius: 0,
          endX: W * 0.5,
          endY: H * 0.5,
          endRadius: 620,
        },
        patternBg: {
          type: 'hexagons',
          color: 'rgba(34, 211, 238, 0.22)',
          secondaryColor: 'rgba(99, 102, 241, 0.12)',
          size: 26,
          spacing: 10,
          rotation: 9,
          blendMode: 'overlay',
          opacity: 0.65,
        },
        noiseBg: { intensity: 0.045 },
        borderRadius: 22,
        stroke: {
          width: 3,
          gradient: {
            type: 'linear',
            colors: [
              { stop: 0, color: '#22d3ee' },
              { stop: 0.5, color: '#a78bfa' },
              { stop: 1, color: '#f472b6' },
            ],
            startX: 0,
            startY: 0,
            endX: W,
            endY: H,
          },
          style: 'solid',
          borderRadius: 22,
        },
        shadow: {
          color: 'rgba(56, 189, 248, 0.35)',
          offsetX: 0,
          offsetY: 22,
          blur: 55,
          opacity: 0.9,
          borderRadius: 22,
        },
      });
      return { mime: 'image/png', data: canvas.buffer };
    }
    case 'bg-tideglass': {
      const canvas = await painter.createCanvas({
        width: W,
        height: H,
        gradientBg: {
          type: 'linear',
          colors: [
            { stop: 0, color: '#042f2e' },
            { stop: 0.4, color: '#115e59' },
            { stop: 0.75, color: '#134e4a' },
            { stop: 1, color: '#0c4a6e' },
          ],
          startX: 0,
          startY: 0,
          endX: W * 0.85,
          endY: H,
          rotate: 118,
        },
        bgLayers: [
          {
            type: 'gradient',
            value: {
              type: 'radial',
              colors: [
                { stop: 0, color: 'rgba(165, 243, 252, 0.35)' },
                { stop: 0.5, color: 'rgba(45, 212, 191, 0.08)' },
                { stop: 1, color: 'transparent' },
              ],
              startX: W * 0.22,
              startY: H * 0.28,
              startRadius: 0,
              endX: W * 0.18,
              endY: H * 0.32,
              endRadius: 340,
            },
            opacity: 0.85,
            blendMode: 'soft-light',
          },
        ],
        patternBg: {
          type: 'waves',
          color: 'rgba(186, 230, 253, 0.16)',
          secondaryColor: 'rgba(14, 116, 144, 0.25)',
          size: 36,
          spacing: 8,
          rotation: 0,
          blendMode: 'soft-light',
          opacity: 0.5,
        },
        noiseBg: { intensity: 0.038 },
        borderRadius: 14,
        stroke: {
          width: 1,
          color: 'rgba(207, 250, 254, 0.2)',
          style: 'solid',
          borderRadius: 14,
        },
      });
      return { mime: 'image/png', data: canvas.buffer };
    }
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown background preview: ${_exhaustive}`);
    }
  }
}
