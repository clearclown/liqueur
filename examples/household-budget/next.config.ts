import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@liqueur/protocol', '@liqueur/react', '@liqueur/ai-provider'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@liqueur/protocol': path.resolve(__dirname, '../../packages/protocol/src'),
      '@liqueur/react': path.resolve(__dirname, '../../packages/react/src'),
      '@liqueur/ai-provider': path.resolve(__dirname, '../../packages/ai-provider/src'),
    };
    return config;
  },
};

export default nextConfig;
