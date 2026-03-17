import { useEffect, useRef, useState } from "react";

import type {
  AdvancedStatus,
  NinaMountInfo,
  NinaWeatherInfo,
} from "@nina/advanced";
import type { LiveApiResponse, OverlayImage } from "@/lib/site-types";

const FAILURE_THRESHOLD = 3;

interface UseOverlaySessionOptions {
  pollMs: number;
}

interface UseOverlaySessionResult {
  imageHistory: ReadonlyArray<OverlayImage>;
  advancedStatus: AdvancedStatus | null;
  connectionOffline: boolean;
  hasConnected: boolean;
  mountInfo: NinaMountInfo | null;
  weatherInfo: NinaWeatherInfo | null;
}

export function useOverlaySession(
  options: UseOverlaySessionOptions,
): UseOverlaySessionResult {
  const { pollMs } = options;
  const effectivePollMs = Math.max(pollMs, 3000);
  const [imageHistory, setImageHistory] = useState<ReadonlyArray<OverlayImage>>([]);
  const [advancedStatus, setAdvancedStatus] = useState<AdvancedStatus | null>(
    null,
  );
  const [mountInfo, setMountInfo] = useState<NinaMountInfo | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<NinaWeatherInfo | null>(null);
  const [connectionOffline, setConnectionOffline] = useState<boolean>(true);
  const [hasConnected, setHasConnected] = useState<boolean>(false);

  const failureCountRef = useRef(0);
  const loggedFailureRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchLatest() {
      try {
        const response = await fetch("/api/live", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const payload = (await response.json()) as LiveApiResponse;

        if (cancelled) {
          return;
        }

        const historyData = payload?.images ?? [];
        const advancedData = payload?.advanced ?? null;
        const mountData = payload?.mount ?? null;
        const weatherData = payload?.weather ?? null;
        const offline = payload?.stale ?? true;

        failureCountRef.current = 0;
        setConnectionOffline(offline);
        setImageHistory(historyData);
        setAdvancedStatus(advancedData);
        setMountInfo(mountData);
        setWeatherInfo(weatherData);
        setHasConnected(payload?.hasConnected ?? false);

        if (loggedFailureRef.current) {
          console.info("Overlay session recovered after fetch failures.");
          loggedFailureRef.current = false;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (!loggedFailureRef.current) {
          console.warn("Overlay fetch failed; monitoring for recovery.", error);
          loggedFailureRef.current = true;
        }

        failureCountRef.current += 1;
        if (failureCountRef.current >= FAILURE_THRESHOLD) {
          setConnectionOffline(true);
          setImageHistory([]);
          setAdvancedStatus(null);
          setMountInfo(null);
          setWeatherInfo(null);
          setHasConnected(false);
          console.warn("Overlay session marked offline after repeated fetch failures.");
        }
      }
    }

    fetchLatest();
    const intervalId = window.setInterval(fetchLatest, effectivePollMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [effectivePollMs]);

  return {
    imageHistory,
    advancedStatus,
    connectionOffline,
    hasConnected,
    mountInfo,
    weatherInfo,
  };
}
