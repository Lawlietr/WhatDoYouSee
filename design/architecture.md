# Architecture: File Dependency Graph

> 參考圖（從 TODO.md 移入）。TODO 與優先級見 `TODO.md`。

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
