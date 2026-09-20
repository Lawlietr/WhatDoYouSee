"use client";

import { FormControl, InputLabel, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import type { AIProvider } from "../../lib/types";
import { useI18n } from "../../hooks/useI18n";

interface ProviderSelectorProps {
  providers: AIProvider[];
  value: string;
  onChange: (id: string) => void;
}

export function ProviderSelector({ providers, value, onChange }: ProviderSelectorProps) {
  const { t } = useI18n();
  return (
    <FormControl fullWidth size="small">
      <InputLabel id="provider-selector-label">{t("provider.label")}</InputLabel>
      <Select
        labelId="provider-selector-label"
        label={t("provider.label")}
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
      >
        {providers.map((provider) => {
          const item = (
            <MenuItem key={provider.id} value={provider.id} disabled={!provider.enabled}>
              <Typography
                variant="body2"
                sx={{ color: provider.enabled ? "text.primary" : "text.disabled" }}
              >
                {provider.name}
                {!provider.enabled && t("provider.comingSoon")}
              </Typography>
            </MenuItem>
          );
          if (provider.enabled) return item;
          return (
            <Tooltip key={`${provider.id}-tip`} title={t("provider.notImplemented")} followCursor>
              {item}
            </Tooltip>
          );
        })}
      </Select>
    </FormControl>
  );
}
