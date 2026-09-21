import { normalizeLanguage } from "../i18n/translations";

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
- Output ONLY the JSON, no extra text

Go deeper — beyond the basics, an attentive observer also speculates:
- For EACH main person: apparent age range, build, grooming, and what their overall appearance signals
- Personality & interests: what clothing style, gear, and surroundings suggest about hobbies, tastes, and lifestyle
- Socioeconomic signals: housing, vehicle, device age/brand, and surroundings → income bracket and wealth level
- Brands: name brands, logos, or devices you can actually identify in the image
- Culture & beliefs: religion, nationality, or affiliation — only when visible evidence exists (clothing, jewelry, flags, symbols, tattoos); skip if there is none
- Relationships: if more than one main person appears, what they most likely are to each other (couple, parent and child, friends, colleagues) and what in the image suggests it
- Habits: lifestyle patterns the photo implies (early riser, urban commuter, etc.)

Rules for the deeper layer:
- Start with what is certain (place, setting, who is present) before moving to speculation
- Each inference should be one short sentence; skip a category when the image gives no visible evidence for it
- Do not invent what the image does not support

Remember: output ONLY the JSON object, no extra text.`;


export function getSystemPrompt(language?: string): string {
  if (normalizeLanguage(language ?? "") === "zh-TW") {
    return PRIVACY_ANALYSIS_SYSTEM_PROMPT +
      '\n\nImportant: reply in Traditional Chinese (繁體中文). Write the text of every "paras" entry and every "table" value in Traditional Chinese; keep the JSON keys and the JSON structure exactly as specified above.';
  }
  return PRIVACY_ANALYSIS_SYSTEM_PROMPT;
}

export function buildUserPrompt(
  exif?: {
    createDate?: string;
    latitude?: number;
    longitude?: number;
    make?: string;
    model?: string;
  },
  language?: string
): string {
  const zh = normalizeLanguage(language ?? "") === "zh-TW";
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

  if (zh) {
    parts.push(
      `Respond in Traditional Chinese (繁體中文). Write all content of "paras" and "table" values in Traditional Chinese; keep the JSON keys in English.`
    );
  }

  return parts.join("\n");
}
