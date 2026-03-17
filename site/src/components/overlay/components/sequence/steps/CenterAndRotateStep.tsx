"use client";

import type { NinaSequenceItem } from "@nina/advanced";

interface CenterAndRotateStepProps {
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

export function CenterAndRotateStep({ item }: CenterAndRotateStepProps) {
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

  if (parts.length > 0) {
    return <span>Center and Rotate ({parts.join(" · ")})</span>;
  }

  return <span>Center and Rotate</span>;
}