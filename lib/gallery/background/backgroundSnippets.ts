/**
 * Gallery metadata + static example source. Previews live in `public/gallery-outputs/backgrounds/`.
 */
import type { GalleryCardBase } from '../core/galleryTypes';
import { canvasBackgroundPipelineGalleryItems } from './canvasBackgroundGallerySnippets';

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
    startY: 270,
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

const AURORA_GRID_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#020617' },
      { stop: 0.5, color: '#1e1b4b' },
      { stop: 1, color: '#312e81' },
    ],
    startX: 0,
    startY: 0,
    endX: 960,
    endY: 540,
    rotate: 22,
  },
  bgLayers: [
    {
      type: 'gradient',
      blendMode: 'screen',
      opacity: 0.55,
      value: {
        type: 'radial',
        colors: [
          { stop: 0, color: 'rgba(56, 189, 248, 0.42)' },
          { stop: 0.45, color: 'rgba(99, 102, 241, 0.18)' },
          { stop: 1, color: 'transparent' },
        ],
        startX: 960 * 0.72,
        startY: 540 * 0.26,
        startRadius: 0,
        endX: 960 * 0.62,
        endY: 540 * 0.34,
        endRadius: 420,
      },
    },
    {
      type: 'gradient',
      blendMode: 'soft-light',
      opacity: 0.35,
      value: {
        type: 'linear',
        colors: [
          { stop: 0, color: 'rgba(244, 114, 182, 0.22)' },
          { stop: 1, color: 'transparent' },
        ],
        startX: 0,
        startY: 540,
        endX: 960 * 0.55,
        endY: 0,
      },
    },
  ],
  patternBg: {
    type: 'grid',
    color: 'rgba(148, 163, 184, 0.09)',
    opacity: 0.5,
    size: 36,
    rotation: 6,
    blendMode: 'overlay',
  },
  noiseBg: { intensity: 0.042 },
  borderRadius: 18,
  stroke: {
    width: 2,
    color: 'rgba(186, 230, 253, 0.22)',
    style: 'solid',
    borderRadius: 18,
  },
});

return canvas.buffer;`;

const AURORA_GRID_JS = AURORA_GRID_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const MOLTEN_CORE_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'radial',
    colors: [
      { stop: 0, color: '#450a0a' },
      { stop: 0.45, color: '#7f1d1d' },
      { stop: 1, color: '#020617' },
    ],
    startX: 480,
    startY: 300,
    startRadius: 0,
    endX: 480,
    endY: 300,
    endRadius: 560,
  },
  bgLayers: [
    {
      type: 'gradient',
      blendMode: 'screen',
      opacity: 0.5,
      value: {
        type: 'conic',
        centerX: 960 * 0.42,
        centerY: 540 * 0.48,
        startAngle: 48,
        colors: [
          { stop: 0, color: 'rgba(251, 191, 36, 0.45)' },
          { stop: 0.33, color: 'rgba(239, 68, 68, 0.35)' },
          { stop: 0.66, color: 'rgba(249, 115, 22, 0.32)' },
          { stop: 1, color: 'rgba(251, 191, 36, 0.45)' },
        ],
      },
    },
    { type: 'noise', intensity: 0.065, blendMode: 'overlay' },
  ],
  patternBg: {
    type: 'dots',
    color: 'rgba(254, 243, 199, 0.12)',
    secondaryColor: 'rgba(127, 29, 29, 0.35)',
    size: 4,
    spacing: 20,
    rotation: 22,
    blendMode: 'soft-light',
    opacity: 0.45,
  },
  noiseBg: { intensity: 0.03 },
  borderRadius: 14,
  stroke: {
    width: 2,
    gradient: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#fb923c' },
        { stop: 1, color: '#ef4444' },
      ],
      startX: 0,
      startY: 540,
      endX: 960,
      endY: 0,
    },
    style: 'solid',
    borderRadius: 14,
  },
});

return canvas.buffer;`;

const MOLTEN_CORE_JS = MOLTEN_CORE_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const CRYSTAL_FOG_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();
const canvas = await painter.createCanvas({
  width: 960,
  height: 540,
  gradientBg: {
    type: 'linear',
    colors: [
      { stop: 0, color: '#0c4a6e' },
      { stop: 0.45, color: '#164e63' },
      { stop: 1, color: '#020617' },
    ],
    startX: 960,
    startY: 0,
    endX: 0,
    endY: 540,
    rotate: 12,
  },
  bgLayers: [
    {
      type: 'gradient',
      blendMode: 'lighter',
      opacity: 0.4,
      value: {
        type: 'radial',
        colors: [
          { stop: 0, color: 'rgba(165, 243, 252, 0.55)' },
          { stop: 0.55, color: 'rgba(56, 189, 248, 0.12)' },
          { stop: 1, color: 'transparent' },
        ],
        startX: 960 * 0.28,
        startY: 540 * 0.62,
        startRadius: 0,
        endX: 960 * 0.22,
        endY: 540 * 0.58,
        endRadius: 380,
      },
    },
  ],
  patternBg: {
    type: 'waves',
    color: 'rgba(224, 242, 254, 0.14)',
    secondaryColor: 'rgba(14, 116, 144, 0.28)',
    size: 42,
    spacing: 10,
    rotation: 0,
    blendMode: 'overlay',
    opacity: 0.48,
  },
  noiseBg: { intensity: 0.085 },
  borderRadius: 20,
  stroke: {
    width: 1,
    color: 'rgba(207, 250, 254, 0.2)',
    style: 'solid',
    borderRadius: 20,
  },
  shadow: {
    color: 'rgba(56, 189, 248, 0.25)',
    offsetY: 26,
    blur: 52,
    opacity: 0.75,
    borderRadius: 20,
  },
});

return canvas.buffer;`;

const CRYSTAL_FOG_JS = CRYSTAL_FOG_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const CROSSWEAVE_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

const canvas = await painter.createCanvas({
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

return canvas.buffer;`;

const CROSSWEAVE_JS = CROSSWEAVE_TS.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

/** Preview files live under `public/gallery-outputs/backgrounds/`. */
export const legacyBackgroundSnippetBuilds: { rel: string; ts: string }[] = [
  { rel: 'backgrounds/bg-chromatic-depth.png', ts: CHROMATIC_TS },
  { rel: 'backgrounds/bg-crt-ghost.png', ts: CRT_TS },
  { rel: 'backgrounds/bg-solstice-silk.png', ts: SOLSTICE_TS },
  { rel: 'backgrounds/bg-hex-stage.png', ts: HEX_TS },
  { rel: 'backgrounds/bg-tideglass.png', ts: TIDE_TS },
  { rel: 'backgrounds/bg-aurora-grid.png', ts: AURORA_GRID_TS },
  { rel: 'backgrounds/bg-molten-core.png', ts: MOLTEN_CORE_TS },
  { rel: 'backgrounds/bg-crystal-fog.png', ts: CRYSTAL_FOG_TS },
];

export type BackgroundGalleryCard = GalleryCardBase & {
  category: 'background';
  code: { ts: string; js: string };
};

export const backgroundGalleryItems: BackgroundGalleryCard[] = [
  {
    id: 'bg-chromatic-depth',
    title: 'Depth Field — stacked light',
    category: 'background',
    description:
      '**Depth without bitmaps.** A dark **`gradientBg`** base, two luminous **`bgLayers`** blended with screen and soft-light, grain folded into the stack, then a closing **`noiseBg`** pass.\n\n**Takeaway:** Demonstrates how layered gradients read as physical light rather than a flat poster—good for hero strips and product chrome.',
    thumbnail: '/gallery-outputs/backgrounds/bg-chromatic-depth.png',
    featured: true,
    code: { ts: CHROMATIC_TS, js: CHROMATIC_JS },
  },
  {
    id: 'bg-crt-ghost',
    title: 'CRT Ghost — phosphor haze',
    category: 'background',
    description:
      '**CRT-era atmosphere, fully procedural.** Warm radial glows, a rotated dot **`patternBg`**, and stronger **`noiseBg`** emulate phosphor and scan vibes—no textures shipped.\n\n**Takeaway:** Pairs well with devtools, terminals, or retro-future UI framing where you want mood without photography.',
    thumbnail: '/gallery-outputs/backgrounds/bg-crt-ghost.png',
    featured: true,
    code: { ts: CRT_TS, js: CRT_JS },
  },
  {
    id: 'bg-solstice-silk',
    title: 'Solstice Silk — conic over sunset',
    category: 'background',
    description:
      '**Dual gradient personalities in one pass.** A warm linear-band **`gradientBg`** carries the mood while a conic sweep in **`bgLayers`** acts as a focused highlight.\n\n**Takeaway:** Useful when you want directional warmth plus a controlled hotspot—conic as garnish, not the entire field.',
    thumbnail: '/gallery-outputs/backgrounds/bg-solstice-silk.png',
    code: { ts: SOLSTICE_TS, js: SOLSTICE_JS },
  },
  {
    id: 'bg-hex-stage',
    title: 'Hex Stage — lattice + neon rim',
    category: 'background',
    description:
      '**Stage-lit frame on a hex lattice.** Radial void, cyan **`patternBg`** hex mesh, then **`stroke.gradient`** plus tinted **`shadow`** sell rim lighting around the card.\n\n**Takeaway:** High-energy hero backdrop when you need structure and glow without stock imagery.',
    thumbnail: '/gallery-outputs/backgrounds/bg-hex-stage.png',
    featured: true,
    code: { ts: HEX_TS, js: HEX_JS },
  },
  {
    id: 'bg-tideglass',
    title: 'Tideglass — waves on teal',
    category: 'background',
    description:
      '**Calm editorial surf.** Cool linear **`gradientBg`**, a restrained radial bloom in **`bgLayers`**, and **`patternBg`** waves with soft-light blending hint at motion.\n\n**Takeaway:** Maritime calm for landing sections—everything stays inside `createCanvas`, zero bitmap dependencies.',
    thumbnail: '/gallery-outputs/backgrounds/bg-tideglass.png',
    code: { ts: TIDE_TS, js: TIDE_JS },
  },
  {
    id: 'bg-aurora-grid',
    title: 'Aurora lattice — grid over dual radials',
    category: 'background',
    description:
      '**UI-native lattice over aurora bases.** Split-tone linear **`gradientBg`**, stacked cyan radial and pink linear sweeps in **`bgLayers`**, capped with **`patternBg`** grid and **`noiseBg`**.\n\n**Takeaway:** Structured overlays keep dashboards and marketing shells feeling deliberate rather than decorative.',
    thumbnail: '/gallery-outputs/backgrounds/bg-aurora-grid.png',
    featured: true,
    code: { ts: AURORA_GRID_TS, js: AURORA_GRID_JS },
  },
  {
    id: 'bg-molten-core',
    title: 'Molten core — conic ember field',
    category: 'background',
    description:
      '**Molten halo composition.** Radial inferno **`gradientBg`**, ember **`conic`** ring via **`bgLayers`**, warm **`patternBg`** dots, and a **`stroke.gradient`** rim.\n\n**Takeaway:** Punchy hero energy while staying entirely vector-driven—great when marketing wants heat without photography.',
    thumbnail: '/gallery-outputs/backgrounds/bg-molten-core.png',
    code: { ts: MOLTEN_CORE_TS, js: MOLTEN_CORE_JS },
  },
  {
    id: 'bg-crystal-fog',
    title: 'Crystal fog — waves + heavy grain',
    category: 'background',
    description:
      '**Frosted drift + grain.** Cool diagonal **`gradientBg`**, icy radial **`bgLayers`** with blend mode **`lighter`**, **`patternBg`** waves, aggressive **`noiseBg`**, and a tinted **`shadow`** skirt.\n\n**Takeaway:** Mimics frosted glass lighting for premium SaaS heroes—still one canvas export.',
    thumbnail: '/gallery-outputs/backgrounds/bg-crystal-fog.png',
    code: { ts: CRYSTAL_FOG_TS, js: CRYSTAL_FOG_JS },
  },
  {
    id: 'bg-crossweave-noir',
    title: 'Crossweave noir · crosses pattern',
    category: 'background',
    description:
      '**Fine cross hatch over indigo depth.** Linear **`gradientBg`**, **`patternBg`** **`crosses`** with dual ink colors, **`noiseBg`**, rim **`stroke`**, and lift **`shadow`**.\n\n**Takeaway:** Alternative to dots/grid when you want textile-like structure—still zero external bitmaps.',
    thumbnail: '/gallery-outputs/backgrounds/bg-crossweave-noir.png',
    code: { ts: CROSSWEAVE_TS, js: CROSSWEAVE_JS },
  },
  ...canvasBackgroundPipelineGalleryItems,
];
