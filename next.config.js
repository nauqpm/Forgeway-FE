const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  outputFileTracingRoot: path.join(__dirname),
  output: "standalone",
};

const serverUrl = process.env.NEXT_PUBLIC_API_URL;

if (!serverUrl?.startsWith("http")) {
  console.log("Server backend URL: " + serverUrl);
}

// Add rewrites dynamically
nextConfig.rewrites = async () => {
  return [
    {
      source: "/uploads/:path*",
      destination: `${serverUrl}/uploads/:path*`,
    },
    {
      source: "/imageapi/:path*",
      destination: `${serverUrl}/imageapi/:path*`,
    },
  ];
};

module.exports = nextConfig;
