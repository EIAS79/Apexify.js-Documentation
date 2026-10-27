const path = require('node:path')

/**
 * Trace only the native packages for the build/runtime architecture.
 *
 * The previous list forced glibc + musl and x64 + arm64 copies of canvas/sharp
 * into one serverless function. Together with Deno + FFmpeg that pushed
 * /api/gallery/run above Vercel's 250 MB uncompressed function limit.
 *
 * Studio production execution no longer uses the trusted-local tsx runner, so
 * tsx/esbuild do not need to be forced into the production function either.
 */
function linuxNativeRuntimeIncludes() {
  if (process.platform !== 'linux') return []

  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const report = typeof process.report?.getReport === 'function'
    ? process.report.getReport()
    : null
  const glibc = Boolean(report?.header?.glibcVersionRuntime)
  const libc = glibc ? 'gnu' : 'musl'
  const sharpPlatform = glibc ? `linux-${arch}` : `linuxmusl-${arch}`

  return [
    `./node_modules/@napi-rs/canvas-linux-${arch}-${libc}/**/*`,
    `./node_modules/@img/sharp-${sharpPlatform}/**/*`,
    `./node_modules/@img/sharp-libvips-${sharpPlatform}/**/*`,
  ]
}

const galleryRunNativeIncludes = [
  './node_modules/dejavu-fonts-ttf/**/*',
  './node_modules/apexify.js/**/*',
  './node_modules/@napi-rs/canvas/**/*',
  './node_modules/sharp/**/*',
  ...linuxNativeRuntimeIncludes(),
  // Deployment payloads contain gzip-compressed executables. The route
  // hydrates them lazily into /tmp on the first isolated/media run.
  './vendor/studio-deno/**/*',
  './vendor/studio-ffmpeg/**/*',
  './scripts/studio/ffmpeg-proxy',
  './scripts/studio/ffprobe-proxy',
  './scripts/studio/media-process-proxy.mjs',
  './scripts/studio/media-process-proxy-cli.mjs',
]

const doc6SearchIncludes = [
  './generated/docs-doc6/search-records.json',
  './generated/docs-doc6/search-index-manifest.json',
  './generated/docs-doc6/related-content.json',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    serverComponentsExternalPackages: ['apexify.js', '@napi-rs/canvas'],
    /**
     * Gallery / Studio production execution uses the same-origin Deno runtime.
     * Include the pinned Apexify runtime plus only the native packages for this
     * build architecture (see `galleryRunNativeIncludes`).
     */
    /** Gallery + `/studio` (`POST /api/gallery/run`). */
    outputFileTracingIncludes: {
      '/app/api/gallery/run': galleryRunNativeIncludes,
      '/app/api/docs/search': doc6SearchIncludes,
    },
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@apexify/web'] = path.resolve(
      __dirname,
      'vendor/apexify-web/src/index.ts'
    );

    // Windows dev: HMR + antivirus can delete numbered chunk files while webpack-runtime still references them
    // (`Cannot find module './276.js'`). Disable chunk splitting in dev + avoid `next/dynamic` on /gallery for fewer async chunks.
    if (dev) {
      config.cache = false;
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        runtimeChunk: false,
      }
      // Fewer parallel builds → less chance of torn writes on Windows watchers (marginal; safe to remove if slow).
      if (process.platform === 'win32') {
        config.parallelism = Math.min(config.parallelism ?? 100, 4);
      }
    }
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        { 'apexify.js': 'commonjs apexify.js' },
        { '@napi-rs/canvas': 'commonjs @napi-rs/canvas' }
      );
    }
    return config;
  },
}

module.exports = nextConfig
