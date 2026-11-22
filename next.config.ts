import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/stream",
        destination: "http://localhost:8000/stream",
      },
    ];
  },
};

export default nextConfig;
