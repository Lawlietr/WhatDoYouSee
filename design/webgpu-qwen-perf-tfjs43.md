# WebGPU Qwen3.5-4B 效能診斷 + transformers.js 4.3 評估

**日期：** 2026-09-21
**起因：** owner 回報 Qwen3.5-4B 在 WebGPU 很慢（GPU 一開始飆高後平緩），並問「我們的 transformers.js 是否太舊」。
**結論（owner 決策）：** 維持 **4.2.0**。Qwen3.5-4B 在 browser WebGPU 屬於「能用但結構性慢」（7–9 分鐘/張），與 runtime 版本、quant 變體、硬體皆無關；LFM2.5-450M（~10 秒）是實用的 WebGPU 模型。

---

## 1. 診斷過程與發現

### 1.1 否決的假設（實測）

| 假設 | 結果 |
|------|------|
| 「模型硬跑滿 max_new_tokens budget」 | **否決**。node + CPU 用與 app 相同的流程（q4f16、相同 chat template、相同 processor 呼叫）實測：簡短問題下模型**自己在 ~200 tokens 停止**，EOS 正常。 |
| 「照片尺寸造成 visual tokens 爆炸」 | **否決**。walk.jpg（1600×1067，4:3）縮放後 `image_grid_thw = [1,66,98]` = 1617 visual tokens，量級正常。 |
| 「換 quant 變體（fp16/q4/quantized）可改善」 | **否決**。onnx-community/Qwen3.5-4B-ONNX 五種變體（預設/fp16/q4/q4f16/quantized）的 decoder 圖結構完全相同：都是 **24 個 `If` + 16 個 `Range`**。dtype 只改 GEMM 跑法與記憶體，不影響此結構。 |

### 1.2 結構性原因

- Qwen3.5-4B decoder ONNX 圖有 **24 個 `If` 節點**（linear attention 的狀態更新，每個子圖 ~80 個小 tensor op）+ 16 個 `Range`；LFM2.5-450M 有 **0 個 `If`**（所以它快）。
- onnxruntime-web 的 WebGPU EP（**1.26.0-dev 與 1.31.0-dev 皆同**）：48 個 op 檔案（1.31 多一個 dft.ts），**沒有 `if.ts`**——`If` 不是 GPU kernel。官方 `webgpu-operators.md`（microsoft/onnxruntime `js/web/docs/`）把 `If` 列為 supported，那是 **runtime 層 control flow**（cond 在 host 評估、子圖逐節點派發），不是融合的 GPU kernel。
- **⚠️ 證據修正（給未來 session 的警告）：** 初診曾引用 C++ native ORT 的 `core/providers/webgpu/if.cc`（WebGPU `If` 直接 call base CPU version）當「smoking gun」——那是 **native ORT 的 C++ EP，不是瀏覽器用的 onnxruntime-web（JS/TS）EP**，對本專案不適用。正確證據是 1.2 的 JS EP op 清單（`lib/wasm/jsep/webgpu/ops/` 無 if.ts）。不要再引用 C++ 版。
- 每 token 的 overhead（24 次 If control-flow + 上千個小 kernel 派發）的**精確機制**在瀏覽器端無法從靜態分析確定；但 4.2/4.3 兩個版本的實測速度（§3）一致顯示「結構性慢」。

## 2. transformers.js 4.3.0 評估

- 4.2.0（2026-04-22，本專案原版本，ORT-web 1.26.0-dev.20260416）vs 4.3.0（2026-09-16，ORT-web **1.31.0-dev.20260914**）。
- 4.3.0 對本專案有用的特性：
  - **Safari 26+ WebGPU**（Mac 使用者多一個選擇）
  - `@huggingface/transformers-structured-output`（JSON schema 約束生成——有機會解決 450M「只寫散文不出 JSON」問題，**值得未來用 4.3 重測**）
  - TextStreamer（streaming 顯示）
  - 修復 `progress_callback` 開啟時重複下載模型檔（與我們的下載流程相關）
- **對 Qwen 慢的期待：不成立。** 1.31 的 WebGPU EP 同樣沒有 `if.ts`（實測 npm tarball）。
- **部署阻斷（關鍵）：** 4.3.0 的 browser build **硬編碼**使用 `ort-wasm-simd-threaded.asyncify.wasm`（16 處引用、無 env 開關可切回小變體），該檔 **26,861,777 bytes = 25.6MiB**，超過 **Cloudflare Pages 單檔 25MiB 上限**（差 0.6MiB）→ wrangler 直接拒絕上傳。
  - 該檔在磁碟上是 **sparse file**（實體 ~12MB、邏輯 25.6MiB）；CF 算邏輯大小，de-sparse 無效。
  - 4.2.0 時代此檔是 12MiB（不同變體）所以從未觸限。

### 2.1 替代託管平台（單檔 25.6MiB + 全站 ~30MB）

| 平台 | 單檔限制 | 總量 | 備註 |
|------|---------|------|------|
| **Vercel Hobby** | 無 | CLI 上傳 ≤ 100MB（我們 ~30MB ✅） | 100GB 頻寬/月；自訂域名免費；**首選** |
| GitHub Pages | 無 | repo 1GB 軟限 | repo 已 public（Lawlietr/WhatDoYouSee）；git 每次 push ~30MB 二進位會永久膨脹 |
| HF Static Spaces | 無 | 無 | 同 git 膨脹問題；AI 社群曝光 |
| Netlify | 無 | zip ≤ 1.25GB | **2026 新制 300 credits/月，用完會 PAUSE**——不推薦 |
| Cloudflare Pages | **25MiB/檔** | — | 現行；4.3 卡死 |

（owner 曾問「GitHub Pages / versel?」——Vercel 拼法 v-e-r-c-e-l。）

## 3. 實測數據（owner，Mac + Brave，WebGPU，同一張 walk.jpg）

| 版本 | Qwen3.5-4B | LFM2.5-VL-3B | LFM2.5-450M |
|------|-----------|-------------|-------------|
| 4.2.0 / ORT 1.26 | **557.1s** | **55s（en）/ 82s（zh）** | 10.9s |
| 4.3.0 / ORT 1.31 | **414.2s** | — | 9.7s |

- ORT 1.31 對 Qwen 快 ~26%，但兩者都不可實用（7–9 分鐘/張）。
- **LFM2.5-VL-3B 是 WebGPU 的實用主力**：55–82s/張、遠快於 Qwen 4B，中文輸出「及格」（owner 定語，明顯優於 450M）。
- LFM 450M 在 4.3 無回歸（9.7s，正常）——4.3 升級本身功能上是安全的，唯一問題是 CF 25MiB 部署阻斷。
- 推論耗時顯示：結果區上方的 caption（`page.tsx` 用 `meta.latencyMs` 渲染 `Analyzed with … in X.Xs`）**本來就有**，不用新加。

## 4. 現狀與決策

- **owner 決策（2026-09-21）：先用 4.2.0**（維持 CF Pages 部署路徑；Vercel 遷移未拍板）。
- DEV 分支已回退至 4.2.0，且 package.json **pin 死 `4.2.0`（非 caret）**——caret `^4.2.0` 會讓新 session/新 clone 的 `npm install` 解析到 4.3.0，再撞 CF 上限。
- 4.3.0 的升級 commit 仍在 git 歷史（`ec6f534`），要重啟升級時 `git revert`/`cherry-pick` 即可，再配合託管平台變更（Vercel 為首選）。
- 本機測試實例（**2026-09-21 晚已清理，皆未運行**）：4.2 實例（worktree `/tmp/wdys-42` + 3104/3444）已**刪除**；4.3 實例（3103/3443）已**關閉但未刪除**（主樹 `.next` 仍是 4.3 build）。要重啟 4.3 測試：現有 `.next` 就是 4.3 build，直接 `npm start -- -p 3103 -H 0.0.0.0` + `node scripts/https-test-server.mjs`（PROXY_TARGET 指向 3103）即可；若要從 source 重建：`git checkout ec6f534` → `npm install`（4.3）→ `npm run build`。注意：任何 `npm run build` 在 DEV（4.2）上會把 `.next` 蓋回 4.2。模型 cache 是 **per-origin**（browser Cache API）：換 port = 換 origin = 模型重下。
- 4.2 部署狀態：test 站（wdustesting）已 promote 回 4.2 部署 `3baa2595`；production（wdus）一直是 4.2。
- 4.3 部署嘗試的殘骸：test 站曾有 incomplete deployment `390ddeca`（index.html 新、部分 chunk 404）——已被 promote 覆蓋，無後遺症。
- **owner 決策（2026-09-21，Qwen WebGPU 去留）：UI 隱藏、不刪除。** Qwen3.5-4B 在 WebGPU 設定（模型下載對話框）中不再顯示，Thinking 開關也一併隱藏（它本就是為 Qwen 加的）——目標：WebGPU 模型選項回到 Qwen 加入前一樣（只剩 450M/3B）。實作：`model-catalog.ts` 加 `hidden` 旗標（Qwen = `hidden: true`，資料與尺寸全保留）＋ `VISIBLE_WEBGPU_MODELS` 供 UI 過濾；`webgpu.ts` 的 Qwen 推論路徑、processor 順序、1568px 縮圖、`enable_thinking` 邏輯全未動，未隱藏前已選定的 Qwen 設定仍會正常推論。要恢復顯示：移除 `hidden: true` + 把 Thinking 開關 JSX 加回 `WebGPUSettings.tsx`（git 歷史可查）。

## 5. 未來選項（未排期）

1. **UI 標註**：模型清單中 Qwen3.5-4B 標「browser 推論慢（~7–9 min）」，建議 API mode。
2. **換託管到 Vercel** 後重啟 4.3 升級 → 順帶可測 structured output（450M JSON 表格問題）與 streaming。
3. **Qwen 走 API mode**（llama-server + Qwen3.5-9B-VL）是「完整結構化輸出」的現行正解（見 `LOCAL-TEST-NOTES.md`）。
