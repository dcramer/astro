"use client";

import type { NinaSequenceItem } from "@nina/advanced";

interface FlatPanelStepProps {
  item: NinaSequenceItem;
}

export function FlatPanelStep({ item }: FlatPanelStepProps) {
  const itemName = item.name.toLowerCase();
  const metadata = item.metadata || {};

  if (itemName.includes("set brightness")) {
    const brightness = metadata["Brightness"] || metadata["Level"] || metadata["BrightnessLevel"];
    if (brightness !== undefined && brightness !== null) {
      return <span>Set Brightness → {String(brightness)}%</span>;
    }
    return <span>Set Brightness</span>;
  }

  if (itemName.includes("open")) {
    return <span>Open Flat Panel Cover</span>;
  }

  if (itemName.includes("close")) {
    return <span>Close Flat Panel Cover</span>;
  }

  return <span>{item.name}</span>;
}