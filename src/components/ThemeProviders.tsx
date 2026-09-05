"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "@/styles/theme";

const noopSubscribe = () => () => {};

export function ThemeProviders({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <ThemeProvider theme={theme}>
      {mounted && <CssBaseline />}
      {children}
    </ThemeProvider>
  );
}
