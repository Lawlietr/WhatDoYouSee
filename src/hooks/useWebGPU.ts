"use client";

import { useEffect, useState } from "react";

interface WebGpuState {
  supported: boolean;
  adapter: GPUAdapter | null;
}

export function useWebGPU() {
  const [state, setState] = useState<WebGpuState | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (typeof navigator === "undefined" || !("gpu" in navigator)) {
        if (active) setState({ supported: false, adapter: null });
        return;
      }
      const gpu = (navigator as Navigator & { gpu: GPU }).gpu;
      const adapter = (await gpu.requestAdapter()) ?? null;
      if (active) setState({ supported: adapter != null, adapter });
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    supported: state?.supported ?? false,
    checking: state == null,
    adapter: state?.adapter ?? null,
  };
}
