"use client";

import { useState } from "react";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import type { EXIFData } from "../lib/types";

interface EXIFDisplayProps {
  exif: EXIFData | null;
}

function formatCreateDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EXIFDisplay({ exif }: EXIFDisplayProps) {
  const [open, setOpen] = useState(false);

  const hasData =
    !!exif &&
    (exif.createDate ||
      exif.latitude != null ||
      exif.longitude != null ||
      exif.make ||
      exif.model);

  if (!hasData) {
    return (
      <Typography variant="body2" color="text.disabled">
        No EXIF metadata found in this photo.
      </Typography>
    );
  }

  const dateText = formatCreateDate(exif.createDate);
  const cameraText = [exif.make, exif.model].filter(Boolean).join(" ");

  const rows: Array<{ label: string; value: string | null }> = [
    { label: "Taken", value: dateText },
    {
      label: "Location",
      value:
        exif.latitude != null && exif.longitude != null
          ? `${exif.latitude.toFixed(5)}, ${exif.longitude.toFixed(5)}`
          : null,
    },
    { label: "Camera", value: cameraText || null },
  ].filter((row) => row.value != null) as Array<{ label: string; value: string }>;

  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 2,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ letterSpacing: 0.3 }}>
          Photo metadata
        </Typography>
        <IconButton
          size="small"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Collapse metadata" : "Expand metadata"}
        >
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Box component="dl" sx={{ margin: 0, display: "grid", gap: 0.75 }}>
            {rows.map((row) => (
              <Box
                key={row.label}
                sx={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 1 }}
              >
                <dt>
                  <Typography variant="body2" color="text.secondary">
                    {row.label}
                  </Typography>
                </dt>
                <dd>
                  <Typography
                    variant="body2"
                    sx={{ margin: 0, overflowWrap: "anywhere" }}
                  >
                    {row.value}
                  </Typography>
                </dd>
              </Box>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
