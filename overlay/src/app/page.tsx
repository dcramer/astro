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
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
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
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Frames</span>
              <span className={styles.statValue}>0</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Integration</span>
              <span className={styles.statValue}>—</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Status</span>
              <span className={styles.statValue}>{message}</span>
            </div>
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

  const hasFrames = Boolean(targetSummary?.records.length);
  const latest = targetSummary?.latestRecord ?? null;
  const latestThumbnailUrl = hasFrames
    ? getThumbnailUrl(baseUrl, summary.key, latest)
    : null;

  const latestFilter = latest?.filterName?.trim() ?? (hasFrames ? "Unfiltered" : "—");
  const latestCaptured = hasFrames ? formatTime(latest?.started) : "—";
  const latestDuration = formatDuration(latest?.duration);
  const totalFrames = targetSummary?.records.length ?? 0;
  const totalIntegration = targetSummary?.totalIntegrationSeconds ?? 0;
  const sessionDurationSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(history.startTime).getTime()) / 1000),
  );

  const previewClass = hasFrames
    ? styles.thumbnail
    : `${styles.thumbnail} ${styles.thumbnailSquare}`;

  const secondaryStats = [
    {
      label: "Status",
      value: history.activeSession ? "Live Session" : "Recent Session",
    },
    {
      label: "Subs",
      value: totalFrames.toString(),
    },
    {
      label: "Integration",
      value: formatDuration(totalIntegration),
    },
    {
      label: "Session",
      value: formatDuration(sessionDurationSeconds),
    },
    { label: "Profile", value: history.profileName },
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
                {hasFrames ? "Preview pending…" : "Waiting for first frame…"}
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
