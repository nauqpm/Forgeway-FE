import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
  outputFileTracingRoot: path.join(__dirname),
  output: "standalone",
};

const serverUrl = process.env.NEXT_PUBLIC_API_URL;

nextConfig.rewrites = async () => [
  { source: "/uploads/:path*", destination: `${serverUrl}/uploads/:path*` },
  { source: "/imageapi/:path*", destination: `${serverUrl}/imageapi/:path*` },
];

export default nextConfig;
