"use client";

import { Box, Button, CircularProgress, LinearProgress, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import type { DownloadProgress as DownloadProgressState } from "../lib/types";
import { formatBytes, formatDuration } from "../lib/model-cache";
import { useI18n } from "../hooks/useI18n";

interface DownloadProgressProps {
  progress: DownloadProgressState;
  modelLabel: string;
  onCancel: () => void;
  phase?: "downloading" | "loading";
}

export function DownloadProgress({
  progress,
  modelLabel,
  onCancel,
  phase = "downloading",
}: DownloadProgressProps) {
  const { t } = useI18n();
  if (phase === "loading") {
    return (
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={18} />
          <Box>
            <Typography variant="body2">{t("download.loadingTitle", { model: modelLabel })}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("download.loadingBody")}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  const { percent, loaded, total, speedBps } = progress;
  const remaining = Math.max(0, total - loaded);
  const etaSeconds = speedBps > 1024 ? remaining / speedBps : null;

  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="body2" noWrap sx={{ pr: 1 }}>
          {t("download.title", { model: modelLabel })}
        </Typography>
        <Button
          size="small"
          startIcon={<CloseIcon />}
          onClick={onCancel}
          aria-label={t("download.cancelAria")}
        >
          {t("common.cancel")}
        </Button>
      </Box>
      <LinearProgress variant="determinate" value={percent * 100} sx={{ mb: 1 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {Math.round(percent * 100)}% — {formatBytes(loaded)} / {formatBytes(total)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {speedBps > 0 ? `${formatBytes(speedBps)}/s` : t("download.starting")}
          {etaSeconds != null && t("download.eta", { duration: formatDuration(etaSeconds) })}
        </Typography>
      </Box>
    </Box>
  );
}
