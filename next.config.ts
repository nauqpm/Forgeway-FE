import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Fix: specify correct workspace root to avoid confusion from
  // stray package-lock.json files in parent directories
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;