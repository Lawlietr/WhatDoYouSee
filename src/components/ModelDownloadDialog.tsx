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
  const [selectedId, setSelectedId] = useState(currentModelId);
  const selected = models.find((m) => m.id === selectedId) ?? models[0];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>WebGPU Models</DialogTitle>
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
                      (active)
                    </Typography>
                  )}
                  {cachedIds.includes(model.id) && model.id !== currentModelId && (
                    <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                      Downloaded
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
                Format: {selected.format}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Size: {formatBytes(selected.sizeBytes)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Source: {selected.source}
              </Typography>
            </Box>
          </Box>
        )}
        <Typography variant="body2" color="text.secondary">
          Privacy notice: the model is downloaded from {selected?.source ?? "Hugging Face"} and
          cached in your browser&apos;s local storage (Cache API). It never leaves your device.
          Photos analyzed with it are processed entirely on your hardware — no image data is
          sent anywhere.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
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
              ? "Done"
              : cachedIds.includes(selected.id)
                ? "Use this model"
                : `Download (${formatBytes(selected.sizeBytes)})`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
