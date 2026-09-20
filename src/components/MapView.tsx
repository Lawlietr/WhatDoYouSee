"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useSyncExternalStore } from "react";
import { Box, Button, Typography } from "@mui/material";
import { Map as MapIcon, SatelliteAlt } from "@mui/icons-material";
import type { MapLayer } from "./leaflet-map";

const emptySubscribe = () => () => {};

interface MapViewProps {
  lat: number | null;
  lon: number | null;
}

type LeafletMapEl = ComponentType<{ lat: number; lon: number; layer: MapLayer }>;

export function MapView({ lat, lon }: MapViewProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [layer, setLayer] = useState<MapLayer>("street");
  const [LeafletMap, setLeafletMap] = useState<LeafletMapEl | null>(null);

  useEffect(() => {
    let active = true;
    import("./leaflet-map").then((mod) => {
      if (active) setLeafletMap(() => mod.LeafletMap);
    });
    return () => {
      active = false;
    };
  }, []);

  const hasGps = lat != null && lon != null;

  if (!hasGps) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 3,
          border: "1px dashed rgba(255,255,255,0.15)",
          borderRadius: 2,
          color: "text.secondary",
        }}
      >
        <MapIcon sx={{ fontSize: 28 }} />
        <Typography variant="body2">
          No GPS data in this photo, so the location can’t be shown on a map.
        </Typography>
      </Box>
    );
  }

  if (!mounted || !LeafletMap) {
    return (
      <Box sx={{ width: "100%", height: 320, borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <LeafletMap lat={lat} lon={lon} layer={layer} />
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          display: "flex",
          gap: 0.5,
        }}
      >
        <Button
          size="small"
          variant={layer === "street" ? "contained" : "outlined"}
          startIcon={<MapIcon />}
          onClick={() => setLayer("street")}
          sx={{ color: "text.primary" }}
        >
          Street
        </Button>
        <Button
          size="small"
          variant={layer === "satellite" ? "contained" : "outlined"}
          startIcon={<SatelliteAlt />}
          onClick={() => setLayer("satellite")}
          sx={{ color: "text.primary" }}
        >
          Satellite
        </Button>
      </Box>
    </Box>
  );
}
