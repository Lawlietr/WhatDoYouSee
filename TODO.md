# TODO.md — Development Workflow

## Phase 0: Project Scaffolding

### Step 0.1: Initialize Next.js Project
- [x] Run `npx create-next-app@latest they-see-your-photo --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (ran in temp dir then merged, since project dir already had docs + git)
- [x] Verify project runs with `npm run dev`
- [x] Clean up default page content (remove starter code from `page.tsx`)

### Step 0.2: Install Dependencies
- [x] UI framework: `npm install @mui/material @mui/icons-material @emotion/react @emotion/styled` (MUI v9)
- [x] AI (browser): `npm install @huggingface/transformers`
- [x] EXIF: `npm install exifr`
- [x] Image compression: `npm install browser-image-compression`
- [x] Map: `npm install react-leaflet leaflet` + `npm install -D @types/leaflet` (react-leaflet v5, requires React 19 ✓)
- [x] Utilities: `npm install idb` (IndexedDB wrapper for model caching)

### Step 0.3: Configure Tailwind + MUI
- [x] Tailwind v4 (CSS-first, no `tailwind.config.js` needed) — verified MUI v9 coexists without extra config
- [x] Create `src/styles/theme.ts` — MUI dark theme config
- [x] Update `src/app/layout.tsx` — wrap with MUI ThemeProvider + CssBaseline (via `src/components/ThemeProviders.tsx` client boundary)

### Step 0.4: Create Base Types
- [x] Create `src/lib/types.ts` — all shared TypeScript interfaces:
  - `AnalysisRequest`, `AnalysisResponse`
  - `ProviderConfig`, `AIProvider`
  - `EXIFData`, `AppSettings`
  - `ModelInfo`, `DownloadProgress`

### Step 0.5: Configure for Static Export
- [x] Update `next.config.ts`:
  ```ts
  const nextConfig: NextConfig = {
    output: "export",         // Static export for Cloudflare Pages / HF Spaces
    images: { unoptimized: true }  // Required for static export
  }
  ```
- [x] Verify `npm run build` produces `/out` directory (includes 404.html for Cloudflare)
- [x] Verify `/out` can be served locally (served + HTTP 200)
- [x] Note: API routes (`src/app/api/`) will NOT work in static export mode
  - API mode: frontend fetches user's llama-server URL directly (no server proxy)
  - WebGPU mode: fully functional (runs in browser)

---

## Phase 1: Core Library (No React)

### Step 1.1: EXIF Parser
- [x] Create `src/lib/exif.ts`
- [x] Export `parseEXIF(file: File): Promise<EXIFData>`
- [x] Extract: `CreateDate`, `latitude`, `longitude`, `Make`, `Model`
- [x] Handle missing gracefully (return partial data, no errors) — try/catch returns `{}`

### Step 1.2: Image Compressor
- [x] Create `src/lib/compress.ts`
- [x] Export `compressImage(file: File): Promise<File>`
- [x] Config: `maxSizeMB: 0.5`, `maxWidthOrHeight: 3000`, `initialQuality: 0.8`
- [x] Skips compression when already under limit; falls back to original on error (HEIF handled via canvas if supported)

### Step 1.3: Provider Interface + llama-server Implementation
- [x] `AIProvider` interface lives in `src/lib/types.ts` (created in Step 0.4) rather than a separate `providers/types.ts` — kept central to match dependency graph
- [x] Create `src/lib/providers/llama-server.ts`:
  - `analyze()` — POST to `{baseUrl}/chat/completions` with image + prompt
  - `testConnection()` — GET `{baseUrl}/models`
  - System prompt for privacy analysis (see AGENTS.md → System Prompt section) → `system-prompt.ts`
  - Parse JSON response → `{ paras, table }` → `utils.ts` (`parseAnalysisJson`)
- [x] Create `src/lib/providers/registry.ts` — provider lookup + active provider
- [x] Create `src/lib/providers/defaults.ts` — default configs per provider
- [x] Added `src/lib/providers/utils.ts` (fileToDataURL + parseAnalysisJson) shared by providers

### Step 1.4: Placeholder Providers (Skeleton)
- [x] Create `src/lib/providers/openai.ts` — skeleton with TODO comments
- [x] Create `src/lib/providers/claude.ts` — skeleton with TODO comments
- [x] Create `src/lib/providers/grok.ts` — skeleton with TODO comments
- [x] Create `src/lib/providers/openrouter.ts` — skeleton with TODO comments
- [x] Register all in `registry.ts` with `enabled: false` flag (throw "not implemented" on use)

### Step 1.5: Settings Manager
- [x] Create `src/lib/settings-manager.ts`
- [x] `loadSettings(): AppSettings` — from localStorage (SSR-safe, merges over defaults)
- [x] `saveSettings(settings: AppSettings): void` — to localStorage
- [x] `getProviderConfig(id: string): ProviderConfig | null` (+ setProviderConfig)
- [x] Default settings: WebGPU mode, llama-server provider, English

### Step 1.6: WebGPU Inference Engine
- [x] Create `src/lib/providers/webgpu.ts` (lazy-loads @huggingface/transformers)
- [x] Check WebGPU availability: `navigator.gpu` (`isWebGpuSupported()`)
- [x] Load model: `AutoModelForImageTextToText.from_pretrained(MODEL_ID, { device: 'webgpu', dtype: 'q4' })`
- [x] Process image + prompt → return analysis (singleton pipeline, cached Promise)
- [x] Handle model not loaded / unsupported (throw clear error)
- [ ] ⚠ VERIFY at Phase 7.1: exact LFM2.5-VL input schema (`pixel_values`/`images` + chat template) needs a real WebGPU browser + downloaded model to confirm

### Step 1.7: Model Download Manager
- [x] Create `src/lib/download-manager.ts` (idb wrapper)
- [x] IndexedDB storage for model files
- [x] `hasModel(modelId): Promise<boolean>`
- [x] `downloadModel(modelId, url, onProgress, signal)` — streams via ReadableStream, returns ArrayBuffer
- [x] `deleteModel(modelId): Promise<void>` (+ clearModelCache, getModelBytes, cachedModelBytes)
- [x] Support `AbortController` for cancellation
- [x] Progress tracking: bytes downloaded, total size (speed/ETA computed in hook layer)

---

## Phase 2: Backend API Routes

### Step 2.1: Unified Analysis Endpoint
- [x] Create `src/app/api/analyze/route.ts`
- [x] Accept `POST` with multipart/form-data:
  - `file` (Blob)
  - `filename` (string)
  - `created` (optional string)
  - `latitude` (optional number)
  - `longitude` (optional number)
  - `camera` (optional string)
  - `language` (string)
  - `provider` (string — which AI provider to use)
  - `providerConfig` (JSON string — provider settings)
- [x] Route to correct provider's `analyze()` method
- [x] Return `{ success, data, error, provider, model, latency }`
- [x] Error handling: connection refused (502), unknown provider (400), not-implemented (501), webgpu-via-API rejected (400)
- [x] CORS headers for cross-origin llama-server calls

### Step 2.2: Reverse Geocode Endpoint
- [x] Create `src/app/api/reverse-geocode/route.ts`
- [x] Accept `GET` with query params: `lat`, `lon`
- [x] Call Nominatim API (uses `format=jsonv2`, the current format; `json` is deprecated)
- [x] Return `{ address, country, city }`
- [x] Cache results in memory (verified: 1.3s → 0.012s on repeat)
- [x] Validates lat/lon range; 400 on missing/out-of-range

### ⚠ Build-mode note (discovered in Phase 2)

Next.js 16 static export (`output: 'export'`) **cannot compile** route handlers that read the `Request` (both `POST /api/analyze` and `GET /api/reverse-geocode` fail the export build). Since the static Cloudflare/HF deployment doesn't need these routes (WebGPU runs in-browser; API mode calls the user's own llama-server directly), the build is split into two modes:

- `npm run build` → self-hosted, keeps API routes (dynamic, served by `next start`)
- `npm run build:export` → runs `scripts/build-export.mjs`, which temporarily moves `src/app/api` out of the app tree, builds with `NEXT_STATIC_EXPORT=1`, then restores it (try/finally). Produces `/out` for Cloudflare/HF.

`next.config.ts` reads `NEXT_STATIC_EXPORT=1` to toggle `output: 'export'`.

---

## Phase 3: React Components

### Step 3.1: Photo Upload Component
- [x] Create `src/components/PhotoUpload.tsx`
- [x] Drag & drop zone with visual feedback
- [x] Click to open file picker
- [x] Accept `image/*`
- [x] Show preview after selection
- [x] Call `onPhotoSelected(file: File)` callback
- [x] Optional controlled `file` prop (Phase 6 parent owns the selected file; example clicks also render the preview)

### Step 3.2: Example Photos Component
- [x] Create `src/components/ExamplePhotos.tsx`
- [x] Display 4 example images in a 2x2 grid
- [x] Click to select → trigger analysis
- [x] Images from `/public/examples/`
- [x] Placeholder gradient scenes generated by `scripts/generate-examples.mjs` (swap for real photos later)

### Step 3.3: EXIF Display Component
- [x] Create `src/components/EXIFDisplay.tsx`
- [x] Show parsed EXIF data: date, location, camera
- [x] Graceful handling when data is missing
- [x] Collapsible section

### Step 3.4: Analysis Result Components
- [x] Create `src/components/AnalysisResult.tsx` — container with tabs
- [x] Create `src/components/DescriptionView.tsx` — paragraph descriptions
- [x] Create `src/components/DataTableView.tsx` — key-value data table
- [x] Tab switcher: "Description" | "Data"

### Step 3.5: Map Component
- [x] Create `src/components/MapView.tsx`
- [x] Use react-leaflet with OpenStreetMap tiles
- [x] Show marker at photo's GPS coordinates
- [x] Satellite view layer
- [x] Graceful fallback when no GPS data

### Step 3.6: Loading Animation
- [x] Create `src/components/LoadingAnimation.tsx`
- [x] Google-style bouncing colored dots
- [x] Rotating loading messages: "Analyzing photo metadata...", "Extracting location data...", etc.

---

## Phase 4: Settings UI

### Step 4.1: Settings Panel
- [x] Create `src/components/settings/SettingsPanel.tsx`
- [x] Slide-out drawer from right side
- [x] Inference mode toggle (WebGPU / API)
- [x] Provider selector dropdown
- [x] Dynamic config form (changes based on selected provider)
- [x] Test Connection button with status indicator
- [x] Save / Cancel buttons

### Step 4.2: Provider Selector
- [x] Create `src/components/settings/ProviderSelector.tsx`
- [x] Dropdown listing all providers
- [x] Show icon + name + "(coming soon)" for unimplemented providers
- [x] Disable unimplemented providers (clickable but shows tooltip)

### Step 4.3: Provider Config Form
- [x] Create `src/components/settings/ProviderConfigForm.tsx`
- [x] Dynamically render form fields based on `configSchema`
- [x] Always show: Base URL, Model
- [x] llama-server Model field: free text (model preset name / `-hf` repo id / `--alias` / GGUF filename stem) with an auto-detect dropdown populated from `fetchAvailableModels()` (server `/v1/models`) — preset routing mode means users MUST be able to type the name manually, not just pick
- [x] Conditionally show: API Key (with visibility toggle eye icon)
- [x] Validate URL format
- [x] Mask API key input

### Step 4.4: Connection Test
- [x] Create `src/components/settings/ConnectionTest.tsx`
- [x] Button: "Test Connection"
- [x] On click: call `provider.testConnection(config)`
- [x] Show spinner during test
- [x] Show ✅ "Connected" or ❌ "Failed" with error details

### Step 4.5: WebGPU Model Manager
- [x] Create `src/components/settings/WebGPUSettings.tsx`
- [x] Show current model status (downloaded / not downloaded)
- [x] Show model size and cache location
- [x] "Manage Models" button → opens model list
- [x] "Clear Cache" button → confirm → delete from IndexedDB

### Step 4.6: Model Download Dialog
- [x] Create `src/components/ModelDownloadDialog.tsx`
- [x] Material Design dialog with model info:
  - Model name, format, size, source
  - Privacy notice: "runs in browser, not sent to any server"
- [x] Two buttons: "Cancel" | "Download Model"
- [x] Download does NOT start until user clicks confirm

### Step 4.7: Download Progress
- [x] Create `src/components/DownloadProgress.tsx`
- [x] Material Design LinearProgress bar
- [x] Show: percentage, downloaded/total, speed, ETA
- [x] "Cancel Download" button (AbortController)
- [x] Auto-dismiss on completion

---

## Phase 5: Settings Hooks

### Step 5.1: useSettings Hook
- [ ] Create `src/hooks/useSettings.ts`
- [ ] Wrap settings-manager with React Context
- [ ] Provide `settings`, `updateSettings`, `resetSettings`
- [ ] Persist to localStorage on every change

### Step 5.2: useProvider Hook
- [ ] Create `src/hooks/useProvider.ts`
- [ ] Return current active provider instance
- [ ] Re-derive when settings change

### Step 5.3: useModelDownload Hook
- [ ] Create `src/hooks/useModelDownload.ts`
- [ ] State: `isDownloaded`, `isDownloading`, `progress`, `error`
- [ ] Actions: `download()`, `cancel()`, `deleteModel()`
- [ ] Auto-check on mount if model exists in cache

### Step 5.4: useWebGPU Hook
- [ ] Create `src/hooks/useWebGPU.ts`
- [ ] Detect WebGPU support: `navigator.gpu`
- [ ] Return `{ supported: boolean, adapter: GPUAdapter | null }`
- [ ] Show warning banner if not supported

### Step 5.5: usePhotoAnalysis Hook
- [ ] Create `src/hooks/usePhotoAnalysis.ts`
- [ ] Orchestrates: EXIF parse → compress → analyze (WebGPU or API)
- [ ] State: `isAnalyzing`, `result`, `error`, `stage`
- [ ] Stage tracking: "parsing EXIF" → "compressing" → "analyzing" → "done"

---

## Phase 6: Main Page Assembly

### Step 6.1: Page Layout
- [ ] Update `src/app/page.tsx`
- [ ] Two-column layout (responsive):
  - Left: original photo + EXIF info
  - Right: analysis results (description / data tabs)
- [ ] Mobile: single column, stacked layout
- [ ] Header with settings gear icon (opens SettingsPanel)

### Step 6.2: Integrate All Components
- [ ] Wire up: PhotoUpload → usePhotoAnalysis → AnalysisResult
- [ ] Wire up: ExamplePhotos → same flow
- [ ] Wire up: MapView with EXIF GPS data
- [ ] Wire up: SettingsPanel with useSettings
- [ ] Wire up: InferenceModeToggle with settings

### Step 6.3: State Flow
```
Settings (localStorage)
    │
    ├── inferenceMode: 'webgpu' | 'api'
    ├── activeProvider: string
    └── providerConfigs: Record<string, ProviderConfig>
            │
            ▼
usePhotoAnalysis
    │
    ├── parseEXIF(file) → EXIFData
    ├── compressImage(file) → compressed File
    │
    ├── [webgpu mode] webgpuAnalyze(file, exif)
    │       └── @huggingface/transformers → model inference
    │
    └── [api mode] apiAnalyze(file, exif, settings)
            └── fetch('/api/analyze') → provider.analyze()
                    │
                    ├── llama-server → POST /chat/completions
                    ├── openai (future) → POST /chat/completions
                    ├── claude (future) → POST /messages
                    └── ...
            │
            ▼
    AnalysisResult
        ├── DescriptionView (paras[])
        ├── DataTableView (table{})
        └── MapView (lat, lon)
```

---

## Phase 7: Testing & Polish

### Step 7.1: Functional Testing
- [ ] Test WebGPU mode with real photo
- [ ] Test API mode with llama-server running
- [ ] Test EXIF parsing with various image formats (JPG, PNG, HEIC)
- [ ] Test model download → confirm → progress → completion
- [ ] Test model download cancellation
- [ ] Test settings persistence across page refreshes
- [ ] Test provider switching
- [ ] Test connection test with valid/invalid URLs
- [ ] Test map display with/without GPS data
- [ ] Test mobile responsive layout

### Step 7.2: Error Handling
- [ ] Network errors → user-friendly toast notification
- [ ] Model download failure → retry option
- [ ] WebGPU not supported → clear message + fallback suggestion
- [ ] EXIF parsing failure → continue without metadata
- [ ] Invalid image format → error message
- [ ] Backend unreachable → "Check if llama-server is running"

### Step 7.3: Performance
- [ ] Lazy load map component (no Leaflet bundle until needed)
- [ ] Debounce settings saves
- [ ] Virtual list for large analysis results
- [ ] Image preview optimization (object URLs, not base64)

### Step 7.4: UI Polish
- [ ] Smooth transitions between states (upload → analyzing → results)
- [ ] Dark theme consistency (no light mode flash)
- [ ] Loading skeleton for analysis results
- [ ] Empty state illustrations
- [ ] Keyboard shortcuts (Esc to close settings, etc.)

---

## Phase 8: Deployment

### Step 8.1: Static Export Build
- [ ] `next.config.ts` toggles `output: 'export'` via `NEXT_STATIC_EXPORT=1`; `images.unoptimized: true` always set
- [ ] Run `npm run build:export` → confirm `/out` directory generated (API routes auto-excluded + restored)
- [ ] Verify `/out` contains: `index.html`, `_next/static/`, `404.html`, `examples/`
- [ ] Local test: `npx serve out` → verify all features work
- [ ] Note: self-hosted (with API routes) uses `npm run build && npm start`, NOT `build:export`

### Step 8.2: Cloudflare Pages (Recommended)
- [ ] Install wrangler: `npm install -g wrangler`
- [ ] Authenticate: `wrangler login`
- [ ] Deploy: `wrangler pages deploy ./out --project-name=they-see-your-photo`
- [ ] Verify: `https://they-see-your-photo.pages.dev`
- [ ] Optional: connect custom domain in Cloudflare dashboard
- [ ] Set up GitHub integration for auto-deploy on push (optional)

### Step 8.3: HF Static Spaces (Alternative)
- [ ] Create HF Static Space repo
- [ ] Upload `/out` contents to repo
- [ ] Verify: `https://huggingface.co/spaces/{username}/they-see-your-photo`

### Step 8.4: Self-Hosted (Full Functionality)
- [ ] `npm run build && npm start` (includes API routes; do NOT use `build:export` here)
- [ ] Or Docker: create `Dockerfile` + `docker-compose.yml`
- [ ] Start llama-server backend: `llama-server -hf LiquidAI/LFM2.5-VL-3B-GGUF:Q4_K_M --port 8080`
- [ ] Verify both WebGPU and API modes work

### Step 8.5: Deployment Documentation
- [ ] Create `DEPLOY.md` with:
  - Cloudflare Pages deployment steps
  - HF Static Spaces deployment steps
  - Self-hosted deployment steps
  - Environment variables reference
  - Troubleshooting guide

---

## Future Phases (Not Implementing Now)

### Phase F1: Multi-language Support
- Add `src/lib/i18n/` with translation files
- Language toggle in settings

### Phase F2: Additional Providers
- Implement `openai.ts` — GPT-4o vision
- Implement `claude.ts` — Claude Sonnet vision
- Implement `grok.ts` — Grok vision
- Implement `openrouter.ts` — gateway to multiple models

### Phase F3: Model Management UI
- Browse available models from HuggingFace
- Switch between models
- Auto-detect model capabilities (vision vs text only)

### Phase F4: Export & Share
- Export analysis as PDF
- Export as JSON
- Share link with embedded results

---

## File Dependency Graph

```
types.ts
  │
  ├── providers/types.ts
  │     ├── providers/llama-server.ts
  │     ├── providers/webgpu.ts
  │     ├── providers/openai.ts (skeleton)
  │     ├── providers/claude.ts (skeleton)
  │     ├── providers/grok.ts (skeleton)
  │     └── providers/openrouter.ts (skeleton)
  │
  ├── providers/registry.ts
  │
  ├── settings-manager.ts
  │     └── hooks/useSettings.ts
  │
  ├── exif.ts
  ├── compress.ts
  ├── download-manager.ts
  │
  └── hooks/
        ├── useProvider.ts
        ├── useModelDownload.ts
        ├── useWebGPU.ts
        └── usePhotoAnalysis.ts
              │
              └── components/
                    ├── PhotoUpload.tsx
                    ├── ExamplePhotos.tsx
                    ├── AnalysisResult.tsx
                    ├── DescriptionView.tsx
                    ├── DataTableView.tsx
                    ├── MapView.tsx
                    ├── EXIFDisplay.tsx
                    ├── LoadingAnimation.tsx
                    ├── ModelDownloadDialog.tsx
                    ├── DownloadProgress.tsx
                    └── settings/
                          ├── SettingsPanel.tsx
                          ├── ProviderSelector.tsx
                          ├── ProviderConfigForm.tsx
                          ├── ConnectionTest.tsx
                          └── WebGPUSettings.tsx
```

---

## Progress Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0: Scaffolding | ✅ Done | Next.js 16.3.4, MUI v9, Tailwind v4, static export verified |
| Phase 1: Core Library | ✅ Done | EXIF, compress, llama-server + webgpu providers, 4 skeletons, settings, download mgr |
| Phase 2: API Routes | ✅ Done | analyze + reverse-geocode, tested dev + prod; dual build mode (build vs build:export) |
| Phase 3: React Components | ✅ Done (3.1–3.6) | db882f3; upload/examples/EXIF/results/map/loading |
| Phase 4: Settings UI | ✅ Done (4.1–4.7) | ed31d8f; settings drawer, provider selector/config, connection test, WebGPU model mgmt + download progress |
| Phase 5: Settings Hooks | ⬜ Not started | |
| Phase 6: Main Page | ⬜ Not started | |
| Phase 7: Testing | ⬜ Not started | |
| Phase 8: Deployment | ⬜ Not started | |
