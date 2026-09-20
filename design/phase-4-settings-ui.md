# Phase 4: Settings UI — 實施細節

> 狀態: ✅ Done (4.1–4.7, ed31d8f)。本檔僅存實施細節；TODO 與優先級見 `TODO.md`，完成歷史見 git log。

## Step 4.1: Settings Panel
- Create `src/components/settings/SettingsPanel.tsx`
- Slide-out drawer from right side
- Inference mode toggle (WebGPU / API)
- Provider selector dropdown
- Dynamic config form (changes based on selected provider)
- Test Connection button with status indicator
- Save / Cancel buttons

## Step 4.2: Provider Selector
- Create `src/components/settings/ProviderSelector.tsx`
- Dropdown listing all providers
- Show icon + name + "(coming soon)" for unimplemented providers
- Disable unimplemented providers (clickable but shows tooltip)

## Step 4.3: Provider Config Form
- Create `src/components/settings/ProviderConfigForm.tsx`
- Dynamically render form fields based on `configSchema`
- Always show: Base URL, Model
- llama-server Model field: free text (model preset name / `-hf` repo id / `--alias` / GGUF filename stem) with an auto-detect dropdown populated from `fetchAvailableModels()` (server `/v1/models`) — preset routing mode means users MUST be able to type the name manually, not just pick
- Conditionally show: API Key (with visibility toggle eye icon)
- Validate URL format
- Mask API key input

## Step 4.4: Connection Test
- Create `src/components/settings/ConnectionTest.tsx`
- Button: "Test Connection"
- On click: call `provider.testConnection(config)`
- Show spinner during test
- Show ✅ "Connected" or ❌ "Failed" with error details

## Step 4.5: WebGPU Model Manager
- Create `src/components/settings/WebGPUSettings.tsx`
- Show current model status (downloaded / not downloaded)
- Show model size and cache location
- "Manage Models" button → opens model list
- "Clear Cache" button → confirm → delete from IndexedDB

## Step 4.6: Model Download Dialog
- Create `src/components/ModelDownloadDialog.tsx`
- Material Design dialog with model info:
  - Model name, format, size, source
  - Privacy notice: "runs in browser, not sent to any server"
- Two buttons: "Cancel" | "Download Model"
- Download does NOT start until user clicks confirm

## Step 4.7: Download Progress
- Create `src/components/DownloadProgress.tsx`
- Material Design LinearProgress bar
- Show: percentage, downloaded/total, speed, ETA
- "Cancel Download" button (AbortController)
- Auto-dismiss on completion
