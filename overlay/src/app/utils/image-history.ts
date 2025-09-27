import type { NinaImageHistoryEntry } from "@nina/advanced";

export interface ImageHistorySummary {
  readonly latestImage: NinaImageHistoryEntry | null;
  readonly totalImages: number;
  readonly totalIntegrationSeconds: number;
  readonly filterBreakdown: ReadonlyArray<{
    filter: string;
    count: number;
    totalDurationSeconds: number;
  }>;
}

export function summarizeImageHistory(
  entries: ReadonlyArray<NinaImageHistoryEntry>,
): ImageHistorySummary {
  if (!entries.length) {
    return {
      latestImage: null,
      totalImages: 0,
      totalIntegrationSeconds: 0,
      filterBreakdown: [],
    };
  }

  const sorted = [...entries].sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeB - timeA;
  });

  const filters = new Map<string, { filter: string; count: number; totalDurationSeconds: number }>();
  let totalIntegrationSeconds = 0;

  sorted.forEach((entry) => {
    const filterKey = entry.filterName?.trim() || "Unfiltered";
    const duration = entry.exposureDurationSeconds ?? 0;

    const existing = filters.get(filterKey) ?? {
      filter: filterKey,
      count: 0,
      totalDurationSeconds: 0,
    };

    existing.count += 1;
    existing.totalDurationSeconds += duration;
    filters.set(filterKey, existing);

    totalIntegrationSeconds += duration;
  });

  return {
    latestImage: sorted[0] ?? null,
    totalImages: sorted.length,
    totalIntegrationSeconds,
    filterBreakdown: Array.from(filters.values()).sort((a, b) =>
      a.filter.localeCompare(b.filter),
    ),
  };
}