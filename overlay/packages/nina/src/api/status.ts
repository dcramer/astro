import { getNinaAdvancedApiBaseUrl } from "../config";
import type { NinaAdvancedStatus, RawCameraInfo, RawSequenceItem } from "./types";
import { fetchAdvancedResponse } from "./client";
import { toNumber, toPositiveNumber } from "./utils";

function transformSequenceItem(raw: RawSequenceItem) {
  const {
    Name,
    Description,
    Status,
    Items,
    Type,
    Iterations,
    IterationCount,
    CurrentIteration,
    Iteration,
    ExposureCount,
    TargetExposureCount,
    RepeatFor,
    CurrentExposure,
    ExposureIteration,
    ExposureIndex,
    ...rest
  } = raw;

  const metadata = Object.keys(rest).length ? (rest as Record<string, unknown>) : undefined;

  return {
    name: Name,
    description: Description ?? null,
    status: Status ?? undefined,
    items: Items?.map(transformSequenceItem) ?? undefined,
    type: Type ?? null,
    iterations:
      toPositiveNumber(Iterations) ??
      toPositiveNumber(IterationCount) ??
      toPositiveNumber(RepeatFor) ??
      null,
    currentIteration:
      toPositiveNumber(CurrentIteration) ??
      toPositiveNumber(Iteration) ??
      null,
    exposureCount:
      toPositiveNumber(ExposureCount) ??
      toPositiveNumber(TargetExposureCount) ??
      null,
    currentExposure:
      toPositiveNumber(CurrentExposure) ??
      toPositiveNumber(ExposureIteration) ??
      toPositiveNumber(ExposureIndex) ??
      null,
    metadata,
  };
}

function findRunningItem(items: ReadonlyArray<ReturnType<typeof transformSequenceItem>> | undefined, path: ReadonlyArray<string> = []) {
  if (!items?.length) {
    return null;
  }

  for (const item of items) {
    const currentPath = [...path, item.name];
    const nested = findRunningItem(item.items, currentPath);
    if (nested) {
      return nested;
    }

    if (item.status?.toUpperCase() === "RUNNING") {
      return { node: item, path: currentPath };
    }
  }

  return null;
}

function transformCameraInfo(raw: RawCameraInfo | null | undefined) {
  if (!raw) {
    return null;
  }

  const fallbackDuration = toNumber(raw.LastExposureDuration);

  const exposureDurationSeconds = toNumber(raw.ExposureDuration) ?? fallbackDuration;
  const elapsedExposureSeconds = toNumber(raw.ExposureTime);
  const lastDownloadTimeSeconds = toNumber(raw.LastDownloadTime);

  return {
    isExposing: Boolean(raw.IsExposing),
    cameraState:
      raw.CameraState !== undefined && raw.CameraState !== null
        ? Number(raw.CameraState)
        : null,
    exposureEndTime: raw.ExposureEndTime ?? null,
    exposureDurationSeconds,
    elapsedExposureSeconds,
    lastExposureDurationSeconds: fallbackDuration,
    lastDownloadTimeSeconds,
  };
}

export async function loadAdvancedStatus(): Promise<NinaAdvancedStatus> {
  const baseUrl = getNinaAdvancedApiBaseUrl();
  if (!baseUrl) {
    return { available: false };
  }

  const [version, sequenceRaw, cameraRaw] = await Promise.all([
    fetchAdvancedResponse<string | null>(baseUrl, "/v2/api/version"),
    fetchAdvancedResponse<RawSequenceItem[] | null>(baseUrl, "/v2/api/sequence/json"),
    fetchAdvancedResponse<RawCameraInfo | null>(baseUrl, "/v2/api/equipment/camera/info"),
  ]);

  const sequenceItems = sequenceRaw?.map(transformSequenceItem) ?? [];
  const running = findRunningItem(sequenceItems);

  const status: NinaAdvancedStatus = {
    available: true,
    version: version ?? undefined,
    sequence: {
      items: sequenceItems,
      isRunning: Boolean(running),
      runningItemName: running?.node.name ?? null,
      runningPath: running?.path,
      breadcrumb: running?.path ?? null,
    },
    camera: transformCameraInfo(cameraRaw),
  };

  if (!sequenceRaw) {
    status.sequence = null;
  }

  if (!cameraRaw) {
    status.camera = null;
  }

  return status;
}
