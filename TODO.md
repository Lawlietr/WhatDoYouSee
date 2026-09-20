# TODO.md — WhatDoYouSee

> 本檔**只**記錄待辦工作與優先級，不含實施細節。
> - 實施細節 → `design/` 目錄（每個工作單元一個 .md）
> - 近期完成歷史 → `git log`（本檔只保留最近 5 條完成工作，置底）

## 待辦工作（由上至下 = 優先級由高至低）

### P0 — 最高優先級
1. **7.6** 整合 Qwen3.5-4B-ONNX 進 WebGPU 模型清單（q4f16 ≈2.82 GiB）＋ Thinking switch（預設關）；評估已完成（2026-09-20），實作細節與 smoke test 門檻 → `design/model-eval-qwen35-e2b.md`

### P1 — 品質與文件
2. **語言切換** 移到 header 右上角（GitHub icon 左側），下拉選單式；點選即生效（不需 Save），同步移除設定面板的「介面語言」段；施工細節 → `design/i18n.md`
3. **7.3** Performance：lazy-load map、debounce settings、virtual list、object URL preview → `design/phase-7-testing.md`
4. **7.4** UI polish：transitions、dark theme 一致性、skeleton、empty state、鍵盤快捷鍵 → `design/phase-7-testing.md`
5. **8.5** `DEPLOY.md` 部署文件（CF Pages / HF Spaces / self-hosted / env vars / troubleshooting）→ `design/phase-8-deployment.md`

### P2 — 選用 / 有空再做
6. **歷史側欄** 左側快捷欄（點選展開、mobile 用 overlay）：記錄分析過的照片（**含示範照片**，IndexedDB，上限 100，FIFO），點照片顯示**過往結果**（純回顧、不重新分析），新紀錄置頂、編號最舊=1，收起時顯示 N/100，展開有自己的捲軸；支援**單筆／多筆／全部刪除**；**本項只研究施工細節、不必實作** → `design/history-sidebar.md`
7. **分享按鈕** 將「照片 + 分析結果」存為 **JPEG** 圖片（離屏 capture card、非截全螢幕；只含照片＋分析內容，EXIF/地圖不進；檔名不含原檔名）；Chromium 走 `showSaveFilePicker` 詢問儲存位置，其他瀏覽器 fallback 預設下載目錄；施工細節 → `design/share-image.md`
8. **8.4** Self-hosted（Dockerfile + docker-compose）→ `design/phase-8-deployment.md`
9. **7.1 殘留** EXIF PNG/HEIC 格式抽查（JPG 已驗證）→ `design/phase-7-testing.md`
10. **8.3** HF Static Spaces 部署（替代方案）→ `design/phase-8-deployment.md`
11. **8.2 選用** GitHub integration 自動部署（CI 須保留 `build:export` 語義）→ `design/phase-8-deployment.md`
12. **9.1 殘留** 本地工作目錄改名（they-see-your-photo → what-do-you-see）；open-source 時 wrangler project 改名 → `design/license-rename.md`

### Future — 不排期（未實作）
- F1 Multi-language / F2 Additional providers (openai, claude, grok, openrouter) / F3 Model management UI / F4 Export & share（「照片+結果存 JPEG」已拆出為 P2 分享按鈕項，剩 PDF / JSON / share link）→ `design/future-phases.md`

---

## 最近完成（僅最近 5 條，更早請查 `git log`）

| Commit | 日期 | 內容 |
|--------|------|------|
| `23ac171` | 2026-09-21 | i18n：介面繁體中文（EN/zh-TW 雙語、預設 zh-TW + 一次性遷移、設定面板語言切換）＋分析提示詞雙語化 → `design/i18n.md` |
| `143196b` | 2026-09-07 | 7.1：mobile 響應式驗證完成（real iPhone + iPad）；EXIF JPG 驗證完成，PNG/HEIC 待補 |
| `7b99f3d` | 2026-09-06 | 示例照片改版：新 Pexels 照片 + desktop 直欄優先 / mobile 堆疊佈局 |
| `e9974ae` | 2026-09-06 | 部署策略：test/prod 雙專案分割、`--branch main` 修正、post-deploy WebGPU 修復記錄 |
| `176b9bc` | 2026-09-06 | WebGPU：禁止靜默下載（inference gate on cache）；model dialog 對當前模型可用 |

