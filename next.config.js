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
};

const serverUrl = process.env.NEXT_PUBLIC_API_URL;

if (!serverUrl?.startsWith("http")) {
  throw new Error("NEXT_PUBLIC_SERVER_URL must start with http:// or https://");
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
