import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@liqueur/protocol', '@liqueur/react'],
};

export default nextConfig;
