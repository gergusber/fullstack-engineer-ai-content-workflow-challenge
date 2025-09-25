import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Specify the correct root directory for file tracing
  outputFileTracingRoot: "/Users/gerbertea/Projects/fullstack-engineer-ai-content-workflow-challenge/frontend",

  // Ensure standalone output for Docker
  output: "standalone",

  // Configure experimental features
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ["@tanstack/react-query"]
  }
};

export default nextConfig;
