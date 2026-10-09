import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@hr-platform/shared"],
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
