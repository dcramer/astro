import type { NinaWeatherInfo } from "@nina/advanced";

function normalizeString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function formatSkyQuality(
  weather: NinaWeatherInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (!weather) {
    return "—";
  }

  const skyQualityRaw = normalizeString(weather.skyQuality);
  if (skyQualityRaw) {
    const numeric = Number.parseFloat(skyQualityRaw);
    if (Number.isFinite(numeric)) {
      return numeric.toFixed(1);
    }

    if (skyQualityRaw.toLowerCase() === "nan") {
      return "—";
    }

    return skyQualityRaw;
  }

  return "—";
}

export function formatAmbientTemperature(
  weather: NinaWeatherInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (!weather || weather.temperatureCelsius === undefined || weather.temperatureCelsius === null) {
    return "—";
  }

  return `${weather.temperatureCelsius.toFixed(1)}°C`;
}

export function formatHumidity(
  weather: NinaWeatherInfo | null,
  options: { connectionOffline: boolean; hasConnected: boolean },
): string {
  if (options.connectionOffline) {
    return "<Offline>";
  }

  if (!options.hasConnected) {
    return "<Loading>";
  }

  if (weather?.humidityPercent === undefined || weather.humidityPercent === null) {
    return "—";
  }

  return `${Math.round(weather.humidityPercent)}%`;
}