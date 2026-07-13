import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which a phone-camera bill photo easily exceeds —
      // that's what was causing "server error" on expense bill uploads.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
