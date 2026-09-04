"use client";

import { FormControl, InputLabel, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import type { AIProvider } from "../../lib/types";

interface ProviderSelectorProps {
  providers: AIProvider[];
  value: string;
  onChange: (id: string) => void;
}

export function ProviderSelector({ providers, value, onChange }: ProviderSelectorProps) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel id="provider-selector-label">Provider</InputLabel>
      <Select
        labelId="provider-selector-label"
        label="Provider"
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
                {!provider.enabled && " (coming soon)"}
              </Typography>
            </MenuItem>
          );
          if (provider.enabled) return item;
          return (
            <Tooltip key={`${provider.id}-tip`} title="Not implemented yet" followCursor>
              {item}
            </Tooltip>
          );
        })}
      </Select>
    </FormControl>
  );
}
