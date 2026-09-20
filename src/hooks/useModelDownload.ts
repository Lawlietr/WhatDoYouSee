"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cachedModelState,
  clearWebGpuModelCache,
  prefetchModel,
} from "../lib/model-cache";
import type { DownloadProgress } from "../lib/types";
import { useI18n } from "./useI18n";

const EMPTY_PROGRESS: DownloadProgress = {
  loaded: 0,
  total: 0,
  speedBps: 0,
  percent: 0,
};

export function useModelDownload(modelId: string) {
  const { t } = useI18n();
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    cachedModelState(modelId).then((status) => {
      if (active) setIsDownloaded(status.cached);
    });
    return () => {
      active = false;
    };
  }, [modelId]);

  const download = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsDownloading(true);
    setError(null);
    setProgress(EMPTY_PROGRESS);
    try {
      await prefetchModel(modelId, {
        onProgress: setProgress,
        signal: controller.signal,
      });
      setIsDownloaded(true);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError(t("common.downloadCancelled"));
      } else {
        setError(e instanceof Error ? e.message : t("common.downloadFailed"));
      }
    } finally {
      setIsDownloading(false);
    }
  }, [modelId, t]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const deleteModel = useCallback(async () => {
    await clearWebGpuModelCache(modelId);
    setIsDownloaded(false);
    setError(null);
  }, [modelId]);

  const refresh = useCallback(async () => {
    const status = await cachedModelState(modelId);
    setIsDownloaded(status.cached);
  }, [modelId]);

  return { isDownloaded, isDownloading, progress, error, download, cancel, deleteModel, refresh };
}
