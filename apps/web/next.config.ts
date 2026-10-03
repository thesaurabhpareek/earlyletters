import type { NextConfig } from 'next';

// Owner: E1 (web platform). Headers, redirects and well-known files are added by E1.
// NEXT_DIST_DIR lets parallel agents run their own dev servers without sharing .next.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@scribe/brand', '@scribe/design-tokens'],
};

export default nextConfig;
