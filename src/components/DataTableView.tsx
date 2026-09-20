"use client";

import { Box, Typography } from "@mui/material";

interface DataTableViewProps {
  table: Record<string, string>;
}

export function DataTableView({ table }: DataTableViewProps) {
  const entries = Object.entries(table);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        No structured findings.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        role="table"
        aria-label="Inferred data"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {entries.map(([key, value]) => (
          <Box
            key={key}
            role="row"
            sx={{
              p: 2,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              "@media (min-width: 600px)": {
                "&:nth-of-type(odd)": { borderRight: "1px solid rgba(255,255,255,0.06)" },
              },
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              {key}
            </Typography>
            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
