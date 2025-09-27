"use client";

import type { NinaSequenceItem } from "@nina/advanced";
import { formatDuration } from "@nina/format";
import { useTimeWithFallback } from "../../../contexts/TimeContext";

interface WaitForAltitudeStepProps {
  item: NinaSequenceItem;
  now?: number;
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

export function WaitForAltitudeStep({ item, now: providedNow }: WaitForAltitudeStepProps) {
  const contextNow = useTimeWithFallback();
  const actualNow = providedNow ?? contextNow;
  const metadata = item.metadata || {};
  const parts: string[] = [];

  // Check for ExpectedTime
  const expectedTimeValue =
    (item as any).ExpectedTime ||
    (item as any).expectedTime ||
    metadata["ExpectedTime"];

  if (expectedTimeValue) {
    const targetTime = new Date(String(expectedTimeValue));
    if (!isNaN(targetTime.getTime())) {
      const remainingMs = targetTime.getTime() - actualNow;
      if (remainingMs > 0) {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        parts.push(formatDuration(remainingSeconds));
      } else {
        const targetAlt = coerceNumber(metadata["Altitude"] || metadata["TargetAltitude"]);
        if (targetAlt !== null) {
          parts.push(`waiting for ${targetAlt.toFixed(1)}°`);
        } else {
          parts.push(`waiting...`);
        }
      }
    }
  }

  // If no timing info, show altitude info
  if (!parts.length) {
    const currentAlt = coerceNumber(metadata["currentAltitude"] || metadata["CurrentAltitude"]);
    const targetAlt = coerceNumber(metadata["Altitude"] || metadata["TargetAltitude"]);

    if (currentAlt !== null) {
      parts.push(`currently ${currentAlt.toFixed(1)}°`);
    }
    if (targetAlt !== null) {
      parts.push(`wait for ${targetAlt.toFixed(1)}°`);
    }
  }

  const stepName = item.name.includes("horizon") ? "Wait until Above Horizon" : "Wait for Altitude";

  if (parts.length > 0) {
    return <span>{stepName} ({parts.join(" · ")})</span>;
  }

  return <span>{stepName}</span>;
}