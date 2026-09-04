import browserImageCompression from "browser-image-compression";

interface CompressOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 3000,
  initialQuality: 0.8,
};

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  if (file.size < opts.maxSizeMB * 1024 * 1024 && isCommonFormat(file.type)) {
    return file;
  }

  try {
    return await browserImageCompression(file, {
      maxSizeMB: opts.maxSizeMB,
      maxWidthOrHeight: opts.maxWidthOrHeight,
      initialQuality: opts.initialQuality,
      preserveExif: false,
    });
  } catch {
    return file;
  }
}

function isCommonFormat(type: string): boolean {
  return type === "image/jpeg" || type === "image/png" || type === "image/webp";
}
