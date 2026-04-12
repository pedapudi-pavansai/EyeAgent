import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // App lives in `app/` under the repo root; trace files from the monorepo root for Vercel/serverless bundles.
  outputFileTracingRoot: path.join(appDir, ".."),
};

export default nextConfig;
