import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["offline-geocode-city"],
  allowedDevOrigins: ["*.trycloudflare.com"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    middlewareClientMaxBodySize: "50mb" as unknown as number,
  },
};

export default nextConfig;
