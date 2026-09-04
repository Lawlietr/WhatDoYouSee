import type { AIProvider, AnalysisRequest, AnalysisResponse, ProviderConfig } from "../types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export const openaiProvider: AIProvider = {
  id: "openai",
  name: "OpenAI (GPT-4o)",
  requiresApiKey: true,
  supportsVision: true,
  enabled: false,
  configSchema: [
    { key: "baseUrl", label: "Base URL", type: "url", required: true, placeholder: DEFAULT_BASE_URL },
    { key: "model", label: "Model", type: "text", required: false, placeholder: "gpt-4o" },
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-..." },
  ],

  async analyze(_request: AnalysisRequest, _config: ProviderConfig): Promise<AnalysisResponse> {
    // TODO: implement GPT-4o vision via /chat/completions
    throw new Error("OpenAI provider is not implemented yet");
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
    // TODO: GET {baseUrl}/models with Authorization header
    void config;
    return false;
  },
};
