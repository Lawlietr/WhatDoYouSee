"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import type { AppSettings, InferenceMode, ProviderConfig } from "../../lib/types";
import { listProviders, getProvider } from "../../lib/providers/registry";
import { SUPPORTED_LANGUAGES, normalizeLanguage } from "../../lib/i18n/translations";
import type { Language } from "../../lib/i18n/translations";
import { ProviderSelector } from "./ProviderSelector";
import { ProviderConfigForm, validateProviderConfig } from "./ProviderConfigForm";
import { ConnectionTest } from "./ConnectionTest";
import { WebGPUSettings } from "./WebGPUSettings";
import { useI18n } from "../../hooks/useI18n";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const PANEL_WIDTH = 440;

export function SettingsPanel({ open, onClose, settings, onSave }: SettingsPanelProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(settings);
      setValidationError(null);
    }
  }

  const providers = listProviders();
  const activeProvider = getProvider(draft.activeProvider) ?? providers[0];

  const setMode = (mode: InferenceMode) => {
    setDraft((d) => ({ ...d, inferenceMode: mode }));
    setValidationError(null);
  };

  const setLanguage = (language: Language) => {
    setDraft((d) => ({ ...d, language }));
    setValidationError(null);
  };

  const setActiveProvider = (id: string) => {
    setDraft((d) => ({ ...d, activeProvider: id }));
    setValidationError(null);
  };

  const setProviderDraft = (id: string, config: ProviderConfig) => {
    setDraft((d) => ({
      ...d,
      providerConfigs: { ...d.providerConfigs, [id]: config },
    }));
    setValidationError(null);
  };

  const setWebGpuModel = (modelId: string) => {
    setDraft((d) => ({ ...d, webgpuModelId: modelId }));
  };

  const setEnableThinking = (enabled: boolean) => {
    setDraft((d) => ({ ...d, enableThinking: enabled }));
  };

  const handleSave = () => {
    if (draft.inferenceMode === "api" && activeProvider) {
      const error = validateProviderConfig(
        activeProvider,
        draft.providerConfigs[activeProvider.id] ?? {},
        t
      );
      if (error) {
        setValidationError(error);
        return;
      }
    }
    onSave(draft);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: PANEL_WIDTH, maxWidth: "90vw" } } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <SettingsIcon />
          <Typography variant="h6">{t("settings.title")}</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("settings.language")}
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={normalizeLanguage(draft.language)}
              onChange={(_, value: Language | null) => value && setLanguage(value)}
              fullWidth
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <ToggleButton key={lang.id} value={lang.id}>
                  {lang.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("settings.inferenceMode")}
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={draft.inferenceMode}
              onChange={(_, value: InferenceMode | null) => value && setMode(value)}
              fullWidth
            >
              <ToggleButton value="webgpu">{t("settings.modeWebgpu")}</ToggleButton>
              <ToggleButton value="api">{t("settings.modeApi")}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          {draft.inferenceMode === "webgpu" ? (
            <WebGPUSettings
              modelId={draft.webgpuModelId}
              onModelChange={setWebGpuModel}
              enableThinking={draft.enableThinking}
              onEnableThinkingChange={setEnableThinking}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <ProviderSelector
                providers={providers}
                value={draft.activeProvider}
                onChange={setActiveProvider}
              />
              {activeProvider && (
                <>
                  <ProviderConfigForm
                    provider={activeProvider}
                    value={draft.providerConfigs[activeProvider.id] ?? {}}
                    onChange={(config) => setProviderDraft(activeProvider.id, config)}
                  />
                  <ConnectionTest
                    provider={activeProvider}
                    config={draft.providerConfigs[activeProvider.id] ?? {}}
                  />
                </>
              )}
            </Box>
          )}
        </Box>

        {validationError && (
          <Alert severity="error" sx={{ m: 2, mt: 0, fontSize: "0.8rem" }}>
            {validationError}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            p: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button onClick={onClose} color="inherit">
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {t("settings.save")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
