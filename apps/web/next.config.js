/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained output in .next/standalone — copies only the
  // files the app actually imports, so the Docker image is ~200 MB instead
  // of ~1 GB. Required for the web Dockerfile.
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
};

module.exports = nextConfig;
