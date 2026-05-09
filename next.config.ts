import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["offline-geocode-city"],
  allowedDevOrigins: ["*.trycloudflare.com"],
  serverActions: {
    bodySizeLimit: "50mb",
  },
};

export default nextConfig;
