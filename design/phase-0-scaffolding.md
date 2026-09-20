# Phase 0: Project Scaffolding — 實施細節

> 狀態: ✅ Done。本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Step 0.1: Initialize Next.js Project
- Run `npx create-next-app@latest they-see-your-photo --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (ran in temp dir then merged, since project dir already had docs + git)
- Verify project runs with `npm run dev`
- Clean up default page content (remove starter code from `page.tsx`)

## Step 0.2: Install Dependencies
- UI framework: `npm install @mui/material @mui/icons-material @emotion/react @emotion/styled` (MUI v9)
- AI (browser): `npm install @huggingface/transformers`
- EXIF: `npm install exifr`
- Image compression: `npm install browser-image-compression`
- Map: `npm install react-leaflet leaflet` + `npm install -D @types/leaflet` (react-leaflet v5, requires React 19 ✓)
- Utilities: `npm install idb` (IndexedDB wrapper for model caching)

## Step 0.3: Configure Tailwind + MUI
- Tailwind v4 (CSS-first, no `tailwind.config.js` needed) — verified MUI v9 coexists without extra config
- Create `src/styles/theme.ts` — MUI dark theme config
- Update `src/app/layout.tsx` — wrap with MUI ThemeProvider + CssBaseline (via `src/components/ThemeProviders.tsx` client boundary)

## Step 0.4: Create Base Types
- Create `src/lib/types.ts` — all shared TypeScript interfaces:
  - `AnalysisRequest`, `AnalysisResponse`
  - `ProviderConfig`, `AIProvider`
  - `EXIFData`, `AppSettings`
  - `ModelInfo`, `DownloadProgress`

## Step 0.5: Configure for Static Export
- Update `next.config.ts`:
  ```ts
  const nextConfig: NextConfig = {
    output: "export",         // Static export for Cloudflare Pages / HF Spaces
    images: { unoptimized: true }  // Required for static export
  }
  ```
- Verify `npm run build` produces `/out` directory (includes 404.html for Cloudflare)
- Verify `/out` can be served locally (served + HTTP 200)
- Note: API routes (`src/app/api/`) will NOT work in static export mode
  - API mode: frontend fetches user's llama-server URL directly (no server proxy)
  - WebGPU mode: fully functional (runs in browser)
