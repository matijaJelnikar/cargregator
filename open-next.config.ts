import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Prerendered pages come from static assets; on-demand renders are kept in the colo's Cache API.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(staticAssetsIncrementalCache, { mode: "long-lived" }),
  enableCacheInterception: true,
});
