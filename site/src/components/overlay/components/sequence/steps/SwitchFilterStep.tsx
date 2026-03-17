"use client";

import type { NinaSequenceItem } from "@nina/advanced";

interface SwitchFilterStepProps {
  item: NinaSequenceItem;
}

export function SwitchFilterStep({ item }: SwitchFilterStepProps) {
  const metadata = item.metadata || {};
  const filter = metadata["Filter"] || metadata["FilterName"] || metadata["TargetFilter"];

  if (filter) {
    return <span>Switch Filter → {String(filter)}</span>;
  }

  return <span>Switch Filter</span>;
}