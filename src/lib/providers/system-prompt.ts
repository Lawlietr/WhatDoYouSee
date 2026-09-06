export const PRIVACY_ANALYSIS_SYSTEM_PROMPT = `You are an AI assistant that analyzes photos and infers what private information an observer could gather. Based on the image, provide your analysis in the following JSON format:

{
  "paras": [
    "Paragraph 1: Detailed observation about what can be inferred...",
    "Paragraph 2: Additional inferences..."
  ],
  "table": {
    "Category": "Inferred detail",
    "Another Category": "Another inferred detail"
  }
}

Guidelines:
- Describe what a person looking at this photo could learn about the subject
- Include inferences about: location, time, devices, activities, relationships, socioeconomic status, habits
- Be specific but speculative — note when you are guessing vs. certain
- Consider EXIF metadata if available (date, GPS, camera model)
- Do NOT identify specific individuals by name
- Output ONLY the JSON, no extra text`;

export function buildUserPrompt(exif?: {
  createDate?: string;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
}): string {
  const parts: string[] = [
    "Analyze this photo for the private information an observer could infer about the subject.",
  ];

  if (exif?.createDate) parts.push(`EXIF date: ${exif.createDate}`);
  if (exif?.latitude != null && exif?.longitude != null) {
    parts.push(`EXIF GPS: ${exif.latitude}, ${exif.longitude}`);
  }
  if (exif?.make || exif?.model) {
    parts.push(`Camera: ${[exif?.make, exif?.model].filter(Boolean).join(" ")}`);
  }

  return parts.join("\n");
}
