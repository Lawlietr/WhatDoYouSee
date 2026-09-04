import type { AIProvider } from "../types";
import { llamaServerProvider } from "./llama-server";
import { webgpuProvider } from "./webgpu";
import { openaiProvider } from "./openai";
import { claudeProvider } from "./claude";
import { grokProvider } from "./grok";
import { openrouterProvider } from "./openrouter";

const providers: AIProvider[] = [
  webgpuProvider,
  llamaServerProvider,
  openaiProvider,
  claudeProvider,
  grokProvider,
  openrouterProvider,
];

export function getProvider(id: string): AIProvider | undefined {
  return providers.find((p) => p.id === id);
}

export function getProviderOrThrow(id: string): AIProvider {
  const provider = getProvider(id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}

export function listProviders(): AIProvider[] {
  return providers;
}

export function enabledProviders(): AIProvider[] {
  return providers.filter((p) => p.enabled);
}
