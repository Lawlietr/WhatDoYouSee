"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import type { DownloadProgress as DownloadProgressState, ModelInfo } from "../../lib/types";
import { isWebGpuSupported } from "../../lib/providers/webgpu";
import {
  cachedModelState,
  clearWebGpuModelCache,
  formatBytes,
  prefetchModel,
  type CacheStatus,
} from "../../lib/model-cache";
import { WEBGPU_MODELS, getModelInfo } from "../../lib/model-catalog";
import { ModelDownloadDialog } from "../ModelDownloadDialog";
import { DownloadProgress } from "../DownloadProgress";
import { useI18n } from "../../hooks/useI18n";

interface WebGPUSettingsProps {
  modelId: string;
  onModelChange: (modelId: string) => void;
}

async function computeCacheMap(): Promise<Record<string, CacheStatus>> {
  const next: Record<string, CacheStatus> = {};
  for (const model of WEBGPU_MODELS) {
    next[model.id] = await cachedModelState(model.id);
  }
  return next;
}

export function WebGPUSettings({ modelId, onModelChange }: WebGPUSettingsProps) {
  const { t } = useI18n();
  const [support, setSupport] = useState<"checking" | "yes" | "no">("checking");
  const isSecureContext = typeof window === "undefined" ? true : window.isSecureContext;
  const [cached, setCached] = useState<Record<string, CacheStatus>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [download, setDownload] = useState<{
    model: ModelInfo;
    progress: DownloadProgressState;
    phase: "downloading" | "loading";
  } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshCache = () => {
    computeCacheMap().then((next) => setCached(next));
  };

  useEffect(() => {
    let active = true;
    isWebGpuSupported().then((ok) => {
      if (active) setSupport(ok ? "yes" : "no");
    });
    computeCacheMap().then((next) => {
      if (active) setCached(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const startDownload = (model: ModelInfo) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setDialogOpen(false);
    setDownloadError(null);
    setDownload({
      model,
      progress: { loaded: 0, total: 0, speedBps: 0, percent: 0 },
      phase: "downloading",
    });
    prefetchModel(model.id, {
      onProgress: (progress) =>
        setDownload((d) => (d ? { ...d, progress } : d)),
      onPhase: (phase) => setDownload((d) => (d ? { ...d, phase } : d)),
      signal: controller.signal,
    })
      .then(() => {
        onModelChange(model.id);
        setDownload(null);
        refreshCache();
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") {
          setDownload(null);
          setDownloadError(t("common.downloadCancelled"));
        } else {
          setDownload(null);
          setDownloadError(e instanceof Error ? e.message : t("common.downloadFailed"));
        }
      });
  };

  const cancelDownload = () => {
    abortRef.current?.abort();
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearWebGpuModelCache();
      setCached({});
    } finally {
      setClearing(false);
      setConfirmClearOpen(false);
    }
  };

  const info = getModelInfo(modelId);
  const modelStatus = cached[modelId];
  const modelCached = modelStatus?.cached ? modelStatus : undefined;
  const completeIds = Object.keys(cached).filter((id) => cached[id]?.cached);

  const statusText = modelCached
    ? t("webgpu.downloaded", { bytes: formatBytes(modelCached.bytes) })
    : modelStatus?.bytes > 0
      ? t("webgpu.partial", { bytes: formatBytes(modelStatus.bytes) })
      : t("webgpu.notDownloaded");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {support === "checking" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={14} />
          <Typography variant="body2" color="text.secondary">
            {t("webgpu.checking")}
          </Typography>
        </Box>
      )}
      {support === "no" && !isSecureContext && (
        <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
          {t("webgpu.insecure")}
        </Alert>
      )}
      {support === "no" && isSecureContext && (
        <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
          {t("webgpu.unsupported")}
        </Alert>
      )}
      {support === "yes" && (
        <Alert severity="info" sx={{ fontSize: "0.8rem" }}>
          {t("webgpu.available")}
        </Alert>
      )}

      <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {info?.name ?? modelId}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {t("webgpu.status")}: {statusText}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {t("webgpu.cacheLocation")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
          {t("webgpu.manageModels")}
        </Button>
        <Button variant="outlined" size="small" onClick={() => setConfirmClearOpen(true)}>
          {t("webgpu.clearCache")}
        </Button>
      </Box>

      {download && (
        <DownloadProgress
          progress={download.progress}
          modelLabel={download.model.name}
          onCancel={cancelDownload}
          phase={download.phase}
        />
      )}
      {downloadError && (
        <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
          {downloadError}
        </Alert>
      )}

      <ModelDownloadDialog
        open={dialogOpen}
        models={WEBGPU_MODELS}
        currentModelId={modelId}
        cachedIds={completeIds}
        onConfirm={(model) => {
          if (cached[model.id]?.cached) {
            onModelChange(model.id);
            setDialogOpen(false);
          } else {
            startDownload(model);
          }
        }}
        onClose={() => setDialogOpen(false)}
      />

      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("webgpu.clearTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t("webgpu.clearBody")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleClear} disabled={clearing}>
            {clearing ? t("webgpu.clearing") : t("webgpu.clear")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
