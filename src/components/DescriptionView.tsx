"use client";

import { Box, Typography } from "@mui/material";

interface DescriptionViewProps {
  paras: string[];
}

export function DescriptionView({ paras }: DescriptionViewProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {paras.map((para, i) => (
        <Typography
          key={i}
          variant="body1"
          sx={{ lineHeight: 1.75, color: "text.primary", whiteSpace: "pre-wrap" }}
        >
          {para}
        </Typography>
      ))}
    </Box>
  );
}
