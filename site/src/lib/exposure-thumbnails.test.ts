import assert from "node:assert/strict";
import test from "node:test";

import {
  compareThumbnailCandidates,
  getBestThumbnailExposure,
  type ThumbnailCandidate,
} from "./exposure-thumbnails";

function createCandidate(overrides: Partial<ThumbnailCandidate> = {}): ThumbnailCandidate {
  return {
    exposureId: "exp-1",
    startedAt: "2026-03-18T10:00:00.000Z",
    detectedStars: 100,
    hfr: 2,
    thumbnailKey: "sessions/test/exposures/exp-1",
    ...overrides,
  };
}

test("getBestThumbnailExposure prefers higher star counts before HFR", () => {
  const sharpButSparse = createCandidate({
    exposureId: "sharp-but-sparse",
    detectedStars: 42,
    hfr: 1.1,
  });
  const softerButDense = createCandidate({
    exposureId: "softer-but-dense",
    detectedStars: 128,
    hfr: 2.6,
  });

  assert.equal(getBestThumbnailExposure([sharpButSparse, softerButDense])?.exposureId, "softer-but-dense");
});

test("getBestThumbnailExposure uses lower HFR when star counts tie", () => {
  const softer = createCandidate({
    exposureId: "softer",
    detectedStars: 88,
    hfr: 2.4,
  });
  const sharper = createCandidate({
    exposureId: "sharper",
    detectedStars: 88,
    hfr: 1.7,
  });

  assert.equal(getBestThumbnailExposure([softer, sharper])?.exposureId, "sharper");
});

test("compareThumbnailCandidates falls back to newest capture for identical metrics", () => {
  const older = createCandidate({
    exposureId: "older",
    startedAt: "2026-03-18T09:00:00.000Z",
  });
  const newer = createCandidate({
    exposureId: "newer",
    startedAt: "2026-03-18T10:00:00.000Z",
  });

  assert.ok(compareThumbnailCandidates(newer, older) < 0);
  assert.ok(compareThumbnailCandidates(older, newer) > 0);
});
