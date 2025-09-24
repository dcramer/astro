import { getFetchTimeoutMs, getNinaBaseUrl } from "./config";

const FAILURE_LOG_COOLDOWN_MS = 60_000;
const MAX_TRACKED_FAILURE_ENDPOINTS = 16;
const sessionFailureLog = new Map<string, number>();

function stampSessionFailure(key: string, timestamp: number) {
  if (sessionFailureLog.size >= MAX_TRACKED_FAILURE_ENDPOINTS) {
    const oldestKey = sessionFailureLog.keys().next().value;
    if (oldestKey) {
      sessionFailureLog.delete(oldestKey);
    }
  }
  sessionFailureLog.set(key, timestamp);
}

function shouldLogSessionFailure(key: string) {
  const now = Date.now();
  const last = sessionFailureLog.get(key);
  if (last && now - last < FAILURE_LOG_COOLDOWN_MS) {
    return false;
  }
  stampSessionFailure(key, now);
  return true;
}

function clearSessionFailure(key: string) {
  if (sessionFailureLog.has(key)) {
    sessionFailureLog.delete(key);
  }
}

export type NinaSequenceStatus =
  | "Ready"
  | "Running"
  | "Completed"
  | "Failed"
  | "Aborted"
  | "Paused"
  | string;

export interface NinaLogEvent {
  readonly id?: string;
  readonly eventType?: string;
  readonly category?: string;
  readonly message?: string;
  readonly utcTimestamp?: string;
}

export interface NinaImageRecord {
  readonly id: string;
  readonly index: number;
  readonly fileName: string;
  readonly fullPath: string;
  readonly started: string;
  readonly epochMilliseconds?: number;
  readonly duration: number;
  readonly filterName?: string;
  readonly detectedStars?: number;
  readonly HFR?: number;
  readonly GuidingRMS?: number;
  readonly GuidingRMSArcSec?: number;
  readonly GuidingRMSRA?: number;
  readonly GuidingRMSRAArcSec?: number;
  readonly GuidingRMSDEC?: number;
  readonly GuidingRMSDECArcSec?: number;
  readonly FocuserTemperature?: number;
  readonly WeatherTemperature?: number;
}

export interface NinaTarget {
  readonly id: string;
  readonly name: string;
  readonly startTime: string;
  readonly imageRecords?: ReadonlyArray<NinaImageRecord>;
}

export interface NinaSessionSummary {
  readonly key: string;
  readonly display: string;
}

export interface NinaSessionListResponse {
  readonly sessions: ReadonlyArray<NinaSessionSummary>;
}

export interface NinaSessionHistory {
  readonly id: string;
  readonly pluginVersion: string;
  readonly sessionVersion: number;
  readonly startTime: string;
  readonly profileName: string;
  readonly activeSession: boolean;
  readonly activeTargetId?: string | null;
  readonly targets?: ReadonlyArray<NinaTarget>;
  readonly events?: ReadonlyArray<NinaLogEvent>;
}

export interface NinaOverlaySessionContext {
  readonly summary: NinaSessionSummary;
  readonly history: NinaSessionHistory;
}

// Backwards-compatible aliases for legacy imports.
export type SessionSummary = NinaSessionSummary;
export type SessionListResponse = NinaSessionListResponse;
export type SessionHistory = NinaSessionHistory;
export type Target = NinaTarget;
export type ImageRecord = NinaImageRecord;
export type OverlaySessionContext = NinaOverlaySessionContext;

async function fetchJson<T>(baseUrl: string, path: string): Promise<T | null> {
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (shouldLogSessionFailure(url)) {
        console.warn(
          `Session API request to ${url} failed: ${response.status} ${response.statusText}`,
        );
      }
      return null;
    }

    clearSessionFailure(url);
    return (await response.json()) as T;
  } catch (error) {
    if (shouldLogSessionFailure(url)) {
      console.warn(`Failed to fetch session endpoint ${url}`, error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSessionList(
  baseUrl: string,
): Promise<NinaSessionListResponse | null> {
  return fetchJson<NinaSessionListResponse>(baseUrl, "/sessions/sessions.json");
}

export async function fetchSessionHistory(
  baseUrl: string,
  sessionKey: string,
): Promise<NinaSessionHistory | null> {
  return fetchJson<NinaSessionHistory>(baseUrl, `/sessions/${sessionKey}/sessionHistory.json`);
}

export async function loadOverlaySession(): Promise<NinaOverlaySessionContext | null> {
  const baseUrl = getNinaBaseUrl();
  if (!baseUrl) {
    console.warn("NINA_SESSION_BASE_URL is not configured.");
    return null;
  }

  const sessionList = await fetchSessionList(baseUrl);
  if (!sessionList?.sessions?.length) {
    console.warn("No sessions found in session list.");
    return null;
  }

  const orderedSessions = [...sessionList.sessions].sort((a, b) => a.key.localeCompare(b.key));

  for (let idx = orderedSessions.length - 1; idx >= 0; idx -= 1) {
    const summary = orderedSessions[idx];
    const history = await fetchSessionHistory(baseUrl, summary.key);
    if (!history) {
      continue;
    }

    if (history.activeSession || idx === orderedSessions.length - 1) {
      return { summary, history };
    }
  }

  return null;
}
