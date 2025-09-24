import { getNinaAdvancedApiBaseUrl } from "../config";
import { fetchAdvancedResponse } from "./client";
import type { NinaMountInfo, RawMountInfo } from "./types";
import { toNumber } from "./utils";

function normalizeSideOfPier(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const lower = value.toLowerCase();
  if (lower.includes("east")) {
    return "east";
  }
  if (lower.includes("west")) {
    return "west";
  }
  return lower;
}

function transformMountInfo(raw: RawMountInfo | null | undefined): NinaMountInfo | null {
  if (!raw) {
    return null;
  }

  const coordinates = raw.Coordinates ?? undefined;

  const rightAscensionHours =
    toNumber(raw.RightAscension) ?? toNumber(coordinates?.RA) ?? null;
  const rightAscensionDegrees = toNumber(coordinates?.RADegrees);
  const declinationDegrees =
    toNumber(raw.Declination) ?? toNumber(coordinates?.Dec) ?? null;

  return {
    rightAscensionHours,
    rightAscensionDegrees,
    rightAscensionString: raw.RightAscensionString ?? coordinates?.RAString ?? null,
    declinationDegrees,
    declinationString: raw.DeclinationString ?? coordinates?.DecString ?? null,
    altitudeDegrees: toNumber(raw.Altitude),
    altitudeString: raw.AltitudeString ?? null,
    azimuthDegrees: toNumber(raw.Azimuth),
    azimuthString: raw.AzimuthString ?? null,
    siderealTimeHours: toNumber(raw.SiderealTime),
    siderealTimeString: raw.SiderealTimeString ?? null,
    timeToMeridianFlipSeconds: toNumber(raw.TimeToMeridianFlip),
    timeToMeridianFlipString: raw.TimeToMeridianFlipString ?? null,
    hoursToMeridianString: raw.HoursToMeridianString ?? null,
    trackingEnabled:
      typeof raw.TrackingEnabled === "boolean" ? raw.TrackingEnabled : null,
    trackingModes: raw.TrackingModes ?? null,
    slewing: typeof raw.Slewing === "boolean" ? raw.Slewing : null,
    atPark: typeof raw.AtPark === "boolean" ? raw.AtPark : null,
    atHome: typeof raw.AtHome === "boolean" ? raw.AtHome : null,
    sideOfPier: normalizeSideOfPier(raw.SideOfPier ?? null),
    siteLatitudeDegrees: toNumber(raw.SiteLatitude),
    siteLongitudeDegrees: toNumber(raw.SiteLongitude),
    siteElevationMeters: toNumber(raw.SiteElevation),
    alignmentMode: raw.AlignmentMode ?? null,
    equatorialSystem: raw.EquatorialSystem ?? null,
    guideRateRightAscensionArcsecPerSec: toNumber(
      raw.GuideRateRightAscensionArcsecPerSec,
    ),
    guideRateDeclinationArcsecPerSec: toNumber(
      raw.GuideRateDeclinationArcsecPerSec,
    ),
    isPulseGuiding: typeof raw.IsPulseGuiding === "boolean" ? raw.IsPulseGuiding : null,
    utcDate: raw.UTCDate ?? null,
    name: raw.Name ?? null,
    displayName: raw.DisplayName ?? null,
    connected: typeof raw.Connected === "boolean" ? raw.Connected : null,
  };
}

export async function loadMountInfo(): Promise<NinaMountInfo | null> {
  const baseUrl = getNinaAdvancedApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const raw = await fetchAdvancedResponse<RawMountInfo | null>(
    baseUrl,
    "/v2/api/equipment/mount/info",
  );

  return transformMountInfo(raw);
}
