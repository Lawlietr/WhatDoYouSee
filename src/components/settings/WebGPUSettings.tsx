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
          setDownloadError("Download cancelled.");
        } else {
          setDownload(null);
          setDownloadError(e instanceof Error ? e.message : "Download failed");
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {support === "checking" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={14} />
          <Typography variant="body2" color="text.secondary">
            Checking WebGPU support...
          </Typography>
        </Box>
      )}
      {support === "no" && !isSecureContext && (
        <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
          WebGPU is hidden because this page is not in a secure context (HTTP on a
          non-localhost address). Your browser may still support WebGPU — open the app
          via https://… or http://localhost… (e.g. an SSH tunnel) to enable it.
        </Alert>
      )}
      {support === "no" && isSecureContext && (
        <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
          WebGPU is not available in this browser. Photos will be processed on your own
          hardware only via API mode.
        </Alert>
      )}
      {support === "yes" && (
        <Alert severity="info" sx={{ fontSize: "0.8rem" }}>
          WebGPU available. Inference runs entirely in this browser — no data leaves your
          device.
        </Alert>
      )}

      <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {info?.name ?? modelId}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Status: {
            modelCached
              ? `Downloaded (${formatBytes(modelCached.bytes)} cached)`
              : modelStatus?.bytes > 0
                ? `Partially downloaded (${formatBytes(modelStatus.bytes)} of required files) — re-download to complete`
                : "Not downloaded"
          }
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Cache location: this browser (Cache API + IndexedDB)
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
          Manage models
        </Button>
        <Button variant="outlined" size="small" onClick={() => setConfirmClearOpen(true)}>
          Clear cache
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
        <DialogTitle>Clear model cache?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This deletes all downloaded WebGPU model files from this browser. They will be
            re-downloaded the next time they are needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleClear} disabled={clearing}>
            {clearing ? "Clearing..." : "Clear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
