import { createRequire } from "node:module";

import type { NinaMountInfo } from "@nina/advanced";

import type { CurrentTargetSnapshot } from "../lib/site-types";

const require = createRequire(import.meta.url);
const { LocalCatalogClient } = require("@astro/catalog") as typeof import("@astro/catalog");

const catalogClient = new LocalCatalogClient({ maxMagnitude: 14 });

const ROUGH_TARGET_SEARCH_RADIUS_DEGREES = 1.5;
const ROUGH_TARGET_TYPES = [
  "galaxy",
  "nebula",
  "planetary",
  "oc",
  "gc",
  "snr",
  "hii",
] as const;

function normalizeCatalogLabel(value: string): string {
  const trimmed = value.trim();
  const compact = trimmed.replace(/\s+/g, "");

  if (/^m\d+$/i.test(compact) || /^ngc\d+$/i.test(compact) || /^ic\d+$/i.test(compact)) {
    return compact.toUpperCase();
  }

  if (/^sh2[-_]?\d+$/i.test(compact)) {
    return compact.replace(/^sh2[-_]?/i, "Sh2-");
  }

  return trimmed;
}

function pickCatalogLabel(target: import("@astro/catalog").LocalCatalogTarget): string {
  const preferred = target.catalogIds.find((value) =>
    /^(m|ngc|ic)\s*\d+$/i.test(value.trim()) || /^sh2[-_\s]?\d+$/i.test(value.trim()),
  );

  return normalizeCatalogLabel(preferred ?? target.catalogId ?? target.name);
}

function getMountCoordinates(
  mount: NinaMountInfo | null,
): { ra: number; dec: number } | null {
  const ra = mount?.rightAscensionDegrees ?? null;
  const dec = mount?.declinationDegrees ?? null;

  if (!Number.isFinite(ra) || !Number.isFinite(dec)) {
    return null;
  }

  return { ra: Number(ra), dec: Number(dec) };
}

export async function resolveRoughPointingTarget(
  mount: NinaMountInfo | null,
): Promise<CurrentTargetSnapshot | null> {
  const coordinates = getMountCoordinates(mount);
  if (!coordinates) {
    return null;
  }

  try {
    const result = await catalogClient.searchTargets(
      coordinates.ra,
      coordinates.dec,
      ROUGH_TARGET_SEARCH_RADIUS_DEGREES,
      {
        types: [...ROUGH_TARGET_TYPES],
        magMax: 14,
      },
    );

    const bestMatch = result?.targets[0];
    if (!bestMatch) {
      return null;
    }

    return {
      name: `Near ${pickCatalogLabel(bestMatch)}`,
      ra: coordinates.ra,
      dec: coordinates.dec,
      source: "catalog",
      catalogId: normalizeCatalogLabel(bestMatch.catalogId),
      distanceArcmin: bestMatch.distance,
      searchRadiusArcmin: result?.searchRadius ?? ROUGH_TARGET_SEARCH_RADIUS_DEGREES * 60,
    };
  } catch (error) {
    console.warn("Failed to resolve rough pointing target from local catalog", error);
    return null;
  }
}
