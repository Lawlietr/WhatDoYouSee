import type { AnalysisResponse } from "../types";

export async function fileToDataURL(file: File | Blob): Promise<string> {
  const mime = file.type || "application/octet-stream";
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export function parseAnalysisJson(text: string): AnalysisResponse {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response is not valid JSON");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

  const paras = Array.isArray(parsed.paras)
    ? parsed.paras.filter((p): p is string => typeof p === "string")
    : [];
  const table =
    parsed.table && typeof parsed.table === "object" && !Array.isArray(parsed.table)
      ? Object.fromEntries(
          Object.entries(parsed.table as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v),
          ])
        )
      : {};

  if (paras.length === 0 && Object.keys(table).length === 0) {
    throw new Error("Model response contained no analysis data");
  }

  return { paras, table };
}
