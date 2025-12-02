const API_BASE = "https://astrosphericpublicaccess.azurewebsites.net/api";

export interface AstrosphericForecastRequest {
  Ession: string; // API key
  Ession2: string; // Must match Ession
  Ession3: string; // Must match Ession
  Lat: number;
  Long: number;
}

export interface WindData {
  Speed_kph: number;
  Direction: string;
  Gust_kph: number;
}

export interface ForecastDataPoint {
  LocalTime: string;
  UTCTime: string;
  CloudCover: number; // 0-100%
  Transparency: number; // 1-5 scale (5 = excellent)
  Seeing: number; // 1-5 scale (5 = excellent)
  Darkness: number; // Sky brightness
  Temperature_C: number;
  DewPoint_C: number;
  RelativeHumidity: number;
  Wind: WindData;
  Smoke: number; // 0-5 scale
  LiftedIndex: number;
}

export interface AstrosphericForecastResponse {
  StatusCode: number;
  ErrorMessage: string | null;
  ForecastData: ForecastDataPoint[];
}

export async function getForecast(
  apiKey: string,
  lat: number,
  lon: number
): Promise<AstrosphericForecastResponse> {
  const request: AstrosphericForecastRequest = {
    Ession: apiKey,
    Ession2: apiKey,
    Ession3: apiKey,
    Lat: lat,
    Long: lon,
  };

  const response = await fetch(`${API_BASE}/GetForecastData_V1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Astrospheric API error: ${response.status}`);
  }

  return response.json();
}

export interface NightForecast {
  date: string;
  sunset: Date;
  sunrise: Date;
  hours: ForecastDataPoint[];
  avgCloudCover: number;
  avgSeeing: number;
  avgTransparency: number;
  minTemp: number;
  maxHumidity: number;
  hasSmoke: boolean;
  score: number; // 0-100 overall quality score
}

export function scoreNight(hours: ForecastDataPoint[]): number {
  if (hours.length === 0) return 0;

  // Weight factors for scoring
  const weights = {
    clouds: 0.4, // Cloud cover is most important
    seeing: 0.25,
    transparency: 0.2,
    humidity: 0.1,
    smoke: 0.05,
  };

  let cloudScore = 0;
  let seeingScore = 0;
  let transparencyScore = 0;
  let humidityScore = 0;
  let smokeScore = 0;

  for (const hour of hours) {
    // Cloud cover: 0% = 100 points, 100% = 0 points
    cloudScore += (100 - hour.CloudCover) / 100;

    // Seeing: 1-5 scale, normalize to 0-1
    seeingScore += (hour.Seeing - 1) / 4;

    // Transparency: 1-5 scale, normalize to 0-1
    transparencyScore += (hour.Transparency - 1) / 4;

    // Humidity: lower is better, <60% ideal
    humidityScore += hour.RelativeHumidity < 60 ? 1 : (100 - hour.RelativeHumidity) / 40;

    // Smoke: 0-5 scale, lower is better
    smokeScore += (5 - hour.Smoke) / 5;
  }

  const n = hours.length;
  const score =
    weights.clouds * (cloudScore / n) +
    weights.seeing * (seeingScore / n) +
    weights.transparency * (transparencyScore / n) +
    weights.humidity * (humidityScore / n) +
    weights.smoke * (smokeScore / n);

  return Math.round(score * 100);
}

export function analyzeNight(
  forecast: ForecastDataPoint[],
  date: string
): NightForecast | null {
  // Filter to nighttime hours (after sunset, before sunrise)
  // We'll approximate: consider hours where Darkness > some threshold
  // or simply use evening hours (18:00 - 06:00)
  const nightHours = forecast.filter((h) => {
    const hour = new Date(h.LocalTime).getHours();
    return hour >= 18 || hour < 6;
  });

  if (nightHours.length === 0) return null;

  const avgCloudCover =
    nightHours.reduce((sum, h) => sum + h.CloudCover, 0) / nightHours.length;
  const avgSeeing =
    nightHours.reduce((sum, h) => sum + h.Seeing, 0) / nightHours.length;
  const avgTransparency =
    nightHours.reduce((sum, h) => sum + h.Transparency, 0) / nightHours.length;
  const minTemp = Math.min(...nightHours.map((h) => h.Temperature_C));
  const maxHumidity = Math.max(...nightHours.map((h) => h.RelativeHumidity));
  const hasSmoke = nightHours.some((h) => h.Smoke > 2);

  return {
    date,
    sunset: new Date(nightHours[0].LocalTime),
    sunrise: new Date(nightHours[nightHours.length - 1].LocalTime),
    hours: nightHours,
    avgCloudCover,
    avgSeeing,
    avgTransparency,
    minTemp,
    maxHumidity,
    hasSmoke,
    score: scoreNight(nightHours),
  };
}

export function formatNightSummary(night: NightForecast): string {
  const rating =
    night.score >= 80
      ? "🟢 Excellent"
      : night.score >= 60
        ? "🟡 Good"
        : night.score >= 40
          ? "🟠 Fair"
          : "🔴 Poor";

  const lines = [
    `**${night.date}** - ${rating} (${night.score}/100)`,
    `☁️ Clouds: ${Math.round(night.avgCloudCover)}%`,
    `👁️ Seeing: ${night.avgSeeing.toFixed(1)}/5`,
    `✨ Transparency: ${night.avgTransparency.toFixed(1)}/5`,
    `🌡️ Low: ${Math.round(night.minTemp)}°C`,
    `💧 Max Humidity: ${Math.round(night.maxHumidity)}%`,
  ];

  if (night.hasSmoke) {
    lines.push(`🔥 Smoke advisory`);
  }

  return lines.join("\n");
}
