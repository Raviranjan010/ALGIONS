import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Avoid build breaks during deployment if minor lint rules trigger
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Maintain strict TS
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
