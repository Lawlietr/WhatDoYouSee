import type { AIProvider, AnalysisRequest, AnalysisResponse, ProviderConfig } from "../types";

const DEFAULT_BASE_URL = "https://api.x.ai/v1";

export const grokProvider: AIProvider = {
  id: "grok",
  name: "xAI (Grok)",
  requiresApiKey: true,
  supportsVision: true,
  enabled: false,
  configSchema: [
    { key: "baseUrl", label: "Base URL", type: "url", required: true, placeholder: DEFAULT_BASE_URL },
    { key: "model", label: "Model", type: "text", required: false, placeholder: "grok-2-vision" },
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "xai-..." },
  ],

  async analyze(_request: AnalysisRequest, _config: ProviderConfig): Promise<AnalysisResponse> {
    // TODO: implement Grok vision via /chat/completions (OpenAI-compatible)
    throw new Error("Grok provider is not implemented yet");
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
    // TODO: GET {baseUrl}/models with Authorization header
    void config;
    return false;
  },
};
