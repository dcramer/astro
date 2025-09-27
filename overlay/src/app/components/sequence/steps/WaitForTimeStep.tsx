"use client";

import type { NinaSequenceItem } from "@nina/advanced";
import { formatDuration } from "@nina/format";
import { useTimeWithFallback } from "../../../contexts/TimeContext";

interface WaitForTimeStepProps {
  item: NinaSequenceItem;
  now?: number;
}

export function WaitForTimeStep({ item, now: providedNow }: WaitForTimeStepProps) {
  const contextNow = useTimeWithFallback();
  const actualNow = providedNow ?? contextNow;

  // Check for TargetTime in various places
  const targetTimeValue =
    (item as any).TargetTime ||
    (item as any).targetTime ||
    item.metadata?.["TargetTime"] ||
    item.metadata?.["WaitUntil"] ||
    item.metadata?.["Time"];

  if (targetTimeValue) {
    const targetTime = new Date(String(targetTimeValue));
    if (!isNaN(targetTime.getTime())) {
      const remainingMs = targetTime.getTime() - actualNow;
      if (remainingMs > 0) {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        return <span>Wait for Time ({formatDuration(remainingSeconds)})</span>;
      }
      return <span>Wait for Time (waiting...)</span>;
    }
  }

  // Check for CalculatedWaitDuration
  const calculatedDuration =
    (item as any).CalculatedWaitDuration ||
    (item as any).calculatedWaitDuration;

  if (calculatedDuration) {
    const durationMatch = String(calculatedDuration).match(/(\d+):(\d+):(\d+)/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseInt(durationMatch[3], 10);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds > 0) {
        return <span>Wait for Time ({formatDuration(totalSeconds)})</span>;
      }
    }
  }

  return <span>Wait for Time</span>;
}