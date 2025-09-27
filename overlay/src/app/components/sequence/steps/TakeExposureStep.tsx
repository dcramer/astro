"use client";

import type { NinaSequenceItem } from "@nina/advanced";
import { formatDuration } from "@nina/format";

interface TakeExposureStepProps {
  item: NinaSequenceItem;
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

export function TakeExposureStep({ item }: TakeExposureStepProps) {
  const parts: string[] = [];
  const metadata = item.metadata || {};

  const exposureTime = coerceNumber(metadata["ExposureTime"] || metadata["Duration"] || metadata["Time"]);
  if (exposureTime) {
    parts.push(formatDuration(exposureTime));
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

  // Add iteration/exposure counts if available
  if (item.exposureCount && item.exposureCount > 0) {
    const current = item.currentExposure ?? 0;
    parts.unshift(`${current}/${item.exposureCount}`);
  }

  if (parts.length > 0) {
    return <span>Take Exposure ({parts.join(" · ")})</span>;
  }

  return <span>Take Exposure</span>;
}