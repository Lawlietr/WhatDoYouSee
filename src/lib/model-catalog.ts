import type { DataType } from "@huggingface/transformers";
import type { ModelInfo } from "./types";

export interface WebGpuModelInfo extends ModelInfo {
  dtype: Record<string, DataType>;
  filePatterns: string[];
}

const LFM2_5_VL_DTYPES: Record<string, DataType> = {
  vision_encoder: "fp16",
  embed_tokens: "fp16",
  decoder_model_merged: "q4",
};

const LFM2_5_VL_FILE_PATTERNS = [
  "^onnx/embed_tokens_fp16\\.onnx(_data(_\\d+)?)?$",
  "^onnx/vision_encoder_fp16\\.onnx(_data(_\\d+)?)?$",
  "^onnx/decoder_model_merged_q4\\.onnx(_data(_\\d+)?)?$",
  "\\.json$",
  "\\.jinja$",
];

export const WEBGPU_MODELS: WebGpuModelInfo[] = [
  {
    id: "LiquidAI/LFM2.5-VL-3B-ONNX",
    name: "LFM2.5-VL-3B (fp16 encoder + Q4 decoder)",
    format: "ONNX",
    sizeBytes: 3_999_475_483,
    source: "huggingface.co (Hugging Face CDN)",
    dtype: LFM2_5_VL_DTYPES,
    filePatterns: LFM2_5_VL_FILE_PATTERNS,
  },
  {
    id: "LiquidAI/LFM2.5-VL-450M-ONNX",
    name: "LFM2.5-VL-450M (fp16 encoder + Q4 decoder)",
    format: "ONNX",
    sizeBytes: 808_759_577,
    source: "huggingface.co (Hugging Face CDN)",
    dtype: LFM2_5_VL_DTYPES,
    filePatterns: LFM2_5_VL_FILE_PATTERNS,
  },
];

export function getModelInfo(modelId: string): WebGpuModelInfo | undefined {
  return WEBGPU_MODELS.find((m) => m.id === modelId);
}
