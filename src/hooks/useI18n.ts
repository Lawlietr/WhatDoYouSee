"use client";

import { useCallback } from "react";
import {
  getMessages,
  interpolate,
  normalizeLanguage,
  type Language,
  type Messages,
} from "../lib/i18n/translations";
import { useSettings } from "./useSettings";

export function useI18n() {
  const { settings, updateSettings } = useSettings();
  const lang = normalizeLanguage(settings.language);
  const t = useCallback(
    (key: keyof Messages, vars?: Record<string, string | number>): string =>
      interpolate(getMessages(lang)[key], vars),
    [lang]
  );
  const setLanguage = useCallback(
    (language: Language) => {
      updateSettings({ language });
    },
    [updateSettings]
  );
  return { t, lang, setLanguage };
}
