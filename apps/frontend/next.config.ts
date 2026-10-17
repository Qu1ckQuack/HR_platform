import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "node:path";
import { getBackendUrl } from "./src/lib/backend-url";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@hr-platform/shared"],
  experimental: { proxyClientMaxBodySize: "100mb" },
  async rewrites() {
    const backendUrl = getBackendUrl();
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
