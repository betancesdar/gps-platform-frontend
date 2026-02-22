import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Generates a minimal standalone server for Docker deployments.
  // Only the necessary files are included in the image.
  output: "standalone",
};

export default nextConfig;

