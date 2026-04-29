/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,

  // Allow images from any HTTPS source (company logos, avatars)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },

  // Proxy /api calls to FastAPI backend in dev
  async rewrites() {
    return [
      {
        source:      "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/:path*`,
      },
    ];
  },

  // Suppress hydration warnings from browser extensions
  experimental: {
    optimizePackageImports: ["zustand"],
  },
};