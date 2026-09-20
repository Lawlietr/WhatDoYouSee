"use client";

import { useCallback, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff, Search as SearchIcon } from "@mui/icons-material";
import type { AIProvider, ConfigField, ProviderConfig } from "../../lib/types";
import { fetchAvailableModels } from "../../lib/providers/llama-server";
import type { Messages } from "../../lib/i18n/translations";
import { useI18n } from "../../hooks/useI18n";

interface ProviderConfigFormProps {
  provider: AIProvider;
  value: ProviderConfig;
  onChange: (config: ProviderConfig) => void;
}

const URL_PATTERN = /^https?:\/\/[^\s]+$/i;

type T = (key: keyof Messages, vars?: Record<string, string | number>) => string;

const LABEL_KEYS: Record<string, keyof Messages> = {
  baseUrl: "provider.baseUrl",
  model: "provider.model",
  apiKey: "provider.apiKey",
};

const PLACEHOLDER_KEYS: Record<string, keyof Messages> = {
  baseUrl: "provider.baseUrlPlaceholder",
  model: "provider.modelPlaceholder",
  apiKey: "provider.apiKeyPlaceholder",
};

const HELPER_KEYS: Record<string, keyof Messages> = {
  baseUrl: "provider.baseUrlHelper",
  model: "provider.modelHelper",
};

function translatedField(field: ConfigField, t: T) {
  return {
    label: t(LABEL_KEYS[field.key] ?? "provider.model"),
    placeholder: t(PLACEHOLDER_KEYS[field.key] ?? "provider.modelPlaceholder"),
    helperText: field.key in HELPER_KEYS ? t(HELPER_KEYS[field.key]) : field.helperText,
  };
}

function fieldValue(config: ProviderConfig, key: string): string {
  return String((config as Record<string, unknown>)[key] ?? "");
}

function validateField(field: ConfigField, value: string, t: T): string | null {
  const label = t(LABEL_KEYS[field.key] ?? "provider.model");
  if (field.required && !value.trim()) return t("form.required", { label });
  if (field.type === "url" && value.trim() && !URL_PATTERN.test(value.trim())) {
    return t("form.invalidUrl");
  }
  return null;
}

export function validateProviderConfig(
  provider: AIProvider,
  config: ProviderConfig,
  t: T
): string | null {
  for (const field of provider.configSchema) {
    const error = validateField(field, fieldValue(config, field.key), t);
    if (error) return error;
  }
  return null;
}

interface PasswordFieldProps {
  field: ConfigField;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}

function PasswordField({ field, value, error, onChange }: PasswordFieldProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const labels = translatedField(field, t);
  return (
    <TextField
      fullWidth
      size="small"
      label={labels.label}
      type={visible ? "text" : "password"}
      value={value}
      placeholder={labels.placeholder}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error ?? ""}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? t("form.hideKey") : t("form.showKey")}
                edge="end"
              >
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

interface ModelFieldProps {
  field: ConfigField;
  value: string;
  baseUrl: string;
  apiKey?: string;
  error: string | null;
  onChange: (value: string) => void;
}

function ModelField({ field, value, baseUrl, apiKey, error, onChange }: ModelFieldProps) {
  const { t } = useI18n();
  const [options, setOptions] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (!baseUrl.trim()) {
      setDetectError(t("form.enterUrlFirst"));
      return;
    }
    setDetecting(true);
    setDetectError(null);
    try {
      const models = await fetchAvailableModels(baseUrl, apiKey);
      setOptions(models);
      if (models.length === 0) {
        setDetectError(t("form.noModels"));
      }
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : t("form.reachFailed"));
    } finally {
      setDetecting(false);
    }
  }, [baseUrl, apiKey, t]);

  const labels = translatedField(field, t);
  return (
    <Box>
      <Autocomplete
        freeSolo
        size="small"
        value={value}
        onChange={(_, v) => onChange(typeof v === "string" ? v : "")}
        onInputChange={(_, v, reason) => {
          if (reason === "reset" || reason === "blur") return;
          onChange(v);
        }}
        options={options}
        onOpen={detect}
        loading={detecting}
        renderInput={(params) => (
          <TextField {...params} label={labels.label} placeholder={labels.placeholder} />
        )}
        sx={{ minWidth: 0 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
        <Button
          size="small"
          startIcon={detecting ? undefined : <SearchIcon />}
          onClick={detect}
          disabled={detecting}
          sx={detecting ? { "& .MuiButton-startIcon": { animation: "spin 1s linear infinite" } } : {}}
        >
          {detecting ? t("form.detecting") : t("form.detect")}
        </Button>
        {detectError && (
          <Typography variant="caption" color="error">
            {detectError}
          </Typography>
        )}
      </Box>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block" }}>
          {error}
        </Typography>
      )}
      <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
        {t("form.modelHint")}
      </Typography>
    </Box>
  );
}

const spinKeyframes = `
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export function ProviderConfigForm({ provider, value, onChange }: ProviderConfigFormProps) {
  const { t } = useI18n();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setField = (key: string, fieldVal: string) =>
    onChange({ ...value, [key]: fieldVal });

  return (
    <Box>
      <style>{spinKeyframes}</style>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {provider.configSchema.map((field) => {
          const currentValue = fieldValue(value, field.key);
          const error = touched[field.key] ? validateField(field, currentValue, t) : null;
          const isLlamaModel = provider.id === "llama-server" && field.key === "model";

          if (isLlamaModel) {
            return (
              <ModelField
                key={field.key}
                field={field}
                value={currentValue}
                baseUrl={value.baseUrl ?? ""}
                apiKey={value.apiKey}
                error={error}
                onChange={(v) => setField(field.key, v)}
              />
            );
          }

          if (field.type === "password") {
            return (
              <PasswordField
                key={field.key}
                field={field}
                value={currentValue}
                error={error}
                onChange={(v) => setField(field.key, v)}
              />
            );
          }

          const labels = translatedField(field, t);
          return (
            <TextField
              key={field.key}
              fullWidth
              size="small"
              label={labels.label}
              type={field.type === "url" ? "url" : "text"}
              value={currentValue}
              placeholder={labels.placeholder}
              onChange={(e) => setField(field.key, e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, [field.key]: true }))}
              error={!!error}
              helperText={error ?? labels.helperText ?? ""}
            />
          );
        })}
      </Box>
    </Box>
  );
}
