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

function isTargetContainer(item: NinaSequenceItem): boolean {
  return item.name === "Targets_Container" || item.name === "Targets Container";
}

function extractTargetName(itemName: string): string | null {
  if (!itemName) return null;

  // Remove "_Container" suffix if present
  const cleaned = itemName.replace(/_Container$/i, "").replace(/ Container$/i, "").trim();

  // Don't return generic container names
  if (cleaned.toLowerCase() === "targets" || cleaned.toLowerCase() === "target") {
    return null;
  }

  return cleaned;
}

function findTargetsInContainer(container: NinaSequenceItem): string[] {
  const targets: string[] = [];

  if (!container.items) return targets;

  for (const item of container.items) {
    const targetName = extractTargetName(item.name);
    if (targetName) {
      targets.push(targetName);
    }
  }

  return targets;
}

export function findCurrentImagingTarget(
  sequenceData: AdvancedSequenceSnapshot | null,
): string | null {
  if (!sequenceData?.items) {
    return null;
  }

  // First, try to find the target from the current breadcrumb path
  if (sequenceData.breadcrumb?.length) {
    // Check if we're currently inside a Targets_Container
    let insideTargetsContainer = false;
    let lastTarget: string | null = null;

    for (let i = 0; i < sequenceData.breadcrumb.length; i++) {
      const segment = sequenceData.breadcrumb[i];

      if (segment === "Targets_Container" || segment === "Targets Container") {
        insideTargetsContainer = true;
        continue;
      }

      if (insideTargetsContainer) {
        const targetName = extractTargetName(segment);
        if (targetName) {
          lastTarget = targetName;
        }
      }
    }

    if (lastTarget) {
      return lastTarget;
    }
  }

  // If we couldn't find a target in the current path, search the entire sequence
  // Look for all Targets_Container items
  const findTargetsRecursive = (
    items: ReadonlyArray<NinaSequenceItem>,
    currentPath: string[] = [],
  ): { path: string[]; target: string }[] => {
    const results: { path: string[]; target: string }[] = [];

    for (const item of items) {
      const itemPath = [...currentPath, item.name];

      if (isTargetContainer(item)) {
        // Found a targets container, extract targets from its children
        const targets = findTargetsInContainer(item);
        for (const target of targets) {
          results.push({ path: [...itemPath, target], target });
        }
      }

      // Recurse into children
      if (item.items?.length) {
        results.push(...findTargetsRecursive(item.items, itemPath));
      }
    }

    return results;
  };

  const allTargets = findTargetsRecursive(sequenceData.items);

  if (allTargets.length === 0) {
    return null;
  }

  // If we have a current breadcrumb, try to find the closest target
  if (sequenceData.breadcrumb?.length) {
    // Find targets that come before or at our current position
    const currentDepth = sequenceData.breadcrumb.length;

    // Look for the most recently passed target
    let bestMatch: { path: string[]; target: string } | null = null;

    for (const targetInfo of allTargets) {
      // Check if this target is in our path or before us
      let matches = true;
      for (let i = 0; i < Math.min(targetInfo.path.length, currentDepth); i++) {
        if (i < sequenceData.breadcrumb.length &&
            targetInfo.path[i] !== sequenceData.breadcrumb[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        bestMatch = targetInfo;
      }
    }

    if (bestMatch) {
      return bestMatch.target;
    }
  }

  // Fall back to the first target in the sequence
  return allTargets[0].target;
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

type SequenceDetailExtractor = (item: NinaSequenceItem, now?: number) => string[];

const sequenceDetailExtractors: Record<string, SequenceDetailExtractor> = {
  "Wait for Time": (item, now) => {
    const parts: string[] = [];

    // Check for TargetTime directly on the item (from the JSON structure)
    const targetTimeValue = (item as any).TargetTime ||
                           (item as any).targetTime ||
                           item.metadata?.["TargetTime"] ||
                           item.metadata?.["WaitUntil"] ||
                           item.metadata?.["Time"];

    if (targetTimeValue) {
      const targetTime = new Date(String(targetTimeValue));
      if (!isNaN(targetTime.getTime())) {
        if (now) {
          // Calculate countdown
          const remainingMs = targetTime.getTime() - now;
          if (remainingMs > 0) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            parts.push(formatDuration(remainingSeconds));
          } else {
            // Time has passed
            parts.push(`waiting...`);
          }
        } else {
          // Fallback to static time display if no current time provided
          const timeStr = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          parts.push(`until ${timeStr}`);
        }
      }
    }

    // Check for CalculatedWaitDuration directly on the item
    const calculatedDuration = (item as any).CalculatedWaitDuration ||
                               (item as any).calculatedWaitDuration;
    if (!targetTimeValue && calculatedDuration) {
      // Parse duration string like "02:40:25.9083582"
      const durationMatch = String(calculatedDuration).match(/(\d+):(\d+):(\d+)/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        const seconds = parseInt(durationMatch[3], 10);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        if (totalSeconds > 0) {
          parts.push(`${formatDuration(totalSeconds)}`);
        }
      }
    }

    // Fallback to metadata fields
    if (!targetTimeValue && !calculatedDuration) {
      const waitSeconds = coerceNumber(item.metadata?.["WaitSeconds"] ||
                                       item.metadata?.["Duration"] ||
                                       item.metadata?.["Seconds"]);
      if (waitSeconds) {
        parts.push(`${formatDuration(waitSeconds)}`);
      }
    }

    return parts;
  },

  "Wait For Altitude": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const targetAlt = coerceNumber(metadata["TargetAltitude"] || metadata["Altitude"]);
    if (targetAlt) {
      parts.push(`${targetAlt.toFixed(1)}°`);
    }

    const comparison = metadata["Comparator"] || metadata["Comparison"] || metadata["Direction"];
    if (comparison) {
      const comp = String(comparison).toLowerCase();
      if (comp.includes("rising") || comp.includes("above")) {
        parts.push("rising");
      } else if (comp.includes("setting") || comp.includes("below")) {
        parts.push("setting");
      }
    }

    return parts;
  },

  "Take Exposure": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const exposureTime = coerceNumber(metadata["ExposureTime"] || metadata["Duration"] || metadata["Time"]);
    if (exposureTime) {
      parts.push(`${formatDuration(exposureTime)}`);
    }

    const filter = metadata["Filter"] || metadata["FilterName"];
    if (filter) {
      parts.push(String(filter));
    }

    const binning = metadata["Binning"] || metadata["BinX"];
    if (binning) {
      parts.push(`Bin ${binning}`);
    }

    const gain = coerceNumber(metadata["Gain"]);
    if (gain !== null) {
      parts.push(`Gain ${gain}`);
    }

    return parts;
  },

  "Switch Filter": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const filter = metadata["Filter"] || metadata["FilterName"] || metadata["TargetFilter"];
    if (filter) {
      parts.push(`→ ${filter}`);
    }

    return parts;
  },

  "Cool Camera": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const targetTemp = coerceNumber(metadata["TargetTemperature"] || metadata["Temperature"]);
    if (targetTemp !== null) {
      parts.push(`${targetTemp}°C`);
    }

    const duration = coerceNumber(metadata["Duration"] || metadata["CoolDuration"]);
    if (duration) {
      parts.push(`over ${formatDuration(duration)}`);
    }

    return parts;
  },

  "Run Autofocus": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const stepSize = coerceNumber(metadata["StepSize"] || metadata["AutoFocusStepSize"]);
    if (stepSize) {
      parts.push(`step ${stepSize}`);
    }

    const exposureTime = coerceNumber(metadata["ExposureTime"] || metadata["AutoFocusExposureTime"]);
    if (exposureTime) {
      parts.push(`${formatDuration(exposureTime)}`);
    }

    return parts;
  },

  "Slew to Target": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const coordinates = metadata["Coordinates"] || metadata["Target"] || metadata["RA"];
    if (coordinates) {
      const coordStr = String(coordinates);
      if (coordStr.length > 20) {
        parts.push(coordStr.substring(0, 20) + "…");
      } else {
        parts.push(coordStr);
      }
    }

    return parts;
  },

  "Center and Rotate": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const threshold = coerceNumber(metadata["Threshold"] || metadata["AcceptableError"]);
    if (threshold) {
      parts.push(`±${threshold}″`);
    }

    const rotation = coerceNumber(metadata["Rotation"] || metadata["TargetRotation"]);
    if (rotation !== null) {
      parts.push(`${rotation}°`);
    }

    return parts;
  },

  "Park Scope": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const position = metadata["ParkPosition"] || metadata["Position"];
    if (position) {
      parts.push(String(position));
    }

    return parts;
  },

  "Dither": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const pixels = coerceNumber(metadata["Pixels"] || metadata["DitherPixels"] || metadata["PixelDistance"]);
    if (pixels) {
      parts.push(`${pixels}px`);
    }

    const raOnly = metadata["RAOnly"] || metadata["OnlyRA"];
    if (raOnly === true || raOnly === "true") {
      parts.push("RA only");
    }

    return parts;
  },

  "Loop Condition": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const condition = metadata["Condition"] || metadata["LoopCondition"];
    if (condition) {
      const condStr = String(condition);
      if (condStr.length > 15) {
        parts.push(condStr.substring(0, 15) + "…");
      } else {
        parts.push(condStr);
      }
    }

    return parts;
  },

  "Set Tracking": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const rate = metadata["TrackingRate"] || metadata["Rate"];
    if (rate) {
      parts.push(String(rate));
    }

    return parts;
  },

  "Warm Camera": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const duration = coerceNumber(metadata["Duration"] || metadata["WarmDuration"]);
    if (duration) {
      parts.push(`over ${formatDuration(duration)}`);
    }

    return parts;
  },

  "Meridian Flip": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const minutesAfter = coerceNumber(metadata["MinutesAfterMeridian"] || metadata["MinutesAfter"]);
    if (minutesAfter !== null) {
      parts.push(`+${minutesAfter}min`);
    }

    return parts;
  },

  "Plate Solve": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const threshold = coerceNumber(metadata["Threshold"] || metadata["AcceptableError"] || metadata["Accuracy"]);
    if (threshold) {
      parts.push(`±${threshold}″`);
    }

    return parts;
  },
};

export function formatSequenceProgressSuffix(
  item: NinaSequenceItem | null,
  now?: number
): string | null {
  if (!item) {
    return null;
  }

  const parts: string[] = [];

  // First, add iteration/exposure counts if available
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

  if (iterationsTotal) {
    const current = iterationsCurrent ?? 0;
    parts.push(`${current}/${iterationsTotal}`);
  }

  if (exposuresTotal) {
    const current = exposuresCurrent ?? 0;
    parts.push(`${current}/${exposuresTotal}`);
  }

  // Then add type-specific details based on the Name field
  const itemName = item.name;

  // Try exact match first
  if (itemName && sequenceDetailExtractors[itemName]) {
    const typeSpecificDetails = sequenceDetailExtractors[itemName](item, now);
    parts.push(...typeSpecificDetails);
  } else if (itemName) {
    // Try case-insensitive partial match
    const lowerName = itemName.toLowerCase();
    for (const [key, extractor] of Object.entries(sequenceDetailExtractors)) {
      if (lowerName.includes(key.toLowerCase())) {
        const typeSpecificDetails = extractor(item, now);
        parts.push(...typeSpecificDetails);
        break;
      }
    }
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

export function getFilterColor(filterName: string | null | undefined): string | null {
  if (!filterName) return null;

  const filter = filterName.trim().toLowerCase();

  // RGB filters
  if (filter === 'r' || filter === 'red') return '#ff4444';
  if (filter === 'g' || filter === 'green') return '#44ff44';
  if (filter === 'b' || filter === 'blue') return '#4444ff';

  // Luminance
  if (filter === 'l' || filter === 'lum' || filter === 'luminance') return '#ffffff';

  // Narrowband filters (wavelength-accurate colors)
  if (filter === 'ha' || filter === 'h-alpha' || filter === 'halpha') return '#ff4444';  // 656nm - red
  if (filter === 'sii' || filter === 's2' || filter === 'sulfur') return '#aa0000';  // 672nm - deep red
  if (filter === 'oiii' || filter === 'o3' || filter === 'oxygen') return '#00ddcc';  // 500nm - teal/cyan

  return null;
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

/**
 * Fetch astronomical targets from Telescopius API based on mount coordinates
 */
export async function fetchTelescopiusTargets(
  mount: NinaMountInfo | null,
  radius: number = 30,
  lat?: number,
  lon?: number,
) {
  if (!mount || !mount.rightAscensionDegrees || !mount.declinationDegrees) {
    return null;
  }

  try {
    let url = `/api/telescopius?ra=${mount.rightAscensionDegrees}&dec=${mount.declinationDegrees}&radius=${radius}`;

    // Add observer location if provided
    if (lat !== undefined && lon !== undefined) {
      url += `&lat=${lat}&lon=${lon}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch targets:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Telescopius targets:", error);
    return null;
  }
}
