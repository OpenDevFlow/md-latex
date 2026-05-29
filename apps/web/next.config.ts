import type { NextConfig } from 'next';

const isGithubActions = process.env.GITHUB_ACTIONS || process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubActions ? '/md-latex' : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@md-latex/transpiler'],
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
  },
};

export default nextConfig;
