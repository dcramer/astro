import type { NinaSequenceItem } from "@nina/advanced";
import { formatDuration } from "@nina/format";

type SequenceDetailExtractor = (item: NinaSequenceItem, now?: number) => string[];

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

export const sequenceDetailExtractors: Record<string, SequenceDetailExtractor> = {
  "Wait for Time": (item, now) => {
    const parts: string[] = [];

    // Check for TargetTime directly on the item (from the JSON structure)
    const targetTimeValue = (item as any).TargetTime ||
                           (item as any).targetTime ||
                           item.metadata?.["TargetTime"] ||
                           item.metadata?.["WaitUntil"] ||
                           item.metadata?.["Time"];

    if (targetTimeValue) {
      const targetTime = new Date(String(targetTimeValue));
      if (!isNaN(targetTime.getTime())) {
        if (now) {
          // Calculate countdown
          const remainingMs = targetTime.getTime() - now;
          if (remainingMs > 0) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            parts.push(formatDuration(remainingSeconds));
          } else {
            // Time has passed
            parts.push(`waiting...`);
          }
        } else {
          // Fallback to static time display if no current time provided
          const timeStr = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          parts.push(`until ${timeStr}`);
        }
      }
    }

    // Check for CalculatedWaitDuration directly on the item
    const calculatedDuration = (item as any).CalculatedWaitDuration ||
                               (item as any).calculatedWaitDuration;
    if (!targetTimeValue && calculatedDuration) {
      // Parse duration string like "02:40:25.9083582"
      const durationMatch = String(calculatedDuration).match(/(\d+):(\d+):(\d+)/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        const seconds = parseInt(durationMatch[3], 10);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        if (totalSeconds > 0) {
          parts.push(`${formatDuration(totalSeconds)}`);
        }
      }
    }

    // Fallback to metadata fields
    if (!targetTimeValue && !calculatedDuration) {
      const waitSeconds = coerceNumber(item.metadata?.["WaitSeconds"] ||
                                       item.metadata?.["Duration"] ||
                                       item.metadata?.["Seconds"]);
      if (waitSeconds) {
        parts.push(`${formatDuration(waitSeconds)}`);
      }
    }

    return parts;
  },

  "Wait For Altitude": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const targetAlt = coerceNumber(metadata["TargetAltitude"] || metadata["Altitude"]);
    if (targetAlt) {
      parts.push(`${targetAlt.toFixed(1)}°`);
    }

    const comparison = metadata["Comparator"] || metadata["Comparison"] || metadata["Direction"];
    if (comparison) {
      const comp = String(comparison).toLowerCase();
      if (comp.includes("rising") || comp.includes("above")) {
        parts.push("rising");
      } else if (comp.includes("setting") || comp.includes("below")) {
        parts.push("setting");
      }
    }

    return parts;
  },

  "Wait until Above horizon": (item, now) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    // Get the current altitude
    const currentAlt = coerceNumber(metadata["currentAltitude"] || metadata["CurrentAltitude"]);

    // Get the target altitude (horizon threshold)
    const targetAlt = coerceNumber(metadata["Altitude"] || metadata["TargetAltitude"] || metadata["HorizonAltitude"]);

    // Check for ExpectedTime directly on the item (from the JSON structure)
    const expectedTimeValue = (item as any).ExpectedTime ||
                             (item as any).expectedTime ||
                             metadata["ExpectedTime"] ||
                             metadata["WaitUntil"] ||
                             metadata["Time"];

    if (expectedTimeValue) {
      let targetTime: Date | null = null;
      const timeStr = String(expectedTimeValue);

      // Try parsing as a full date first
      targetTime = new Date(timeStr);

      // If that fails or gives an invalid date, try parsing as time-only string (e.g., "21:05")
      if (isNaN(targetTime.getTime()) && timeStr.includes(':')) {
        const today = new Date(now || Date.now());
        const [hours, minutes] = timeStr.split(':').map(n => parseInt(n, 10));
        if (!isNaN(hours) && !isNaN(minutes)) {
          targetTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);

          // If the time has already passed today, assume it's for tomorrow
          if (targetTime.getTime() < today.getTime()) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
        }
      }

      if (targetTime && !isNaN(targetTime.getTime())) {
        if (now) {
          // Calculate countdown
          const remainingMs = targetTime.getTime() - now;
          if (remainingMs > 0) {
            // Show countdown when there's time remaining
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            parts.push(formatDuration(remainingSeconds));
          } else {
            // Time has passed, show target altitude instead
            if (targetAlt !== null) {
              parts.push(`waiting for ${targetAlt.toFixed(1)}°`);
            } else {
              // Fallback if no target altitude available
              parts.push(`waiting...`);
            }
          }
        } else {
          // Fallback to static time display if no current time provided
          const displayTime = targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          parts.push(`at ${displayTime}`);
        }
        return parts; // Return early when ExpectedTime is available
      }
    }

    // Check for CalculatedWaitDuration directly on the item
    const calculatedDuration = (item as any).CalculatedWaitDuration ||
                               (item as any).calculatedWaitDuration;
    if (calculatedDuration) {
      // Parse duration string like "02:40:25.9083582"
      const durationMatch = String(calculatedDuration).match(/(\d+):(\d+):(\d+)/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        const seconds = parseInt(durationMatch[3], 10);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        if (totalSeconds > 0) {
          parts.push(formatDuration(totalSeconds));
        }
      }
    }

    // If no timing info, show current altitude and target
    if (!parts.length) {
      if (currentAlt !== null) {
        parts.push(`currently ${currentAlt.toFixed(1)}°`);
      }
      if (targetAlt !== null) {
        parts.push(`wait for ${targetAlt.toFixed(1)}°`);
      }
    }

    // Final fallback to metadata fields
    if (!parts.length) {
      const waitSeconds = coerceNumber(metadata["WaitSeconds"] ||
                                       metadata["Duration"] ||
                                       metadata["Seconds"]);
      if (waitSeconds) {
        parts.push(formatDuration(waitSeconds));
      }
    }

    return parts;
  },

  "Take Exposure": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const exposureTime = coerceNumber(metadata["ExposureTime"] || metadata["Duration"] || metadata["Time"]);
    if (exposureTime) {
      parts.push(`${formatDuration(exposureTime)}`);
    }

    const filter = metadata["Filter"] || metadata["FilterName"];
    if (filter) {
      parts.push(String(filter));
    }

    const binning = metadata["Binning"] || metadata["BinX"];
    if (binning) {
      parts.push(`Bin ${binning}`);
    }

    const gain = coerceNumber(metadata["Gain"]);
    if (gain !== null) {
      parts.push(`Gain ${gain}`);
    }

    return parts;
  },

  "Switch Filter": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const filter = metadata["Filter"] || metadata["FilterName"] || metadata["TargetFilter"];
    if (filter) {
      parts.push(`→ ${filter}`);
    }

    return parts;
  },

  "Cool Camera": (item) => {
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

    return parts;
  },

  "Run Autofocus": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const stepSize = coerceNumber(metadata["StepSize"] || metadata["AutoFocusStepSize"]);
    if (stepSize) {
      parts.push(`step ${stepSize}`);
    }

    const exposureTime = coerceNumber(metadata["ExposureTime"] || metadata["AutoFocusExposureTime"]);
    if (exposureTime) {
      parts.push(`${formatDuration(exposureTime)}`);
    }

    return parts;
  },

  "Slew to Target": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const coordinates = metadata["Coordinates"] || metadata["Target"] || metadata["RA"];
    if (coordinates) {
      const coordStr = String(coordinates);
      if (coordStr.length > 20) {
        parts.push(coordStr.substring(0, 20) + "…");
      } else {
        parts.push(coordStr);
      }
    }

    return parts;
  },

  "Center and Rotate": (item) => {
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

    return parts;
  },

  "Park Scope": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const position = metadata["ParkPosition"] || metadata["Position"];
    if (position) {
      parts.push(String(position));
    }

    return parts;
  },

  "Dither": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const pixels = coerceNumber(metadata["Pixels"] || metadata["DitherPixels"] || metadata["PixelDistance"]);
    if (pixels) {
      parts.push(`${pixels}px`);
    }

    const raOnly = metadata["RAOnly"] || metadata["OnlyRA"];
    if (raOnly === true || raOnly === "true") {
      parts.push("RA only");
    }

    return parts;
  },

  "Loop Condition": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const condition = metadata["Condition"] || metadata["LoopCondition"];
    if (condition) {
      const condStr = String(condition);
      if (condStr.length > 15) {
        parts.push(condStr.substring(0, 15) + "…");
      } else {
        parts.push(condStr);
      }
    }

    return parts;
  },

  "Set Tracking": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const rate = metadata["TrackingRate"] || metadata["Rate"];
    if (rate) {
      parts.push(String(rate));
    }

    return parts;
  },

  "Warm Camera": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const duration = coerceNumber(metadata["Duration"] || metadata["WarmDuration"]);
    if (duration) {
      parts.push(`over ${formatDuration(duration)}`);
    }

    return parts;
  },

  "Meridian Flip": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const minutesAfter = coerceNumber(metadata["MinutesAfterMeridian"] || metadata["MinutesAfter"]);
    if (minutesAfter !== null) {
      parts.push(`+${minutesAfter}min`);
    }

    return parts;
  },

  "Plate Solve": (item) => {
    const parts: string[] = [];
    const metadata = item.metadata || {};

    const threshold = coerceNumber(metadata["Threshold"] || metadata["AcceptableError"] || metadata["Accuracy"]);
    if (threshold) {
      parts.push(`±${threshold}″`);
    }

    return parts;
  },
};