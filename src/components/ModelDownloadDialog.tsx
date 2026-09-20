"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  Typography,
} from "@mui/material";
import type { ModelInfo } from "../lib/types";
import { formatBytes } from "../lib/model-cache";
import { useI18n } from "../hooks/useI18n";

interface ModelDownloadDialogProps {
  open: boolean;
  models: ModelInfo[];
  currentModelId: string;
  cachedIds: string[];
  onConfirm: (model: ModelInfo) => void;
  onClose: () => void;
}

export function ModelDownloadDialog({
  open,
  models,
  currentModelId,
  cachedIds,
  onConfirm,
  onClose,
}: ModelDownloadDialogProps) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState(currentModelId);
  const selected = models.find((m) => m.id === selectedId) ?? models[0];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("dialog.title")}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          {models.map((model) => (
            <Box
              key={model.id}
              onClick={() => setSelectedId(model.id)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                py: 0.5,
                borderRadius: 1,
                px: 1,
                cursor: "pointer",
                bgcolor: model.id === selected?.id ? "action.hover" : "transparent",
              }}
            >
              <Radio
                checked={model.id === selected?.id}
                onChange={() => setSelectedId(model.id)}
                slotProps={{ input: { "aria-label": model.name } }}
                sx={{ mt: -0.5 }}
              />
              <Box>
                <Typography variant="body2">
                  {model.name}
                  {model.id === currentModelId && (
                    <Typography component="span" variant="caption" sx={{ ml: 1 }} color="primary">
                      {t("common.active")}
                    </Typography>
                  )}
                  {cachedIds.includes(model.id) && model.id !== currentModelId && (
                    <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                      {t("common.downloaded")}
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {model.format} · {formatBytes(model.sizeBytes)} · {model.source}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        {selected && (
          <Box sx={{ mb: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {selected.name}
            </Typography>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {t("dialog.format", { format: selected.format })}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {t("dialog.size", { size: formatBytes(selected.sizeBytes) })}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {t("dialog.source", { source: selected.source })}
              </Typography>
            </Box>
          </Box>
        )}
        <Typography variant="body2" color="text.secondary">
          {t("dialog.privacy", { source: selected?.source ?? "Hugging Face" })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        {selected && (
          <Button
            variant="contained"
            onClick={() =>
              selected.id === currentModelId && cachedIds.includes(selected.id)
                ? onClose()
                : onConfirm(selected)
            }
          >
            {selected.id === currentModelId && cachedIds.includes(selected.id)
              ? t("common.done")
              : cachedIds.includes(selected.id)
                ? t("webgpu.useModel")
                : t("webgpu.download", { size: formatBytes(selected.sizeBytes) })}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
