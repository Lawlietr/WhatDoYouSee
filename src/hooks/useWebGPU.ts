"use client";

import { useEffect, useState } from "react";

interface WebGpuState {
  supported: boolean;
  adapter: GPUAdapter | null;
  // navigator.gpu is only exposed in secure contexts (HTTPS or localhost).
  // A plain-HTTP page on a LAN IP is not secure, so even browsers that
  // support WebGPU (Chrome, Edge, Brave, Safari 26+) report "unsupported".
  secureContext: boolean;
}

export function useWebGPU() {
  const [state, setState] = useState<WebGpuState | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const secure = typeof window !== "undefined" ? window.isSecureContext : true;
      if (typeof navigator === "undefined" || !("gpu" in navigator)) {
        if (active) setState({ supported: false, adapter: null, secureContext: secure });
        return;
      }
      const gpu = (navigator as Navigator & { gpu: GPU }).gpu;
      const adapter = (await gpu.requestAdapter()) ?? null;
      if (active) setState({ supported: adapter != null, adapter, secureContext: secure });
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    supported: state?.supported ?? false,
    checking: state == null,
    adapter: state?.adapter ?? null,
    secureContext: state?.secureContext ?? true,
  };
}
