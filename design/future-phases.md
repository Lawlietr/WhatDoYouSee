# Future Phases (Not Implementing Now) — 實施細節

> 狀態: 規劃中，不排期。TODO 與優先級見 `TODO.md`。

## Phase F1: Multi-language Support
- Add `src/lib/i18n/` with translation files
- Language toggle in settings

## Phase F2: Additional Providers
- Implement `openai.ts` — GPT-4o vision
- Implement `claude.ts` — Claude Sonnet vision
- Implement `grok.ts` — Grok vision
- Implement `openrouter.ts` — gateway to multiple models

## Phase F3: Model Management UI
- Browse available models from HuggingFace
- Switch between models
- Auto-detect model capabilities (vision vs text only)

## Phase F4: Export & Share
- （2026-09）「照片 + 分析結果存 PNG 圖片」已拆出為具體 TODO（P2 分享按鈕），施工細節見 `design/share-image.md`
- Export analysis as PDF
- Export as JSON
- Share link with embedded results
