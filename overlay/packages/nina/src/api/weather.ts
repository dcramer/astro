import { getNinaAdvancedApiBaseUrl } from "../config";
import { fetchAdvancedResponse } from "./client";
import type { NinaWeatherInfo, RawWeatherInfo } from "./types";
import { toNumber } from "./utils";

function coerceString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue ? stringValue : null;
}

function transformWeatherInfo(raw: RawWeatherInfo | null | undefined): NinaWeatherInfo | null {
  if (!raw) {
    return null;
  }

  return {
    averagePeriodSeconds: toNumber(raw.AveragePeriod),
    cloudCoverPercent: toNumber(raw.CloudCover),
    dewPointCelsius: toNumber(raw.DewPoint),
    humidityPercent: toNumber(raw.Humidity),
    pressureHPa: toNumber(raw.Pressure),
    rainRate: coerceString(raw.RainRate),
    skyBrightness: coerceString(raw.SkyBrightness),
    skyQuality: coerceString(raw.SkyQuality),
    skyTemperature: coerceString(raw.SkyTemperature),
    starFwhm: coerceString(raw.StarFWHM),
    temperatureCelsius: toNumber(raw.Temperature),
    windDirectionDegrees: toNumber(raw.WindDirection),
    windGust: coerceString(raw.WindGust),
    windSpeedMps: toNumber(raw.WindSpeed),
    connected: typeof raw.Connected === "boolean" ? raw.Connected : null,
    name: coerceString(raw.Name),
    displayName: coerceString(raw.DisplayName),
    description: coerceString(raw.Description),
  };
}

export async function loadWeatherInfo(): Promise<NinaWeatherInfo | null> {
  const baseUrl = getNinaAdvancedApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const raw = await fetchAdvancedResponse<RawWeatherInfo | null>(
    baseUrl,
    "/v2/api/equipment/weather/info",
  );

  return transformWeatherInfo(raw);
}
