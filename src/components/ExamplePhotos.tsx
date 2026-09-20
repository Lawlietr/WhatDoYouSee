"use client";

import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { PhotoLibrary } from "@mui/icons-material";

interface Example {
  file: string;
  src: string;
  label: string;
  credit: string;
}

const EXAMPLES: Example[] = [
  { file: "parade.jpg", src: "/examples/parade.jpg", label: "Street parade", credit: "Klub Boks · Pexels" },
  { file: "family.jpg", src: "/examples/family.jpg", label: "Family gathering", credit: "Raymond Ma Yi Rong · Pexels" },
  { file: "walk.jpg", src: "/examples/walk.jpg", label: "A tree-lined walk", credit: "Hsing Chi Fang · Pexels" },
  { file: "family-bed.jpg", src: "/examples/family-bed.jpg", label: "Mother and kids", credit: "Ketut Subiyanto · Pexels" },
];

interface ExamplePhotosProps {
  onPhotoSelected: (file: File) => void;
}

export function ExamplePhotos({ onPhotoSelected }: ExamplePhotosProps) {
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const selectExample = async (example: Example) => {
    if (loadingFile) return;
    setLoadingFile(example.file);
    try {
      const response = await fetch(example.src);
      if (!response.ok) throw new Error(`Failed to load ${example.src}`);
      const blob = await response.blob();
      const file = new File([blob], example.file, { type: blob.type || "image/jpeg" });
      onPhotoSelected(file);
    } catch {
      setLoadingFile(null);
    }
  };

  return (
    <Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}
      >
        <PhotoLibrary sx={{ fontSize: 18 }} />
        Or try an example
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: "1fr",
          "@media (min-width: 1024px)": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        {EXAMPLES.map((example, i) => (
          <Box
            key={example.file}
            role="button"
            tabIndex={0}
            aria-label={`Use example photo: ${example.label}`}
            onClick={() => selectExample(example)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") selectExample(example);
            }}
            sx={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              transition: "border-color 0.15s, transform 0.15s",
              "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
              "&:focus-visible": { outline: "2px solid primary.main" },
              "@media (min-width: 1024px)": {
                gridColumn: Math.floor(i / 2) + 1,
                gridRow: (i % 2) + 1,
              },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={example.src}
              alt={example.label}
              loading="lazy"
              style={{ display: "block", width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                insetX: 0,
                bottom: 0,
                px: 1.5,
                py: 1,
                background: "rgba(0,0,0,0.55)",
              }}
            >
              <Typography variant="caption">{example.label}</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                {example.credit}
              </Typography>
            </Box>
            {loadingFile === example.file && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.4)",
                }}
              >
                <CircularProgress size={28} />
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
