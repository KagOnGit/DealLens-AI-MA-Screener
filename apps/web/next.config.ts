// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Skip ESLint during `next build`
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TS type-check during `next build` (CI/Vercel)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;