import type { ModelInfo } from "./types";

export const WEBGPU_MODELS: ModelInfo[] = [
  {
    id: "LiquidAI/LFM2.5-VL-3B-ONNX",
    name: "LFM2.5-VL-3B (Q4)",
    format: "ONNX",
    sizeBytes: 2_758_000_000,
    source: "huggingface.co (Hugging Face CDN)",
  },
  {
    id: "LiquidAI/LFM2.5-VL-1.6B-ONNX",
    name: "LFM2.5-VL-1.6B (Q4)",
    format: "ONNX",
    sizeBytes: 1_423_000_000,
    source: "huggingface.co (Hugging Face CDN)",
  },
  {
    id: "LiquidAI/LFM2.5-VL-450M-ONNX",
    name: "LFM2.5-VL-450M (Q4)",
    format: "ONNX",
    sizeBytes: 521_000_000,
    source: "huggingface.co (Hugging Face CDN)",
  },
];

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return WEBGPU_MODELS.find((m) => m.id === modelId);
}
