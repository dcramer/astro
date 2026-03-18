import type {
  IngestExposurePayload,
  IngestSessionPayload,
  LiveApiResponse,
  LiveMode,
  OverlayImage,
  SessionCurrentState,
  SessionLivePreview,
  StoredExposure,
  StoredSession,
} from "./site-types";
import {
  BEST_THUMBNAIL_EXPOSURE_ORDER,
  getBestThumbnailExposure,
} from "./exposure-thumbnails";

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Failed to parse JSON payload from D1", error);
    return null;
  }
}

function asBoolean(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseDelimitedValues(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildAssetUrl(assetKey: string | null | undefined): string | null {
  if (!assetKey) {
    return null;
  }

  return `/api/assets/${assetKey.split("/").map(encodeURIComponent).join("/")}`;
}

function buildThumbnailUrl(exposure: StoredExposure): string | null {
  return buildAssetUrl(exposure.thumbnailKey);
}

const BEST_THUMBNAIL_KEY_SQL = `
      COALESCE(
        exposures.thumbnail_key,
        'sessions/' || exposures.session_key || '/exposures/' || exposures.exposure_id
      )
`;

function toOverlayImage(exposure: StoredExposure): OverlayImage {
  return {
    exposureDurationSeconds: exposure.durationSeconds,
    imageType: "Light",
    filterName: exposure.filterName ?? "—",
    rmsText: exposure.guidingRmsArcSec !== null ? `${exposure.guidingRmsArcSec.toFixed(2)}"` : "—",
    temperatureText:
      exposure.weatherTemperature !== null ? `${exposure.weatherTemperature.toFixed(1)}` : "—",
    cameraName: "",
    gain: 0,
    offset: 0,
    startTime: exposure.startedAt,
    telescopeName: "",
    focalLength: 0,
    stDev: 0,
    mean: 0,
    median: 0,
    detectedStars: exposure.detectedStars,
    hfr: exposure.hfr,
    isBayered: false,
    cameraTemperature: exposure.focuserTemperature,
    exposureId: exposure.exposureId,
    targetName: exposure.targetName,
    thumbnailUrl: buildThumbnailUrl(exposure),
  };
}

function toLivePreviewImage(
  session: StoredSession,
  preview: SessionLivePreview,
): OverlayImage {
  return {
    exposureDurationSeconds: preview.durationSeconds ?? 0,
    imageType: preview.imageType ?? "LIVE_PREVIEW",
    filterName: preview.filterName ?? "—",
    rmsText: "—",
    temperatureText: "—",
    cameraName: "",
    gain: 0,
    offset: 0,
    startTime: preview.capturedAt ?? session.lastSeenAt ?? session.startedAt,
    telescopeName: "",
    focalLength: 0,
    stDev: 0,
    mean: 0,
    median: 0,
    detectedStars: null,
    hfr: preview.hfr ?? null,
    isBayered: false,
    cameraTemperature: null,
    exposureId: `${session.sessionKey}:live-preview`,
    targetName: preview.targetName ?? session.currentState?.currentTarget?.name ?? null,
    thumbnailUrl: buildAssetUrl(preview.assetKey),
  };
}

export function getStaleAfterSeconds(env: SiteRuntimeEnv): number {
  const raw = env.SYNC_STALE_AFTER_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
}

function toSessionFromRow(
  env: SiteRuntimeEnv,
  row: Record<string, unknown> | null,
): StoredSession | null {
  if (!row) {
    return null;
  }

  return toStoredSession(row, isSessionStale(String(row.last_seen_at), getStaleAfterSeconds(env)));
}

function toStoredSession(row: Record<string, unknown>, stale: boolean): StoredSession {
  const latestExposureId = row.latest_valid_exposure_id ? String(row.latest_valid_exposure_id) : null;
  const bestThumbnailExposureId = row.best_thumbnail_exposure_id
    ? String(row.best_thumbnail_exposure_id)
    : null;

  return {
    sessionKey: String(row.session_key),
    displayName: String(row.display_name),
    startedAt: String(row.started_at),
    endedAt: row.ended_at ? String(row.ended_at) : null,
    profileName: row.profile_name ? String(row.profile_name) : null,
    primaryTargetName: row.primary_target_name ? String(row.primary_target_name) : null,
    targetNames: parseDelimitedValues(row.target_names_csv),
    filterNames: parseDelimitedValues(row.filter_names_csv),
    activeSession: asBoolean(row.active_session),
    sessionStatus: row.session_status ? String(row.session_status) : null,
    lastSeenAt: String(row.last_seen_at),
    exposureCount: parseNumber(row.valid_exposure_count) ?? 0,
    totalExposureSeconds: parseNumber(row.valid_total_exposure_seconds) ?? 0,
    latestExposureId,
    heroExposureId: bestThumbnailExposureId ?? latestExposureId,
    heroThumbnailUrl: buildAssetUrl(row.best_thumbnail_key ? String(row.best_thumbnail_key) : null),
    stale,
    currentState: parseJson<SessionCurrentState>(
      row.current_state_payload ? String(row.current_state_payload) : null,
    ),
  };
}

function toStoredExposure(row: Record<string, unknown>): StoredExposure {
  return {
    exposureId: String(row.exposure_id),
    sessionKey: String(row.session_key),
    exposureIndex: parseNumber(row.exposure_index),
    targetName: row.target_name ? String(row.target_name) : null,
    fileName: row.file_name ? String(row.file_name) : null,
    fullPath: row.full_path ? String(row.full_path) : null,
    startedAt: String(row.started_at),
    epochMilliseconds: parseNumber(row.epoch_milliseconds),
    durationSeconds: parseNumber(row.duration_seconds) ?? 0,
    filterName: row.filter_name ? String(row.filter_name) : null,
    detectedStars: parseNumber(row.detected_stars),
    hfr: parseNumber(row.hfr),
    guidingRms: parseNumber(row.guiding_rms),
    guidingRmsArcSec: parseNumber(row.guiding_rms_arcsec),
    guidingRmsRa: parseNumber(row.guiding_rms_ra),
    guidingRmsRaArcSec: parseNumber(row.guiding_rms_ra_arcsec),
    guidingRmsDec: parseNumber(row.guiding_rms_dec),
    guidingRmsDecArcSec: parseNumber(row.guiding_rms_dec_arcsec),
    focuserTemperature: parseNumber(row.focuser_temperature),
    weatherTemperature: parseNumber(row.weather_temperature),
    thumbnailKey: row.thumbnail_key ? String(row.thumbnail_key) : null,
    thumbnailContentType: row.thumbnail_content_type ? String(row.thumbnail_content_type) : null,
  };
}

const SESSION_SELECT = `
  SELECT
    sessions.*,
    (
      SELECT COUNT(*)
      FROM exposures
      WHERE exposures.session_key = sessions.session_key
        AND exposures.detected_stars IS NOT NULL
    ) AS valid_exposure_count,
    (
      SELECT COALESCE(SUM(exposures.duration_seconds), 0)
      FROM exposures
      WHERE exposures.session_key = sessions.session_key
        AND exposures.detected_stars IS NOT NULL
    ) AS valid_total_exposure_seconds,
    (
      SELECT exposures.exposure_id
      FROM exposures
      WHERE exposures.session_key = sessions.session_key
        AND exposures.detected_stars IS NOT NULL
      ORDER BY datetime(exposures.started_at) DESC, exposures.exposure_id DESC
      LIMIT 1
    ) AS latest_valid_exposure_id,
    (
      SELECT exposures.exposure_id
      FROM exposures
      WHERE exposures.session_key = sessions.session_key
        AND exposures.detected_stars IS NOT NULL
      ORDER BY ${BEST_THUMBNAIL_EXPOSURE_ORDER}
      LIMIT 1
    ) AS best_thumbnail_exposure_id,
    (
      SELECT ${BEST_THUMBNAIL_KEY_SQL}
      FROM exposures
      WHERE exposures.session_key = sessions.session_key
        AND exposures.detected_stars IS NOT NULL
      ORDER BY ${BEST_THUMBNAIL_EXPOSURE_ORDER}
      LIMIT 1
    ) AS best_thumbnail_key,
    (
      SELECT target_name
      FROM exposures
      WHERE exposures.session_key = sessions.session_key
        AND exposures.detected_stars IS NOT NULL
        AND exposures.target_name IS NOT NULL
        AND TRIM(exposures.target_name) != ''
      GROUP BY exposures.target_name
      ORDER BY COUNT(*) DESC, MAX(datetime(exposures.started_at)) DESC, exposures.target_name ASC
      LIMIT 1
    ) AS primary_target_name,
    (
      SELECT GROUP_CONCAT(target_name, '||')
      FROM (
        SELECT exposures.target_name AS target_name
        FROM exposures
        WHERE exposures.session_key = sessions.session_key
          AND exposures.detected_stars IS NOT NULL
          AND exposures.target_name IS NOT NULL
          AND TRIM(exposures.target_name) != ''
        GROUP BY exposures.target_name
        ORDER BY COUNT(*) DESC, MAX(datetime(exposures.started_at)) DESC, exposures.target_name ASC
      )
    ) AS target_names_csv,
    (
      SELECT GROUP_CONCAT(filter_name, '||')
      FROM (
        SELECT exposures.filter_name AS filter_name
        FROM exposures
        WHERE exposures.session_key = sessions.session_key
          AND exposures.detected_stars IS NOT NULL
          AND exposures.filter_name IS NOT NULL
          AND TRIM(exposures.filter_name) != ''
        GROUP BY exposures.filter_name
        ORDER BY MAX(datetime(exposures.started_at)) DESC, exposures.filter_name ASC
      )
    ) AS filter_names_csv
  FROM sessions
`;

function isSessionStale(lastSeenAt: string, staleAfterSeconds: number): boolean {
  const lastSeen = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(lastSeen)) {
    return true;
  }

  return Date.now() - lastSeen > staleAfterSeconds * 1000;
}

export async function getLatestLiveSession(env: SiteRuntimeEnv): Promise<StoredSession | null> {
  const activeRow = await env.DB.prepare(
    `
      ${SESSION_SELECT}
      WHERE active_session = 1
      ORDER BY datetime(last_seen_at) DESC, datetime(started_at) DESC
      LIMIT 1
    `,
  ).first<Record<string, unknown>>();

  const activeSession = toSessionFromRow(env, activeRow);
  if (activeSession) {
    return activeSession;
  }

  const archivedRow = await env.DB.prepare(
    `
      ${SESSION_SELECT}
      WHERE EXISTS (
        SELECT 1
        FROM exposures
        WHERE exposures.session_key = sessions.session_key
          AND exposures.detected_stars IS NOT NULL
      )
      ORDER BY active_session DESC, datetime(last_seen_at) DESC, datetime(started_at) DESC
      LIMIT 1
    `,
  ).first<Record<string, unknown>>();

  return toSessionFromRow(env, archivedRow);
}

export async function getRecentSessions(
  env: SiteRuntimeEnv,
  limit = 12,
): Promise<StoredSession[]> {
  const rows = await env.DB.prepare(
    `
      ${SESSION_SELECT}
      WHERE EXISTS (
          SELECT 1
          FROM exposures
          WHERE exposures.session_key = sessions.session_key
            AND exposures.detected_stars IS NOT NULL
        )
      ORDER BY datetime(started_at) DESC
      LIMIT ?
    `,
  )
    .bind(limit)
    .all<Record<string, unknown>>();

  const staleAfterSeconds = getStaleAfterSeconds(env);
  return (rows.results ?? []).map((row) =>
    toStoredSession(row, isSessionStale(String(row.last_seen_at), staleAfterSeconds)),
  );
}

export async function getSessionByKey(
  env: SiteRuntimeEnv,
  sessionKey: string,
): Promise<StoredSession | null> {
  const row = await env.DB.prepare(
    `
      ${SESSION_SELECT}
      WHERE session_key = ?
        AND EXISTS (
          SELECT 1
          FROM exposures
          WHERE exposures.session_key = sessions.session_key
            AND exposures.detected_stars IS NOT NULL
        )
      LIMIT 1
    `,
  )
    .bind(sessionKey)
    .first<Record<string, unknown>>();

  if (!row) {
    return null;
  }

  return toStoredSession(row, isSessionStale(String(row.last_seen_at), getStaleAfterSeconds(env)));
}

export async function getSessionExposures(
  env: SiteRuntimeEnv,
  sessionKey: string,
  limit = 200,
): Promise<StoredExposure[]> {
  const rows = await env.DB.prepare(
    `
      SELECT *
      FROM exposures
      WHERE session_key = ?
        AND detected_stars IS NOT NULL
      ORDER BY datetime(started_at) DESC
      LIMIT ?
    `,
  )
    .bind(sessionKey, limit)
    .all<Record<string, unknown>>();

  return (rows.results ?? []).map(toStoredExposure);
}

export async function getExposureById(
  env: SiteRuntimeEnv,
  exposureId: string,
): Promise<StoredExposure | null> {
  const row = await env.DB.prepare(
    `
      SELECT *
      FROM exposures
      WHERE exposure_id = ?
        AND detected_stars IS NOT NULL
      LIMIT 1
    `,
  )
    .bind(exposureId)
    .first<Record<string, unknown>>();

  return row ? toStoredExposure(row) : null;
}

export async function getLiveApiResponse(env: SiteRuntimeEnv): Promise<LiveApiResponse> {
  const session = await getLatestLiveSession(env);

  if (!session) {
    return {
      session: null,
      images: [],
      advanced: null,
      mount: null,
      weather: null,
      stale: true,
      hasConnected: false,
      liveMode: "empty",
    };
  }

  const exposures = session.sessionKey
    ? await getSessionExposures(env, session.sessionKey, 24)
    : [];
  const exposureImages = exposures.map(toOverlayImage);
  const livePreview = session.currentState?.latestPreview
    ? toLivePreviewImage(session, session.currentState.latestPreview)
    : null;
  const hasExposureThumbnail = exposureImages.some((image) => Boolean(image.thumbnailUrl));
  const hasConnected = Boolean(session.currentState);
  const liveMode: LiveMode = session.activeSession
    ? session.exposureCount > 0
      ? "active-imaging"
      : "active-pending"
    : "recent-archive";

  return {
    session,
    images: livePreview && !hasExposureThumbnail ? [livePreview, ...exposureImages] : exposureImages,
    advanced: session.currentState?.advanced ?? null,
    mount: session.currentState?.mount ?? null,
    weather: session.currentState?.weather ?? null,
    stale: session.stale,
    hasConnected,
    liveMode,
  };
}

function buildSessionUpsert(env: SiteRuntimeEnv, session: IngestSessionPayload) {
  const validExposures = session.exposures.filter((exposure) => exposure.detectedStars !== null);
  const exposureCount = validExposures.length;
  const totalExposureSeconds = validExposures.reduce(
    (total, exposure) => total + (exposure.durationSeconds ?? 0),
    0,
  );
  const latestExposureId =
    [...validExposures]
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]?.exposureId ?? null;
  const heroExposureId = getBestThumbnailExposure(validExposures)?.exposureId ?? latestExposureId;

  return env.DB.prepare(
    `
      INSERT INTO sessions (
        session_key,
        display_name,
        started_at,
        ended_at,
        profile_name,
        active_session,
        session_status,
        last_seen_at,
        current_state_payload,
        latest_exposure_id,
        hero_exposure_id,
        exposure_count,
        total_exposure_seconds,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_key) DO UPDATE SET
        display_name = excluded.display_name,
        started_at = excluded.started_at,
        ended_at = excluded.ended_at,
        profile_name = excluded.profile_name,
        active_session = excluded.active_session,
        session_status = excluded.session_status,
        last_seen_at = excluded.last_seen_at,
        current_state_payload = excluded.current_state_payload,
        latest_exposure_id = COALESCE(excluded.latest_exposure_id, sessions.latest_exposure_id),
        hero_exposure_id = COALESCE(excluded.hero_exposure_id, sessions.hero_exposure_id),
        exposure_count = excluded.exposure_count,
        total_exposure_seconds = excluded.total_exposure_seconds,
        updated_at = excluded.updated_at
    `,
  ).bind(
    session.sessionKey,
    session.displayName,
    session.startedAt,
    session.endedAt,
    session.profileName,
    session.activeSession ? 1 : 0,
    session.sessionStatus,
    session.lastSeenAt,
    session.currentState ? JSON.stringify(session.currentState) : null,
    latestExposureId,
    heroExposureId,
    exposureCount,
    totalExposureSeconds,
    session.lastSeenAt,
  );
}

function buildExposureUpsert(env: SiteRuntimeEnv, sessionKey: string, exposure: IngestExposurePayload) {
  return env.DB.prepare(
    `
      INSERT INTO exposures (
        exposure_id,
        session_key,
        exposure_index,
        target_name,
        file_name,
        full_path,
        started_at,
        epoch_milliseconds,
        duration_seconds,
        filter_name,
        detected_stars,
        hfr,
        guiding_rms,
        guiding_rms_arcsec,
        guiding_rms_ra,
        guiding_rms_ra_arcsec,
        guiding_rms_dec,
        guiding_rms_dec_arcsec,
        focuser_temperature,
        weather_temperature,
        thumbnail_key,
        thumbnail_content_type,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(exposure_id) DO UPDATE SET
        exposure_index = excluded.exposure_index,
        target_name = excluded.target_name,
        file_name = excluded.file_name,
        full_path = excluded.full_path,
        started_at = excluded.started_at,
        epoch_milliseconds = excluded.epoch_milliseconds,
        duration_seconds = excluded.duration_seconds,
        filter_name = excluded.filter_name,
        detected_stars = excluded.detected_stars,
        hfr = excluded.hfr,
        guiding_rms = excluded.guiding_rms,
        guiding_rms_arcsec = excluded.guiding_rms_arcsec,
        guiding_rms_ra = excluded.guiding_rms_ra,
        guiding_rms_ra_arcsec = excluded.guiding_rms_ra_arcsec,
        guiding_rms_dec = excluded.guiding_rms_dec,
        guiding_rms_dec_arcsec = excluded.guiding_rms_dec_arcsec,
        focuser_temperature = excluded.focuser_temperature,
        weather_temperature = excluded.weather_temperature,
        thumbnail_key = COALESCE(excluded.thumbnail_key, exposures.thumbnail_key),
        thumbnail_content_type = COALESCE(excluded.thumbnail_content_type, exposures.thumbnail_content_type),
        updated_at = excluded.updated_at
    `,
  ).bind(
    exposure.exposureId,
    sessionKey,
    exposure.exposureIndex,
    exposure.targetName,
    exposure.fileName,
    exposure.fullPath,
    exposure.startedAt,
    exposure.epochMilliseconds,
    exposure.durationSeconds,
    exposure.filterName,
    exposure.detectedStars,
    exposure.hfr,
    exposure.guidingRms,
    exposure.guidingRmsArcSec,
    exposure.guidingRmsRa,
    exposure.guidingRmsRaArcSec,
    exposure.guidingRmsDec,
    exposure.guidingRmsDecArcSec,
    exposure.focuserTemperature,
    exposure.weatherTemperature,
    exposure.thumbnailKey,
    exposure.thumbnailContentType,
    new Date().toISOString(),
  );
}

export async function upsertSessions(
  env: SiteRuntimeEnv,
  sessions: ReadonlyArray<IngestSessionPayload>,
): Promise<void> {
  if (!sessions.length) {
    return;
  }

  const statements = sessions.flatMap((session) => [
    buildSessionUpsert(env, session),
    ...session.exposures.map((exposure) => buildExposureUpsert(env, session.sessionKey, exposure)),
  ]);

  await env.DB.batch(statements);
}
