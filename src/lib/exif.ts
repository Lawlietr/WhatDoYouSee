import exifr from "exifr";
import type { EXIFData } from "./types";

export async function parseEXIF(file: File): Promise<EXIFData> {
  try {
    const parsed = (await exifr.parse(file, {
      translateKeys: true,
      gps: true,
    })) as Record<string, unknown> | undefined;

    if (!parsed) return {};

    const dateSource =
      parsed.createTime ?? parsed.createDate ?? parsed.modifyTime ?? parsed.dateTimeOriginal;
    const createDate = dateSource instanceof Date ? dateSource.toISOString() : undefined;

    const lat = parsed.latitude ?? parsed.GPSLatitude;
    const lon = parsed.longitude ?? parsed.GPSLongitude;

    return {
      createDate,
      latitude: typeof lat === "number" ? lat : undefined,
      longitude: typeof lon === "number" ? lon : undefined,
      make: typeof parsed.make === "string" ? parsed.make : undefined,
      model: typeof parsed.model === "string" ? parsed.model : undefined,
      raw: parsed,
    };
  } catch {
    return {};
  }
}
