import path from "node:path";

import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  // The Prisma client and shared packages live outside apps/web. Trace from the
  // repository root so Vercel includes them in the serverless bundles.
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
};

export default withVarlock(nextConfig);
