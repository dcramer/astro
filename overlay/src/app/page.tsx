/* eslint-disable @next/next/no-img-element */
import type {
  OverlaySessionContext,
  Target,
  ImageRecord,
} from "@/src/lib/nina-api";
import { loadOverlaySession } from "@/src/lib/nina-api";
import { getNinaBaseUrl } from "@/src/lib/config";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDuration(seconds: number | undefined) {
  if (seconds === undefined || Number.isNaN(seconds)) {
    return "—";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    if (secs === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

function formatNumber(value: number | undefined, fractionDigits = 2) {
  if (value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

function formatTime(dateInput: string | Date | undefined) {
  if (!dateInput) {
    return "—";
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getActiveTarget(history: OverlaySessionContext["history"]): Target | null {
  const targets = history.targets ?? [];
  if (!targets.length) {
    return null;
  }

  if (history.activeTargetId) {
    const byId = targets.find((target) => target.id === history.activeTargetId);
    if (byId) {
      return byId;
    }
  }

  return targets[targets.length - 1];
}

function summarizeTarget(target: NonNullable<ReturnType<typeof getActiveTarget>>) {
  const records = target.imageRecords ?? [];
  let latestRecord = records[records.length - 1] ?? null;
  const filters = new Map<
    string,
    { filter: string; count: number; totalDuration: number }
  >();

  records.forEach((record) => {
    const filter = record.filterName?.trim() || "Unfiltered";
    const entry = filters.get(filter) ?? {
      filter,
      count: 0,
      totalDuration: 0,
    };

    entry.count += 1;
    entry.totalDuration += record.duration ?? 0;
    filters.set(filter, entry);

    if (!latestRecord) {
      latestRecord = record;
      return;
    }

    const latestTime = new Date(latestRecord.started).getTime();
    const currentTime = new Date(record.started).getTime();

    if (Number.isFinite(currentTime) && currentTime > latestTime) {
      latestRecord = record;
    }
  });

  return {
    records,
    latestRecord,
    totalIntegrationSeconds: records.reduce(
      (total, record) => total + (record.duration ?? 0),
      0,
    ),
    filterBreakdown: Array.from(filters.values()).sort((a, b) =>
      a.filter.localeCompare(b.filter),
    ),
  } as const;
}

function getThumbnailUrl(
  baseUrl: string,
  sessionKey: string,
  record: ImageRecord | null,
) {
  if (!record?.id) {
    return null;
  }

  return `${baseUrl}/sessions/${encodeURIComponent(sessionKey)}/thumbnails/${encodeURIComponent(record.id)}.jpg`;
}

function StatusOverlay({
  message,
  subtext,
  previewMessage = "Preview unavailable",
}: {
  message: string;
  subtext?: string;
  previewMessage?: string;
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.layout}>
        <div className={styles.leftSide}>
          <div className={`${styles.thumbnail} ${styles.thumbnailSquare}`}>
            <div className={styles.thumbnailFallback}>{previewMessage}</div>
          </div>
          <div className={styles.latestCard}>
            <span className={styles.latestHeading}>Latest Sub</span>
            <p className={styles.latestTitle}>No exposures yet</p>
            {subtext ? <p className={styles.latestMeta}>{subtext}</p> : null}
          </div>
        </div>
        <div className={styles.topStats}>
          <div className={`${styles.statRow} ${styles.statRowTarget}`}>
            <div className={styles.targetCard}>
              <span className={styles.targetLabel}>Target</span>
              <p className={styles.targetName}>No active target</p>
            </div>
          </div>
          <div className={styles.statRow}>
            {[
              { label: "Status", value: message },
              { label: "Subs", value: "0" },
              { label: "Integration", value: "—" },
            ].map((stat) => (
              <div className={styles.statCard} key={stat.label}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  const baseUrl = getNinaBaseUrl();

  if (!baseUrl) {
    return (
      <StatusOverlay
        message="Failed to validate the N.I.N.A. session host."
        subtext="Set NINA_SESSION_BASE_URL in .env.local if http://eagle4pro0329:8000 isn’t reachable."
      />
    );
  }

  const overlaySession = await loadOverlaySession();

  if (!overlaySession) {
    return (
      <StatusOverlay
        message="Waiting for N.I.N.A. session data…"
        previewMessage="Waiting for first frame…"
        subtext={`Confirm the Web Session History Viewer plugin is running and that the overlay host can reach ${baseUrl}.`}
      />
    );
  }

  const { summary, history } = overlaySession;
  const activeTarget = getActiveTarget(history);
  const targetSummary = activeTarget ? summarizeTarget(activeTarget) : null;

  const hasTargetFrames = Boolean(targetSummary?.records.length);
  const latest = targetSummary?.latestRecord ?? null;
  const latestThumbnailUrl = hasTargetFrames
    ? getThumbnailUrl(baseUrl, summary.key, latest)
    : null;

  const allImageRecords = (history.targets ?? []).flatMap(
    (target) => target.imageRecords ?? [],
  );

  const latestFilter = latest?.filterName?.trim() ?? (hasTargetFrames ? "Unfiltered" : "—");
  const latestCaptured = hasTargetFrames ? formatTime(latest?.started) : "—";
  const latestDuration = formatDuration(latest?.duration);

  const sessionFrameCount = allImageRecords.length;
  const sessionIntegrationSeconds = allImageRecords.reduce(
    (total, record) => total + (record.duration ?? 0),
    0,
  );
  const previewClass = hasTargetFrames
    ? styles.thumbnail
    : `${styles.thumbnail} ${styles.thumbnailSquare}`;

  const filterTotals = new Map<
    string,
    { count: number; durationSeconds: number }
  >();
  const normalizedTotals = new Map<
    string,
    { count: number; durationSeconds: number; labels: Set<string> }
  >();

  allImageRecords.forEach((record) => {
    const filterKey = record.filterName?.trim() || "Unfiltered";
    const entry = filterTotals.get(filterKey) ?? { count: 0, durationSeconds: 0 };
    entry.count += 1;
    entry.durationSeconds += record.duration ?? 0;
    filterTotals.set(filterKey, entry);

    const normalized = filterKey.toLowerCase();
    const normalizedEntry =
      normalizedTotals.get(normalized) ?? {
        count: 0,
        durationSeconds: 0,
        labels: new Set<string>(),
      };
    normalizedEntry.count += 1;
    normalizedEntry.durationSeconds += record.duration ?? 0;
    normalizedEntry.labels.add(filterKey);
    normalizedTotals.set(normalized, normalizedEntry);
  });

  const availableFilters = Array.from(filterTotals.keys());
  const normalizedFilters = availableFilters.map((filter) => filter.toLowerCase());

  const hasHa = normalizedFilters.includes("ha");
  const hasSii = normalizedFilters.some((filter) =>
    ["sii", "s-ii", "s2"].includes(filter),
  );
  const hasOiii = normalizedFilters.some((filter) =>
    ["oiii", "o-iii"].includes(filter),
  );
  const hasNarrowband = hasHa && hasSii && hasOiii;
  const hasRGB = ["r", "g", "b"].every((key) => normalizedFilters.includes(key));

  const getGroupTotals = (keys: string[], displayLabel: string) => {
    let count = 0;
    let durationSeconds = 0;
    keys.forEach((key) => {
      const totals = normalizedTotals.get(key.toLowerCase());
      if (totals) {
        count += totals.count;
        durationSeconds += totals.durationSeconds;
      }
    });

    if (count === 0) {
      return null;
    }

    return {
      label: `Filter ${displayLabel}`,
      value: `${count} subs · ${formatDuration(durationSeconds)}`,
    };
  };

  const narrowbandGroups = [
    { keys: ["ha"], label: "Ha" },
    { keys: ["sii", "s-ii", "s2"], label: "SII" },
    { keys: ["oiii", "o-iii"], label: "OIII" },
  ];

  const rgbGroups = [
    { keys: ["r"], label: "R" },
    { keys: ["g"], label: "G" },
    { keys: ["b"], label: "B" },
  ];

  const narrowbandStats = narrowbandGroups
    .map(({ keys, label }) => getGroupTotals(keys, label))
    .filter((item): item is { label: string; value: string } => item !== null);

  const rgbStats = rgbGroups
    .map(({ keys, label }) => getGroupTotals(keys, label))
    .filter((item): item is { label: string; value: string } => item !== null);

  let filterStats: { label: string; value: string }[];

  if (narrowbandStats.length > 0) {
    filterStats = narrowbandStats;
  } else if (rgbStats.length === rgbGroups.length) {
    filterStats = rgbStats;
  } else {
    filterStats = availableFilters
      .map((filter) => {
        const totals = filterTotals.get(filter);
        if (!totals) {
          return null;
        }
        return {
          label: `Filter ${filter}`,
          value: `${totals.count} subs · ${formatDuration(totals.durationSeconds)}`,
        };
      })
      .filter((item): item is { label: string; value: string } => item !== null);
  }

  const secondaryStats = [
    {
      label: "Status",
      value: history.activeSession ? "Live Session" : "Recent Session",
    },
    {
      label: "Subs",
      value: sessionFrameCount.toString(),
    },
    {
      label: "Integration",
      value: formatDuration(sessionIntegrationSeconds),
    },
    ...filterStats,
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.layout}>
        <div className={styles.leftSide}>
          <div className={previewClass}>
            {latestThumbnailUrl ? (
              <img
                src={latestThumbnailUrl}
                alt={latest?.fileName ?? "Latest frame"}
              />
            ) : (
              <div className={styles.thumbnailFallback}>
                {hasTargetFrames ? "Preview pending…" : "Waiting for first frame…"}
              </div>
            )}
          </div>

          <div className={styles.latestCard}>
            <span className={styles.latestHeading}>Latest Sub</span>
            <p className={styles.latestTitle}>
              {latest?.fileName ?? "No exposures captured"}
            </p>
            <div className={styles.latestMetrics}>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>HFR</span>
                <span className={styles.latestMetricValue}>
                  {formatNumber(latest?.HFR)}
                </span>
              </div>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>Stars</span>
                <span className={styles.latestMetricValue}>
                  {latest?.detectedStars ?? "—"}
                </span>
              </div>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>Filter</span>
                <span className={styles.latestMetricValue}>{latestFilter}</span>
              </div>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>Captured</span>
                <span className={styles.latestMetricValue}>{latestCaptured}</span>
              </div>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>Exposure</span>
                <span className={styles.latestMetricValue}>{latestDuration}</span>
              </div>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>Focuser °C</span>
                <span className={styles.latestMetricValue}>
                  {formatNumber(latest?.FocuserTemperature, 1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.topStats}>
          <div className={`${styles.statRow} ${styles.statRowTarget}`}>
            <div className={styles.targetCard}>
              <span className={styles.targetLabel}>Target</span>
              <p className={styles.targetName}>
                {activeTarget?.name ?? "No active target"}
              </p>
            </div>
          </div>
          <div className={styles.statRow}>
            {secondaryStats.map((stat) => (
              <div className={styles.statCard} key={stat.label}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
