import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["offline-geocode-city"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
