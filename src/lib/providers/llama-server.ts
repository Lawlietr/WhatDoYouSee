import type { AIProvider, AnalysisRequest, AnalysisResponse, ProviderConfig } from "../types";
import { PRIVACY_ANALYSIS_SYSTEM_PROMPT, buildUserPrompt } from "./system-prompt";
import { fileToDataURL, parseAnalysisJson } from "./utils";

const DEFAULT_BASE_URL = "http://localhost:8080/v1";

const CONNECT_TIMEOUT_MS = 10000;
const INFER_TIMEOUT_MS = 10 * 60 * 1000;

function normalizeBaseUrl(baseUrl: string): string {
  let base = baseUrl.trim().replace(/\/$/, "");
  if (!base) base = DEFAULT_BASE_URL;
  if (!/^https?:\/\//i.test(base)) base = `http://${base}`;
  if (!/\/v1$/i.test(base)) base += "/v1";
  return base;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = CONNECT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function authHeaders(apiKey?: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

async function chatCompletion(
  baseUrl: string,
  model: string,
  userPrompt: string,
  imageDataUrl: string,
  apiKey?: string
): Promise<string> {
  const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(apiKey) },
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
      max_tokens: 4096,
      temperature: 0.3,
      // Qwen3/Qwen3.5 "thinking" models spend their whole token budget in
      // reasoning_content and leave content empty; llama.cpp honors this
      // template kwarg and non-Qwen templates ignore it.
      chat_template_kwargs: { enable_thinking: false },
    }),
  }, INFER_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error(
      `llama-server responded ${response.status}: ${await safeBody(response)}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string; reasoning_content?: string };
      finish_reason?: string;
    }>;
    usage?: { completion_tokens?: number };
  };
  const choice = data.choices?.[0];
  let content = choice?.message?.content ?? "";
  // Fallback for thinking models whose budget was exhausted inside
  // reasoning_content, so the user sees something instead of nothing.
  if (!content.trim()) content = choice?.message?.reasoning_content ?? "";
  if (!content.trim()) {
    throw new Error(
      `llama-server returned no content (finish_reason: ${choice?.finish_reason ?? "?"}, ` +
        `${data.usage?.completion_tokens ?? "?"} tokens). If this is a "thinking" model ` +
        `its reasoning may have exhausted the token budget; try a non-thinking model.`
    );
  }
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
  baseUrl: string = DEFAULT_BASE_URL,
  apiKey?: string
): Promise<string[]> {
  const response = await fetchWithTimeout(
    `${normalizeBaseUrl(baseUrl)}/models`,
    { headers: authHeaders(apiKey) }
  );
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
      label: "Server",
      type: "text",
      required: true,
      placeholder: "http://<your-llama-server-host>:8080",
      helperText: "host:port of your llama-server — the /v1 prefix is added automatically",
    },
    {
      key: "model",
      label: "Model",
      type: "text",
      required: false,
      placeholder: "preset name or model id from /v1/models (blank = auto-detect)",
      helperText: "baseUrl only needs host:port — /v1 is added automatically",
    },
    {
      key: "apiKey",
      label: "API Key",
      type: "password",
      required: false,
      placeholder: "only if llama-server was started with --api-key",
    },
  ],

  async analyze(request: AnalysisRequest, config: ProviderConfig): Promise<AnalysisResponse> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    let model = config.model ?? "";
    if (!model) {
      const models = await fetchAvailableModels(baseUrl, config.apiKey);
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
      imageDataUrl,
      config.apiKey
    );
    return parseAnalysisJson(content);
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    try {
      const response = await fetchWithTimeout(
        `${normalizeBaseUrl(baseUrl)}/models`,
        { headers: authHeaders(config.apiKey) }
      );
      return response.ok;
    } catch {
      return false;
    }
  },
};
