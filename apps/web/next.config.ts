import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@md-latex/transpiler'],
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
  },
};

export default nextConfig;
