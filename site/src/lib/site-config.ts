const DEFAULT_LOCAL_SYNC_API_BASE_URL = "http://127.0.0.1:4321";
const DEFAULT_LOCAL_SYNC_HMAC_SECRET = "astro-site-local-dev-secret";

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

export function getSyncApiBaseUrl(): string {
  const candidate = process.env.SYNC_API_BASE_URL?.trim() || DEFAULT_LOCAL_SYNC_API_BASE_URL;

  try {
    const normalized = normalizeBaseUrl(candidate);
    new URL(normalized);
    return normalized;
  } catch (error) {
    throw new Error(`Invalid SYNC_API_BASE_URL: ${String(error)}`);
  }
}

export function getLocalSyncHmacSecret(): string {
  return process.env.SYNC_HMAC_SECRET?.trim() || DEFAULT_LOCAL_SYNC_HMAC_SECRET;
}

export function getRequestSyncHmacSecret(
  runtimeSecret: string | null | undefined,
  requestUrl: string,
): string {
  if (runtimeSecret?.trim()) {
    return runtimeSecret.trim();
  }

  const { hostname } = new URL(requestUrl);
  if (isLocalHostname(hostname)) {
    return DEFAULT_LOCAL_SYNC_HMAC_SECRET;
  }

  throw new Error("Missing SYNC_HMAC_SECRET for non-local request.");
}

export function getDefaultLocalSyncApiBaseUrl(): string {
  return DEFAULT_LOCAL_SYNC_API_BASE_URL;
}

export function getDefaultLocalSyncHmacSecret(): string {
  return DEFAULT_LOCAL_SYNC_HMAC_SECRET;
}
