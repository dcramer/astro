"use client";

import type { NinaSequenceItem } from "@nina/advanced";

interface SetTrackingStepProps {
  item: NinaSequenceItem;
}

export function SetTrackingStep({ item }: SetTrackingStepProps) {
  const metadata = item.metadata || {};
  const rate = metadata["TrackingRate"] || metadata["Rate"] || metadata["TrackingMode"];

  if (rate) {
    return <span>Set Tracking → {String(rate)}</span>;
  }

  const enabled = metadata["Enabled"] || metadata["TrackingEnabled"];
  if (enabled !== undefined) {
    return <span>Set Tracking → {enabled ? "On" : "Off"}</span>;
  }

  return <span>Set Tracking</span>;
}