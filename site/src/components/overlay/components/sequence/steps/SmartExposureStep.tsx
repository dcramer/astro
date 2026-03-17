"use client";

import type { NinaSequenceItem } from "@nina/advanced";

interface SmartExposureStepProps {
  item: NinaSequenceItem;
}

export function SmartExposureStep({ item }: SmartExposureStepProps) {
  const parts: string[] = [];

  // Smart Exposure typically tracks overall progress
  if (item.iterations && item.iterations > 0) {
    const current = item.currentIteration ?? 0;
    parts.push(`${current}/${item.iterations}`);
  } else if (item.exposureCount && item.exposureCount > 0) {
    const current = item.currentExposure ?? 0;
    parts.push(`${current}/${item.exposureCount}`);
  }

  // Add any metadata about the smart exposure settings
  const metadata = item.metadata || {};

  // Check for SNR target or other smart exposure parameters
  const snrTarget = metadata["SNRTarget"] || metadata["TargetSNR"];
  if (snrTarget) {
    parts.push(`SNR ${snrTarget}`);
  }

  const exposureTime = metadata["ExposureTime"] || metadata["Duration"];
  if (exposureTime) {
    parts.push(`${exposureTime}s`);
  }

  if (parts.length > 0) {
    return <span>Smart Exposure ({parts.join(" · ")})</span>;
  }

  return <span>Smart Exposure</span>;
}