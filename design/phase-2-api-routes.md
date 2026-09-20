# Phase 2: Backend API Routes — 實施細節

> 狀態: ✅ Done。本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Step 2.1: Unified Analysis Endpoint
- Create `src/app/api/analyze/route.ts`
- Accept `POST` with multipart/form-data:
  - `file` (Blob)
  - `filename` (string)
  - `created` (optional string)
  - `latitude` (optional number)
  - `longitude` (optional number)
  - `camera` (optional string)
  - `language` (string)
  - `provider` (string — which AI provider to use)
  - `providerConfig` (JSON string — provider settings)
- Route to correct provider's `analyze()` method
- Return `{ success, data, error, provider, model, latency }`
- Error handling: connection refused (502), unknown provider (400), not-implemented (501), webgpu-via-API rejected (400)
- CORS headers for cross-origin llama-server calls

## Step 2.2: Reverse Geocode Endpoint
- Create `src/app/api/reverse-geocode/route.ts`
- Accept `GET` with query params: `lat`, `lon`
- Call Nominatim API (uses `format=jsonv2`, the current format; `json` is deprecated)
- Return `{ address, country, city }`
- Cache results in memory (verified: 1.3s → 0.012s on repeat)
- Validates lat/lon range; 400 on missing/out-of-range

## Build-mode note (discovered in Phase 2)

Next.js 16 static export (`output: 'export'`) **cannot compile** route handlers that read the `Request` (both `POST /api/analyze` and `GET /api/reverse-geocode` fail the export build). Since the static Cloudflare/HF deployment doesn't need these routes (WebGPU runs in-browser; API mode calls the user's own llama-server directly), the build is split into two modes:

- `npm run build` → self-hosted, keeps API routes (dynamic, served by `next start`)
- `npm run build:export` → runs `scripts/build-export.mjs`, which temporarily moves `src/app/api` out of the app tree, builds with `NEXT_STATIC_EXPORT=1`, then restores it (try/finally). Produces `/out` for Cloudflare/HF.

`next.config.ts` reads `NEXT_STATIC_EXPORT=1` to toggle `output: 'export'`.
