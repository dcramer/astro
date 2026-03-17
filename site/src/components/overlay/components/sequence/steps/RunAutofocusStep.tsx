"use client";

import type { NinaSequenceItem } from "@nina/advanced";
import { formatDuration } from "@nina/format";

interface RunAutofocusStepProps {
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

export function RunAutofocusStep({ item }: RunAutofocusStepProps) {
  const parts: string[] = [];
  const metadata = item.metadata || {};

  const stepSize = coerceNumber(metadata["StepSize"] || metadata["AutoFocusStepSize"]);
  if (stepSize) {
    parts.push(`step ${stepSize}`);
  }

  const exposureTime = coerceNumber(metadata["ExposureTime"] || metadata["AutoFocusExposureTime"]);
  if (exposureTime) {
    parts.push(formatDuration(exposureTime));
  }

  if (parts.length > 0) {
    return <span>Run Autofocus ({parts.join(" · ")})</span>;
  }

  return <span>Run Autofocus</span>;
}