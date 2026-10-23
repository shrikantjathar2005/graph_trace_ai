import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // GitHub Pages hosts this repository under its /<repo> path.
  ...(process.env.GITHUB_ACTIONS === "true"
    ? { basePath: `/${process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "graph_trace_ai"}` }
    : {}),
};

export default nextConfig;
