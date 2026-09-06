"use client";

import { useCallback, useState } from "react";
import { Alert, Box, Button, IconButton, Typography } from "@mui/material";
import {
  GitHub as GitHubIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { SITE } from "../lib/site";
import { PhotoUpload } from "../components/PhotoUpload";
import { ExamplePhotos } from "../components/ExamplePhotos";
import { EXIFDisplay } from "../components/EXIFDisplay";
import { AnalysisResult } from "../components/AnalysisResult";
import { MapView } from "../components/MapView";
import { LoadingAnimation } from "../components/LoadingAnimation";
import { SettingsPanel } from "../components/settings/SettingsPanel";
import { useSettings } from "../hooks/useSettings";
import { usePhotoAnalysis } from "../hooks/usePhotoAnalysis";

export default function Home() {
  const { settings, updateSettings } = useSettings();
  const {
    isAnalyzing,
    stage,
    result,
    meta,
    error,
    exif,
    analyze,
    reset,
  } = usePhotoAnalysis();
  const [photo, setPhoto] = useState<File | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handlePhotoSelected = useCallback(
    (file: File) => {
      setPhoto(file);
      void analyze(file);
    },
    [analyze]
  );

  const handleClear = useCallback(() => {
    setPhoto(null);
    reset();
  }, [reset]);

  return (
    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, md: 4 },
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
            {SITE.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {SITE.tagline}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {SITE.GITHUB_REPO_URL ? (
            <a
              href={SITE.GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconButton aria-label="View source on GitHub">
                <GitHubIcon />
              </IconButton>
            </a>
          ) : null}
          <IconButton
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        {!photo ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Box sx={{ textAlign: "center", mt: { xs: 4, md: 8 } }}>
              <Typography variant="h4" component="h1">
                What can a stranger tell from your photo?
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1, mx: "auto", maxWidth: 560 }}
              >
                Upload a photo and the AI will list everything an observer could
                infer about you. Everything is processed {settings.inferenceMode === "webgpu"
                  ? "in your browser"
                  : "on your own server"} — nothing is sent to a third party.
              </Typography>
            </Box>
            <PhotoUpload onPhotoSelected={handlePhotoSelected} />
            <ExamplePhotos onPhotoSelected={handlePhotoSelected} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 4,
              alignItems: "start",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <PhotoUpload
                file={photo}
                onPhotoSelected={handlePhotoSelected}
                onClear={handleClear}
              />
              <EXIFDisplay exif={exif} />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {isAnalyzing && (
                <Box sx={{ py: 6 }}>
                  <LoadingAnimation />
                </Box>
              )}

              {!isAnalyzing && error && (
                <Alert
                  severity="error"
                  sx={{ whiteSpace: "pre-line" }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => void analyze(photo)}
                    >
                      Retry
                    </Button>
                  }
                >
                  {error}
                </Alert>
              )}

              {!isAnalyzing && result && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Analyzed with {meta?.provider} ({meta?.model}) in{" "}
                    {((meta?.latencyMs ?? 0) / 1000).toFixed(1)}s
                  </Typography>
                  <AnalysisResult result={result} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Location
                    </Typography>
                    <MapView
                      lat={exif?.latitude ?? null}
                      lon={exif?.longitude ?? null}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoLibraryIcon />}
                    onClick={handleClear}
                  >
                    Analyze another photo
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Inspired by ENTE&rsquo;s theyseeyourphotos · runs entirely on your own
          hardware · AGPL-3.0
        </Typography>
      </Box>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(s) => updateSettings(s)}
      />
    </Box>
  );
}
