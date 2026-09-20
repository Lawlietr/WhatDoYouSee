# Phase 5: Settings Hooks — 實施細節

> 狀態: ✅ Done (5.1–5.5)。本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Step 5.1: useSettings Hook
- Create `src/hooks/useSettings.tsx`
- Wrap settings-manager with React Context
- Provide `settings`, `updateSettings`, `resetSettings` (+ `setProviderConfigValue`)
- Persist to localStorage on every change (effect on settings)

## Step 5.2: useProvider Hook
- Create `src/hooks/useProvider.ts`
- Return current active provider instance as `{ provider, config }` (webgpu → `webgpuModelId`; api → active provider + its stored config)
- Re-derive when settings change

## Step 5.3: useModelDownload Hook
- Create `src/hooks/useModelDownload.ts`
- State: `isDownloaded`, `isDownloading`, `progress`, `error`
- Actions: `download()`, `cancel()`, `deleteModel()` (+ `refresh()`)
- Auto-check on mount if model exists in cache (Cache API via `cachedModelState`)

## Step 5.4: useWebGPU Hook
- Create `src/hooks/useWebGPU.ts`
- Detect WebGPU support: `navigator.gpu`
- Return `{ supported, checking, adapter: GPUAdapter | null }`

## Step 5.5: usePhotoAnalysis Hook
- Create `src/hooks/usePhotoAnalysis.ts`
- Orchestrates: EXIF parse → compress → analyze (WebGPU or API, via `useProvider`)
- State: `isAnalyzing`, `result`, `meta` (provider/model/latency), `error`, `stage`
- Stage tracking: "parsing-exif" → "compressing" → "analyzing" → "done"/"error"

**Note:** `src/lib/providers/webgpu.ts` updated in this phase — pipeline cache is now per-model (`Map<modelId, Promise>`), and `analyze()` honors `config.model` (falls back to `DEFAULT_WEBGPU_MODEL`), so the model picked in settings actually takes effect.
