const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

/**
 * Native / sibling optional deps are never pulled in by static analysis alone.
 * Covers Vercel Linux **glibc + musl**, **x64 + arm64** (match lockfile package names).
 */
const galleryRunNativeIncludes = [
  './node_modules/tsx/**/*',
  './node_modules/esbuild/**/*',
  './node_modules/@esbuild/linux-x64/**/*',
  './node_modules/@esbuild/linux-arm64/**/*',
  './node_modules/get-tsconfig/**/*',
  './node_modules/resolve-pkg-maps/**/*',
  './node_modules/apexify.js/**/*',
  './node_modules/@napi-rs/canvas/**/*',
  './node_modules/@napi-rs/canvas-linux-x64-gnu/**/*',
  './node_modules/@napi-rs/canvas-linux-arm64-gnu/**/*',
  './node_modules/@napi-rs/canvas-linux-x64-musl/**/*',
  './node_modules/@napi-rs/canvas-linux-arm64-musl/**/*',
  './node_modules/sharp/**/*',
  './node_modules/@img/sharp-linux-x64/**/*',
  './node_modules/@img/sharp-linux-arm64/**/*',
  './node_modules/@img/sharp-linuxmusl-x64/**/*',
  './node_modules/@img/sharp-linuxmusl-arm64/**/*',
  './node_modules/@img/sharp-libvips-linux-x64/**/*',
  './node_modules/@img/sharp-libvips-linux-arm64/**/*',
  './node_modules/@img/sharp-libvips-linuxmusl-x64/**/*',
  './node_modules/@img/sharp-libvips-linuxmusl-arm64/**/*',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  experimental: {
    serverComponentsExternalPackages: ['apexify.js', '@napi-rs/canvas'],
    /**
     * Gallery `/api/gallery/run` spawns `tsx` + loads apexify by path. Include toolchain +
     * native optional deps (see `galleryRunNativeIncludes`). Pure-JS deps follow `import 'apexify.js'` in the route.
     */
    outputFileTracingIncludes: {
      '/app/api/gallery/run': galleryRunNativeIncludes,
    },
  },
  webpack: (config, { dev, isServer }) => {
    // Windows dev: HMR + antivirus can delete numbered chunk files while webpack-runtime still references them
    // (`Cannot find module './276.js'`). Disable chunk splitting in dev + avoid `next/dynamic` on /gallery for fewer async chunks.
    if (dev) {
      config.cache = false;
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        runtimeChunk: false,
      };
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

module.exports = withMDX(nextConfig)

