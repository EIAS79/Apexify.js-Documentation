/**
 * Background gallery cards for the `createCanvas` pipeline (`transparentBase`, `bgLayers.presetPattern`, base + top patterns).
 * Snippets import **only** `apexify.js`. Previews: static PNGs under `public/gallery-outputs/backgrounds/`.
 */
import type { GalleryCardBase } from '../core/galleryTypes';

type BackgroundGalleryCard = GalleryCardBase & {
  category: 'background';
  code: { ts: string; js: string };
};

const W = 960;
const H = 540;

const toJs = (ts: string) => ts.replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');

const slateGradient = `{
    type: 'linear',
    startX: 0,
    startY: 0,
    endX: ${W},
    endY: ${H},
    rotate: 36,
    colors: [
      { stop: 0, color: '#020617' },
      { stop: 0.5, color: '#0f172a' },
      { stop: 1, color: '#1e1b4b' },
    ],
  }`;

const PIPELINE_TRANSPARENT_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const canvas = await painter.createCanvas({
    width: ${W},
    height: ${H},
    transparentBase: true,
    bgLayers: [{ type: 'gradient', value: ${slateGradient}, opacity: 1 }],
  });
  return canvas.buffer;
}

return await main();
`;

const PIPELINE_DOTS_MULTIPLY_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const slate = ${slateGradient};

  const canvas = await painter.createCanvas({
    width: ${W},
    height: ${H},
    transparentBase: true,
    bgLayers: [
      { type: 'gradient', value: slate, opacity: 1 },
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
  return canvas.buffer;
}

return await main();
`;

const PIPELINE_GRID_CROSSES_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const slate = ${slateGradient};

  const canvas = await painter.createCanvas({
    width: ${W},
    height: ${H},
    gradientBg: slate,
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
  return canvas.buffer;
}

return await main();
`;

const PIPELINE_COLOR_STRIPES_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const canvas = await painter.createCanvas({
    width: ${W},
    height: ${H},
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
  return canvas.buffer;
}

return await main();
`;

const PIPELINE_FRAMED_CHROME_TS = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

async function main() {
  const canvas = await painter.createCanvas({
    width: ${W},
    height: ${H},
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: ${W},
      endY: ${H},
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
  return canvas.buffer;
}

return await main();
`;

export const canvasBackgroundPipelineGalleryItems: BackgroundGalleryCard[] = [
  {
    id: 'bg-pipeline-transparent-gradient',
    title: 'Pipeline · transparentBase + gradient layer',
    category: 'background',
    description:
      '**Skip the default `#000` base** with **`transparentBase: true`**, then paint **`bgLayers[0]`** as a linear gradient—same stack order as the library: base → **`bgLayers`** → **`patternBg`** → **`noiseBg`**.\n\n**Takeaway:** Useful for PNG alpha or compositing; avoids a black flash under the first layer.',
    thumbnail: '/gallery-outputs/backgrounds/bg-pipeline-transparent-gradient.png',
    featured: true,
    code: { ts: PIPELINE_TRANSPARENT_TS, js: toJs(PIPELINE_TRANSPARENT_TS) },
  },
  {
    id: 'bg-pipeline-layer-dots-multiply',
    title: 'Pipeline · presetPattern dots (multiply)',
    category: 'background',
    description:
      '**`bgLayers`** can carry **`presetPattern`** (built-ins share the same vocabulary as **`patternBg`**). Here gradient + **dots** with **`blendMode: \'multiply\'`**, then **`noiseBg`**.\n\n**Takeaway:** Layer-local **`blendMode`** tints the slab without changing the whole canvas composite.',
    thumbnail: '/gallery-outputs/backgrounds/bg-pipeline-layer-dots-multiply.png',
    code: { ts: PIPELINE_DOTS_MULTIPLY_TS, js: toJs(PIPELINE_DOTS_MULTIPLY_TS) },
  },
  {
    id: 'bg-pipeline-gradient-grid-crosses',
    title: 'Pipeline · gradientBg + preset grid + crosses',
    category: 'background',
    description:
      '**Classic stack:** **`gradientBg`** as the opaque base, **`presetPattern`** grid inside **`bgLayers`**, top **`patternBg`** crosses, light **`noiseBg`**.\n\n**Takeaway:** Shows how **`presetPattern`** (layer stack) differs from **`patternBg`** (single overlay pass after layers).',
    thumbnail: '/gallery-outputs/backgrounds/bg-pipeline-gradient-grid-crosses.png',
    featured: true,
    code: { ts: PIPELINE_GRID_CROSSES_TS, js: toJs(PIPELINE_GRID_CROSSES_TS) },
  },
  {
    id: 'bg-pipeline-color-stripes',
    title: 'Pipeline · colorBg + stripes preset',
    category: 'background',
    description:
      '**Solid **`colorBg`** + **`presetPattern`** stripes** (`screen` blend) and grain.\n\n**Takeaway:** **`stripes`** respects **`secondaryColor`** for alternating bands—good for low-noise texture over flat ink.',
    thumbnail: '/gallery-outputs/backgrounds/bg-pipeline-color-stripes.png',
    code: { ts: PIPELINE_COLOR_STRIPES_TS, js: toJs(PIPELINE_COLOR_STRIPES_TS) },
  },
  {
    id: 'bg-pipeline-framed-chrome',
    title: 'Pipeline · framed slab (crosses + stroke + shadow)',
    category: 'background',
    description:
      '**One exportable card:** linear **`gradientBg`**, **`patternBg`** crosses, **`noiseBg`**, rounded clip **`borderRadius`**, rim **`stroke`**, drop **`shadow`**.\n\n**Takeaway:** Matches the “hero slab” pattern—chrome happens after the fill stack, still inside **`createCanvas`**.',
    thumbnail: '/gallery-outputs/backgrounds/bg-pipeline-framed-chrome.png',
    featured: true,
    code: { ts: PIPELINE_FRAMED_CHROME_TS, js: toJs(PIPELINE_FRAMED_CHROME_TS) },
  },
];
