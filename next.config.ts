import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["offline-geocode-city"],
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
