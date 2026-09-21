# TODO.md — WhatDoYouSee

> 本檔**只**記錄待辦工作與優先級，不含實施細節。
> - 實施細節 → `design/` 目錄（每個工作單元一個 .md）
> - 近期完成歷史 → `git log`（本檔只保留最近 5 條完成工作，置底）

## 待辦工作（由上至下 = 優先級由高至低）

### P1 — 品質與文件
1. **語言切換** 移到 header 右上角（GitHub icon 左側），下拉選單式；點選即生效（不需 Save），同步移除設定面板的「介面語言」段；施工細節 → `design/i18n.md`
2. **7.3** Performance：lazy-load map、debounce settings、virtual list、object URL preview → `design/phase-7-testing.md`
3. **7.4** UI polish：transitions、dark theme 一致性、skeleton、empty state、鍵盤快捷鍵 → `design/phase-7-testing.md`
4. **8.5** `DEPLOY.md` 部署文件（CF Pages / HF Spaces / self-hosted / env vars / troubleshooting）→ `design/phase-8-deployment.md`

### P2 — 選用 / 有空再做
5. **歷史側欄** 左側快捷欄（點選展開、mobile 用 overlay）：記錄分析過的照片（**含示範照片**，IndexedDB，上限 100，FIFO），點照片顯示**過往結果**（純回顧、不重新分析），新紀錄置頂、編號最舊=1，收起時顯示 N/100，展開有自己的捲軸；支援**單筆／多筆／全部刪除**；**本項只研究施工細節、不必實作** → `design/history-sidebar.md`
6. **分享按鈕** 將「照片 + 分析結果」存為 **JPEG** 圖片（離屏 capture card、非截全螢幕；只含照片＋分析內容，EXIF/地圖不進；檔名不含原檔名）；Chromium 走 `showSaveFilePicker` 詢問儲存位置，其他瀏覽器 fallback 預設下載目錄；施工細節 → `design/share-image.md`
7. **8.4** Self-hosted（Dockerfile + docker-compose）→ `design/phase-8-deployment.md`
8. **7.1 殘留** EXIF PNG/HEIC 格式抽查（JPG 已驗證）→ `design/phase-7-testing.md`
9. **8.3** HF Static Spaces 部署（替代方案）→ `design/phase-8-deployment.md`
10. **8.2 選用** GitHub integration 自動部署（CI 須保留 `build:export` 語義）→ `design/phase-8-deployment.md`
11. **9.1 殘留** 本地工作目錄改名（they-see-your-photo → what-do-you-see）；open-source 時 wrangler project 改名 → `design/license-rename.md`
12. **UI 標註** 模型清單中 Qwen3.5-4B 標「browser 推論慢（~7–9 min）」，建議 API mode → `design/webgpu-qwen-perf-tfjs43.md`
13. **4.3 重啟評估** 託管遷 Vercel（或其他無單檔上限平台）後，重啟 transformers.js 4.3 升級＋測 structured output（450M JSON 問題）/streaming → `design/webgpu-qwen-perf-tfjs43.md`

### Future — 不排期（未實作）
- F1 Multi-language / F2 Additional providers (openai, claude, grok, openrouter) / F3 Model management UI / F4 Export & share（「照片+結果存 JPEG」已拆出為 P2 分享按鈕項，剩 PDF / JSON / share link）→ `design/future-phases.md`

---

## 最近完成（僅最近 5 條，更早請查 `git log`）

| Commit | 日期 | 內容 |
|--------|------|------|
| `c49b9f5`＋後續 | 2026-09-21 | LFM 中文輸出定案保留（attempt 3，系統提示詞末尾追加英文指令）；WebGPU UI 隱藏 Qwen3.5-4B＋Thinking 開關（`hidden` 旗標，非刪除）→ `design/i18n.md`、`design/webgpu-qwen-perf-tfjs43.md` |
| `daed6a8` | 2026-09-21 | Qwen WebGPU 效能診斷＋ transformers.js 4.3 評估：維持 4.2.0（4.3 的 25.6MiB wasm 撞 CF 25MiB 上限），package.json pin 死 4.2.0 → `design/webgpu-qwen-perf-tfjs43.md` |
| `b1a21eb` | 2026-09-21 | 修復：model prompt 回滾為英文（LFM2.5 中文指令 → 重複迴圈）→ `design/i18n.md` |
| `1a67caf` | 2026-09-21 | 修復：Qwen processor 參數順序 (text, image)（"undefined is not iterable"）→ `design/model-eval-qwen35-e2b.md` |
| `1a1f8a2` | 2026-09-21 | 7.6：Qwen3.5-4B-ONNX（q4f16，3.02 GB）進 WebGPU 模型清單＋ Thinking switch（預設關）→ `design/model-eval-qwen35-e2b.md` |


