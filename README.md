# Sampling For Good Marketplace

This is the single canonical GitHub source for the Sampling For Good Marketplace.

- **Live Marketplace:** https://sampling-for-good-marketplace.vercel.app/
- **Vercel production project:** `sampling-for-good-marketplace`
- **Production branch:** `main`
- **Current Vercel root directory:** `marketplace-preview/` (historical internal folder name; not a separate application).
- **Supabase project ref:** `yxfqfrgjjbxagrioeqzz` (marketplace account, chapter, brand, proposal and messaging data).
- **Original distribution/legacy site:** `samplingforgood-b5ld` (being retired).

## Important: sample-request backend migration pending

The Marketplace currently routes `/api/sample-request` to the legacy `samplingforgood-b5ld` Vercel API using the rewrite in `marketplace-preview/vercel.json`. That older Vercel project holds protected email, database service, and rate-limit environment variables.

**Do not delete `samplingforgood-b5ld` until this API is migrated to the Marketplace, its protected environment variables are configured there, and a live submission test passes.** The root-level `api/sample-request.js` implements this API.

This repo contains the historical original `public/` application as well as the Marketplace. The public Marketplace is the only active development target. The backend and legacy code will be consolidated after the API migration.

Only commit/deploy changes on explicit authorization. Standalone demos are not the development target.
