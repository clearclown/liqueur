import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@liqueur/protocol', '@liqueur/react'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@liqueur/protocol': path.resolve(__dirname, '../protocol/src'),
      '@liqueur/react': path.resolve(__dirname, '../react/src'),
    };
    return config;
  },
};

export default nextConfig;
