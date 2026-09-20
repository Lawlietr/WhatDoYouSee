# History Sidebar — 左側歷史紀錄快捷欄（施工細節研究）

> TODO P2。**本工作單元只研究施工細節，不含實作**；未來要實作時另開工作，依本檔施工。

## 需求（owner 原始規格）

1. 網頁**左邊**一個快捷欄，點選後**展開**。
2. 內記錄所有**查詢（分析）過的照片**；點選照片 → 網頁切換到該張的**過往分析結果**——純回顧，**不會重新用模型分析**。
3. 紀錄存在**使用者瀏覽器內**，最多 **100 個**。
4. 快捷欄**下方**顯示數量，例如已掃描 20 次就顯示 **20/100**。
5. 每查詢一個新照片 → 出現在**最上方**（其餘下移）。
6. **編號 1–100**：滿 100 筆時，最上 = 100、最下 = 1（即 **1 = 最舊**）。
7. 快捷欄（展開狀態）有**自己的捲軸**，可上下捲動。
8. **示範照片也計入**：使用者點選示例照片觸發分析時，同樣入列（owner 裁定）。
9. **刪除功能**：單筆刪除、多筆（複選）刪除、一鍵全選刪除（owner 裁定）。
10. **xs（mobile）展開方式：左側 overlay**（owner 裁定，非水平推開）。

## 現況（2026-09 已驗證的代碼事實）

- 結果形狀（`src/lib/types.ts`）：`AnalysisResponse { paras: string[]; table: Record<string,string> }`、`AnalysisMeta { provider, model, latencyMs }`、`EXIFData`。
- `src/hooks/usePhotoAnalysis.ts`：`analyze(file)` = EXIF → `compressImage` → `provider.analyze`；成功時在 hook 內一次 `setState` 寫入 `result/meta/exif`——這是**歷史寫入的唯一捕捉點**（壓縮後的影像也在這個範圍內取得）。
- `idb` 套件**已存在**（`src/lib/download-manager.ts` 用 `openDB`）→ 歷史庫直接沿用，不加新依賴。
- 頁面 shell 在 `src/app/page.tsx`（header + 單一 main Box），**目前沒有左側結構**，需在外層加 flex row。
- 專案慣例 mobile-first → rail 的 xs（手機）行為必須明確定義，不能只設計 desktop。

## 儲存設計（IndexedDB）

- **不能用 localStorage**（~5MB 上限，100 張縮圖 + 結果會爆）→ **IndexedDB**。
- 新 DB `what-do-you-see-history`，store `entries`（keyPath `id`）；wrapper 放 `src/lib/history-store.ts`（`addEntry` / `listEntries` / `count` / `removeEntry` / `removeEntries` / `clear`，沿用 `download-manager.ts` 的 `openDB` 模式）。
- Entry 欄位：
  - `id`（`crypto.randomUUID()`）、`createdAt`（epoch ms）
  - `thumbnail`：dataURL，由壓縮後的影像再降尺寸至 ~320px 寬（WebP/JPEG，約 20–40KB/張）
  - `result`：`{ paras, table }` 原樣存入
  - `meta`：`{ provider, model, latencyMs }` 原樣
  - `exif`：`EXIFData` 原樣（資料小；有 GPS 時回顧畫面可畫 map）
  - `language`：分析時的 UI 語言（給「以 X 模型分析」caption 與文案用；文字本身已存原樣，不受之後換語言影響）
- 容量估計：100 筆 ≈ 2–5MB → IDB 容納無壓力。
- **上限 100**：`addEntry` 後若 count > 100，刪除最舊（FIFO）。
- **只記成功**的分析；失敗（`stage: "error"`）不寫入。寫入點是 `usePhotoAnalysis` 成功那一刻；示例照片點選也走同一個 `analyze`（`page.tsx` 的 onExample 回调）→ 同一寫入點自然覆蓋，**不需獨立分支**。
- 隱私：純瀏覽器本地、零外部請求，符合專案隱私規則（無 analytics、無上傳）。

## 編號與計數

- 編號**不存 DB**，render 時依列表位置計算：**1 = 最舊，count = 最新（最上方）**。
- 不變式：20 筆 → 最上 20、最下 1；100 筆 → 最上 100、最下 1。FIFO 淘汰後自動維持，無需重編號。
- 快捷欄**收起狀態**下方顯示 `count/100`（i18n 純數字插值即可）。

## UI / 佈局

新檔案：
- `src/components/HistoryRail.tsx` — 快捷欄：
  - 收起：左側直條（expand 按鈕 + 下方 `count/100` label）
  - 展開：列表面板，`overflow-y: auto` **自己的捲軸**；項目 = 編號 + 縮圖 + 時間戳（+ provider/model caption）；目前選取項目高亮
- `src/lib/history-store.ts` — idb wrapper（如上）
- `src/hooks/useHistory.ts` — React state：entries 列表（載入時讀 IDB）、activeId、新增時即時 prepend

`src/app/page.tsx` 改動：
- 外層變 flex row：`[HistoryRail | 既有 main 直欄]`
- **md+**：inline 展開（寬 0 → ~280px，main 內容被推開）
- **xs（mobile）**：rail 為 ~44px 細條，展開為**左側 overlay**（`position: fixed`、寬 ~280px、有 backdrop）——不擠壓內容（owner 裁定）
- 主區域加**檢視狀態**：`viewing = { mode: "current" } | { mode: "history", entry }`
  - 點擊歷史項目 → 以**既有元件**渲染該筆已存資料（`AnalysisResult` / `DataTableView` / `EXIFDisplay` / 有 GPS 時 `MapView`）；**不呼叫 `analyze`、不產生任何模型/網路請求**
  - 回傳路徑：重新上傳照片、或檢視列的「回到目前」按鈕 → 回 `current`
- i18n：`translations.ts` 加 ~15 組 key（rail aria、展開/收起、空狀態、`count/100` caption、回到目前、時間戳格式、單筆刪除 aria、刪除模式、刪除所選 N、全部刪除、確認對話框；無結構化發現的沿用現有 key）

### 刪除功能（owner 裁定：單筆 / 多筆 / 全選）

- **單筆**：每列右端小 `DeleteIcon` `IconButton`（常駐顯示、24px）→ **直接刪、不確認**（純回顧資料，風險低；`N/100` 與編號隨 render 自動更新）。
- **多筆**：面板 header 的「刪除模式」切換鈕（`DeleteSweepIcon`）→ 進入後每列顯示 checkbox、點列切換選取；header 變「取消」＋「刪除所選（N）」（N=0 時 disabled）→ 點擊出確認對話框（MUI `Dialog`）→ `removeEntries(ids)`。
- **全選**：面板 header「全部刪除」鈕 → 確認對話框（顯示總筆數 N）→ `clear()`。
- **編號不受影響**：編號是 render 時依位置算的（1=最舊）→ 刪除後自動重算，無需重編號邏輯；FIFO 上限 100 不變（刪出空位後新紀錄照填）。

## 驗收門檻（給未來實作工作）

- 分析 20 張 → 快捷欄顯示 20/100；第 101 張成功後，最舊自動消失、新在最上、編號仍 1–100。
- 點歷史項目：DevTools 確認**零**模型/網路請求；顯示的 paras/table 與當時分析逐字相同。
- 重整頁面後歷史與編號維持。
- 示例照片：點選示例 → 分析 → 該筆出現在列表最上、編號正確。
- 單筆刪除（無確認）/ 多筆刪除（刪除模式＋確認框）/ 全部刪除（確認框）皆可用；刪後 `N/100`、編號、列表立即更新。
- 375px mobile：細條不擠破 header/內容；overlay 展開、點選、關閉皆可用。
- `tsc --noEmit` 與 `npm run build:export` 通過。

## 裁定（owner，2026-09）

1. **刪除功能**：加單筆 / 多筆（複選）/ 一鍵全選——細節見「刪除功能」section。
2. **示例照片**：計入（使用者點選觸發分析時）。
3. **xs 展開方式**：左側 overlay（本研究建議，獲採用）。
