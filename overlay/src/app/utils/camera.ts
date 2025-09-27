import type { AdvancedCameraSnapshot } from "@nina/advanced";
import { formatDuration } from "@nina/format";

export interface ExposureProgress {
  percent: number;
  remainingSeconds?: number | null;
  totalSeconds?: number | null;
  elapsedSeconds?: number | null;
}

function mapCameraState(state: number | null | undefined): string | null {
  if (state === undefined || state === null) {
    return null;
  }

  switch (state) {
    case -1:
      return "Idle";
    case 0:
      return "Waiting";
    case 1:
      return "Exposing";
    case 2:
      return "Reading";
    case 3:
      return "Downloading";
    case 4:
      return "Camera Busy";
    case 5:
      return "Camera Error";
    default:
      return null;
  }
}

export function formatCameraStatus(
  camera: AdvancedCameraSnapshot,
  now: number,
  progress?: ExposureProgress | null,
): string {
  if (camera.isExposing) {
    if (
      progress &&
      progress.remainingSeconds !== null &&
      progress.remainingSeconds !== undefined &&
      progress.remainingSeconds > 0
    ) {
      return `Exposing (${formatDuration(progress.remainingSeconds)})`;
    }

    if (camera.exposureEndTime) {
      const endsAtMs = new Date(camera.exposureEndTime).getTime();
      if (Number.isFinite(endsAtMs)) {
        const remainingSeconds = Math.round((endsAtMs - now) / 1000);
        if (remainingSeconds > 0) {
          return `Exposing (${formatDuration(remainingSeconds)})`;
        }
      }
    }
    return "Exposing";
  }

  const stateLabel = mapCameraState(camera.cameraState);
  if (stateLabel === "Downloading" && camera.lastDownloadTimeSeconds) {
    return `Downloading (${formatDuration(camera.lastDownloadTimeSeconds)} last)`;
  }

  return stateLabel ?? "Idle";
}

export function computeExposureProgress(
  camera: AdvancedCameraSnapshot,
  now: number,
  fallbackDuration: number | null,
  knownRemainingSeconds: number | null,
  initialRemainingSeconds: number | null,
): ExposureProgress | null {
  if (!camera.isExposing) {
    return null;
  }

  let total = camera.exposureDurationSeconds ?? null;
  const elapsedFromCamera = camera.elapsedExposureSeconds ?? null;
  let remainingSeconds = knownRemainingSeconds;

  let elapsedSeconds: number | null = null;
  if (remainingSeconds !== null && total !== null) {
    elapsedSeconds = Math.max(0, Math.min(total, total - remainingSeconds));
  } else if (elapsedFromCamera !== null) {
    elapsedSeconds = elapsedFromCamera;
  }

  if ((total === null || total <= 0) && elapsedFromCamera !== null && remainingSeconds !== null) {
    total = Math.max(remainingSeconds + elapsedFromCamera, 0);
  }

  if ((total === null || total <= 0) && elapsedFromCamera !== null && remainingSeconds === null) {
    total = Math.max(elapsedFromCamera, 0);
  }

  if ((total === null || total <= 0) && camera.lastExposureDurationSeconds) {
    total = camera.lastExposureDurationSeconds;
  }

  if ((total === null || total <= 0) && fallbackDuration) {
    total = fallbackDuration;
  }

  if ((total === null || total <= 0) && initialRemainingSeconds) {
    total = initialRemainingSeconds;
  }

  if (elapsedSeconds === null && total !== null && remainingSeconds !== null) {
    elapsedSeconds = Math.max(0, Math.min(total, total - remainingSeconds));
  }

  if (remainingSeconds === null && total !== null && elapsedSeconds !== null) {
    remainingSeconds = Math.max(0, Math.round(total - elapsedSeconds));
  }

  if (camera.isExposing && total !== null && total > 0) {
    if (elapsedSeconds === null) {
      elapsedSeconds = Math.max(0, elapsedFromCamera ?? 0);
    }
    if (remainingSeconds === null) {
      remainingSeconds = Math.max(0, Math.round(total - (elapsedSeconds ?? 0)));
    }
  }

  const percent =
    total && total > 0 && elapsedSeconds !== null
      ? Math.min(1, Math.max(0, elapsedSeconds / total))
      : null;

  if (percent === null) {
    return null;
  }

  return {
    percent,
    remainingSeconds,
    totalSeconds: total,
    elapsedSeconds,
  };
}

export function getRemainingSeconds(
  camera: AdvancedCameraSnapshot | null,
  now: number,
): number | null {
  if (!camera?.isExposing || !camera.exposureEndTime) {
    return null;
  }

  const endMs = new Date(camera.exposureEndTime).getTime();
  if (!Number.isFinite(endMs)) {
    return null;
  }

  return Math.max(0, Math.round((endMs - now) / 1000));
}