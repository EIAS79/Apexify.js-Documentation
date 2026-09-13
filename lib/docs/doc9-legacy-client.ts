function slug(value: string): string {
  return value.replace(/^\d+-/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

const START = new Set(['00-beginner-guide','01-install-and-setup','02-your-first-image','03-how-buffers-work','04-save-and-export','05-common-mistakes','01-feature-tracks']);
const RECIPES = new Set(['00-recipes-overview','01-what-you-can-build','02-philosophy-goals-and-when-to-use','recipe-share-card']);
const BATCH_SAVE = new Set(['00-batch-save-output-overview','01-save-disk-and-multiple','02-output-format-and-outPut','03-imgur-output-security']);
const VIDEO_MAIN = new Set(['00-video-overview','01-metadata-and-frames','02-transcode-trim-transform','03-audio','04-effects-overlays','05-compose-and-build','06-advanced-presets-transitions','07-video-creation-options-matrix','08-imperative-video-helpers','09-security-runtime-configuration']);
const VIDEO_OPTIONS = new Set(['00-video-options-hub','01-discovery-metadata','02-frame-extraction','03-transcode-export','04-timeline-edits','05-geometry','06-audio-deep-dive','07-visual-filters','08-text-overlays','09-compositing','10-advanced-ops','11-on-progress']);
const ADVANCED_ROOT = new Set(['00-advanced-overview','01-runtime-resource-governance','02-security-deployment','03-performance-memory','04-migration-v6']);
const ADVANCED_AUDIO = new Set(['00-audio-advanced-hub','01-create-audio']);
const ADVANCED_COMPOSITION = new Set(['00-composition-hub','01-named-assets','02-templates','03-preset-components','04-plugins','05-imperative-batch-chain-assets']);
const ADVANCED_VIDEO = new Set(['00-video-advanced-hub','01-video-pipeline']);
const RASTER_BATCH = new Set(['00-raster-batch-output-overview','01-batch-and-chain','02-save-disk','03-output-format-and-encoding','04-image-stitch-and-collage','05-image-compress-and-palette','06-image-resize-convert-effects','07-image-blend-mask-crop-gradient','08-pixel-data','09-path2d-draw-and-custom-lines','10-hit-detection']);

/**
 * Client-safe canonical map for the legacy hash corpus. Keep this implementation
 * free of fs/server imports because LegacyDocsRedirectIsland consumes it.
 * scripts/docs/doc9-generate.ts verifies every migration record against it.
 */
export function resolveDoc9LegacyIdentity(identity: string): string | null {
  if (identity === 'README') return '/docs/overview';
  if (identity === '00-start-here' || identity === 'start-here' || identity === 'Getting-Started') return '/docs/getting-started';
  if (identity === '00-create-canvas-overview') return '/docs/node/canvas';
  if (identity === '01-canvas-size-and-coordinates') return '/docs/node/canvas/size-and-coordinates';
  if (identity === 'changelog' || identity === 'Change-Log' || identity === '01-5.4.5-remote-image-hotfix') return '/docs/migration/changelog';
  if (identity === '00-internals-overview') return '/docs/architecture/internals-overview';
  if (identity === 'feature-guides-hub') return '/docs/node/feature-guides-hub';
  if (identity === 'create-charts') return '/docs/node/charts/charts-overview';
  if (identity === 'create-gifs') return '/docs/node/gif-animation/create-gif-overview';
  if (identity === 'create-videos') return '/docs/node/video-ffmpeg/video-overview';
  if (identity === 'api-index' || identity.startsWith('api-') || identity === 'canvas-utils-and-types' || identity === 'package-surface') return '/api-reference';
  if (START.has(identity)) return `/docs/start/${slug(identity)}`;
  if (RECIPES.has(identity)) return `/docs/recipes/${slug(identity)}`;
  if (BATCH_SAVE.has(identity)) return `/docs/node/batch-save-output/${slug(identity)}`;
  if (VIDEO_OPTIONS.has(identity)) return `/docs/node/video-ffmpeg/options/${slug(identity)}`;
  if (VIDEO_MAIN.has(identity)) return `/docs/node/video-ffmpeg/${slug(identity)}`;
  if (ADVANCED_ROOT.has(identity)) return `/docs/advanced/${slug(identity)}`;
  if (ADVANCED_AUDIO.has(identity)) return `/docs/advanced/audio/${slug(identity)}`;
  if (ADVANCED_COMPOSITION.has(identity)) return `/docs/advanced/composition/${slug(identity)}`;
  if (ADVANCED_VIDEO.has(identity)) return `/docs/advanced/video/${slug(identity)}`;
  if (/scene/.test(identity)) return `/docs/advanced/scene/${slug(identity)}`;
  if (RASTER_BATCH.has(identity)) return `/docs/node/raster-batch-output/${slug(identity)}`;
  if (/canvas|background|stroke-options|shadow-options|paint-order/.test(identity) && !/text|image/.test(identity)) return `/docs/node/canvas/${slug(identity)}`;
  if (/chart/.test(identity)) return `/docs/node/charts/${slug(identity)}`;
  if (/gif|animate-api/.test(identity)) return `/docs/node/gif-animation/${slug(identity)}`;
  if (/create-image|shapes-reference|remote-image/.test(identity)) return `/docs/node/images-shapes/${slug(identity)}`;
  if (/custom-line|create-custom-api|path2d|hit-testing-paths/.test(identity)) return `/docs/node/lines-connectors/${slug(identity)}`;
  if (/create-text|measure-text/.test(identity)) return `/docs/node/text-rendering/${slug(identity)}`;
  return null;
}
