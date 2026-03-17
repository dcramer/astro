import "dotenv/config";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  fetchSessionHistory,
  fetchSessionList,
  getNinaAdvancedApiBaseUrl,
  getNinaBaseUrl,
  loadAdvancedStatus,
  loadImageHistory,
  loadMountInfo,
  loadOverlaySession,
  loadWeatherInfo,
} from "../lib/nina";
import type { NinaImageRecord, NinaSessionHistory, NinaSessionSummary } from "../lib/nina/session";
import { extractTargetWithCoordinates } from "../components/overlay/target-extractor";
import { findCurrentImagingTarget } from "../components/overlay/utils";
import { signMessage } from "../lib/hmac";
import { getLocalSyncHmacSecret, getSyncApiBaseUrl } from "../lib/site-config";
import { normalizeTimestamp } from "../lib/time";
import type {
  CurrentTargetSnapshot,
  IngestExposurePayload,
  IngestSessionPayload,
  IngestStatePayload,
  SessionCurrentState,
} from "../lib/site-types";
import {
  buildLivePreview,
  createSessionViewerExposureAsset,
  type GeneratedAsset,
} from "./assets";

interface SyncState {
  readonly version: number;
  readonly syncTarget: string | null;
  readonly knownSessions: ReadonlyArray<string>;
  readonly uploadedThumbnailKeys: ReadonlyArray<string>;
  readonly lastActiveSessionKey: string | null;
  readonly lastLivePreviewSignature: string | null;
}

interface ThumbnailAssetPayload {
  readonly bodyBase64: string;
  readonly contentType: string;
}

interface AssetUploadSummary {
  readonly state: SyncState;
  readonly uploadedExposureAssets: number;
  readonly skippedExposureAssets: number;
}

interface SyncRunResult {
  readonly state: SyncState;
  readonly summary: string;
}

function getLatestTimestamp(values: ReadonlyArray<string | null | undefined>): string | null {
  let latest: string | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) {
      continue;
    }

    const normalized = normalizeTimestamp(value);
    if (!normalized) {
      continue;
    }

    const timestamp = new Date(normalized).getTime();
    if (!Number.isFinite(timestamp)) {
      continue;
    }

    if (timestamp > latestMs) {
      latestMs = timestamp;
      latest = normalized;
    }
  }

  return latest;
}

function buildLivePreviewSignature(assetKey: string, bodyBase64: string): string {
  return `${assetKey}:${createHash("sha1").update(bodyBase64).digest("hex")}`;
}

const DEFAULT_SYNC_INTERVAL_MS = 30_000;
const SYNC_STATE_FILE = process.env.SYNC_STATE_FILE?.trim() || path.resolve(".local/sync-state.json");

function normalizeSyncTarget(url: string): string {
  return url.replace(/\/+$/, "");
}

function getSyncIntervalMs(): number {
  const raw = process.env.SYNC_INTERVAL_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 5_000 ? parsed : DEFAULT_SYNC_INTERVAL_MS;
}

async function loadState(): Promise<SyncState> {
  try {
    const raw = await readFile(SYNC_STATE_FILE, "utf8");
    const parsed = JSON.parse(raw) as SyncState;
    return {
      version: 1,
      syncTarget: parsed.syncTarget ?? null,
      knownSessions: parsed.knownSessions ?? [],
      uploadedThumbnailKeys: parsed.uploadedThumbnailKeys ?? [],
      lastActiveSessionKey: parsed.lastActiveSessionKey ?? null,
      lastLivePreviewSignature: parsed.lastLivePreviewSignature ?? null,
    };
  } catch {
    return {
      version: 1,
      syncTarget: null,
      knownSessions: [],
      uploadedThumbnailKeys: [],
      lastActiveSessionKey: null,
      lastLivePreviewSignature: null,
    };
  }
}

async function saveState(state: SyncState): Promise<void> {
  await mkdir(path.dirname(SYNC_STATE_FILE), { recursive: true });
  await writeFile(SYNC_STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function signedJsonFetch(
  url: string,
  secret: string,
  payload: unknown,
): Promise<Response> {
  const rawBody = JSON.stringify(payload);
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const signature = await signMessage(secret, `${timestamp}.${rawBody}`);

  return fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-astro-timestamp": timestamp,
      "x-astro-signature": signature,
    },
    body: rawBody,
  });
}

function deriveCurrentTarget(
  currentState: Pick<SessionCurrentState, "advanced" | "mount">,
): CurrentTargetSnapshot | null {
  const extracted = extractTargetWithCoordinates(currentState.advanced?.sequence ?? null);
  if (extracted?.name) {
    return extracted;
  }

  const sequenceTarget = findCurrentImagingTarget(currentState.advanced?.sequence ?? null);
  if (sequenceTarget) {
    return {
      name: sequenceTarget,
      ra: currentState.mount?.rightAscensionDegrees ?? undefined,
      dec: currentState.mount?.declinationDegrees ?? undefined,
      source: "sequence",
    };
  }

  if (
    currentState.mount?.rightAscensionDegrees !== null &&
    currentState.mount?.rightAscensionDegrees !== undefined &&
    currentState.mount?.declinationDegrees !== null &&
    currentState.mount?.declinationDegrees !== undefined
  ) {
    return {
      name: "Current pointing",
      ra: currentState.mount.rightAscensionDegrees,
      dec: currentState.mount.declinationDegrees,
      source: "mount",
    };
  }

  return null;
}

function buildExposurePayload(
  sessionKey: string,
  targetName: string,
  record: NinaImageRecord,
): IngestExposurePayload {
  const exposureId = record.id || `${sessionKey}:${record.index}`;
  return {
    exposureId,
    exposureIndex: record.index ?? null,
    targetName,
    fileName: record.fileName ?? null,
    fullPath: record.fullPath ?? null,
    startedAt: normalizeTimestamp(record.started) ?? record.started,
    epochMilliseconds: record.epochMilliseconds ?? null,
    durationSeconds: record.duration ?? 0,
    filterName: record.filterName ?? null,
    detectedStars: record.detectedStars ?? null,
    hfr: record.HFR ?? null,
    guidingRms: record.GuidingRMS ?? null,
    guidingRmsArcSec: record.GuidingRMSArcSec ?? null,
    guidingRmsRa: record.GuidingRMSRA ?? null,
    guidingRmsRaArcSec: record.GuidingRMSRAArcSec ?? null,
    guidingRmsDec: record.GuidingRMSDEC ?? null,
    guidingRmsDecArcSec: record.GuidingRMSDECArcSec ?? null,
    focuserTemperature: record.FocuserTemperature ?? null,
    weatherTemperature: record.WeatherTemperature ?? null,
    thumbnailKey: `sessions/${sessionKey}/exposures/${exposureId}`,
    thumbnailContentType: null,
  };
}

function getLatestExposureStartedAt(
  exposures: ReadonlyArray<IngestExposurePayload>,
  options?: { requireDetectedStars?: boolean },
): string | null {
  const candidates = options?.requireDetectedStars
    ? exposures.filter((exposure) => exposure.detectedStars !== null)
    : exposures;

  return getLatestTimestamp(candidates.map((exposure) => exposure.startedAt));
}

function getSessionLastSeenAt(input: {
  history: NinaSessionHistory;
  exposures: ReadonlyArray<IngestExposurePayload>;
  syncedAt: string;
  currentState: SessionCurrentState | null;
}): string {
  const latestValidExposureStartedAt = getLatestExposureStartedAt(input.exposures, {
    requireDetectedStars: true,
  });
  const latestPreviewCapturedAt = input.currentState?.latestPreview?.capturedAt ?? null;
  const latestRecordedActivityAt = getLatestTimestamp([
    latestValidExposureStartedAt,
    latestPreviewCapturedAt,
  ]);

  if (
    input.currentState?.advanced?.sequence?.isRunning ||
    input.currentState?.advanced?.camera?.isExposing
  ) {
    return input.syncedAt;
  }

  return latestRecordedActivityAt ?? normalizeTimestamp(input.history.startTime) ?? input.syncedAt;
}

function buildSessionPayload(
  summary: NinaSessionSummary,
  history: NinaSessionHistory,
  syncedAt: string,
  currentState: SessionCurrentState | null,
): IngestSessionPayload {
  const exposures =
    history.targets?.flatMap((target) =>
      (target.imageRecords ?? []).map((record) =>
        buildExposurePayload(
          summary.key,
          target.name,
          record,
        ),
      ),
    ) ?? [];

  const latestExposureStartedAt = getLatestExposureStartedAt(exposures);
  const lastSeenAt = getSessionLastSeenAt({
    history,
    exposures,
    syncedAt,
    currentState,
  });

  return {
    sessionKey: summary.key,
    displayName: summary.display,
    startedAt: normalizeTimestamp(history.startTime) ?? history.startTime,
    endedAt: history.activeSession ? null : latestExposureStartedAt,
    profileName: history.profileName,
    activeSession: history.activeSession,
    sessionStatus: history.activeSession ? "running" : "completed",
    lastSeenAt,
    currentState,
    exposures,
  };
}

function getCandidateSessionKeys(
  summaries: ReadonlyArray<NinaSessionSummary>,
  state: SyncState,
  activeSessionKey: string | null,
): string[] {
  const ordered = [...summaries].sort((left, right) => left.key.localeCompare(right.key));
  const recentKeys = ordered.slice(-3).map((summary) => summary.key);
  const unsyncedKeys = ordered
    .filter((summary) => !state.knownSessions.includes(summary.key))
    .map((summary) => summary.key);

  const combined = new Set<string>([
    ...recentKeys,
    ...unsyncedKeys,
    ...(activeSessionKey ? [activeSessionKey] : []),
    ...(state.lastActiveSessionKey ? [state.lastActiveSessionKey] : []),
  ]);

  return Array.from(combined);
}

function detectImageContentType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }

  if (
    bytes.length >= 4 &&
    (
      (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)
    )
  ) {
    return "image/tiff";
  }

  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    (
      (bytes[8] === 0x61 && bytes[9] === 0x76 && bytes[10] === 0x69 && bytes[11] === 0x66) ||
      (bytes[8] === 0x68 && bytes[9] === 0x65 && bytes[10] === 0x69 && bytes[11] === 0x63) ||
      (bytes[8] === 0x68 && bytes[9] === 0x65 && bytes[10] === 0x69 && bytes[11] === 0x66)
    )
  ) {
    return "image/avif";
  }

  return null;
}

function describeLeadingBytes(bytes: Uint8Array, length = 16): string {
  return Array.from(bytes.slice(0, length))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join(" ");
}

async function fetchThumbnailAsset(
  sessionBaseUrl: string,
  sessionKey: string,
  sessionHistory: NinaSessionHistory,
  exposure: IngestExposurePayload,
): Promise<ThumbnailAssetPayload | null> {
  const generated = await createSessionViewerExposureAsset({
    sessionBaseUrl,
    sessionKey,
    exposureId: exposure.exposureId,
    fullPath: exposure.fullPath,
    stretchOptions: sessionHistory.stretchOptions,
  });
  if (generated.asset) {
    return generated.asset;
  }

  if (generated.reason) {
    console.warn(`[sync] ${generated.reason}`);
  }
  return null;
}

async function fetchPreparedPreviewAsset(): Promise<GeneratedAsset | null> {
  const advancedBaseUrl = getNinaAdvancedApiBaseUrl();
  if (!advancedBaseUrl) {
    return null;
  }

  const response = await fetch(
    `${advancedBaseUrl}/v2/api/prepared-image?resize=true&size=960x720&quality=82`,
    {
      headers: {
        Accept: "image/*",
      },
    },
  );

  if (!response.ok) {
    console.warn(
      `[sync] prepared-image fetch failed: ${response.status} ${response.statusText}`,
    );
    return null;
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) {
    console.warn("[sync] prepared-image response was empty");
    return null;
  }

  const headerContentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? null;
  const contentType =
    (headerContentType?.startsWith("image/") ? headerContentType : null) ??
    detectImageContentType(bytes);

  if (!contentType) {
    console.warn(
      `[sync] prepared-image response was not a recognized image (content-type ${headerContentType ?? "<missing>"}, first-bytes ${describeLeadingBytes(bytes)})`,
    );
    return null;
  }

  return {
    bodyBase64: Buffer.from(bytes).toString("base64"),
    contentType,
  };
}

async function uploadAsset(
  syncApiBaseUrl: string,
  secret: string,
  payload: {
    assetKey: string;
    contentType: string;
    bodyBase64: string;
    exposureId?: string | null;
  },
): Promise<void> {
  const response = await signedJsonFetch(
    `${syncApiBaseUrl}/api/ingest/assets`,
    secret,
    payload,
  );

  if (!response.ok) {
    throw new Error(`Asset upload failed for ${payload.assetKey}: ${response.status}`);
  }
}

async function uploadMissingAssets(
  sessionBaseUrl: string,
  syncApiBaseUrl: string,
  secret: string,
  sessions: ReadonlyArray<IngestSessionPayload>,
  sessionHistories: ReadonlyMap<string, NinaSessionHistory>,
  state: SyncState,
): Promise<AssetUploadSummary> {
  const uploaded = new Set(state.uploadedThumbnailKeys);
  let uploadedExposureAssets = 0;
  let skippedExposureAssets = 0;

  for (const session of sessions) {
    for (const exposure of session.exposures) {
      if (exposure.detectedStars === null) {
        continue;
      }

      if (!exposure.thumbnailKey || uploaded.has(exposure.thumbnailKey)) {
        continue;
      }

      const sessionHistory = sessionHistories.get(session.sessionKey);
      if (!sessionHistory) {
        console.warn(`[sync] missing session history for ${session.sessionKey}; cannot create rendered image`);
        skippedExposureAssets += 1;
        continue;
      }

      const asset = await fetchThumbnailAsset(sessionBaseUrl, session.sessionKey, sessionHistory, exposure);
      if (!asset) {
        skippedExposureAssets += 1;
        continue;
      }

      await uploadAsset(syncApiBaseUrl, secret, {
        exposureId: exposure.exposureId,
        assetKey: exposure.thumbnailKey,
        contentType: asset.contentType,
        bodyBase64: asset.bodyBase64,
      });

      uploaded.add(exposure.thumbnailKey);
      uploadedExposureAssets += 1;
    }
  }

  return {
    state: {
      ...state,
      uploadedThumbnailKeys: Array.from(uploaded),
    },
    uploadedExposureAssets,
    skippedExposureAssets,
  };
}

async function syncOnce(previousState: SyncState): Promise<SyncRunResult> {
  const syncApiBaseUrl = getSyncApiBaseUrl();
  const syncTarget = normalizeSyncTarget(syncApiBaseUrl);
  const secret = getLocalSyncHmacSecret();
  const ninaBaseUrl = getNinaBaseUrl();
  if (!ninaBaseUrl) {
    throw new Error("Invalid NINA session base URL.");
  }
  const syncedAt = new Date().toISOString();
  const scopedState =
    previousState.syncTarget === syncTarget
      ? previousState
      : {
          version: 1,
          syncTarget,
          knownSessions: [],
          uploadedThumbnailKeys: [],
          lastActiveSessionKey: null,
          lastLivePreviewSignature: null,
        };

  const [sessionList, overlaySession, advancedStatus, imageHistory, mountInfo, weatherInfo] = await Promise.all([
    fetchSessionList(ninaBaseUrl),
    loadOverlaySession(),
    loadAdvancedStatus(),
    loadImageHistory(),
    loadMountInfo(),
    loadWeatherInfo(),
  ]);

  const summaries = sessionList?.sessions ?? [];
  if (!summaries.length) {
    return {
      state: scopedState,
      summary: "no sessions found",
    };
  }

  const activeSessionKey = overlaySession?.summary.key ?? null;
  const summaryMap = new Map(summaries.map((summary) => [summary.key, summary]));
  const sessionKeys = getCandidateSessionKeys(summaries, scopedState, activeSessionKey);
  const latestImage = imageHistory[0] ?? null;
  const livePreviewAsset = activeSessionKey ? await fetchPreparedPreviewAsset() : null;
  const livePreview = activeSessionKey && livePreviewAsset
    ? buildLivePreview(activeSessionKey, latestImage, livePreviewAsset)
    : null;
  const livePreviewSignature =
    livePreview && livePreviewAsset
      ? buildLivePreviewSignature(livePreview.assetKey, livePreviewAsset.bodyBase64)
      : null;
  const sessionHistories = new Map<string, NinaSessionHistory>();

  const sessions: IngestSessionPayload[] = [];
  for (const sessionKey of sessionKeys) {
    const summary = summaryMap.get(sessionKey);
    if (!summary) {
      continue;
    }

    const history = await fetchSessionHistory(ninaBaseUrl, sessionKey);
    if (!history) {
      continue;
    }
    sessionHistories.set(sessionKey, history);

    const currentState: SessionCurrentState | null =
      sessionKey === activeSessionKey
        ? {
            syncedAt,
            advanced: advancedStatus,
            mount: mountInfo,
            weather: weatherInfo,
            currentTarget: deriveCurrentTarget({ advanced: advancedStatus, mount: mountInfo }),
            latestPreview: livePreview,
          }
        : null;

    sessions.push(
      buildSessionPayload(
        summary,
        history,
        syncedAt,
        currentState,
      ),
    );
  }

  if (!sessions.length) {
    return {
      state: scopedState,
      summary: "no session payloads were built",
    };
  }

  const payload: IngestStatePayload = {
    syncedAt,
    sessions,
  };

  const shouldUploadLivePreview =
    Boolean(livePreview && livePreviewAsset) &&
    livePreviewSignature !== scopedState.lastLivePreviewSignature;

  if (livePreview && livePreviewAsset && shouldUploadLivePreview) {
    await uploadAsset(syncApiBaseUrl, secret, {
      assetKey: livePreview.assetKey,
      contentType: livePreviewAsset.contentType,
      bodyBase64: livePreviewAsset.bodyBase64,
    });
  }

  const stateResponse = await signedJsonFetch(`${syncApiBaseUrl}/api/ingest/state`, secret, payload);
  if (!stateResponse.ok) {
    throw new Error(`State ingest failed with status ${stateResponse.status}`);
  }

  const assetSummary = await uploadMissingAssets(ninaBaseUrl, syncApiBaseUrl, secret, sessions, sessionHistories, {
    version: 1,
    syncTarget,
    knownSessions: Array.from(new Set([...scopedState.knownSessions, ...sessions.map((session) => session.sessionKey)])),
    uploadedThumbnailKeys: scopedState.uploadedThumbnailKeys,
    lastActiveSessionKey: activeSessionKey,
    lastLivePreviewSignature:
      livePreview && livePreviewAsset
        ? livePreviewSignature
        : null,
  });

  const validExposureCount = sessions.reduce(
    (total, session) => total + session.exposures.filter((exposure) => exposure.detectedStars !== null).length,
    0,
  );
  const activeSessionValidExposureCount =
    activeSessionKey
      ? sessions
          .find((session) => session.sessionKey === activeSessionKey)
          ?.exposures.filter((exposure) => exposure.detectedStars !== null).length ?? 0
      : 0;
  const summaryParts = [
    `${sessions.length} sessions`,
    `${validExposureCount} valid exposures`,
    `${assetSummary.uploadedExposureAssets} exposure thumbnails uploaded`,
  ];

  if (assetSummary.skippedExposureAssets > 0) {
    summaryParts.push(`${assetSummary.skippedExposureAssets} exposure thumbnails still missing`);
  }

  if (livePreview && shouldUploadLivePreview) {
    summaryParts.push("live preview uploaded");
  } else if (livePreview) {
    summaryParts.push("live preview unchanged");
  } else if (activeSessionKey) {
    summaryParts.push("no live preview available");
  }

  if (activeSessionKey && activeSessionValidExposureCount === 0) {
    summaryParts.push("active session has no valid archived subs yet");
  }

  return {
    state: assetSummary.state,
    summary: [
      ...(previousState.syncTarget && previousState.syncTarget !== syncTarget
        ? [`sync target changed to ${syncTarget}; state reset`]
        : []),
      summaryParts.join(", "),
    ].join(", "),
  };
}

async function main() {
  const intervalMs = getSyncIntervalMs();
  let state = await loadState();
  let running = false;

  async function tick() {
    if (running) {
      console.warn("Previous sync still running; skipping overlap.");
      return;
    }

    running = true;
    try {
      const result = await syncOnce(state);
      state = result.state;
      await saveState(state);
      console.info(`[sync] success at ${new Date().toISOString()} (${result.summary})`);
    } catch (error) {
      console.error("[sync] failed", error);
    } finally {
      running = false;
    }
  }

  await tick();
  setInterval(() => {
    void tick();
  }, intervalMs);
}

void main();
