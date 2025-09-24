"use client";

import { useEffect, useRef, useState } from "react";

import { formatDuration, formatNumber, formatTime } from "@nina/format";
import { getImageThumbnailUrl } from "@nina/advanced";
import { getNinaAdvancedApiBaseUrl } from "@nina/config";

import { useOverlaySession } from "./use-overlay-session";
import { StatValue } from "./components/StatValue";
import { StatsRow, type StatDefinition } from "./components/StatsRow";
import {
  computeExposureProgress,
  findSequenceItemByPath,
  formatCameraStatus,
  formatMountDisplay,
  formatAmbientTemperature,
  formatWeatherDisplay,
  formatSequenceProgressSuffix,
  formatSequenceStatus,
  getRemainingSeconds,
  normalizeSequenceBreadcrumbEntry,
  summarizeImageHistory,
} from "./overlay-utils";

import styles from "./page.module.css";

const DEFAULT_POLL_MS = 5000;

interface OverlayDisplayProps {
  baseUrl: string | null;
  pollMs?: number;
}

export default function OverlayDisplay({
  baseUrl,
  pollMs = DEFAULT_POLL_MS,
}: OverlayDisplayProps) {
  const {
    imageHistory,
    advancedStatus,
    connectionOffline,
    hasConnected,
    mountInfo,
    weatherInfo,
  } =
    useOverlaySession({ baseUrl, pollMs });
  const [now, setNow] = useState(() => Date.now());
  const exposureRef = useRef<{
    key: string | null;
    initialRemaining: number | null;
  }>({ key: null, initialRemaining: null });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const imageSummary = summarizeImageHistory(imageHistory);
  const hasImages = imageSummary.totalImages > 0;
  const latestImage = imageSummary.latestImage;
  const advancedBaseUrl = getNinaAdvancedApiBaseUrl();

  const latestCaptured = hasImages ? formatTime(latestImage?.startTime ?? null) : "—";
  const latestDuration = formatDuration(latestImage?.exposureDurationSeconds ?? null);

  const previewClass = styles.thumbnail;
  const latestThumbnailUrl =
    hasImages && advancedBaseUrl ? getImageThumbnailUrl(advancedBaseUrl, 0) : null;

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
    value: cameraProgress
      ? undefined
      : <StatValue>{cameraData ? formatCameraStatus(cameraData, now, null) : "—"}</StatValue>,
    progressPercent: cameraProgress?.percent,
    progressCaption: cameraProgress
      ? (
          <>
            <span>{`${Math.round(cameraProgress.percent * 100)}%`}</span>
            {cameraProgress.remainingSeconds !== null &&
            cameraProgress.remainingSeconds !== undefined ? (
              <span>{formatDuration(cameraProgress.remainingSeconds)}</span>
            ) : null}
          </>
        )
      : undefined,
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
        {formatWeatherDisplay(weatherInfo, { connectionOffline, hasConnected })}
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

  const rowTwoStats: StatDefinition[] = [cameraStat, mountStat, skyStat, temperatureStat];

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

  const targetName = connectionOffline
    ? "<Offline>"
    : hasConnected
      ? (sequencerChain?.length
          ? sequencerChain[0]
          : latestImage?.targetName?.trim()) || "<No Target>"
      : "<Loading>";

  let sequencerBreadcrumb: string[] | null = sequencerChain;

  const runningSequenceItem = findSequenceItemByPath(
    sequencerData?.items,
    sequencerChain ?? sequencerData?.breadcrumb ?? null,
  );
  const progressSuffix = formatSequenceProgressSuffix(runningSequenceItem);

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
                <span className={styles.latestMetricValue}>
                  {latestImage?.filterName?.trim() ?? "—"}
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
              <p className={styles.targetName}>{targetName}</p>
            </div>
          </div>
          <StatsRow stats={rowTwoStats} className={styles.statRowCamera} />
          <StatsRow stats={rowThreeStats} className={styles.statRowSequencer} />
        </div>
      </div>
    </div>
  );
}
