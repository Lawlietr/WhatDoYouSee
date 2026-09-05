"use client";

import { useCallback, useState } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import type { AIProvider, ProviderConfig } from "../../lib/types";

interface ConnectionTestProps {
  provider: AIProvider;
  config: ProviderConfig;
}

type TestStatus = "idle" | "testing" | "success" | "failed";

function failureHint(provider: AIProvider): string {
  switch (provider.id) {
    case "llama-server":
      return (
        "Common causes: " +
        "(1) llama-server must be started with a --cors-origins flag — without it, browsers block cross-origin requests (restart it with --cors-origins '*'). " +
        "(2) The server is unreachable from this browser (different network, firewall, or wrong address). " +
        "(3) This page is served over HTTPS but the server is HTTP (mixed content) — localhost URLs are the only allowed exception."
      );
    case "webgpu":
      return "This browser does not expose the WebGPU API. Try a recent Chrome or Edge.";
    default:
      return "Check the URL and credentials, then try again.";
  }
}

export function ConnectionTest({ provider, config }: ConnectionTestProps) {
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
        setError(failureHint(provider));
      }
    } catch (e) {
      setStatus("failed");
      setError(
        (e instanceof Error ? e.message : "Connection failed") +
          "\n" +
          failureHint(provider)
      );
    }
  }, [provider, config]);

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
        {status === "testing" ? "Testing..." : "Test connection"}
      </Button>
      {status === "success" && (
        <Alert severity="success" sx={{ fontSize: "0.8rem" }}>
          Connected to {provider.name} successfully.
        </Alert>
      )}
      {status === "failed" && (
        <Alert severity="error" sx={{ fontSize: "0.8rem", whiteSpace: "pre-line" }}>
          {error}
        </Alert>
      )}
      {provider.requiresApiKey && (
        <Typography variant="caption" color="text.disabled">
          API key is stored only in this browser and sent solely to the endpoint above.
        </Typography>
      )}
    </Box>
  );
}
