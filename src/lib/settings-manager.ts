import type { AppSettings, ProviderConfig } from "./types";
import { defaultProviderConfigs, DEFAULT_WEBGPU_MODEL } from "./providers/defaults";
import { WEBGPU_MODELS } from "./model-catalog";

const STORAGE_KEY = "what-do-you-see:settings";

export function defaultSettings(): AppSettings {
  return {
    inferenceMode: "webgpu",
    activeProvider: "llama-server",
    providerConfigs: defaultProviderConfigs(),
    language: "en",
    webgpuModelId: DEFAULT_WEBGPU_MODEL,
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const defaults = defaultSettings();
    const merged: AppSettings = {
      ...defaults,
      ...parsed,
      providerConfigs: { ...defaults.providerConfigs, ...(parsed.providerConfigs ?? {}) },
    };
    if (!WEBGPU_MODELS.some((m) => m.id === merged.webgpuModelId)) {
      merged.webgpuModelId = DEFAULT_WEBGPU_MODEL;
    }
    return merged;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getProviderConfig(
  settings: AppSettings,
  id: string
): ProviderConfig | null {
  return settings.providerConfigs[id] ?? null;
}

export function setProviderConfig(
  settings: AppSettings,
  id: string,
  config: ProviderConfig
): AppSettings {
  return { ...settings, providerConfigs: { ...settings.providerConfigs, [id]: config } };
}
