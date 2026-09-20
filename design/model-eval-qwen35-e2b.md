# 評估：Qwen3.5-4B-ONNX 與 gemma-4-E2B-it-ONNX（標準版）加入 WebGPU 模型清單

> 日期：2026-09-20。僅評估，未實作。驗證方式：transformers.js 4.2.0 npm tarball dist 內碼 + HF API 檔案清單/size + 兩個 ONNX repo 的 config / preprocessor / chat template。
>
> 背景：先前已否決 `onnx-community/gemma-4-E2B-it-qat-mobile-ONNX`（mobile QAT 版）——需要 ONNX Runtime ≥1.27.0（當時僅能從 source build）+ `wNa8o8` 自訂 quant schema。本文評估的是**標準版** `onnx-community/gemma-4-E2B-it-ONNX`。

## 結論

| | Qwen3.5-4B-ONNX | gemma-4-E2B-it-ONNX（標準版） |
|---|---|---|
| **建議** | ✅ 值得整合（先做一次性瀏覽器 smoke test） | ❌ 不建議（體積更大、有效參數更少、路徑更新、無額外價值） |
| 下載大小（q4f16 最小集合 + 設定檔） | **≈ 2.82 GiB** | **≈ 3.10 GiB** |
| 有效參數 | 4B dense | 2.3B effective（5.1B total，PLE） |
| Session 數 | 3（embed + decoder + vision） | 4（多一個 audio_encoder，對我們是純負擔 163.5 MB） |
| tfjs 4.2.0 管線成熟度 | 高（繼承 Qwen3-VL 整條成熟管線） | 低（全新 gemma4 路徑：PLE + hybrid attention + p-RoPE） |
| 授權 | Apache-2.0（base 6.8M 下載） | Apache 2.0（Gemma 4；base 3.35M 下載） |
| thinking 預設 | **開**（template 預設 reasoning） | 關（需 system prompt 開頭放 `<|think|>` 才開） |
| WebGPU 公開先例 | webml-community「Qwen3.5 WebGPU」Space（0.8B/2B/4B） | ONNX README 附 tfjs WebGPU 範例 |

## Qwen3.5-4B-ONNX（onnx-community/Qwen3.5-4B-ONNX）

**已驗證**
- `config.json`：`architectures: ["Qwen3_5ForConditionalGeneration"]`、`model_type: qwen3_5`、`text_config.model_type: qwen3_5_text`（32 層、hidden 2560、GQA 16/4、vocab 248320、hybrid linear+full attention——dist 有對應的 KV-cache 特例代碼）
- dist 內：`Qwen3_5ForConditionalGeneration = class extends Qwen3VLForConditionalGeneration`；登記在 `MODEL_FOR_IMAGE_TEXT_TO_TEXT_MAPPING_NAMES` → 現有 `AutoModelForImageTextToText` 路徑直接可用
- 無 audio → session 結構與 LFM2.5-VL 相同：`embed_tokens` + `decoder_model_merged` + `vision_encoder`
- `preprocessor_config.json`：`processor_class: "Qwen3VLProcessor"`（✅ 已在 tfjs export map，`extends Qwen2_5_VLProcessor`）+ `image_processor_type: "Qwen2VLImageProcessorFast"`（✅ tfjs 會 `replace(/Fast$/,'')` → `Qwen2VLImageProcessor`）——雙路徑都能解析
- q4f16 最小集合（HF tree API 精確 size）：

| 檔案 | 大小 |
|------|------|
| decoder_model_merged_q4f16.onnx + 2 shards | 2323.3 MB |
| embed_tokens_q4f16.onnx + shard | 350.5 MB |
| vision_encoder_q4f16.onnx + shard | 189.4 MB |
| **小計** | **2863.2 MB ≈ 2.80 GiB** |

  加 tokenizer.json（18.3 MB）等 JSON → 約 2.82 GiB。**比 LFM2.5-VL-3B（3.72 GB）小 25%，參數更多**
- `transformers.js_config.use_external_data_format` 與實際檔案完全吻合（decoder q4f16 = 2 shards、embed = 1、vision = 1）

**整合時的三個必做點**
1. **明確傳 per-session dtype**——WebGPU 的 `DEFAULT_DEVICE_DTYPE = fp32`，不指定的話會去解析 bf16 base（decoder 單是 base 就 15.2 GB）。catalog 需帶 `{decoder_model_merged:'q4f16', embed_tokens:'q4f16', vision_encoder:'q4f16'}`（同 LFM2.5 的 per-submodel dtype map 機制）
2. **thinking 預設開 → 做成使用者切換，預設關（owner 需求 2026-09-20）**——Qwen3.5-4B 的 chat template 原生支援 `enable_thinking` Jinja 變數（已驗證模板原文）：
   - `enable_thinking: false` → 模板輸出空的 `\n\n`（即空思考區塊），模型直接回答
   - 未定義或 `true` → 模型先思考再回答
   - 轉發路徑已驗證（tfjs 4.2.0 dist）：`processor.apply_chat_template` 原樣透傳 options → `tokenizer.apply_chat_template` 把所有非保留 options 以 `...kwargs` 展開進 Jinja render——所以 WebGPU 端直接傳**頂層** `enable_thinking`（注意：不是 llama-server/OpenAI API 的 `chat_template_kwargs` 包裝格式；`llama-server.ts` 用 `chat_template_kwargs` 是因為那是 OpenAI chat API 的欄位）
   - 實作草圖（`webgpu.ts`）：`apply_chat_template(messages, { add_generation_prompt: true, enable_thinking: request.enableThinking ?? false })`；LFM2.5-VL 等無此變數的模板會忽略多餘變數，三個模型共用同一行沒問題
   - 開啟 thinking 時輸出端要剝離 `<think>...</think>` 區塊（含 closing tag）再進 `parseAnalysisResilient`
   - UI：Settings → WebGPU 加「Thinking」switch，**預設關**；存 localStorage（其他 WebGPU 設定同機制）
3. **下載 filePatterns 要鎖死 q4f16 最小集合**——該 repo 同時包含 q4 / q8 / bf16 base 等多種 dtype 變體（bf16 base decoder 15.2 GB）。`model-catalog.ts` 的 `filePatterns` 必須精確匹配 q4f16 的 7 個 ONNX 檔（含 `_onnx_data(_N)?` shards）+ JSON 檔，`model-cache.ts` 的 HF tree 過濾才會只抓需要的

## gemma-4-E2B-it-ONNX（onnx-community，標準版）——否決

**已驗證的事實**
- 架構 `Gemma4ForConditionalGeneration extends Gemma3nForConditionalGeneration`（PLE forward 全繼承）；走 `ImageAudioTextToText` 的 session config → **強制需要 4 個 session，多一個 `audio_encoder`（q4f16 ≈ 163.5 MB）**——我們純圖像用途，這部分是下載與記憶體上的純負擔
- PLE（Per-Layer Embedding）架構：5.1B 總參數但**有效參數只有 2.3B**——同體積下比 Qwen3.5-4B 的 4B dense 少一半
- q4f16 下載 ≈ 3.05 GiB（+audio ≈ 3.10 GiB），比 Qwen3.5-4B 還大
- gemma4 在 tfjs 4.2.0 是**全新路徑**（PLE + hybrid attention + p-RoPE），沒有像 Qwen3-VL 那樣已被多個模型驗證過的成熟管線
- 唯一加分項：thinking 預設關（不需 template 參數調整）；ONNX README 附官方 tfjs WebGPU 範例

**結論**：沒有比 Qwen3.5-4B 好任何一點（更小？否；更有效參數？否；更簡單管線？否；下載更小？否），不加入。

## 下一步（待 owner 指示，尚未實作）

1. **一次性瀏覽器 smoke test**（P1 驗證門檻）：在部署站（WebGPU 需 secure context，`wdustesting.avpclub.eu.org` 或本地 https 代理）用 `Gemma4ForConditionalGeneration` 對照的 `AutoModelForImageTextToText.from_pretrained('onnx-community/Qwen3.5-4B-ONNX', {dtype: {...}, device:'webgpu'})` 載入並推一張 example 照片，確認：
   - q4f16 權重可完整載入（6 GB+ VRAM 獨顯）
   - 圖像推理可出文（4B 應能產出 `{paras, table}` JSON，若失敗記下實際輸出）
   - 首次 shader compile + 權重載入的 `loading` 階段時長（驗證 UI spinner 足夠）
2. 通過後才動 catalog：`model-catalog.ts` 加 `WEBGPU_MODELS` 條目（sizeBytes 用本文精確值）、`defaults.ts` 維持 450M 為預設、UI 顯示序 450M → 3B → Qwen3.5-4B（smallest→largest）
3. smoke test 不通過或記憶體吃緊 → 回到 3B 上限，Qwen3.5-4B 僅留待 WebGPU 記憶體上限放開後再評估
