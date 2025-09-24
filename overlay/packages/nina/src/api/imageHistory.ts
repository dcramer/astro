import { getNinaAdvancedApiBaseUrl } from "../config";
import type {
  NinaImageHistoryEntry,
  RawImageHistoryEntry,
  RawImageHistoryResponse,
} from "./types";
import { fetchAdvancedResponse } from "./client";
import { toNumber } from "./utils";

function transformImageHistoryEntry(raw: RawImageHistoryEntry): NinaImageHistoryEntry {
  const exposureDurationSeconds = toNumber(raw.ExposureTime) ?? 0;
  const detectedStarsRaw = toNumber(raw.Stars);
  const detectedStars = detectedStarsRaw !== null && detectedStarsRaw >= 0 ? detectedStarsRaw : null;
  const hfr = toNumber(raw.HFR);
  const parsedTemperature = toNumber(raw.Temperature);

  return {
    exposureDurationSeconds,
    imageType: raw.ImageType,
    filterName: raw.Filter,
    rmsText: raw.RmsText,
    temperatureText: `${raw.Temperature}`,
    cameraName: raw.CameraName,
    gain: toNumber(raw.Gain) ?? 0,
    offset: toNumber(raw.Offset) ?? 0,
    startTime: raw.Date,
    telescopeName: raw.TelescopeName,
    focalLength: toNumber(raw.FocalLength) ?? 0,
    stDev: toNumber(raw.StDev) ?? 0,
    mean: toNumber(raw.Mean) ?? 0,
    median: toNumber(raw.Median) ?? 0,
    detectedStars,
    hfr: hfr !== null && hfr >= 0 ? hfr : null,
    isBayered: raw.IsBayered ?? false,
    cameraTemperature: Number.isFinite(parsedTemperature) ? parsedTemperature : null,
  };
}

export async function loadImageHistory(): Promise<ReadonlyArray<NinaImageHistoryEntry>> {
  const baseUrl = getNinaAdvancedApiBaseUrl();
  if (!baseUrl) {
    return [];
  }

  const payload = await fetchAdvancedResponse<RawImageHistoryEntry[] | RawImageHistoryResponse | null>(
    baseUrl,
    "/v2/api/image-history",
  );

  if (!payload) {
    return [];
  }

  let entries: RawImageHistoryEntry[] = [];
  if (Array.isArray(payload)) {
    entries = payload;
  } else if (typeof payload === "object") {
    const candidate =
      payload.Images ?? payload.History ?? payload.Items ?? payload.Entries ?? [];
    if (Array.isArray(candidate)) {
      entries = candidate;
    }
  }

  return entries.map(transformImageHistoryEntry).sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeB - timeA;
  });
}

export function getImageThumbnailUrl(baseUrl: string, index = 0): string {
  return `${baseUrl}/v2/api/image/thumbnail/${encodeURIComponent(index)}`;
}
