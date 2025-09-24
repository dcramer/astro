"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AdvancedStatus,
  NinaImageHistoryEntry,
  NinaMountInfo,
  NinaWeatherInfo,
} from "@nina/advanced";

const FAILURE_THRESHOLD = 3;

interface UseOverlaySessionOptions {
  baseUrl: string | null;
  pollMs: number;
}

interface UseOverlaySessionResult {
  imageHistory: ReadonlyArray<NinaImageHistoryEntry>;
  advancedStatus: AdvancedStatus | null;
  connectionOffline: boolean;
  hasConnected: boolean;
  mountInfo: NinaMountInfo | null;
  weatherInfo: NinaWeatherInfo | null;
}

export function useOverlaySession(
  options: UseOverlaySessionOptions,
): UseOverlaySessionResult {
  const { baseUrl, pollMs } = options;
  const effectivePollMs = Math.max(pollMs, 3000);
  const [imageHistory, setImageHistory] = useState<ReadonlyArray<NinaImageHistoryEntry>>([]);
  const [advancedStatus, setAdvancedStatus] = useState<AdvancedStatus | null>(
    null,
  );
  const [mountInfo, setMountInfo] = useState<NinaMountInfo | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<NinaWeatherInfo | null>(null);
  const [connectionOffline, setConnectionOffline] = useState<boolean>(
    !baseUrl,
  );
  const [hasConnected, setHasConnected] = useState<boolean>(false);

  const failureCountRef = useRef(0);
  const loggedFailureRef = useRef(false);

  useEffect(() => {
    if (!baseUrl) {
      setImageHistory([]);
      setAdvancedStatus(null);
      setMountInfo(null);
      setWeatherInfo(null);
      setConnectionOffline(true);
      setHasConnected(false);
      failureCountRef.current = 0;
      loggedFailureRef.current = false;
      return () => {};
    }

    let cancelled = false;

    async function fetchLatest() {
      try {
        const response = await fetch("/api/overlay-session", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const payload = (await response.json()) as {
          images?: ReadonlyArray<NinaImageHistoryEntry>;
          advanced?: AdvancedStatus | null;
          mount?: NinaMountInfo | null;
          weather?: NinaWeatherInfo | null;
        };

        if (cancelled) {
          return;
        }

        const historyData = payload?.images ?? [];
        const advancedData = payload?.advanced ?? null;
        const mountData = payload?.mount ?? null;
        const weatherData = payload?.weather ?? null;

        if (historyData.length) {
          failureCountRef.current = 0;
          setConnectionOffline(false);
          setImageHistory(historyData);
          setAdvancedStatus(advancedData);
          setMountInfo(mountData);
          setWeatherInfo(weatherData);
          setHasConnected(true);

          if (loggedFailureRef.current) {
            console.info("Overlay session recovered after fetch failures.");
            loggedFailureRef.current = false;
          }
          return;
        }

        // Successful response but no image history yet.
        failureCountRef.current = 0;
        setConnectionOffline(false);
        setImageHistory([]);
        setAdvancedStatus(advancedData);
        setMountInfo(mountData);
        setWeatherInfo(weatherData);
        setHasConnected(true);

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
  }, [baseUrl, effectivePollMs]);

  return {
    imageHistory,
    advancedStatus,
    connectionOffline,
    hasConnected,
    mountInfo,
    weatherInfo,
  };
}
