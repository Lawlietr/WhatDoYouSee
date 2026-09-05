"use client";

import { useCallback, useState } from "react";
import { parseEXIF } from "../lib/exif";
import { compressImage } from "../lib/compress";
import { useProvider } from "./useProvider";
import { useSettings } from "./useSettings";
import type {
  AnalysisMeta,
  AnalysisResponse,
  EXIFData,
} from "../lib/types";

export type AnalysisStage =
  | "idle"
  | "parsing-exif"
  | "compressing"
  | "analyzing"
  | "done"
  | "error";

interface PhotoAnalysisState {
  isAnalyzing: boolean;
  stage: AnalysisStage;
  result: AnalysisResponse | null;
  meta: AnalysisMeta | null;
  error: string | null;
}

const INITIAL: PhotoAnalysisState = {
  isAnalyzing: false,
  stage: "idle",
  result: null,
  meta: null,
  error: null,
};

export function usePhotoAnalysis() {
  const { provider, config } = useProvider();
  const { settings } = useSettings();
  const [state, setState] = useState<PhotoAnalysisState>(INITIAL);

  const analyze = useCallback(
    async (file: File): Promise<AnalysisResponse | null> => {
      setState({ ...INITIAL, isAnalyzing: true, stage: "parsing-exif" });
      const startedAt = Date.now();
      try {
        let exif: EXIFData = {};
        try {
          exif = await parseEXIF(file);
        } catch {
          // no readable EXIF — continue without it
        }
        setState((s) => ({ ...s, stage: "compressing" }));
        const compressed = await compressImage(file);
        setState((s) => ({ ...s, stage: "analyzing" }));
        const response = await provider.analyze(
          { file: compressed, exif, language: settings.language },
          config
        );
        setState({
          isAnalyzing: false,
          stage: "done",
          result: response,
          meta: {
            provider: provider.name,
            model: config.model ?? provider.id,
            latencyMs: Date.now() - startedAt,
          },
          error: null,
        });
        return response;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Analysis failed";
        setState((s) => ({ ...s, isAnalyzing: false, stage: "error", error: message }));
        return null;
      }
    },
    [provider, config, settings.language]
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, analyze, reset };
}
