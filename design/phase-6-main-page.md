# Phase 6: Main Page Assembly — 實施細節

> 狀態: ✅ Done (6.1–6.3)。本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Step 6.1: Page Layout
- Update `src/app/page.tsx` — hero screen (headline + upload + examples) → two-column grid on analyze (left: photo + EXIF; right: loading/error/result + meta line + map + "Analyze another photo"); `md` breakpoint stacks to single column on mobile; header bar with title + settings gear
- Two-column layout (responsive): left photo + EXIF, right results (description / data tabs)
- Mobile: single column, stacked layout
- Header with settings gear icon (opens SettingsPanel)
- `AppProviders` client boundary wraps `SettingsProvider` in layout (page is SSG — hooks need the provider at prerender)

## Step 6.2: Integrate All Components
- Wire up: PhotoUpload → usePhotoAnalysis → AnalysisResult (photo selection triggers `analyze(file)` immediately; controlled `file` prop keeps the preview)
- Wire up: ExamplePhotos → same flow (same `onPhotoSelected` handler)
- Wire up: MapView with EXIF GPS data (no-GPS dashed fallback verified with the Arc photo that has empty EXIF)
- Wire up: SettingsPanel with useSettings (`onSave` → `updateSettings`; panel closes itself after saving)
- Mode reflected in hero copy ("in your browser" vs "on your own server")
- Error state: Alert + Retry button re-runs `analyze(photo)`
- **llama-server baseUrl hardening** (found during E2E): users paste bare `host:port` — `normalizeBaseUrl()` auto-adds `http://` and `/v1`; settings field is now plain `Server` text with helperText (no more `http://` URL validation); model-detect + test-connection respect the API key; `ConfigField.helperText` added to types + form rendering
- **E2E verified (Playwright, production build, 15/15 pass)**: hero → upload Arc de Triomphe → loading animation → mock API result → meta line → Data tab table → EXIF empty state → map no-GPS fallback → back to hero → settings drawer; zero console errors, zero 4xx/5xx

## Step 6.3: State Flow
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
