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

interface ProviderConfigFormProps {
  provider: AIProvider;
  value: ProviderConfig;
  onChange: (config: ProviderConfig) => void;
}

const URL_PATTERN = /^https?:\/\/[^\s]+$/i;

function fieldValue(config: ProviderConfig, key: string): string {
  return String((config as Record<string, unknown>)[key] ?? "");
}

function validateField(field: ConfigField, value: string): string | null {
  if (field.required && !value.trim()) return `${field.label} is required`;
  if (field.type === "url" && value.trim() && !URL_PATTERN.test(value.trim())) {
    return "Enter a valid URL (http:// or https://)";
  }
  return null;
}

export function validateProviderConfig(
  provider: AIProvider,
  config: ProviderConfig
): string | null {
  for (const field of provider.configSchema) {
    const error = validateField(field, fieldValue(config, field.key));
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
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      fullWidth
      size="small"
      label={field.label}
      type={visible ? "text" : "password"}
      value={value}
      placeholder={field.placeholder}
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
                aria-label={visible ? "Hide API key" : "Show API key"}
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
  error: string | null;
  onChange: (value: string) => void;
}

function ModelField({ field, value, baseUrl, error, onChange }: ModelFieldProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (!URL_PATTERN.test(baseUrl)) {
      setDetectError("Enter a valid Base URL first");
      return;
    }
    setDetecting(true);
    setDetectError(null);
    try {
      const models = await fetchAvailableModels(baseUrl);
      setOptions(models);
      if (models.length === 0) {
        setDetectError("Server is reachable but has no loaded models.");
      }
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : "Failed to reach the server");
    } finally {
      setDetecting(false);
    }
  }, [baseUrl]);

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
          <TextField {...params} label={field.label} placeholder={field.placeholder} />
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
          {detecting ? "Detecting..." : "Detect models"}
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
        You can type any model id the server routes on: a model preset name
        (--models-preset), an -hf repo id, a --alias, or the loaded GGUF file name.
        Leave empty to auto-detect.
      </Typography>
    </Box>
  );
}

const spinKeyframes = `
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export function ProviderConfigForm({ provider, value, onChange }: ProviderConfigFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setField = (key: string, fieldValue: string) =>
    onChange({ ...value, [key]: fieldValue });

  return (
    <Box>
      <style>{spinKeyframes}</style>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {provider.configSchema.map((field) => {
          const currentValue = fieldValue(value, field.key);
          const error = touched[field.key] ? validateField(field, currentValue) : null;
          const isLlamaModel = provider.id === "llama-server" && field.key === "model";

          if (isLlamaModel) {
            return (
              <ModelField
                key={field.key}
                field={field}
                value={currentValue}
                baseUrl={value.baseUrl ?? ""}
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

          return (
            <TextField
              key={field.key}
              fullWidth
              size="small"
              label={field.label}
              type={field.type === "url" ? "url" : "text"}
              value={currentValue}
              placeholder={field.placeholder}
              onChange={(e) => setField(field.key, e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, [field.key]: true }))}
              error={!!error}
              helperText={error ?? ""}
            />
          );
        })}
      </Box>
    </Box>
  );
}
