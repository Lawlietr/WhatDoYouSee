# Phase 1: Core Library (No React) — 實施細節

> 狀態: ✅ Done。本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Step 1.1: EXIF Parser
- Create `src/lib/exif.ts`
- Export `parseEXIF(file: File): Promise<EXIFData>`
- Extract: `CreateDate`, `latitude`, `longitude`, `Make`, `Model`
- Handle missing gracefully (return partial data, no errors) — try/catch returns `{}`

## Step 1.2: Image Compressor
- Create `src/lib/compress.ts`
- Export `compressImage(file: File): Promise<File>`
- Config: `maxSizeMB: 0.5`, `maxWidthOrHeight: 3000`, `initialQuality: 0.8`
- Skips compression when already under limit; falls back to original on error (HEIF handled via canvas if supported)

## Step 1.3: Provider Interface + llama-server Implementation
- `AIProvider` interface lives in `src/lib/types.ts` (created in Step 0.4) rather than a separate `providers/types.ts` — kept central to match dependency graph
- Create `src/lib/providers/llama-server.ts`:
  - `analyze()` — POST to `{baseUrl}/chat/completions` with image + prompt
  - `testConnection()` — GET `{baseUrl}/models`
  - System prompt for privacy analysis (see AGENTS.md → System Prompt section) → `system-prompt.ts`
  - Parse JSON response → `{ paras, table }` → `utils.ts` (`parseAnalysisJson`)
- Create `src/lib/providers/registry.ts` — provider lookup + active provider
- Create `src/lib/providers/defaults.ts` — default configs per provider
- Added `src/lib/providers/utils.ts` (fileToDataURL + parseAnalysisJson) shared by providers

## Step 1.4: Placeholder Providers (Skeleton)
- Create `src/lib/providers/openai.ts` — skeleton with TODO comments
- Create `src/lib/providers/claude.ts` — skeleton with TODO comments
- Create `src/lib/providers/grok.ts` — skeleton with TODO comments
- Create `src/lib/providers/openrouter.ts` — skeleton with TODO comments
- Register all in `registry.ts` with `enabled: false` flag (throw "not implemented" on use)

## Step 1.5: Settings Manager
- Create `src/lib/settings-manager.ts`
- `loadSettings(): AppSettings` — from localStorage (SSR-safe, merges over defaults)
- `saveSettings(settings: AppSettings): void` — to localStorage
- `getProviderConfig(id: string): ProviderConfig | null` (+ setProviderConfig)
- Default settings: WebGPU mode, llama-server provider, English

## Step 1.6: WebGPU Inference Engine
- Create `src/lib/providers/webgpu.ts` (lazy-loads @huggingface/transformers)
- Check WebGPU availability: `navigator.gpu` (`isWebGpuSupported()`)
- Load model: `AutoModelForImageTextToText.from_pretrained(MODEL_ID, { device: 'webgpu', dtype: 'q4' })`
- Process image + prompt → return analysis (singleton pipeline, cached Promise)
- Handle model not loaded / unsupported (throw clear error)
- ⚠ VERIFY (done, Phase 7.1): LFM2.5-VL input schema confirmed via `AutoProcessor` + `apply_chat_template` — verified end-to-end with a real WebGPU browser (450M, Arc de Triomphe photo) and independently with the transformers.js wasm backend on the server

## Step 1.7: Model Download Manager
- Create `src/lib/download-manager.ts` (idb wrapper)
- IndexedDB storage for model files
- `hasModel(modelId): Promise<boolean>`
- `downloadModel(modelId, url, onProgress, signal)` — streams via ReadableStream, returns ArrayBuffer
- `deleteModel(modelId): Promise<void>` (+ clearModelCache, getModelBytes, cachedModelBytes)
- Support `AbortController` for cancellation
- Progress tracking: bytes downloaded, total size (speed/ETA computed in hook layer)
