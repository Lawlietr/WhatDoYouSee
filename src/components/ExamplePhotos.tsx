"use client";

import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { PhotoLibrary } from "@mui/icons-material";

interface Example {
  file: string;
  src: string;
  label: string;
}

const EXAMPLES: Example[] = [
  { file: "street.png", src: "/examples/street.png", label: "Street at dusk" },
  { file: "interior.png", src: "/examples/interior.png", label: "Apartment interior" },
  { file: "outdoors.png", src: "/examples/outdoors.png", label: "Hiking trail" },
  { file: "selfie.png", src: "/examples/selfie.png", label: "Café selfie" },
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
      const file = new File([blob], example.file, { type: blob.type || "image/png" });
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
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1.5,
        }}
      >
        {EXAMPLES.map((example) => (
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
