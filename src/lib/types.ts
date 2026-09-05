export interface AnalysisRequest {
  file: File | Blob;
  exif?: EXIFData;
  language: string;
}

export interface AnalysisResponse {
  paras: string[];
  table: Record<string, string>;
}

export interface AnalysisMeta {
  provider: string;
  model: string;
  latencyMs: number;
}

export interface ProviderConfig {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  extra?: Record<string, string>;
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "url" | "password";
  required: boolean;
  placeholder?: string;
  helperText?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  requiresApiKey: boolean;
  supportsVision: boolean;
  enabled: boolean;
  configSchema: ConfigField[];
  analyze(request: AnalysisRequest, config: ProviderConfig): Promise<AnalysisResponse>;
  testConnection(config: ProviderConfig): Promise<boolean>;
}

export interface EXIFData {
  createDate?: string;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
  raw?: Record<string, unknown>;
}

export type InferenceMode = "webgpu" | "api";

export interface AppSettings {
  inferenceMode: InferenceMode;
  activeProvider: string;
  providerConfigs: Record<string, ProviderConfig>;
  language: string;
  webgpuModelId: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  format: "ONNX" | "GGUF";
  sizeBytes: number;
  source: string;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  speedBps: number;
  percent: number;
}
