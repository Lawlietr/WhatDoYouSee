"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const MESSAGES = [
  "Analyzing photo metadata...",
  "Extracting location data...",
  "Detecting objects and patterns...",
  "Reviewing background details...",
  "Inferring personal information...",
  "Compiling findings...",
];

const DOT_COLORS = ["#4285f4", "#34a853", "#fbbc05", "#ea4335"];
const ROTATE_MS = 2500;

export function LoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setMessageIndex((i) => (i + 1) % MESSAGES.length),
      ROTATE_MS
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        py: 6,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-end", height: 48 }}>
        {DOT_COLORS.map((color, i) => (
          <Box
            key={color}
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: color,
              animation: `dot-bounce 1.2s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {MESSAGES[messageIndex]}
      </Typography>
    </Box>
  );
}
