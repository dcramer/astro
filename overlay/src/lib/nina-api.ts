import { getFetchTimeoutMs, getNinaBaseUrl } from "./config";

export interface SessionSummary {
  key: string;
  display: string;
}

export interface SessionListResponse {
  sessions: SessionSummary[];
}

export interface SessionHistory {
  id: string;
  pluginVersion: string;
  sessionVersion: number;
  startTime: string;
  profileName: string;
  activeSession: boolean;
  activeTargetId?: string | null;
  targets?: Target[];
  events?: NinaLogEvent[];
}

export interface NinaLogEvent {
  id?: string;
  eventType?: string;
  category?: string;
  message?: string;
  utcTimestamp?: string;
}

export interface Target {
  id: string;
  name: string;
  startTime: string;
  imageRecords?: ImageRecord[];
}

export interface ImageRecord {
  id: string;
  index: number;
  fileName: string;
  fullPath: string;
  started: string;
  epochMilliseconds?: number;
  duration: number;
  filterName?: string;
  detectedStars?: number;
  HFR?: number;
  GuidingRMS?: number;
  GuidingRMSArcSec?: number;
  GuidingRMSRA?: number;
  GuidingRMSRAArcSec?: number;
  GuidingRMSDEC?: number;
  GuidingRMSDECArcSec?: number;
  FocuserTemperature?: number;
  WeatherTemperature?: number;
}

export interface OverlaySessionContext {
  summary: SessionSummary;
  history: SessionHistory;
}

async function fetchJson<T>(baseUrl: string, path: string): Promise<T | null> {
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getFetchTimeoutMs());

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Request to ${url} failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${url}`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSessionList(baseUrl: string): Promise<SessionListResponse | null> {
  return fetchJson<SessionListResponse>(baseUrl, "/sessions/sessions.json");
}

export async function fetchSessionHistory(
  baseUrl: string,
  sessionKey: string,
): Promise<SessionHistory | null> {
  return fetchJson<SessionHistory>(baseUrl, `/sessions/${sessionKey}/sessionHistory.json`);
}

export async function loadOverlaySession(): Promise<OverlaySessionContext | null> {
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

  // Prefer active session; otherwise fall back to most recent session with data
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
