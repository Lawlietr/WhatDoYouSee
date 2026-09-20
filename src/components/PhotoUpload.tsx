"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { CloudUpload, PhotoLibrary, Delete } from "@mui/icons-material";

interface PhotoUploadProps {
  onPhotoSelected: (file: File) => void;
  onClear?: () => void;
  file?: File | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoUpload({ onPhotoSelected, onClear, file }: PhotoUploadProps) {
  const isControlled = file !== undefined;
  const [dragActive, setDragActive] = useState(false);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [internalUrl, setInternalUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const internalUrlRef = useRef<string | null>(null);

  const setInternalPreview = (url: string | null) => {
    if (internalUrlRef.current) URL.revokeObjectURL(internalUrlRef.current);
    internalUrlRef.current = url;
    setInternalUrl(url);
  };

  const controlledUrl = useMemo(
    () => (isControlled && file ? URL.createObjectURL(file) : null),
    [file, isControlled]
  );

  useEffect(() => {
    return () => {
      if (controlledUrl) URL.revokeObjectURL(controlledUrl);
    };
  }, [controlledUrl]);

  useEffect(() => {
    return () => {
      if (internalUrlRef.current) URL.revokeObjectURL(internalUrlRef.current);
    };
  }, []);

  const handleFile = useCallback(
    (f: File | undefined) => {
      if (!f || !f.type.startsWith("image/")) return;
      if (!isControlled) {
        setInternalFile(f);
        setInternalPreview(URL.createObjectURL(f));
      }
      onPhotoSelected(f);
    },
    [isControlled, onPhotoSelected]
  );

  const clear = useCallback(() => {
    if (!isControlled) setInternalFile(null);
    setInternalPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  }, [isControlled, onClear]);

  const selectedFile = isControlled ? file : internalFile;
  const previewUrl = selectedFile ? (isControlled ? controlledUrl : internalUrl) : null;

  return (
    <Box sx={{ width: "100%" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {selectedFile && previewUrl ? (
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={selectedFile.name}
            style={{
              display: "block",
              width: "100%",
              maxHeight: 420,
              objectFit: "contain",
            }}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.5,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {selectedFile.name} · {formatBytes(selectedFile.size)}
            </Typography>
            <Button
              size="small"
              startIcon={<PhotoLibrary />}
              onClick={() => inputRef.current?.click()}
            >
              Change
            </Button>
            <IconButton size="small" onClick={clear} aria-label="Clear photo">
              <Delete />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          sx={{
            width: "100%",
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            cursor: "pointer",
            borderRadius: 2,
            border: `2px dashed ${dragActive ? "primary.main" : "rgba(255,255,255,0.2)"}`,
            background: dragActive ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)",
            transition: "border-color 0.2s, background 0.2s",
            "&:hover": { borderColor: "primary.main" },
            "&:focus-visible": { outline: "2px solid primary.main" },
          }}
        >
          <CloudUpload sx={{ fontSize: 56, color: "primary.main" }} />
          <Typography variant="h6">Upload a photo</Typography>
          <Typography variant="body2" color="text.secondary">
            Drag & drop an image here, or click to browse
          </Typography>
          <Typography variant="caption" color="text.disabled">
            JPEG · PNG · WebP · HEIC
          </Typography>
        </Box>
      )}
    </Box>
  );
}
