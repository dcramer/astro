export type TelescopeStreamPosition = "bottom-left" | "bottom-right";

const DEFAULT_BASE_URL = "http://eagle4pro0329:8000";
const ADVANCED_API_DEFAULT_PORT = 1888;
const DEFAULT_TELESCOPE_STREAM_URL = "rtsp://192.168.1.128:8554/unicast";
const DEFAULT_TELESCOPE_STREAM_POSITION: TelescopeStreamPosition = "bottom-left";
const TELESCOPE_STREAM_WIDTH_PX = 352;
const TELESCOPE_STREAM_HEIGHT_PX = 264;
const DEFAULT_TELESCOPE_STREAM_FPS = 10;
const DEFAULT_TELESCOPE_STREAM_QUALITY = 5;
const DEFAULT_FFMPEG_PATH = "ffmpeg";
const TELESCOPE_STREAM_ENDPOINT = "/api/telescope-stream";

const sessionBaseEnv = process.env.NINA_SESSION_BASE_URL?.trim();
const advancedBaseEnv = process.env.NINA_ADVANCED_API_BASE_URL?.trim();

export interface TelescopeStreamOverlayConfig {
  enabled: boolean;
  endpoint: string;
  position: TelescopeStreamPosition;
}

export interface TelescopeStreamFfmpegConfig {
  ffmpegPath: string;
  inputUrl: string;
  fps: number;
  outputWidthPx: number;
  outputHeightPx: number;
  quality: number;
}

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

function parsePositiveInteger(raw: string | undefined, fallback: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTelescopeStreamInputUrl(): string | null {
  const candidate =
    process.env.TELESCOPE_STREAM_URL?.trim() ||
    process.env.TELESCOPE_RTSP_URL?.trim() ||
    DEFAULT_TELESCOPE_STREAM_URL;

  if (!candidate) {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    if (!["rtsp:", "rtsps:", "http:", "https:"].includes(parsed.protocol)) {
      console.error("Unsupported telescope stream protocol:", parsed.protocol);
      return null;
    }
    return candidate;
  } catch (error) {
    console.error("Invalid telescope stream URL:", error);
    return null;
  }
}

function getTelescopeStreamPosition(): TelescopeStreamPosition {
  const raw = process.env.TELESCOPE_STREAM_POSITION?.trim().toLowerCase();
  if (raw === "bottom-right" || raw === "bottom-left") {
    return raw;
  }
  return DEFAULT_TELESCOPE_STREAM_POSITION;
}

export function getTelescopeStreamOverlayConfig(): TelescopeStreamOverlayConfig {
  return {
    enabled: Boolean(getTelescopeStreamInputUrl()),
    endpoint: TELESCOPE_STREAM_ENDPOINT,
    position: getTelescopeStreamPosition(),
  };
}

export function getTelescopeStreamFfmpegConfig(): TelescopeStreamFfmpegConfig | null {
  const inputUrl = getTelescopeStreamInputUrl();
  if (!inputUrl) {
    return null;
  }

  return {
    ffmpegPath: process.env.FFMPEG_PATH?.trim() || DEFAULT_FFMPEG_PATH,
    inputUrl,
    fps: parsePositiveInteger(
      process.env.TELESCOPE_STREAM_FPS,
      DEFAULT_TELESCOPE_STREAM_FPS,
    ),
    outputWidthPx: TELESCOPE_STREAM_WIDTH_PX,
    outputHeightPx: TELESCOPE_STREAM_HEIGHT_PX,
    quality: parsePositiveInteger(
      process.env.TELESCOPE_STREAM_QUALITY,
      DEFAULT_TELESCOPE_STREAM_QUALITY,
    ),
  };
}
