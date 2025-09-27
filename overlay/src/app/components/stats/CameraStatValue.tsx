"use client";

import { useEffect, useRef } from "react";
import type { AdvancedCameraSnapshot } from "@nina/advanced";
import { formatCameraStatus, computeExposureProgress, getRemainingSeconds, type ExposureProgress } from "../../utils/camera";
import { StatValue } from "../StatValue";
import { useTimeWithFallback } from "../../contexts/TimeContext";

interface CameraStatValueProps {
  camera: AdvancedCameraSnapshot | null;
  lastExposureDuration?: number | null;
}

export function CameraStatValue({ camera, lastExposureDuration }: CameraStatValueProps) {
  const now = useTimeWithFallback();
  const exposureRef = useRef<{
    key: string | null;
    initialRemaining: number | null;
  }>({ key: null, initialRemaining: null });

  if (!camera) {
    return <StatValue>—</StatValue>;
  }

  const cameraRemainingSeconds = getRemainingSeconds(camera, now);

  // Track initial remaining for progress calculation
  useEffect(() => {
    if (!camera?.isExposing || cameraRemainingSeconds === null) {
      exposureRef.current = { key: null, initialRemaining: null };
      return;
    }

    const key = camera.exposureEndTime ?? `exposure-${Math.floor(cameraRemainingSeconds)}`;
    if (exposureRef.current.key !== key) {
      exposureRef.current = {
        key,
        initialRemaining: cameraRemainingSeconds,
      };
    }
  }, [camera?.isExposing, camera?.exposureEndTime, cameraRemainingSeconds]);

  const cameraProgress = computeExposureProgress(
    camera,
    now,
    lastExposureDuration ?? camera.lastExposureDurationSeconds ?? null,
    cameraRemainingSeconds,
    exposureRef.current.initialRemaining,
  );

  const status = formatCameraStatus(camera, now, cameraProgress);

  return <StatValue>{status}</StatValue>;
}

export function useCameraProgress(
  camera: AdvancedCameraSnapshot | null,
  lastExposureDuration?: number | null
): ExposureProgress | null {
  const now = useTimeWithFallback();
  const exposureRef = useRef<{
    key: string | null;
    initialRemaining: number | null;
  }>({ key: null, initialRemaining: null });

  if (!camera) {
    return null;
  }

  const cameraRemainingSeconds = getRemainingSeconds(camera, now);

  // Track initial remaining for progress calculation
  useEffect(() => {
    if (!camera?.isExposing || cameraRemainingSeconds === null) {
      exposureRef.current = { key: null, initialRemaining: null };
      return;
    }

    const key = camera.exposureEndTime ?? `exposure-${Math.floor(cameraRemainingSeconds)}`;
    if (exposureRef.current.key !== key) {
      exposureRef.current = {
        key,
        initialRemaining: cameraRemainingSeconds,
      };
    }
  }, [camera?.isExposing, camera?.exposureEndTime, cameraRemainingSeconds]);

  return computeExposureProgress(
    camera,
    now,
    lastExposureDuration ?? camera.lastExposureDurationSeconds ?? null,
    cameraRemainingSeconds,
    exposureRef.current.initialRemaining,
  );
}