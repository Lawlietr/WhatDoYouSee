import type { AIProvider, AnalysisRequest, AnalysisResponse, ProviderConfig } from "../types";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

export const openrouterProvider: AIProvider = {
  id: "openrouter",
  name: "OpenRouter (gateway)",
  requiresApiKey: true,
  supportsVision: true,
  enabled: false,
  configSchema: [
    { key: "baseUrl", label: "Base URL", type: "url", required: true, placeholder: DEFAULT_BASE_URL },
    { key: "model", label: "Model", type: "text", required: false, placeholder: "openai/gpt-4o" },
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-or-..." },
  ],

  async analyze(_request: AnalysisRequest, _config: ProviderConfig): Promise<AnalysisResponse> {
    // TODO: implement OpenRouter vision via /chat/completions (OpenAI-compatible)
    throw new Error("OpenRouter provider is not implemented yet");
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
    // TODO: GET {baseUrl}/models with Authorization header
    void config;
    return false;
  },
};
