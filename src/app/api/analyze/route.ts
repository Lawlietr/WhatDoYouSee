import { getProvider } from "@/lib/providers/registry";
import type { AnalysisResponse, EXIFData, ProviderConfig } from "@/lib/types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(
  body: {
    success: boolean;
    data?: AnalysisResponse | null;
    error?: string | null;
    provider?: string;
    model?: string;
    latency?: number;
  },
  status = 200
) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const started = Date.now();

  try {
    const form = await request.formData();

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return jsonResponse({ success: false, error: "Missing or empty file" }, 400);
    }

    const providerId = String(form.get("provider") ?? "llama-server");
    const provider = getProvider(providerId);
    if (!provider) {
      return jsonResponse(
        { success: false, error: `Unknown provider: ${providerId}` },
        400
      );
    }
    if (provider.id === "webgpu") {
      return jsonResponse(
        {
          success: false,
          error:
            "WebGPU inference runs in the browser. Use browser mode, not the API endpoint.",
        },
        400
      );
    }
    if (!provider.enabled) {
      return jsonResponse(
        { success: false, error: `Provider "${providerId}" is not implemented yet` },
        501
      );
    }

    let config: ProviderConfig = {};
    const rawConfig = form.get("providerConfig");
    if (typeof rawConfig === "string" && rawConfig.length > 0) {
      config = JSON.parse(rawConfig) as ProviderConfig;
    }

    const exif: EXIFData = {};
    const created = form.get("created");
    if (typeof created === "string" && created) exif.createDate = created;
    const lat = form.get("latitude");
    const lon = form.get("longitude");
    const latNum = lat != null ? Number(lat) : NaN;
    const lonNum = lon != null ? Number(lon) : NaN;
    if (Number.isFinite(latNum)) exif.latitude = latNum;
    if (Number.isFinite(lonNum)) exif.longitude = lonNum;
    const camera = form.get("camera");
    if (typeof camera === "string" && camera) exif.model = camera;

    const language = String(form.get("language") ?? "en");

    const data = await provider.analyze(
      { file, exif, language },
      config
    );

    return jsonResponse(
      {
        success: true,
        data,
        error: null,
        provider: provider.id,
        model: config.model ?? "",
        latency: Date.now() - started,
      },
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("fetch") || message.includes("Failed to fetch")
      ? 502
      : 500;
    return jsonResponse(
      {
        success: false,
        error: status === 502
          ? `Cannot reach provider backend: ${message}. Check if the server is running and CORS is enabled.`
          : message,
        latency: Date.now() - started,
      },
      status
    );
  }
}
