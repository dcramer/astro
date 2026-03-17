import { getNinaAdvancedApiBaseUrl } from "../config";
import { z } from "zod";
import {
  rawCameraInfoSchema,
  rawSequenceItemSchema,
} from "./schemas";
import type {
  NinaAdvancedStatus,
  NinaCameraSnapshot,
  NinaSequenceItem,
  NinaSequenceSnapshot,
  RawCameraInfo,
  RawSequenceItem,
} from "./types";
import { fetchAdvancedResponse } from "./client";
import { toNumber, toPositiveNumber } from "./utils";

function transformSequenceItem(raw: RawSequenceItem): NinaSequenceItem | null {
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
  const items = Items?.map(transformSequenceItem).filter((item): item is NinaSequenceItem => Boolean(item));

  if (!Name && !items?.length) {
    return null;
  }

  return {
    name: Name ?? "Unnamed",
    description: Description ?? null,
    status: Status ?? undefined,
    items: items?.length ? items : undefined,
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

function findRunningItem(
  items: ReadonlyArray<NinaSequenceItem> | undefined,
  path: ReadonlyArray<string> = [],
): { node: NinaSequenceItem; path: ReadonlyArray<string> } | null {
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

function transformCameraInfo(raw: RawCameraInfo | null | undefined): NinaCameraSnapshot | null {
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
        ? typeof raw.CameraState === "string"
          ? raw.CameraState
          : Number(raw.CameraState)
        : null,
    exposureEndTime: raw.ExposureEndTime ?? null,
    exposureStartTime: raw.ExposureStartTime ?? null,
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
    fetchAdvancedResponse<string | null>(baseUrl, "/v2/api/version", z.string().nullable()),
    fetchAdvancedResponse<RawSequenceItem[] | null>(
      baseUrl,
      "/v2/api/sequence/json",
      rawSequenceItemSchema.array().nullable(),
    ),
    fetchAdvancedResponse<RawCameraInfo | null>(
      baseUrl,
      "/v2/api/equipment/camera/info",
      rawCameraInfoSchema.nullable(),
    ),
  ]);

  const sequenceItems = sequenceRaw?.map(transformSequenceItem).filter((item): item is NinaSequenceItem => Boolean(item)) ?? [];
  const running = findRunningItem(sequenceItems);

  const sequenceSnapshot: NinaSequenceSnapshot | null = sequenceRaw
    ? {
        items: sequenceItems,
        isRunning: Boolean(running),
        runningItemName: running?.node.name ?? null,
        runningPath: running?.path,
        breadcrumb: running?.path ?? null,
      }
    : null;

  const cameraSnapshot = transformCameraInfo(cameraRaw);

  const status: NinaAdvancedStatus = {
    available: true,
    version: version ?? undefined,
    sequence: sequenceSnapshot,
    camera: cameraSnapshot,
  };

  return status;
}
