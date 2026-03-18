import { useEffect, useRef, useState } from "react";

import type {
  AdvancedStatus,
  NinaImageHistoryEntry,
  NinaMountInfo,
  NinaWeatherInfo,
} from "@nina/advanced";
import type { CurrentTargetSnapshot, LiveApiResponse } from "@/lib/site-types";

const FAILURE_THRESHOLD = 3;

interface UseOverlaySessionOptions {
  pollMs: number;
}

type OverlaySessionImage = NinaImageHistoryEntry & {
  thumbnailUrl?: string | null;
};

interface DirectOverlaySessionResponse {
  images?: ReadonlyArray<OverlaySessionImage>;
  advanced?: AdvancedStatus | null;
  mount?: NinaMountInfo | null;
  weather?: NinaWeatherInfo | null;
}

interface UseOverlaySessionResult {
  imageHistory: ReadonlyArray<OverlaySessionImage>;
  advancedStatus: AdvancedStatus | null;
  connectionOffline: boolean;
  currentTargetSnapshot: CurrentTargetSnapshot | null;
  hasConnected: boolean;
  mountInfo: NinaMountInfo | null;
  weatherInfo: NinaWeatherInfo | null;
}

export function useOverlaySession(
  options: UseOverlaySessionOptions,
): UseOverlaySessionResult {
  const { pollMs } = options;
  const effectivePollMs = Math.max(pollMs, 3000);
  const [imageHistory, setImageHistory] = useState<ReadonlyArray<OverlaySessionImage>>([]);
  const [advancedStatus, setAdvancedStatus] = useState<AdvancedStatus | null>(
    null,
  );
  const [mountInfo, setMountInfo] = useState<NinaMountInfo | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<NinaWeatherInfo | null>(null);
  const [currentTargetSnapshot, setCurrentTargetSnapshot] = useState<CurrentTargetSnapshot | null>(null);
  const [connectionOffline, setConnectionOffline] = useState<boolean>(true);
  const [hasConnected, setHasConnected] = useState<boolean>(false);

  const failureCountRef = useRef(0);
  const loggedFailureRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchJson<T>(url: string): Promise<T> {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} (${url})`);
      }

      return (await response.json()) as T;
    }

    async function fetchLatest() {
      try {
        const [directResult, liveResult] = await Promise.allSettled([
          fetchJson<DirectOverlaySessionResponse>("/api/overlay-session"),
          fetchJson<LiveApiResponse>("/api/live"),
        ]);

        if (cancelled) {
          return;
        }

        const directPayload = directResult.status === "fulfilled" ? directResult.value : null;
        const livePayload = liveResult.status === "fulfilled" ? liveResult.value : null;

        setCurrentTargetSnapshot(livePayload?.session?.currentState?.currentTarget ?? null);

        if (directPayload) {
          const hasDirectData =
            (directPayload.images?.length ?? 0) > 0 ||
            directPayload.advanced !== null ||
            directPayload.mount !== null ||
            directPayload.weather !== null;

          failureCountRef.current = 0;
          setConnectionOffline(!hasDirectData);
          setImageHistory(directPayload.images ?? []);
          setAdvancedStatus(directPayload.advanced ?? livePayload?.advanced ?? null);
          setMountInfo(directPayload.mount ?? livePayload?.mount ?? null);
          setWeatherInfo(directPayload.weather ?? livePayload?.weather ?? null);
          setHasConnected(hasDirectData);

          if (loggedFailureRef.current) {
            console.info("Overlay session recovered after fetch failures.");
            loggedFailureRef.current = false;
          }
          return;
        }

        if (!livePayload) {
          const directError = directResult.status === "rejected" ? directResult.reason : null;
          const liveError = liveResult.status === "rejected" ? liveResult.reason : null;
          throw directError ?? liveError ?? new Error("Overlay data unavailable.");
        }

        const historyData = livePayload.images ?? [];
        const advancedData = livePayload.advanced ?? null;
        const mountData = livePayload.mount ?? null;
        const weatherData = livePayload.weather ?? null;
        const connected = livePayload.hasConnected ?? false;
        const offline = (livePayload.stale ?? true) || !connected;

        failureCountRef.current = 0;
        setConnectionOffline(offline);
        setImageHistory(historyData);
        setAdvancedStatus(advancedData);
        setMountInfo(mountData);
        setWeatherInfo(weatherData);
        setHasConnected(connected);

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
          setCurrentTargetSnapshot(null);
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
    currentTargetSnapshot,
    hasConnected,
    mountInfo,
    weatherInfo,
  };
}
