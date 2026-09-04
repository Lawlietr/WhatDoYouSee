import type { AIProvider, AnalysisRequest, AnalysisResponse, ProviderConfig } from "../types";

const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";

export const claudeProvider: AIProvider = {
  id: "claude",
  name: "Anthropic (Claude)",
  requiresApiKey: true,
  supportsVision: true,
  enabled: false,
  configSchema: [
    { key: "baseUrl", label: "Base URL", type: "url", required: true, placeholder: DEFAULT_BASE_URL },
    { key: "model", label: "Model", type: "text", required: false, placeholder: "claude-sonnet-4" },
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-ant-..." },
  ],

  async analyze(_request: AnalysisRequest, _config: ProviderConfig): Promise<AnalysisResponse> {
    // TODO: implement Claude vision via /messages with image base64 content block
    throw new Error("Claude provider is not implemented yet");
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
    // TODO: verify key via a minimal /messages call or /v1/models
    void config;
    return false;
  },
};
