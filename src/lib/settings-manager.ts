import type { AppSettings, ProviderConfig } from "./types";
import { defaultProviderConfigs, DEFAULT_WEBGPU_MODEL } from "./providers/defaults";

const STORAGE_KEY = "they-see-your-photo:settings";

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
    return {
      ...defaults,
      ...parsed,
      providerConfigs: { ...defaults.providerConfigs, ...(parsed.providerConfigs ?? {}) },
    };
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
