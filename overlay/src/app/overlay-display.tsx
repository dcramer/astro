"use client";

import { useEffect, useRef } from "react";
import { TimeProvider, useTime } from "./contexts/TimeContext";

import { formatDuration, formatNumber, formatTime } from "@nina/format";
import { getImageThumbnailUrl } from "@nina/advanced";
import { getNinaAdvancedApiBaseUrl } from "@nina/config";

import { useOverlaySession } from "./use-overlay-session";
import { useTargetEnrichment } from "./use-target-enrichment";
import { StatValue } from "./components/StatValue";
import { StatsRow, type StatDefinition } from "./components/StatsRow";
import { CompactTargetDisplay } from "./components/TargetDisplay";
import {
  computeExposureProgress,
  findSequenceItemByPath,
  findCurrentImagingTarget,
  formatCameraStatus,
  formatMountDisplay,
  formatAmbientTemperature,
  formatHumidity,
  formatSkyQuality,
  formatSequenceProgressSuffix,
  formatSequenceStatus,
  getRemainingSeconds,
  getFilterColor,
  normalizeSequenceBreadcrumbEntry,
  summarizeImageHistory,
} from "./utils";

import styles from "./page.module.css";

const DEFAULT_POLL_MS = 5000;

interface OverlayDisplayProps {
  baseUrl: string | null;
  pollMs?: number;
}

function OverlayDisplayInner({
  baseUrl,
  pollMs = DEFAULT_POLL_MS,
}: OverlayDisplayProps) {
  const now = useTime();
  const {
    imageHistory,
    advancedStatus,
    connectionOffline,
    hasConnected,
    mountInfo,
    weatherInfo,
  } =
    useOverlaySession({ baseUrl, pollMs });

  // Get enriched target information
  const { currentTarget, isLoadingEnrichment } = useTargetEnrichment(
    advancedStatus?.sequence ?? null,
    mountInfo,
    !connectionOffline
  );
  const exposureRef = useRef<{
    key: string | null;
    initialRemaining: number | null;
  }>({ key: null, initialRemaining: null });

  const imageSummary = summarizeImageHistory(imageHistory);
  const hasImages = imageSummary.totalImages > 0;
  const latestImage = imageSummary.latestImage;
  const advancedBaseUrl = getNinaAdvancedApiBaseUrl();

  const latestCaptured = hasImages ? formatTime(latestImage?.startTime ?? null) : "—";
  const latestDuration = formatDuration(latestImage?.exposureDurationSeconds ?? null);

  const previewClass = styles.thumbnail;
  const latestThumbnailUrl =
    hasImages && advancedBaseUrl && latestImage?.originalIndex !== undefined
      ? getImageThumbnailUrl(advancedBaseUrl, latestImage.originalIndex)
      : null;

  const cameraData =
    !connectionOffline && advancedStatus?.available && advancedStatus.camera
      ? advancedStatus.camera
      : null;
  const cameraRemainingSeconds = getRemainingSeconds(cameraData, now);

  useEffect(() => {
    if (!cameraData?.isExposing || cameraRemainingSeconds === null) {
      exposureRef.current = { key: null, initialRemaining: null };
      return;
    }

    const key = cameraData.exposureEndTime ?? `exposure-${Math.floor(cameraRemainingSeconds)}`;
    if (exposureRef.current.key !== key) {
      exposureRef.current = {
        key,
        initialRemaining: cameraRemainingSeconds,
      };
    }
  }, [cameraData?.isExposing, cameraData?.exposureEndTime, cameraRemainingSeconds]);

  const cameraProgress = cameraData
    ? computeExposureProgress(
        cameraData,
        now,
        latestImage?.exposureDurationSeconds ?? cameraData.lastExposureDurationSeconds ?? null,
        cameraRemainingSeconds,
        exposureRef.current.initialRemaining,
      )
    : null;
  const sequencerData =
    !connectionOffline && advancedStatus?.available && advancedStatus.sequence
      ? advancedStatus.sequence
      : null;

  const cameraStat: StatDefinition = {
    key: "camera",
    label: "Camera",
    value: <StatValue>{cameraData ? formatCameraStatus(cameraData, now, cameraProgress) : "—"}</StatValue>,
    progressPercent: cameraProgress?.percent,
    cardClassName: styles.statCardCamera,
  };

  const mountDisplayValue = formatMountDisplay(mountInfo, {
    connectionOffline,
    hasConnected,
  });

  const mountStat: StatDefinition = {
    key: "mount",
    label: "Mount",
    value: <StatValue className={styles.statValueWrap}>{mountDisplayValue}</StatValue>,
    cardClassName: styles.statCardMount,
  };

  const skyStat: StatDefinition = {
    key: "sky-quality",
    label: "Sky Quality",
    value: (
      <StatValue className={styles.statValueWrap}>
        {formatSkyQuality(weatherInfo, { connectionOffline, hasConnected })}
      </StatValue>
    ),
    cardClassName: styles.statCardSkyQuality,
  };

  const temperatureStat: StatDefinition = {
    key: "ambient-temperature",
    label: "Ambient Temp",
    value: (
      <StatValue className={styles.statValueWrap}>
        {formatAmbientTemperature(weatherInfo, { connectionOffline, hasConnected })}
      </StatValue>
    ),
    cardClassName: styles.statCardAmbient,
  };

  const humidityStat: StatDefinition = {
    key: "humidity",
    label: "Humidity",
    value: (
      <StatValue className={styles.statValueWrap}>
        {formatHumidity(weatherInfo, { connectionOffline, hasConnected })}
      </StatValue>
    ),
    cardClassName: styles.statCardHumidity,
  };

  const rowTwoStats: StatDefinition[] = [
    cameraStat,
    mountStat,
    skyStat,
    temperatureStat,
    humidityStat,
  ];

  let sequencerChain: string[] | null = null;
  let sequencerCurrent = sequencerData ? formatSequenceStatus(sequencerData) : "—";

  if (sequencerData?.breadcrumb?.length) {
    const cleaned = sequencerData.breadcrumb
      .filter((entry): entry is string => Boolean(entry))
      .filter((entry, index) => {
        if (index === 0 && entry.toLowerCase().includes("container")) {
          return false;
        }
        return true;
      })
      .map((entry) => normalizeSequenceBreadcrumbEntry(entry))
      .filter((entry): entry is string => Boolean(entry));

    const runningName = normalizeSequenceBreadcrumbEntry(
      sequencerData.runningItemName ?? null,
    );

    const chainBase = cleaned.length ? cleaned : runningName ? [runningName] : [];

  const chain =
      runningName && (!chainBase.length || chainBase[chainBase.length - 1] !== runningName)
        ? [...chainBase, runningName]
        : chainBase;

  if (chain.length) {
      sequencerChain = chain;
      sequencerCurrent = chain[chain.length - 1];
    }
  }

  // Get target name from sequence data
  const imagingTarget = findCurrentImagingTarget(sequencerData);
  const targetName = connectionOffline
    ? "<Offline>"
    : hasConnected
      ? currentTarget?.name || imagingTarget || "<No Target>"
      : "<Loading>";

  let sequencerBreadcrumb: string[] | null = sequencerChain;

  const runningSequenceItem = findSequenceItemByPath(
    sequencerData?.items,
    sequencerData?.breadcrumb ?? null,
  );
  const progressSuffix = formatSequenceProgressSuffix(runningSequenceItem, now);

  if (progressSuffix) {
    sequencerCurrent = `${sequencerCurrent}${progressSuffix}`;
    if (sequencerBreadcrumb && sequencerBreadcrumb.length) {
      const updated = [...sequencerBreadcrumb];
      updated[updated.length - 1] = sequencerCurrent;
      sequencerBreadcrumb = updated;
    }
  }

  const rowThreeStats: StatDefinition[] = [
    {
      key: "sequencer",
      label: "Sequencer",
      value: <StatValue>{sequencerCurrent}</StatValue>,
      cardClassName: styles.statCardSequencer,
      breadcrumb: sequencerBreadcrumb ?? undefined,
    },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.layout}>
        <div className={styles.leftSide}>
          <div className={previewClass}>
            {latestThumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latestThumbnailUrl}
                alt={latestImage?.startTime ?? ""}
              />
            ) : (
              <div className={styles.thumbnailFallback}>
                {hasImages ? "Preview unavailable" : "Waiting for first frame…"}
              </div>
            )}
          </div>

          <div className={styles.latestCard}>
            <span className={styles.latestHeading}>Latest Sub</span>
            <p className={styles.latestTitle}>{latestImage?.startTime ? new Date(latestImage.startTime).toLocaleString() : "—"}</p>
            <div className={styles.latestMetrics}>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>HFR</span>
                <span className={styles.latestMetricValue}>
                  {formatNumber(latestImage?.hfr)}
                </span>
              </div>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>Stars</span>
                <span className={styles.latestMetricValue}>
                  {latestImage?.detectedStars ?? "—"}
                </span>
              </div>
              <div className={styles.latestMetric}>
                <span className={styles.latestMetricLabel}>Filter</span>
                <span className={styles.latestMetricValue} style={{ display: 'flex', alignItems: 'center' }}>
                  {latestImage?.filterName?.trim() ?? "—"}
                  {(() => {
                    const color = getFilterColor(latestImage?.filterName);
                    if (!color) return null;
                    return (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          backgroundColor: color,
                          marginLeft: '6px',
                          border: color === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none'
                        }}
                      />
                    );
                  })()}
                </span>
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
                <span className={styles.latestMetricLabel}>Camera °C</span>
                <span className={styles.latestMetricValue}>
                  {formatNumber(latestImage?.cameraTemperature, 1)}
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
                {currentTarget ? (
                  <CompactTargetDisplay
                    target={currentTarget}
                    isLoading={isLoadingEnrichment}
                  />
                ) : (
                  targetName
                )}
              </p>
            </div>
          </div>
          <StatsRow stats={rowTwoStats} className={styles.statRowCamera} />
          <StatsRow stats={rowThreeStats} className={styles.statRowSequencer} />
        </div>
      </div>
    </div>
  );
}

export default function OverlayDisplay(props: OverlayDisplayProps) {
  return (
    <TimeProvider intervalMs={1000}>
      <OverlayDisplayInner {...props} />
    </TimeProvider>
  );
}
