import type { NextConfig } from "next";

const isExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  output: isExport ? "export" : "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const headersList = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
    ];

    if (isProd) {
      headersList.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
    }

    return [{ source: "/:path*", headers: headersList }];
  },
};

export default nextConfig;
