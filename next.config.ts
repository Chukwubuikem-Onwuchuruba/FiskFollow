/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are now enabled by default in Next.js 15
  // Remove the experimental.serverActions flag entirely

  // Move serverComponentsExternalPackages to the top level
  serverExternalPackages: ["mongoose"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    // Remove typescript from images object - this needs to be at root level
  },
  // Move typescript config to root level
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
