"use client";

import { useEffect, type ReactNode } from "react";
import { SettingsProvider, useSettings } from "../hooks/useSettings";
import { normalizeLanguage } from "../lib/i18n/translations";

function LanguageTagSync() {
  const { settings } = useSettings();
  useEffect(() => {
    document.documentElement.lang = normalizeLanguage(settings.language);
  }, [settings.language]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <LanguageTagSync />
      {children}
    </SettingsProvider>
  );
}
