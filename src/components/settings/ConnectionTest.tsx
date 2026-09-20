"use client";

import { useCallback, useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import type { AIProvider, ProviderConfig } from "../../lib/types";
import type { Messages } from "../../lib/i18n/translations";
import { useI18n } from "../../hooks/useI18n";

interface ConnectionTestProps {
  provider: AIProvider;
  config: ProviderConfig;
}

type TestStatus = "idle" | "testing" | "success" | "failed";

type T = (key: keyof Messages, vars?: Record<string, string | number>) => string;

function failureHint(provider: AIProvider, t: T): string {
  switch (provider.id) {
    case "llama-server":
      return t("conn.hintLlama");
    case "webgpu":
      return t("conn.hintWebgpu");
    default:
      return t("conn.hintDefault");
  }
}

export function ConnectionTest({ provider, config }: ConnectionTestProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<TestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    setStatus("testing");
    setError(null);
    try {
      const ok = await provider.testConnection(config);
      if (ok) {
        setStatus("success");
      } else {
        setStatus("failed");
        setError(failureHint(provider, t));
      }
    } catch (e) {
      setStatus("failed");
      setError(
        (e instanceof Error ? e.message : t("conn.failed")) +
          "\n" +
          failureHint(provider, t)
      );
    }
  }, [provider, config, t]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          status === "testing" ? (
            <CircularProgress size={14} color="inherit" />
          ) : undefined
        }
        onClick={runTest}
        disabled={status === "testing"}
        sx={{ alignSelf: "flex-start" }}
      >
        {status === "testing" ? t("conn.testing") : t("conn.test")}
      </Button>
      {status === "success" && (
        <Alert severity="success" sx={{ fontSize: "0.8rem" }}>
          {t("conn.success", { name: provider.name })}
        </Alert>
      )}
      {status === "failed" && (
        <Alert severity="error" sx={{ fontSize: "0.8rem", whiteSpace: "pre-line" }}>
          {error}
        </Alert>
      )}
      {provider.requiresApiKey && (
        <Typography variant="caption" color="text.disabled">
          {t("conn.keyNote")}
        </Typography>
      )}
    </Box>
  );
}
