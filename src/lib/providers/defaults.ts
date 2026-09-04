import type { ProviderConfig } from "../types";

export const DEFAULT_WEBGPU_MODEL = "LiquidAI/LFM2.5-VL-3B-ONNX";
export const DEFAULT_LLAMA_BASE_URL = "http://localhost:8080/v1";
export const DEFAULT_BACKEND_MODEL = "liquidai/lfm2.5-vl-3b-gguf";

export function defaultProviderConfigs(): Record<string, ProviderConfig> {
  return {
    "llama-server": { baseUrl: DEFAULT_LLAMA_BASE_URL, model: DEFAULT_BACKEND_MODEL },
    openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
    claude: { baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-4" },
    grok: { baseUrl: "https://api.x.ai/v1", model: "grok-2-vision" },
    openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4o" },
  };
}
