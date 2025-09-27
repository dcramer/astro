import type { AdvancedSequenceSnapshot, NinaSequenceItem } from "@nina/advanced";
import { formatDuration } from "@nina/format";
import { sequenceDetailExtractors } from './detail-extractors';

export function pickFriendlySequenceName(path: ReadonlyArray<string> | undefined) {
  if (!path?.length) {
    return null;
  }

  for (let idx = path.length - 1; idx >= 0; idx -= 1) {
    const segment = path[idx];
    if (!segment.toLowerCase().endsWith("_container")) {
      return segment;
    }
  }

  return path[path.length - 1];
}

export function formatSequenceStatus(sequence: AdvancedSequenceSnapshot): string {
  if (!sequence.isRunning) {
    return "Idle";
  }

  const friendly = pickFriendlySequenceName(sequence.runningPath);
  if (friendly) {
    return friendly;
  }

  if (sequence.runningItemName) {
    return sequence.runningItemName;
  }

  return "Running";
}

export function normalizeSequenceBreadcrumbEntry(name: string | null | undefined) {
  if (!name) {
    return null;
  }

  let normalized = name.trim();
  if (!normalized) {
    return null;
  }

  normalized = normalized.replace(/[_]+/g, " ").replace(/\s+/g, " ");

  const ignoredSegments = [
    "container",
    "targets container",
    "template by reference",
  ];

  let previousLength;
  do {
    previousLength = normalized.length;
    for (const segment of ignoredSegments) {
      if (normalized.toLowerCase().endsWith(segment)) {
        normalized = normalized.slice(0, normalized.length - segment.length).trim();
      }
    }
  } while (normalized.length < previousLength && normalized.length > 0);

  return normalized.trim();
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

function toPositiveNumber(value: number | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getMetadataNumber(
  metadata: Readonly<Record<string, unknown>> | undefined,
  keys: ReadonlyArray<string>,
): number | null {
  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const candidate = coerceNumber(metadata[key]);
    if (candidate !== null) {
      return candidate;
    }
  }

  return null;
}

export function formatSequenceProgressSuffix(
  item: NinaSequenceItem | null,
  now?: number
): string | null {
  if (!item) {
    return null;
  }

  const parts: string[] = [];

  // First, add iteration/exposure counts if available
  const iterationsTotal =
    toPositiveNumber(item.iterations ?? null) ||
    toPositiveNumber(getMetadataNumber(item.metadata, ["Iterations", "IterationCount"]));
  const iterationsCurrent =
    toPositiveNumber(item.currentIteration ?? null) ||
    toPositiveNumber(getMetadataNumber(item.metadata, ["CurrentIteration", "Iteration"]));

  const exposuresTotal =
    toPositiveNumber(item.exposureCount ?? null) ||
    toPositiveNumber(
      getMetadataNumber(item.metadata, ["ExposureCount", "TargetExposureCount", "RepeatFor"]),
    );
  const exposuresCurrent =
    toPositiveNumber(item.currentExposure ?? null) ||
    toPositiveNumber(
      getMetadataNumber(item.metadata, ["CurrentExposure", "ExposureIteration", "ExposureIndex"]),
    );

  // Check if iterations and exposures are the same (common in Smart Exposure)
  const iterationStr = iterationsTotal ? `${iterationsCurrent ?? 0}/${iterationsTotal}` : null;
  const exposureStr = exposuresTotal ? `${exposuresCurrent ?? 0}/${exposuresTotal}` : null;

  if (iterationStr && exposureStr && iterationStr === exposureStr) {
    // If both are the same, only show once
    parts.push(iterationStr);
  } else {
    // Show both if they're different
    if (iterationStr) {
      parts.push(iterationStr);
    }
    if (exposureStr) {
      parts.push(exposureStr);
    }
  }

  // Then add type-specific details based on the Name field
  const itemName = item.name;

  // Try exact match first
  if (itemName && sequenceDetailExtractors[itemName]) {
    const typeSpecificDetails = sequenceDetailExtractors[itemName](item, now);
    parts.push(...typeSpecificDetails);
  } else if (itemName) {
    // Try case-insensitive partial match
    const lowerName = itemName.toLowerCase();
    for (const [key, extractor] of Object.entries(sequenceDetailExtractors)) {
      if (lowerName.includes(key.toLowerCase())) {
        const typeSpecificDetails = extractor(item, now);
        parts.push(...typeSpecificDetails);
        break;
      }
    }
  }

  if (!parts.length) {
    return null;
  }

  const label = parts.join(" · ");
  return ` (${label})`;
}