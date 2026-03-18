export interface ThumbnailCandidate {
  readonly exposureId: string;
  readonly startedAt: string;
  readonly detectedStars: number | null;
  readonly hfr: number | null;
  readonly thumbnailKey: string | null;
}

export const BEST_THUMBNAIL_EXPOSURE_ORDER = `
        exposures.detected_stars DESC,
        CASE WHEN exposures.hfr IS NULL THEN 1 ELSE 0 END ASC,
        exposures.hfr ASC,
        datetime(exposures.started_at) DESC,
        exposures.exposure_id DESC
`;

export function buildExposureThumbnailKey(sessionKey: string, exposureId: string): string {
  return `sessions/${sessionKey}/exposures/${exposureId}`;
}

export function compareThumbnailCandidates<T extends ThumbnailCandidate>(left: T, right: T): number {
  const starDelta = (right.detectedStars ?? -1) - (left.detectedStars ?? -1);
  if (starDelta !== 0) {
    return starDelta;
  }

  const leftHfr = left.hfr ?? Number.POSITIVE_INFINITY;
  const rightHfr = right.hfr ?? Number.POSITIVE_INFINITY;
  if (leftHfr !== rightHfr) {
    return leftHfr - rightHfr;
  }

  const startedDelta = right.startedAt.localeCompare(left.startedAt);
  if (startedDelta !== 0) {
    return startedDelta;
  }

  return right.exposureId.localeCompare(left.exposureId);
}

export function getBestThumbnailExposure<T extends ThumbnailCandidate>(
  exposures: ReadonlyArray<T>,
): T | null {
  if (!exposures.length) {
    return null;
  }

  return [...exposures].sort(compareThumbnailCandidates)[0] ?? null;
}
