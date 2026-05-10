import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Ensure Vercel includes the content/ directory in the serverless
  // function bundle. Without this, fs.readFileSync calls fail in production
  // because Next.js only traces files that are statically imported.
  outputFileTracingIncludes: {
    "/**": [
      "./content/**/*.md",
      "./content/**/*.mdx",
      "./content/**/_meta.json",
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
