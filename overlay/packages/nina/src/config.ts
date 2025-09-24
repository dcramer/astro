const DEFAULT_BASE_URL = "http://eagle4pro0329:8000";
const ADVANCED_API_DEFAULT_PORT = 1888;

const sessionBaseEnv = process.env.NINA_SESSION_BASE_URL?.trim();
const advancedBaseEnv = process.env.NINA_ADVANCED_API_BASE_URL?.trim();

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getNinaBaseUrl(): string | null {
  const candidate = sessionBaseEnv || DEFAULT_BASE_URL;

  try {
    const normalized = normalizeBaseUrl(candidate);
    new URL(normalized);
    return normalized;
  } catch (error) {
    console.error("Invalid NINA session base URL:", error);
    return null;
  }
}

function deriveAdvancedBaseFromSession(): string | null {
  const sessionBase = getNinaBaseUrl();
  if (!sessionBase) {
    return null;
  }

  try {
    const sessionUrl = new URL(sessionBase);
    return `${sessionUrl.protocol}//${sessionUrl.hostname}:${ADVANCED_API_DEFAULT_PORT}`;
  } catch (error) {
    console.error("Failed to derive advanced API base from session URL:", error);
    return null;
  }
}

export function getNinaAdvancedApiBaseUrl(): string | null {
  const candidate = advancedBaseEnv || deriveAdvancedBaseFromSession();
  if (!candidate) {
    return null;
  }

  try {
    const normalized = normalizeBaseUrl(candidate);
    new URL(normalized);
    return normalized;
  } catch (error) {
    console.error("Invalid NINA advanced API base URL:", error);
    return null;
  }
}

export function getFetchTimeoutMs(): number {
  const raw = process.env.NINA_OVERLAY_FETCH_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}
