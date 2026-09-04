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
- [ ] Create `src/lib/types.ts` — all shared TypeScript interfaces:
  - `AnalysisRequest`, `AnalysisResponse`
  - `ProviderConfig`, `AIProvider`
  - `EXIFData`, `AppSettings`
  - `ModelInfo`, `DownloadProgress`

### Step 0.5: Configure for Static Export
- [ ] Update `next.config.js`:
  ```js
  const nextConfig = {
    output: 'export',         // Static export for Cloudflare Pages / HF Spaces
    images: { unoptimized: true }  // Required for static export
  }
  ```
- [ ] Verify `npm run build` produces `/out` directory
- [ ] Verify `/out` can be served locally: `npx serve out`
- [ ] Note: API routes (`src/app/api/`) will NOT work in static export mode
  - API mode: frontend fetches user's llama-server URL directly (no server proxy)
  - WebGPU mode: fully functional (runs in browser)

---

## Phase 1: Core Library (No React)

### Step 1.1: EXIF Parser
- [ ] Create `src/lib/exif.ts`
- [ ] Export `parseEXIF(file: File): Promise<EXIFData>`
- [ ] Extract: `CreateDate`, `latitude`, `longitude`, `Make`, `Model`
- [ ] Handle missing gracefully (return partial data, no errors)

### Step 1.2: Image Compressor
- [ ] Create `src/lib/compress.ts`
- [ ] Export `compressImage(file: File): Promise<File>`
- [ ] Config: `maxSizeMB: 0.5`, `maxWidthOrHeight: 3000`, `initialQuality: 0.8`
- [ ] Handle HEIF conversion (if browser supports it)

### Step 1.3: Provider Interface + llama-server Implementation
- [ ] Create `src/lib/providers/types.ts` — `AIProvider` interface
- [ ] Create `src/lib/providers/llama-server.ts`:
  - `analyze()` — POST to `{baseUrl}/chat/completions` with image + prompt
  - `testConnection()` — GET `{baseUrl}/models`
  - System prompt for privacy analysis (see AGENTS.md → System Prompt section)
  - Parse JSON response → `{ paras, table }`
- [ ] Create `src/lib/providers/registry.ts` — provider lookup + active provider
- [ ] Create `src/lib/providers/defaults.ts` — default configs per provider

### Step 1.4: Placeholder Providers (Skeleton)
- [ ] Create `src/lib/providers/openai.ts` — skeleton with TODO comments
- [ ] Create `src/lib/providers/claude.ts` — skeleton with TODO comments
- [ ] Create `src/lib/providers/grok.ts` — skeleton with TODO comments
- [ ] Create `src/lib/providers/openrouter.ts` — skeleton with TODO comments
- [ ] Register all in `registry.ts` with `enabled: false` flag

### Step 1.5: Settings Manager
- [ ] Create `src/lib/settings-manager.ts`
- [ ] `loadSettings(): AppSettings` — from localStorage
- [ ] `saveSettings(settings: AppSettings): void` — to localStorage
- [ ] `getProviderConfig(id: string): ProviderConfig | null`
- [ ] Default settings: WebGPU mode, llama-server provider, English

### Step 1.6: WebGPU Inference Engine
- [ ] Create `src/lib/providers/webgpu.ts`
- [ ] Check WebGPU availability: `navigator.gpu`
- [ ] Load model: `AutoModelForImageTextToText.from_pretrained(MODEL_ID, { device: 'webgpu', dtype: {...} })`
- [ ] Process image + prompt → return analysis
- [ ] Handle model not loaded (throw clear error)

### Step 1.7: Model Download Manager
- [ ] Create `src/lib/download-manager.ts`
- [ ] IndexedDB storage for model files
- [ ] `hasModel(modelId): Promise<boolean>`
- [ ] `downloadModel(modelId, url, onProgress, signal): Promise<ArrayBuffer>`
- [ ] `deleteModel(modelId): Promise<void>`
- [ ] Support `AbortController` for cancellation
- [ ] Progress tracking: bytes downloaded, total size, speed

---

## Phase 2: Backend API Routes

### Step 2.1: Unified Analysis Endpoint
- [ ] Create `src/app/api/analyze/route.ts`
- [ ] Accept `POST` with multipart/form-data:
  - `file` (Blob)
  - `filename` (string)
  - `created` (optional string)
  - `latitude` (optional number)
  - `longitude` (optional number)
  - `camera` (optional string)
  - `language` (string)
  - `provider` (string — which AI provider to use)
  - `providerConfig` (JSON string — provider settings)
- [ ] Route to correct provider's `analyze()` method
- [ ] Return `{ success, data, error, provider, model, latency }`
- [ ] Error handling: connection refused, timeout, invalid response

### Step 2.2: Reverse Geocode Endpoint
- [ ] Create `src/app/api/reverse-geocode/route.ts`
- [ ] Accept `GET` with query params: `lat`, `lon`
- [ ] Call Nominatim API: `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}`
- [ ] Return `{ address, country, city }`
- [ ] Cache results in memory (avoid repeated calls for same coords)

---

## Phase 3: React Components

### Step 3.1: Photo Upload Component
- [ ] Create `src/components/PhotoUpload.tsx`
- [ ] Drag & drop zone with visual feedback
- [ ] Click to open file picker
- [ ] Accept `image/*`
- [ ] Show preview after selection
- [ ] Call `onPhotoSelected(file: File)` callback

### Step 3.2: Example Photos Component
- [ ] Create `src/components/ExamplePhotos.tsx`
- [ ] Display 4 example images in a 2x2 grid
- [ ] Click to select → trigger analysis
- [ ] Images from `/public/examples/`

### Step 3.3: EXIF Display Component
- [ ] Create `src/components/EXIFDisplay.tsx`
- [ ] Show parsed EXIF data: date, location, camera
- [ ] Graceful handling when data is missing
- [ ] Collapsible section

### Step 3.4: Analysis Result Components
- [ ] Create `src/components/AnalysisResult.tsx` — container with tabs
- [ ] Create `src/components/DescriptionView.tsx` — paragraph descriptions
- [ ] Create `src/components/DataTableView.tsx` — key-value data table
- [ ] Tab switcher: "Description" | "Data"

### Step 3.5: Map Component
- [ ] Create `src/components/MapView.tsx`
- [ ] Use react-leaflet with OpenStreetMap tiles
- [ ] Show marker at photo's GPS coordinates
- [ ] Satellite view layer
- [ ] Graceful fallback when no GPS data

### Step 3.6: Loading Animation
- [ ] Create `src/components/LoadingAnimation.tsx`
- [ ] Google-style bouncing colored dots
- [ ] Rotating loading messages: "Analyzing photo metadata...", "Extracting location data...", etc.

---

## Phase 4: Settings UI

### Step 4.1: Settings Panel
- [ ] Create `src/components/settings/SettingsPanel.tsx`
- [ ] Slide-out drawer from right side
- [ ] Inference mode toggle (WebGPU / API)
- [ ] Provider selector dropdown
- [ ] Dynamic config form (changes based on selected provider)
- [ ] Test Connection button with status indicator
- [ ] Save / Cancel buttons

### Step 4.2: Provider Selector
- [ ] Create `src/components/settings/ProviderSelector.tsx`
- [ ] Dropdown listing all providers
- [ ] Show icon + name + "(coming soon)" for unimplemented providers
- [ ] Disable unimplemented providers (clickable but shows tooltip)

### Step 4.3: Provider Config Form
- [ ] Create `src/components/settings/ProviderConfigForm.tsx`
- [ ] Dynamically render form fields based on `configSchema`
- [ ] Always show: Base URL, Model
- [ ] Conditionally show: API Key (with visibility toggle eye icon)
- [ ] Validate URL format
- [ ] Mask API key input

### Step 4.4: Connection Test
- [ ] Create `src/components/settings/ConnectionTest.tsx`
- [ ] Button: "Test Connection"
- [ ] On click: call `provider.testConnection(config)`
- [ ] Show spinner during test
- [ ] Show ✅ "Connected" or ❌ "Failed" with error details

### Step 4.5: WebGPU Model Manager
- [ ] Create `src/components/settings/WebGPUSettings.tsx`
- [ ] Show current model status (downloaded / not downloaded)
- [ ] Show model size and cache location
- [ ] "Manage Models" button → opens model list
- [ ] "Clear Cache" button → confirm → delete from IndexedDB

### Step 4.6: Model Download Dialog
- [ ] Create `src/components/ModelDownloadDialog.tsx`
- [ ] Material Design dialog with model info:
  - Model name, format, size, source
  - Privacy notice: "runs in browser, not sent to any server"
- [ ] Two buttons: "Cancel" | "Download Model"
- [ ] Download does NOT start until user clicks confirm

### Step 4.7: Download Progress
- [ ] Create `src/components/DownloadProgress.tsx`
- [ ] Material Design LinearProgress bar
- [ ] Show: percentage, downloaded/total, speed, ETA
- [ ] "Cancel Download" button (AbortController)
- [ ] Auto-dismiss on completion

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
- [ ] Verify `next.config.js` has `output: 'export'` and `images: { unoptimized: true }`
- [ ] Run `npm run build` → confirm `/out` directory generated
- [ ] Verify `/out` contains: `index.html`, `_next/static/`, `examples/`
- [ ] Local test: `npx serve out` → verify all features work

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
- [ ] `npm run build && npm start` (includes API routes)
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
| Phase 0: Scaffolding | 🟨 In progress | Step 0.1 done (Next.js 16.3.4) |
| Phase 1: Core Library | ⬜ Not started | |
| Phase 2: API Routes | ⬜ Not started | |
| Phase 3: React Components | ⬜ Not started | |
| Phase 4: Settings UI | ⬜ Not started | |
| Phase 5: Settings Hooks | ⬜ Not started | |
| Phase 6: Main Page | ⬜ Not started | |
| Phase 7: Testing | ⬜ Not started | |
| Phase 8: Deployment | ⬜ Not started | |
