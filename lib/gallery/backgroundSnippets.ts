/**
 * Client-safe gallery metadata and runnable code strings only (no apexify / native canvas).
 */
import type { GalleryPreviewId } from './constants';

const CHROMATIC_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#020617' },
      { stop: 0.45, color: '#0f172a' },
      { stop: 1, color: '#1e1b4b' },
    ],
    startX: 0,
    startY: 0,
    endX: 960,
    endY: 540,
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
        startX: 960 * 0.72,
        startY: 540 * 0.18,
        startRadius: 0,
        endX: 960 * 0.55,
        endY: 540 * 0.35,
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
        startX: 960 * 0.12,
        startY: 540 * 0.85,
        startRadius: 0,
        endX: 960 * 0.2,
        endY: 540 * 0.75,
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

return canvas.buffer;`;

const CHROMATIC_JS = `const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#020617' },
      { stop: 0.45, color: '#0f172a' },
      { stop: 1, color: '#1e1b4b' },
    ],
    startX: 0,
    startY: 0,
    endX: 960,
    endY: 540,
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
        startX: 960 * 0.72,
        startY: 540 * 0.18,
        startRadius: 0,
        endX: 960 * 0.55,
        endY: 540 * 0.35,
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
        startX: 960 * 0.12,
        startY: 540 * 0.85,
        startRadius: 0,
        endX: 960 * 0.2,
        endY: 540 * 0.75,
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

return canvas.buffer;`;

const CRT_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#030806' },
      { stop: 0.55, color: '#052e16' },
      { stop: 1, color: '#022c22' },
    ],
    startX: 0,
    startY: 540,
    endX: 960,
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
        startX: 480,
        startY: 260,
        startRadius: 0,
        endX: 480,
        endY: 270,
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
        startX: 816,
        startY: 65,
        startRadius: 0,
        endX: 720,
        endY: 108,
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

return canvas.buffer;`;

const CRT_JS = CRT_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const SOLSTICE_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#431407' },
      { stop: 0.35, color: '#9a3412' },
      { stop: 0.65, color: '#be185d' },
      { stop: 1, color: '#4c0519' },
    ],
    startX: 0,
    startY: 540 * 0.3,
    endX: 960,
    endY: 540 * 0.85,
  },
  bgLayers: [
    {
      type: 'gradient',
      value: {
        type: 'conic',
        centerX: 960 * 0.55,
        centerY: 540 * 0.35,
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

return canvas.buffer;`;

const SOLSTICE_JS = SOLSTICE_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const HEX_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'radial',
    colors: [
      { stop: 0, color: '#1e1b4b' },
      { stop: 0.55, color: '#0f172a' },
      { stop: 1, color: '#020617' },
    ],
    startX: 480,
    startY: 227,
    startRadius: 0,
    endX: 480,
    endY: 270,
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
      endX: 960,
      endY: 540,
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

return canvas.buffer;`;

const HEX_JS = HEX_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const TIDE_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
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
    endX: 960 * 0.85,
    endY: 540,
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
        startX: 960 * 0.22,
        startY: 540 * 0.28,
        startRadius: 0,
        endX: 960 * 0.18,
        endY: 540 * 0.32,
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

return canvas.buffer;`;

const TIDE_JS = TIDE_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

export type BackgroundGalleryCard = {
  id: GalleryPreviewId;
  title: string;
  category: 'background';
  description: string;
  thumbnail: string;
  featured?: boolean;
  code: { ts: string; js: string };
};

export const backgroundGalleryItems: BackgroundGalleryCard[] = [
  {
    id: 'bg-chromatic-depth',
    title: 'Depth Field — stacked light',
    category: 'background',
    description:
      'Not a flat gradient poster: a dark base, two painted light pools with screen / soft-light compositing, grain inside the stack, then a final noise pass. Shows how bgLayers turn a canvas into a scene.',
    thumbnail: '/api/gallery/thumbnail/bg-chromatic-depth',
    featured: true,
    code: { ts: CHROMATIC_TS, js: CHROMATIC_JS },
  },
  {
    id: 'bg-crt-ghost',
    title: 'CRT Ghost — phosphor haze',
    category: 'background',
    description:
      'Borrowed-from-hardware mood without assets: emissive radials, a rotated dot lattice from patternBg, and heavy film noise. Great for devtools, terminals, or retro-future UI chrome.',
    thumbnail: '/api/gallery/thumbnail/bg-crt-ghost',
    featured: true,
    code: { ts: CRT_TS, js: CRT_JS },
  },
  {
    id: 'bg-solstice-silk',
    title: 'Solstice Silk — conic over sunset',
    category: 'background',
    description:
      'A warm linear band meets a conic highlight layer — two gradient personalities in one createCanvas call. Demonstrates conic as an overlay, not the whole background.',
    thumbnail: '/api/gallery/thumbnail/bg-solstice-silk',
    code: { ts: SOLSTICE_TS, js: SOLSTICE_JS },
  },
  {
    id: 'bg-hex-stage',
    title: 'Hex Stage — lattice + neon rim',
    category: 'background',
    description:
      'Deep radial void, cyan hex mesh, then a gradient stroke and colored shadow so the frame reads like stage lighting. Built for hero sections that need energy without stock photography.',
    thumbnail: '/api/gallery/thumbnail/bg-hex-stage',
    featured: true,
    code: { ts: HEX_TS, js: HEX_JS },
  },
  {
    id: 'bg-tideglass',
    title: 'Tideglass — waves on teal',
    category: 'background',
    description:
      'Cool marine linear base, a soft radial bloom, and waves pattern with soft-light blending — editorial calm with motion implied. One API surface, no image files.',
    thumbnail: '/api/gallery/thumbnail/bg-tideglass',
    code: { ts: TIDE_TS, js: TIDE_JS },
  },
];
