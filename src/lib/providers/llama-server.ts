import type { AIProvider, AnalysisRequest, AnalysisResponse, ProviderConfig } from "../types";
import { PRIVACY_ANALYSIS_SYSTEM_PROMPT, buildUserPrompt } from "./system-prompt";
import { fileToDataURL, parseAnalysisJson } from "./utils";

const DEFAULT_BASE_URL = "http://localhost:8080/v1";

async function chatCompletion(
  baseUrl: string,
  model: string,
  userPrompt: string,
  imageDataUrl: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: PRIVACY_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `llama-server responded ${response.status}: ${await safeBody(response)}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("llama-server returned no content");
  return content;
}

async function safeBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return response.statusText;
  }
}

export async function fetchAvailableModels(
  baseUrl: string = DEFAULT_BASE_URL
): Promise<string[]> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`llama-server responded ${response.status}: ${await safeBody(response)}`);
  }
  const data = (await response.json()) as { data?: Array<{ id: string }> };
  return (data.data ?? []).map((m) => m.id);
}

export const llamaServerProvider: AIProvider = {
  id: "llama-server",
  name: "llama-server (local)",
  requiresApiKey: false,
  supportsVision: true,
  enabled: true,
  configSchema: [
    {
      key: "baseUrl",
      label: "Base URL",
      type: "url",
      required: true,
      placeholder: DEFAULT_BASE_URL,
    },
    {
      key: "model",
      label: "Model",
      type: "text",
      required: false,
      placeholder: "preset name or model id from /v1/models (blank = auto-detect)",
    },
  ],

  async analyze(request: AnalysisRequest, config: ProviderConfig): Promise<AnalysisResponse> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    let model = config.model ?? "";
    if (!model) {
      const models = await fetchAvailableModels(baseUrl);
      if (models.length === 0) {
        throw new Error("No models loaded on the llama-server. Start it with -m/-hf or a models preset, or enter the model name in settings.");
      }
      model = models[0];
    }
    const imageDataUrl = await fileToDataURL(request.file);
    const content = await chatCompletion(
      baseUrl,
      model,
      buildUserPrompt(request.exif),
      imageDataUrl
    );
    return parseAnalysisJson(content);
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
