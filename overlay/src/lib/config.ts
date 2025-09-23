const DEFAULT_BASE_URL = "http://eagle4pro0329:8000";

const baseUrlEnv = process.env.NINA_SESSION_BASE_URL?.trim();

function normalizeBaseUrl(url: string) {
  if (url.endsWith("/")) {
    return url.slice(0, -1);
  }
  return url;
}

export function getNinaBaseUrl(): string | null {
  const candidate = baseUrlEnv || DEFAULT_BASE_URL;

  try {
    const normalized = normalizeBaseUrl(candidate);
    // Throws if invalid URL
    new URL(normalized);
    return normalized;
  } catch (error) {
    console.error("Invalid NINA session base URL:", error);
    return null;
  }
}

export function getFetchTimeoutMs(): number {
  const raw = process.env.NINA_OVERLAY_FETCH_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}
