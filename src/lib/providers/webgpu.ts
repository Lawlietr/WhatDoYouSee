import type { AIProvider, AnalysisRequest, AnalysisResponse, ProviderConfig } from "../types";
import { PRIVACY_ANALYSIS_SYSTEM_PROMPT, buildUserPrompt } from "./system-prompt";
import { parseAnalysisJson } from "./utils";
import { DEFAULT_WEBGPU_MODEL } from "./defaults";

type RawImageType = import("@huggingface/transformers").RawImage;

const pipelineCache = new Map<string, Promise<WebGPUState>>();

interface WebGPUState {
  run(images: RawImageType[], prompt: string): Promise<string>;
}

function isBrowser(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

async function getDevice(): Promise<GPUAdapter | null> {
  if (!isBrowser()) return null;
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
  return gpu ? gpu.requestAdapter() : null;
}

async function loadPipeline(modelId: string): Promise<WebGPUState> {
  const cached = pipelineCache.get(modelId);
  if (cached) return cached;
  const promise = (async () => {
    const { AutoModelForImageTextToText, AutoTokenizer, env } = await import(
      "@huggingface/transformers"
    );
    env.allowLocalModels = false;

    const model = await AutoModelForImageTextToText.from_pretrained(modelId, {
      device: "webgpu",
      dtype: "q4",
    });
    const tokenizer = await AutoTokenizer.from_pretrained(modelId);

    return {
      async run(images: RawImageType[], prompt: string): Promise<string> {
        const text = `${PRIVACY_ANALYSIS_SYSTEM_PROMPT}\n\n${prompt}`;
        const inputs = {
          input_ids: (await tokenizer(text, {
            padding: true,
            truncation: true,
            max_length: 2048,
          })) as Record<string, unknown>,
          pixel_values: images,
        };
        const outputs = (await model.generate({ ...inputs, max_new_tokens: 2048 })) as {
          sequence: { toString(): string };
        }[];
        const generated = outputs[0].sequence;
        return generated.toString().slice(text.length);
      },
    };
  })();
  pipelineCache.set(modelId, promise);
  promise.catch(() => pipelineCache.delete(modelId));
  return promise;
}

async function loadRawImage(url: string): Promise<RawImageType> {
  const { RawImage } = await import("@huggingface/transformers");
  return (await RawImage.fromURL(url)) as RawImageType;
}


export const webgpuProvider: AIProvider = {
  id: "webgpu",
  name: "WebGPU (in-browser)",
  requiresApiKey: false,
  supportsVision: true,
  enabled: true,
  configSchema: [
    { key: "model", label: "Model", type: "text", required: false, placeholder: DEFAULT_WEBGPU_MODEL },
  ],

  async analyze(request: AnalysisRequest, config: ProviderConfig): Promise<AnalysisResponse> {
    if (!isBrowser() || !(await getDevice())) {
      throw new Error("WebGPU is not supported in this browser");
    }
    const modelId = config.model || DEFAULT_WEBGPU_MODEL;
    const url = URL.createObjectURL(request.file);
    try {
      const [rawImage, pipeline] = await Promise.all([loadRawImage(url), loadPipeline(modelId)]);
      const text = await pipeline.run([rawImage], buildUserPrompt(request.exif));
      return parseAnalysisJson(text);
    } finally {
      URL.revokeObjectURL(url);
    }
  },

  async testConnection(_config: ProviderConfig): Promise<boolean> {
    return isBrowser() && (await getDevice()) != null;
  },
};

export async function isWebGpuSupported(): Promise<boolean> {
  return isBrowser() && (await getDevice()) != null;
}
