"use client";

import { useMemo } from "react";
import { useSettings } from "./useSettings";
import { getProvider } from "../lib/providers/registry";
import { webgpuProvider } from "../lib/providers/webgpu";
import type { AIProvider, ProviderConfig } from "../lib/types";

export interface ActiveProvider {
  provider: AIProvider;
  config: ProviderConfig;
}

export function useProvider(): ActiveProvider {
  const { settings } = useSettings();

  return useMemo<ActiveProvider>(() => {
    if (settings.inferenceMode === "webgpu") {
      return { provider: webgpuProvider, config: { model: settings.webgpuModelId } };
    }
    const provider = getProvider(settings.activeProvider) ?? webgpuProvider;
    return {
      provider,
      config: settings.providerConfigs[provider.id] ?? {},
    };
  }, [settings]);
}
