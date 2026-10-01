import type { NextConfig } from "next"

import { syncModels, watchModels } from "./scripts/sync-models.mjs"

// Keep the model barrel + registry items in sync with generation/catalog/models/*.
syncModels()
if (process.env.NODE_ENV === "development") watchModels()

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    // The Turbopack build cache stores the values of every env var read while
    // building. On Netlify that wrote HF_API_KEY into `.next/cache` and the
    // secrets scanner (rightly) failed the deploy. Server keys must only exist
    // at runtime, so the persistent build cache stays off.
    turbopackFileSystemCacheForBuild: false,
  },
}

export default nextConfig
