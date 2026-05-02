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
    serverComponentsExternalPackages: ['apexify.js', '@napi-rs/canvas'],
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

