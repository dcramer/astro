"use client";

import type { NinaSequenceItem } from "@nina/advanced";

interface ParkScopeStepProps {
  item: NinaSequenceItem;
}

export function ParkScopeStep({ item }: ParkScopeStepProps) {
  const metadata = item.metadata || {};
  const position = metadata["ParkPosition"] || metadata["Position"];

  if (position) {
    return <span>Park Scope → {String(position)}</span>;
  }

  return <span>Park Scope</span>;
}