import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses with gzip — reduces JS/HTML payload size
  compress: true,

  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // Static files (fonts, images, etc.) — cache for 1 year
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
