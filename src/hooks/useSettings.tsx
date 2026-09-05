"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  defaultSettings,
  loadSettings,
  saveSettings,
  setProviderConfig,
} from "../lib/settings-manager";
import type { AppSettings, ProviderConfig } from "../lib/types";

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => void;
  setProviderConfigValue: (id: string, config: ProviderConfig) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
      setSettings((prev) =>
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      );
    },
    []
  );

  const setProviderConfigValue = useCallback(
    (id: string, config: ProviderConfig) => {
      setSettings((prev) => setProviderConfig(prev, id, config));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings());
  }, []);

  const value: SettingsContextValue = {
    settings,
    updateSettings,
    setProviderConfigValue,
    resetSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
