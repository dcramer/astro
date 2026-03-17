"use client";

import type { NinaSequenceItem } from "@nina/advanced";
import { formatDuration } from "@nina/format";

interface CoolCameraStepProps {
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

export function CoolCameraStep({ item }: CoolCameraStepProps) {
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

  if (parts.length > 0) {
    return <span>Cool Camera ({parts.join(" · ")})</span>;
  }

  return <span>Cool Camera</span>;
}