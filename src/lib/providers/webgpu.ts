"use client";

import type {
  AIProvider,
  AnalysisRequest,
  AnalysisResponse,
  ProviderConfig,
} from "../types";
import { PRIVACY_ANALYSIS_SYSTEM_PROMPT, buildUserPrompt } from "./system-prompt";
import { parseAnalysisResilient } from "./utils";
import { getModelInfo } from "../model-catalog";
import { cachedModelState } from "../model-cache";
import { DEFAULT_WEBGPU_MODEL } from "./defaults";
import { isWebGpuSupported as checkGpu } from "./webgpu-support";

interface VlMessageContent {
  type: string;
  text?: string;
}

interface VlMessage {
  role: string;
  content: string | VlMessageContent[];
}

type TransformersModule = typeof import("@huggingface/transformers");
type RawImageType = InstanceType<TransformersModule["RawImage"]>;

interface VlInputs {
  input_ids: { dims: readonly (number | null)[] };
  [key: string]: unknown;
}

interface VlOutputs {
  dims: readonly (number | null)[];
  slice(...slices: (number | number[] | null)[]): VlOutputs;
}

interface VlProcessor {
  (image: RawImageType, text: string, options: Record<string, unknown>): Promise<VlInputs>;
  apply_chat_template(messages: VlMessage[], options: { add_generation_prompt: boolean }): string;
  batch_decode(input: VlOutputs, options: { skip_special_tokens: boolean }): string[];
}

interface VlPipeline {
  model: {
    generate(inputs: VlInputs): Promise<VlOutputs>;
  };
  processor: VlProcessor;
}

const pipelines = new Map<string, Promise<VlPipeline>>();

async function loadPipeline(modelId: string): Promise<VlPipeline> {
  const existing = pipelines.get(modelId);
  if (existing) return existing;
  const promise = (async () => {
    const status = await cachedModelState(modelId);
    if (!status.cached) {
      throw new Error(
        `Model "${modelId}" is not downloaded. Models are never downloaded automatically — open Settings → WebGPU → "Manage models" and download it first.`,
      );
    }
    const { AutoModelForImageTextToText, AutoProcessor, env } = await loadTransformers();
    env.allowLocalModels = false;
    const info = getModelInfo(modelId);
    const device = (await checkGpu()) ? "webgpu" : "wasm";
    const [model, processor] = await Promise.all([
      AutoModelForImageTextToText.from_pretrained(modelId, {
        device,
        dtype: info?.dtype ?? "q4",
      }),
      AutoProcessor.from_pretrained(modelId),
    ]);
    if (!model) throw new Error("Failed to load model");
    if (!processor) throw new Error("Failed to load processor");
    return { model, processor } as VlPipeline;
  })();
  pipelines.set(modelId, promise);
  promise.catch(() => pipelines.delete(modelId));
  return promise;
}

let transformersPromise: Promise<TransformersModule> | null = null;

function loadTransformers(): Promise<TransformersModule> {
  transformersPromise ??= import("@huggingface/transformers");
  return transformersPromise;
}

async function loadImage(file: Blob): Promise<RawImageType> {
  const { RawImage } = await loadTransformers();
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");
    ctx.drawImage(img, 0, 0);
    return await RawImage.fromCanvas(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function run(modelId: string, file: Blob, request: AnalysisRequest): Promise<string> {
  const [pipeline, image] = await Promise.all([
    loadPipeline(modelId),
    loadImage(file),
  ]);
  const messages: VlMessage[] = [
    { role: "system", content: PRIVACY_ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "image" },
        { type: "text", text: buildUserPrompt(request.exif ?? {}) },
      ],
    },
  ];
  const chatPrompt = pipeline.processor.apply_chat_template(messages, {
    add_generation_prompt: true,
  });
  const inputs = await pipeline.processor(image, chatPrompt, {
    add_special_tokens: false,
  });
  const outputs = await pipeline.model.generate({
    ...inputs,
    do_sample: false,
    max_new_tokens: 3072,
  });
  const dims = inputs.input_ids.dims;
  const inputLength = dims[dims.length - 1] ?? 0;
  const outDims = outputs.dims;
  const total = outDims[outDims.length - 1] ?? 0;
  const generated = outputs.slice(null, [inputLength, total]);
  const text = pipeline.processor.batch_decode(generated, {
    skip_special_tokens: true,
  })[0];
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("The model returned an empty response");
  }
  return text;
}

export const webgpuProvider: AIProvider = {
  id: "webgpu",
  name: "WebGPU (in-browser)",
  requiresApiKey: false,
  supportsVision: true,
  enabled: true,
  configSchema: [],

  async analyze(
    request: AnalysisRequest,
    config: ProviderConfig
  ): Promise<AnalysisResponse> {
    const modelId = config.model ?? DEFAULT_WEBGPU_MODEL;
    const text = await run(modelId, request.file, request);
    return parseAnalysisResilient(text);
  },

  async testConnection(_config: ProviderConfig): Promise<boolean> {
    return checkGpu();
  },
};

export { isWebGpuSupported } from "./webgpu-support";
