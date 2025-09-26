import type {
  AdvancedCameraSnapshot,
  AdvancedSequenceSnapshot,
  NinaImageHistoryEntry,
  NinaMountInfo,
  NinaSequenceItem,
  NinaWeatherInfo,
} from "@nina/advanced";
import { formatDuration } from "@nina/format";

export interface ExposureProgress {
  percent: number;
  remainingSeconds?: number | null;
  totalSeconds?: number | null;
  elapsedSeconds?: number | null;
}

function mapCameraState(state: number | null | undefined): string | null {
  if (state === undefined || state === null) {
    return null;
  }

  switch (state) {
    case -1:
      return "Idle";
    case 0:
      return "Waiting";
    case 1:
      return "Exposing";
    case 2:
      return "Reading";
    case 3:
      return "Downloading";
    case 4:
      return "Camera Busy";
    case 5:
      return "Camera Error";
    default:
      return null;
  }
}

export function formatCameraStatus(
  camera: AdvancedCameraSnapshot,
  now: number,
  progress?: ExposureProgress | null,
): string {
  if (camera.isExposing) {
    if (
      progress &&
      progress.remainingSeconds !== null &&
      progress.remainingSeconds !== undefined
    ) {
      return "Exposing";
    }

    if (camera.exposureEndTime) {
      const endsAtMs = new Date(camera.exposureEndTime).getTime();
      if (Number.isFinite(endsAtMs)) {
        const remainingSeconds = Math.round((endsAtMs - now) / 1000);
        if (remainingSeconds > 0) {
          return `Exposing (${formatDuration(remainingSeconds)} left)`;
        }
      }
    }
    return "Exposing";
  }

  const stateLabel = mapCameraState(camera.cameraState);
  if (stateLabel === "Downloading" && camera.lastDownloadTimeSeconds) {
    return `Downloading (${formatDuration(camera.lastDownloadTimeSeconds)} last)`;
  }

  return stateLabel ?? "Idle";
}

export function pickFriendlySequenceName(path: ReadonlyArray<string> | undefined) {
  if (!path?.length) {
    return null;
  }

  for (let idx = path.length - 1; idx >= 0; idx -= 1) {
    const segment = path[idx];
    if (!segment.toLowerCase().endsWith("_container")) {
      return segment;
    }
  }

  return path[path.length - 1];
}

export function formatSequenceStatus(sequence: AdvancedSequenceSnapshot): string {
  if (!sequence.isRunning) {
    return "Idle";
  }

  const friendly = pickFriendlySequenceName(sequence.runningPath);
  if (friendly) {
    return friendly;
  }

  if (sequence.runningItemName) {
    return sequence.runningItemName;
  }

  return "Running";
}

export function normalizeSequenceBreadcrumbEntry(name: string | null | undefined) {
  if (!name) {
    return null;
  }

  let normalized = name.trim();
  if (!normalized) {
    return null;
  }

  normalized = normalized.replace(/[_]+/g, " ").replace(/\s+/g, " ");

  const ignoredSegments = [
    "container",
    "targets container",
    "template by reference",
  ];

  while (ignoredSegments.some((segment) => normalized.toLowerCase().endsWith(segment))) {
    for (const segment of ignoredSegments) {
      if (normalized.toLowerCase().endsWith(segment)) {
        normalized = normalized.slice(0, normalized.length - segment.length).trim();
      }
    }
  }

  return normalized.trim();
}

export function computeExposureProgress(
  camera: AdvancedCameraSnapshot,
  now: number,
  fallbackDuration: number | null,
  knownRemainingSeconds: number | null,
  initialRemainingSeconds: number | null,
): ExposureProgress | null {
  if (!camera.isExposing) {
    return null;
  }

  let total = camera.exposureDurationSeconds ?? null;
  const elapsedFromCamera = camera.elapsedExposureSeconds ?? null;
  let remainingSeconds = knownRemainingSeconds;

  let elapsedSeconds: number | null = null;
  if (remainingSeconds !== null && total !== null) {
    elapsedSeconds = Math.max(0, Math.min(total, total - remainingSeconds));
  } else if (elapsedFromCamera !== null) {
    elapsedSeconds = elapsedFromCamera;
  }

  if ((total === null || total <= 0) && elapsedFromCamera !== null && remainingSeconds !== null) {
    total = Math.max(remainingSeconds + elapsedFromCamera, 0);
  }

  if ((total === null || total <= 0) && elapsedFromCamera !== null && remainingSeconds === null) {
    total = Math.max(elapsedFromCamera, 0);
  }

  if ((total === null || total <= 0) && camera.lastExposureDurationSeconds) {
    total = camera.lastExposureDurationSeconds;
  }

  if ((total === null || total <= 0) && fallbackDuration) {
    total = fallbackDuration;
  }

  if ((total === null || total <= 0) && initialRemainingSeconds) {
    total = initialRemainingSeconds;
  }

  if (elapsedSeconds === null && total !== null && remainingSeconds !== null) {
    elapsedSeconds = Math.max(0, Math.min(total, total - remainingSeconds));
  }

  if (remainingSeconds === null && total !== null && elapsedSeconds !== null) {
    remainingSeconds = Math.max(0, Math.round(total - elapsedSeconds));
  }

  if (camera.isExposing && total !== null && total > 0) {
    if (elapsedSeconds === null) {
      elapsedSeconds = Math.max(0, elapsedFromCamera ?? 0);
    }
    if (remainingSeconds === null) {
      remainingSeconds = Math.max(0, Math.round(total - (elapsedSeconds ?? 0)));
    }
  }

  const percent =
    total && total > 0 && elapsedSeconds !== null
      ? Math.min(1, Math.max(0, elapsedSeconds / total))
      : null;

  if (percent === null) {
    return null;
  }

  return {
    percent,
    remainingSeconds,
    totalSeconds: total,
    elapsedSeconds,
  };
}

export function getRemainingSeconds(
  camera: AdvancedCameraSnapshot | null,
  now: number,
): number | null {
  if (!camera?.isExposing || !camera.exposureEndTime) {
    return null;
  }

  const endMs = new Date(camera.exposureEndTime).getTime();
  if (!Number.isFinite(endMs)) {
    return null;
  }

  return Math.max(0, Math.round((endMs - now) / 1000));
}

export function findSequenceItemByPath(
  items: ReadonlyArray<NinaSequenceItem> | undefined,
  path: ReadonlyArray<string> | null | undefined,
): NinaSequenceItem | null {
  if (!items || !path || !path.length) {
    return null;
  }

  let currentItems: ReadonlyArray<NinaSequenceItem> | undefined = items;
  let currentItem: NinaSequenceItem | null = null;

  for (const segment of path) {
    if (!currentItems) {
      return null;
    }
    currentItem = currentItems.find((item) => item.name === segment) ?? null;
    if (!currentItem) {
      return null;
    }
    currentItems = currentItem.items;
  }

  return currentItem;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function toPositiveNumber(value: number | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getMetadataNumber(
  metadata: Readonly<Record<string, unknown>> | undefined,
  keys: ReadonlyArray<string>,
): number | null {
  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const candidate = coerceNumber(metadata[key]);
    if (candidate !== null) {
      return candidate;
    }
  }

  return null;
}

export function formatSequenceProgressSuffix(item: NinaSequenceItem | null): string | null {
  if (!item) {
    return null;
  }

  const iterationsTotal =
    toPositiveNumber(item.iterations ?? null) ||
    toPositiveNumber(getMetadataNumber(item.metadata, ["Iterations", "IterationCount"]));
  const iterationsCurrent =
    toPositiveNumber(item.currentIteration ?? null) ||
    toPositiveNumber(getMetadataNumber(item.metadata, ["CurrentIteration", "Iteration"]));

  const exposuresTotal =
    toPositiveNumber(item.exposureCount ?? null) ||
    toPositiveNumber(
      getMetadataNumber(item.metadata, ["ExposureCount", "TargetExposureCount", "RepeatFor"]),
    );
  const exposuresCurrent =
    toPositiveNumber(item.currentExposure ?? null) ||
    toPositiveNumber(
      getMetadataNumber(item.metadata, ["CurrentExposure", "ExposureIteration", "ExposureIndex"]),
    );

  const parts: string[] = [];

  if (iterationsTotal) {
    const current = iterationsCurrent ?? 0;
    parts.push(`${current}/${iterationsTotal}`);
  }

  if (exposuresTotal) {
    const current = exposuresCurrent ?? 0;
    parts.push(`${current}/${exposuresTotal}`);
  }

  if (!parts.length) {
    return null;
  }

  const label = parts.join(" · ");
  return ` (${label})`;
}

export interface ImageHistorySummary {
  readonly latestImage: NinaImageHistoryEntry | null;
  readonly totalImages: number;
  readonly totalIntegrationSeconds: number;
  readonly filterBreakdown: ReadonlyArray<{
    filter: string;
    count: number;
    totalDurationSeconds: number;
  }>;
}

function normalizeString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatHourAngle(hours: number | null | undefined): string | null {
  if (hours === undefined || hours === null || !Number.isFinite(hours)) {
    return null;
  }

  let totalSeconds = Math.round((((hours % 24) + 24) % 24) * 3600);

  let hh = Math.floor(totalSeconds / 3600);
  totalSeconds -= hh * 3600;
  let mm = Math.floor(totalSeconds / 60);
  totalSeconds -= mm * 60;
  let ss = totalSeconds;

  if (ss === 60) {
    ss = 0;
    mm += 1;
  }
  if (mm === 60) {
    mm = 0;
    hh = (hh + 1) % 24;
  }

  const hhString = hh.toString().padStart(2, "0");
  const mmString = mm.toString().padStart(2, "0");
  const ssString = ss.toString().padStart(2, "0");
  return `${hhString}h${mmString}m${ssString}s`;
}

function formatHourAngleFromDegrees(degrees: number | null | undefined): string | null {
  if (degrees === undefined || degrees === null || !Number.isFinite(degrees)) {
    return null;
  }
  const normalized = ((degrees % 360) + 360) % 360;
  return formatHourAngle(normalized / 15);
}

function formatDms(
  value: number | null | undefined,
  { signed, wrap360 = false }: { signed: boolean; wrap360?: boolean },
): string | null {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }

  let numeric = value;
  if (!signed && wrap360) {
    numeric = ((numeric % 360) + 360) % 360;
  }

  let working = Math.abs(numeric);
  let degrees = Math.floor(working);
  working = (working - degrees) * 60;
  let minutes = Math.floor(working);
  let seconds = Math.round((working - minutes) * 60);

  if (seconds === 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes === 60) {
    minutes = 0;
    degrees += 1;
  }

  const sign = numeric < 0 ? "-" : signed ? "+" : "";
  return `${sign}${degrees}°${minutes.toString().padStart(2, "0")}′${seconds
    .toString()
    .padStart(2, "0")}″`;
}


export function formatMountPointing(mount: NinaMountInfo | null): string {
  if (!mount) {
    return "—";
  }

  const raLabel = (() => {
    const explicit = normalizeString(mount.rightAscensionString);
    if (explicit) {
      return explicit.startsWith("RA") ? explicit : `RA ${explicit}`;
    }

    const hours = formatHourAngle(mount.rightAscensionHours);
    if (hours) {
      return `RA ${hours}`;
    }

    const hoursFromDegrees = formatHourAngleFromDegrees(mount.rightAscensionDegrees);
    if (hoursFromDegrees) {
      return `RA ${hoursFromDegrees}`;
    }

    return null;
  })();

  const decLabel = (() => {
    const explicit = normalizeString(mount.declinationString);
    if (explicit) {
      return explicit.startsWith("Dec") ? explicit : `Dec ${explicit}`;
    }

    const dms = formatDms(mount.declinationDegrees, { signed: true });
    if (dms) {
      return `Dec ${dms}`;
    }

    return null;
  })();

  if (raLabel && decLabel) {
    return `${raLabel} · ${decLabel}`;
  }

  const altLabel = (() => {
    const explicit = normalizeString(mount.altitudeString);
    if (explicit) {
      return explicit.startsWith("Alt") ? explicit : `Alt ${explicit}`;
    }

    const formatted = formatDms(mount.altitudeDegrees, { signed: true });
    if (formatted) {
      return `Alt ${formatted}`;
    }

    return null;
  })();

  const azLabel = (() => {
    const explicit = normalizeString(mount.azimuthString);
    if (explicit) {
      return explicit.startsWith("Az") ? explicit : `Az ${explicit}`;
    }

    const formatted = formatDms(mount.azimuthDegrees, { signed: false, wrap360: true });
    if (formatted) {
      return `Az ${formatted}`;
    }

    return null;
  })();

  if (altLabel && azLabel) {
    return `${altLabel} · ${azLabel}`;
  }

  if (raLabel) {
    return raLabel;
  }
  if (decLabel) {
    return decLabel;
  }
  if (altLabel) {
    return altLabel;
  }
  if (azLabel) {
    return azLabel;
  }

  return "—";
}

export function formatMountDisplay(
  mount: NinaMountInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (!mount) {
    return "—";
  }

  const pointing = formatMountPointing(mount);
  return pointing;
}

export function formatSkyQuality(
  weather: NinaWeatherInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (!weather) {
    return "—";
  }

  const skyQualityRaw = normalizeString(weather.skyQuality);
  if (skyQualityRaw) {
    const numeric = Number.parseFloat(skyQualityRaw);
    if (Number.isFinite(numeric)) {
      return numeric.toFixed(1);
    }

    if (skyQualityRaw.toLowerCase() === "nan") {
      return "—";
    }

    return skyQualityRaw;
  }

  return "—";
}

export function summarizeImageHistory(
  entries: ReadonlyArray<NinaImageHistoryEntry>,
): ImageHistorySummary {
  if (!entries.length) {
    return {
      latestImage: null,
      totalImages: 0,
      totalIntegrationSeconds: 0,
      filterBreakdown: [],
    };
  }

  const sorted = [...entries].sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeB - timeA;
  });

  const filters = new Map<string, { filter: string; count: number; totalDurationSeconds: number }>();
  let totalIntegrationSeconds = 0;

  sorted.forEach((entry) => {
    const filterKey = entry.filterName?.trim() || "Unfiltered";
    const duration = entry.exposureDurationSeconds ?? 0;

    const existing = filters.get(filterKey) ?? {
      filter: filterKey,
      count: 0,
      totalDurationSeconds: 0,
    };

    existing.count += 1;
    existing.totalDurationSeconds += duration;
    filters.set(filterKey, existing);

    totalIntegrationSeconds += duration;
  });

  return {
    latestImage: sorted[0] ?? null,
    totalImages: sorted.length,
    totalIntegrationSeconds,
    filterBreakdown: Array.from(filters.values()).sort((a, b) =>
      a.filter.localeCompare(b.filter),
    ),
  };
}
export function formatAmbientTemperature(
  weather: NinaWeatherInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (!weather || weather.temperatureCelsius === undefined || weather.temperatureCelsius === null) {
    return "—";
  }

  return `${weather.temperatureCelsius.toFixed(1)}°C`;
}

export function formatHumidity(
  weather: NinaWeatherInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (weather?.humidityPercent === undefined || weather.humidityPercent === null) {
    return "—";
  }

  return `${Math.round(weather.humidityPercent)}%`;
}
