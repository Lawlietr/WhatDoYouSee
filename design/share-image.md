# Share 按鈕 — 將「照片 + 分析結果」存為 JPEG 圖片（施工細節研究）

> TODO P2。行為參照 ENTE 原始 theyseeyourphotos 服務的分享按鈕（本專案為靈感 clone，品牌與實作獨立）。

## 需求（owner 原始規格）

1. 結果區有一個**分享按鈕**。
2. 按下後**截圖**：範圍是**分析的照片 + LLM 分析結果**，**不是**整個螢幕。
3. 產生圖片後**詢問儲存位置** → 使用者選擇存到哪（含檔名）。

## 現況（2026-09 已驗證的代碼事實）

- 結果區 `src/components/AnalysisResult.tsx`：頂端是 `ToggleButtonGroup`（**description / data 分頁**）——段落與表格**互斥顯示**，螢幕上同一時間只看得到一半。
- 照片預覽（`PhotoUpload.tsx` 與主視圖）用 `URL.createObjectURL(file)`（**blob: URL**，換照片/清除即釋放）。
- 字型：Geist / Geist Mono 走 `next/font/google` → **build 時自我主機化**（`/_next/static/media/*.woff2`），執行期**零** CDN 請求 → 截圖內嵌字型不違反隱私規則。
- `fileToDataURL`（`src/lib/providers/utils.ts`）已存在可重用；dependencies **沒有**任何截圖函式庫。
- Tailwind v4 預設 palette 是 **`oklch()`** 顏色（影響函式庫選擇，見下）。
- `design/future-phases.md` 的 F4（Export & share）列的是 PDF / JSON / share link——本項（存 JPEG 圖片）是相鄰但獨立的功能，從 F4 拆出為具體條目。

## 技術決策

### 1. 截圖函式庫：`html-to-image`（`toJpeg`），**不是** html2canvas

- html2canvas 自己解析 CSS，**不支援 `oklch()`**（Tailwind v4 預設色 → 硬失敗，已知 issue）。
- `html-to-image` 用 SVG `foreignObject` 把 DOM 子樹交給**瀏覽器引擎自己渲染** → oklch、color-mix 等現代 CSS 天然沒問題。
- ~10KB、零 transitive dependency。字型由它自動 fetch 同源的 `@font-face` 並 base64 內嵌（本專案字型自我主機化 → 全程零外部請求）。

### 2. 截圖目標：**專用的離屏 capture card**，不截可見 DOM

理由（逐條對應現況）：
- 結果區是分頁式 → 截可見 DOM 只會得到「目前分頁」；分享要的是**完整**結果（照片 + **全部**段落 + **完整**表格）。
- 可見照片是 blob: object URL（有釋放生命週期）→ capture card 改用 **dataURL**（`fileToDataURL(photo)`），確定性。
- 可見佈局是響應式、寬度不定 → capture card 固定寬 **900px**，輸出尺寸穩定。
- Map（Leaflet）是互動元件、tile 是跨域外部圖片 → **不納入**截圖（也維持零外部請求）。

Capture card（`AnalysisCaptureCard`，同檔私有子元件、不外匯出）：
- 掛法：`position: fixed; top: 0; left: -10000px; width: 900px`——**不可** `display: none`（computed styles 抓不到，`html-to-image` 無法渲染）。
- 內容（自上而下）：header（WhatDoYouSee 名稱 + 分析日期時間）→ 照片（dataURL，max-height ~600px、`object-fit: contain`）→ 全部段落 → 完整資料表 → footer（provider / model + 耗時）。
- 背景**明確指定**深色主題底色（JPEG 無透明度 → 必做）。
- **內容範圍（owner 裁定）**：只有照片 + LLM 分析內容（全部段落 + 完整表格）——**EXIF 與地圖都不進**；卡片 header（應用名 + 日期）與 footer（provider/model）保留，要刪是一行的事。
- **按需掛載**：點 Share 才 mount → 等 `document.fonts.ready` + 一 frame → `toJpeg(node, { pixelRatio: 2, quality: 0.92 })` → 存檔 → unmount（idle 時零 DOM 成本）。
- 結果是 prose-only（弱模型無表格）時：表格段略過，維持既有「No structured findings」i18n 措辭。

### 3. 儲存位置詢問：File System Access API + fallback

- **Chromium**（Chrome / Edge / Opera，desktop）：`window.showSaveFilePicker({ suggestedName, types: [{ description: "JPEG image", accept: { "image/jpeg": [".jpg"] } }] })` → **原生存檔對話框**，使用者選資料夾 + 檔名——正好是「按下後詢問要儲存在哪個位置」。
  - suggestedName：`whatdoousee-YYYYMMDD-HHMM.jpg`（**不含**照片原檔名——owner 裁定；檔名常洩漏拍攝者資訊）。
- **Safari / Firefox / iOS**（無此 API）：fallback `<a download="…">.click()` → 瀏覽器**預設下載目錄**（平台限制：非 Chromium 無選資料夾 API，非設計缺陷）。
- 兩條路徑**都顯示**該按鈕（不做 feature-detect 隱藏）；fallback 路徑行為靜默。

## 檔案與元件

| 檔案 | 動作 |
|------|------|
| `package.json` | 新增依賴 `html-to-image` |
| `src/components/ShareAnalysisButton.tsx` | **新增**（client）：按鈕（MUI `ShareIcon` `IconButton`）+ capture card 掛載/卸載 + 存檔流程；props：`photo: File`、`result: AnalysisResponse`、`meta: AnalysisMeta \| null`、`exif: EXIFData \| null`（exif 不進 capture card——owner 裁定，保留 prop 供未來擴充） |
| `src/components/AnalysisResult.tsx` | action row（`ToggleButtonGroup` 旁）加入 Share 按鈕 |
| `src/app/page.tsx` | 把手上的 `photo`（File）傳入 |
| `src/lib/i18n/translations.ts` | 加 ~4 組 key：share aria label、preparing（「正在產生圖片…」）、failed、（fallback 路徑無須 key） |
| `design/future-phases.md` | F4 註記「JPEG 存圖已拆出為具體 TODO」 |

按鈕狀態：idle → preparing（spinner，截圖含字型內嵌可能 1–2 秒）→ 存檔對話框 → 完成/unmount；失敗（`toJpeg` reject 等）顯示 error i18n 訊息，不 crash。

## 驗收門檻

- JPEG（quality 0.92）含：照片 + **全部**段落 + **完整**表格（與目前開啟的分頁無關）；字型、深色背景（必須明確）、表格框線正確；**不含** EXIF / 地圖。
- Chromium：按下出現**存檔對話框**（位置與檔名可改）；Safari/Firefox 直接落預設下載目錄、檔名正確。
- 截圖過程 DevTools Network：**零外部請求**（字型全部同源 `/_next/static/media/`；無 tile、無 CDN）。
- zh-TW / EN 皆可用；prose-only 結果（無表格）亦可用。
- `tsc --noEmit` 與 `npm run build:export` 通過。

## 裁定（owner，2026-09）

1. **capture card 內容**：只要照片 + LLM 分析內容——EXIF 不進、地圖也不進（地圖本就排除：跨域 tile + 互動元件）。
2. **suggested 檔名**：不含照片原檔名；統一 `whatdoousee-<時間戳>.jpg`。
3. **格式：JPEG**（quality ~0.92；JPEG 無透明度 → 背景明確指定是硬要求）。
4. **與歷史側欄（P2 另一項）相容**：已同意——若歷史側欄先實作，同一 capture card 擴充為「過往紀錄存圖」（props 改吃已存 entry），不需重新設計。
