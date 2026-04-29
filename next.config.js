const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  experimental: {
    serverComponentsExternalPackages: ['apexify.js', '@napi-rs/canvas', 'esbuild'],
    /** Ship ffmpeg-static binary with gallery API lambdas (apexify shells out to `ffmpeg`). */
    outputFileTracingIncludes: {
      '/api/gallery/**': ['./node_modules/ffmpeg-static/**/*'],
    },
  },
  webpack: (config, { dev, isServer }) => {
    // Windows dev: filesystem cache can reference stale numbered chunks (e.g. ./276.js MODULE_NOT_FOUND).
    if (dev) {
      config.cache = false;
    }
    // Dev server bundles: disable async chunk splitting so runtime never does require("./276.js").
    // (Otherwise HMR + antivirus can leave the manifest pointing at deleted chunk files.)
    if (dev && isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        runtimeChunk: false,
      };
    }
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        { 'apexify.js': 'commonjs apexify.js' },
        { '@napi-rs/canvas': 'commonjs @napi-rs/canvas' },
        { esbuild: 'commonjs esbuild' },
        { 'ffmpeg-static': 'commonjs ffmpeg-static' }
      );
    }
    return config;
  },
}

module.exports = withMDX(nextConfig)

