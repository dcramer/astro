"use client";

import type { NinaSequenceItem } from "@nina/advanced";
import { WaitForTimeStep } from "./steps/WaitForTimeStep";
import { WaitForAltitudeStep } from "./steps/WaitForAltitudeStep";
import { TakeExposureStep } from "./steps/TakeExposureStep";
import { SwitchFilterStep } from "./steps/SwitchFilterStep";
import { CoolCameraStep } from "./steps/CoolCameraStep";
import { RunAutofocusStep } from "./steps/RunAutofocusStep";
import { CenterAndRotateStep } from "./steps/CenterAndRotateStep";
import { SmartExposureStep } from "./steps/SmartExposureStep";
import { ParkScopeStep } from "./steps/ParkScopeStep";
import { SetTrackingStep } from "./steps/SetTrackingStep";
import { FlatPanelStep } from "./steps/FlatPanelStep";

interface SequenceStepDisplayProps {
  item: NinaSequenceItem;
  now?: number;
}

/**
 * Renders the appropriate component based on the sequence step type
 */
export function SequenceStepDisplay({ item, now }: SequenceStepDisplayProps) {
  const itemName = item.name.toLowerCase();

  // Match specific step types and render specialized components
  if (itemName.includes("wait for time")) {
    return <WaitForTimeStep item={item} now={now} />;
  }

  if (itemName.includes("wait for altitude") || itemName.includes("wait until above horizon")) {
    return <WaitForAltitudeStep item={item} now={now} />;
  }

  if (itemName.includes("smart exposure")) {
    return <SmartExposureStep item={item} />;
  }

  if (itemName.includes("take exposure")) {
    return <TakeExposureStep item={item} />;
  }

  if (itemName.includes("switch filter")) {
    return <SwitchFilterStep item={item} />;
  }

  if (itemName.includes("cool camera")) {
    return <CoolCameraStep item={item} />;
  }

  if (itemName.includes("run autofocus")) {
    return <RunAutofocusStep item={item} />;
  }

  if (itemName.includes("center and rotate")) {
    return <CenterAndRotateStep item={item} />;
  }

  if (itemName.includes("park scope")) {
    return <ParkScopeStep item={item} />;
  }

  if (itemName.includes("set tracking")) {
    return <SetTrackingStep item={item} />;
  }

  if (itemName.includes("set brightness") || itemName.includes("flat panel")) {
    return <FlatPanelStep item={item} />;
  }

  // Skip annotation steps - they're just for logging
  if (itemName === "annotation") {
    return null;
  }

  // Default display for unknown step types
  return <DefaultStepDisplay item={item} />;
}

function DefaultStepDisplay({ item }: { item: NinaSequenceItem }) {
  const parts: string[] = [];

  // Show iteration/exposure counts if available
  if (item.iterations && item.iterations > 0) {
    const current = item.currentIteration ?? 0;
    parts.push(`${current}/${item.iterations}`);
  }

  if (item.exposureCount && item.exposureCount > 0) {
    const current = item.currentExposure ?? 0;
    parts.push(`${current}/${item.exposureCount}`);
  }

  if (parts.length > 0) {
    return <span>{item.name} ({parts.join(" · ")})</span>;
  }

  return <span>{item.name}</span>;
}