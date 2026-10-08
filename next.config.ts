import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // إيقاف الاعتراض على searchParams و Date.now()
  },
};

export default nextConfig;