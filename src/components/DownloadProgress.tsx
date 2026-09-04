"use client";

import { Box, Button, LinearProgress, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { DownloadProgress as DownloadProgressState } from "../lib/types";
import { formatBytes, formatDuration } from "../lib/model-cache";

interface DownloadProgressProps {
  progress: DownloadProgressState;
  modelLabel: string;
  onCancel: () => void;
}

export function DownloadProgress({ progress, modelLabel, onCancel }: DownloadProgressProps) {
  const { percent, loaded, total, speedBps } = progress;
  const remaining = Math.max(0, total - loaded);
  const etaSeconds = speedBps > 1024 ? remaining / speedBps : null;

  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="body2" noWrap sx={{ pr: 1 }}>
          Downloading {modelLabel}
        </Typography>
        <Button
          size="small"
          startIcon={<CloseIcon />}
          onClick={onCancel}
          aria-label="Cancel download"
        >
          Cancel
        </Button>
      </Box>
      <LinearProgress variant="determinate" value={percent * 100} sx={{ mb: 1 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {Math.round(percent * 100)}% — {formatBytes(loaded)} / {formatBytes(total)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {speedBps > 0 ? `${formatBytes(speedBps)}/s` : "Starting..."}
          {etaSeconds != null && ` — ${formatDuration(etaSeconds)} left`}
        </Typography>
      </Box>
    </Box>
  );
}
