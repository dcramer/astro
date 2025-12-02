/**
 * Astrospheric API Client
 *
 * Fetches and parses weather forecast data from Astrospheric for astrophotography planning.
 *
 * ## API Rate Limits (Pro members)
 * - 100 API credits per day
 * - Credits refresh at midnight UTC
 * - Forecast data is updated every 6 hours
 * - We cache responses for 6 hours to match update frequency
 *
 * ## Data Scales (IMPORTANT - both use "lower is better")
 * - **Seeing**: Arc-seconds (1" = excellent, 5" = terrible)
 * - **Transparency**: Extinction index (0 = perfect, 30+ = terrible)
 * - **Cloud Cover**: Percentage (0% = clear, 100% = overcast)
 *
 * @see https://www.astrospheric.com/dynamiccontent/api_info.html
 */

import { z } from "zod";
import SunCalc from "suncalc";

const API_BASE = "https://astrosphericpublicaccess.azurewebsites.net/api";

/**
 * Cache TTL matches Astrospheric's forecast update frequency (6 hours).
 * No point fetching more frequently since the data won't change.
 */
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

/** Request payload for the Astrospheric forecast API */
export interface AstrosphericForecastRequest {
  APIKey: string;
  Latitude: number;
  Longitude: number;
}

// =============================================================================
// Zod Schemas for API Response Validation
// =============================================================================

/**
 * Individual data point in a forecast array.
 * Each hour of forecast data contains a value and color for display.
 */
const DataPointSchema = z.object({
  Value: z.object({
    /** Hex color code used by Astrospheric to visualize the value */
    ValueColor: z.string(),
    /** The actual numeric value for this hour */
    ActualValue: z.number(),
  }),
  /** Hours offset from LocalStartTime (0 = first hour) */
  HourOffset: z.number(),
});

/**
 * Full Astrospheric API response schema.
 *
 * ## Cloud Cover Sources (in order of preference)
 * - RDPS: Regional Deterministic Prediction System (Canada, higher resolution)
 * - NAM: North American Mesoscale (US, good resolution)
 * - GFS: Global Forecast System (global, lower resolution)
 *
 * ## Seeing & Transparency
 * - Astrospheric_Seeing: Arc-seconds (lower = better, 1" excellent, 5" terrible)
 * - Astrospheric_Transparency: Extinction index (lower = better, 0 perfect, 30+ terrible)
 *
 * ## Temperature Data
 * - RDPS_Temperature: Kelvin (convert to Celsius: K - 273.15)
 * - RDPS_DewPoint: Kelvin
 */
export const AstrosphericForecastResponseSchema = z.object({
  /** Local time when forecast starts (ISO 8601 string) */
  LocalStartTime: z.string(),
  /** UTC time when forecast starts (ISO 8601 string) */
  UTCStartTime: z.string(),
  /** IANA timezone identifier (e.g., "America/Los_Angeles") */
  TimeZone: z.string(),
  /** Forecast location latitude */
  Latitude: z.number(),
  /** Forecast location longitude */
  Longitude: z.number(),
  /** Number of API credits used today (max 100/day for Pro) */
  APICreditUsedToday: z.number(),

  // Cloud cover from different weather models (use first available)
  /** RDPS cloud cover - Canadian model, high resolution, preferred */
  RDPS_CloudCover: z.array(DataPointSchema).nullable(),
  /** NAM cloud cover - US model, good fallback */
  NAM_CloudCover: z.array(DataPointSchema).nullable(),
  /** GFS cloud cover - Global model, lowest resolution fallback */
  GFS_CloudCover: z.array(DataPointSchema).nullable(),

  /**
   * Astronomical seeing in arc-seconds. LOWER IS BETTER.
   * - 1" = Excellent (rare)
   * - 2" = Good
   * - 3" = Average
   * - 4"+ = Poor
   */
  Astrospheric_Seeing: z.array(DataPointSchema).nullable(),

  /**
   * Atmospheric transparency/extinction index. LOWER IS BETTER.
   * - 0-5 = Excellent
   * - 5-15 = Good to Average
   * - 15-25 = Poor
   * - 25+ = Terrible (clouds/haze)
   */
  Astrospheric_Transparency: z.array(DataPointSchema).nullable(),

  /** Temperature in Kelvin (subtract 273.15 for Celsius) */
  RDPS_Temperature: z.array(DataPointSchema).nullable(),
  /** Dew point in Kelvin */
  RDPS_DewPoint: z.array(DataPointSchema).nullable(),
  /** Wind velocity (m/s) */
  RDPS_WindVelocity: z.array(DataPointSchema).nullable(),
  /** Column aerosol mass - indicates smoke/dust (used in transparency calc) */
  RAP_ColumnAerosolMass: z.array(DataPointSchema).nullable(),
});

export type AstrosphericForecastResponse = z.infer<typeof AstrosphericForecastResponseSchema>;
type DataPoint = z.infer<typeof DataPointSchema>;

/**
 * Fetch forecast data from Astrospheric API with KV caching.
 *
 * Uses Cloudflare KV cache (6 hour TTL) matching Astrospheric's update frequency.
 * The API has a limit of 100 requests/day for Pro members, resetting at midnight UTC.
 *
 * @param apiKey - Astrospheric Pro API key
 * @param lat - Latitude of observation location
 * @param lon - Longitude of observation location
 * @param cache - Cloudflare KV namespace for caching
 * @returns Parsed and validated forecast response
 * @throws Error if API returns non-200 status or invalid data
 */
export async function getForecast(
  apiKey: string,
  lat: number,
  lon: number,
  cache: KVNamespace
): Promise<AstrosphericForecastResponse> {
  const cacheKey = `forecast:${lat.toFixed(4)},${lon.toFixed(4)}`;

  // Check KV cache first
  const cached = await cache.get(cacheKey, "json");
  if (cached) {
    console.log("Using cached Astrospheric data from KV");
    return AstrosphericForecastResponseSchema.parse(cached);
  }

  const request: AstrosphericForecastRequest = {
    APIKey: apiKey,
    Latitude: lat,
    Longitude: lon,
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

  const data = await response.json();
  const parsed = AstrosphericForecastResponseSchema.parse(data);

  // Store in KV with TTL
  await cache.put(cacheKey, JSON.stringify(parsed), {
    expirationTtl: CACHE_TTL_SECONDS,
  });
  console.log("Cached fresh Astrospheric data to KV");

  return parsed;
}

// =============================================================================
// Types
// =============================================================================

/**
 * Processed hourly forecast with calculated scores.
 * Derived from raw Astrospheric API data with scoring applied.
 */
export interface HourlyForecast {
  /** Hours offset from forecast start (0 = first hour) */
  hourOffset: number;
  /** Local time for this hour */
  localTime: Date;
  /** Cloud cover percentage (0-100%). Lower = better. */
  cloudCover: number;
  /** Seeing in arc-seconds (1-5 typical). LOWER = BETTER (tighter stars). */
  seeing: number;
  /** Transparency/extinction index (0-30+ typical). LOWER = BETTER. */
  transparency: number;
  /** Temperature in Celsius */
  temperatureC: number;
  /** Dew point in Celsius */
  dewPointC: number;
  /** Calculated relative humidity (0-100%) */
  humidity: number;
  /** Multi-factor quality score (0-100). HIGHER = BETTER. */
  hourScore: number;
  /** Whether this hour meets minimum imaging thresholds */
  isImageable: boolean;
}

/**
 * A consecutive stretch of imageable hours.
 * Longer windows are better for DSO imaging (setup overhead, integration time).
 */
export interface ImagingWindow {
  /** When the imaging window starts */
  startHour: Date;
  /** When the imaging window ends */
  endHour: Date;
  /** Duration in hours */
  length: number;
  /** Average quality score of hours in window (0-100) */
  avgQuality: number;
}

/**
 * Complete analysis of a night's imaging potential.
 * Includes the go/no-go decision and reasoning.
 */
export interface NightForecast {
  /** All hours during astronomical night */
  hours: HourlyForecast[];
  /** Average cloud cover across the night (%) */
  avgCloudCover: number;
  /** Average transparency across the night (lower = better) */
  avgTransparency: number;
  /** Minimum temperature during the night (°C) */
  minTemp: number;
  /** Maximum humidity during the night (%) */
  maxHumidity: number;
  /** Best consecutive imaging window, or null if none found */
  bestWindow: ImagingWindow | null;
  /** Final score (0-100). Requires 60+ to notify. */
  score: number;
  /** Whether to send a notification (needs 6+ hours AND score >= 60) */
  shouldNotify: boolean;
  /** Human-readable explanation of the decision */
  reason: string;
  /** Whether a deal-breaker condition (like rain) was detected */
  hasDealBreaker: boolean;
  /** Explanation of deal-breaker if present */
  dealBreakerReason: string;
}

// =============================================================================
// Scoring Functions (optimized for urban DSO imaging)
// =============================================================================

/**
 * Score cloud cover (0-100, inverted - lower clouds = higher score).
 * Non-linear - heavily penalizes high cloud cover.
 */
export function scoreCloudCover(cloudPercent: number): number {
  if (cloudPercent >= 70) return 0;      // Unusable
  if (cloudPercent >= 50) return 30;     // Poor
  if (cloudPercent >= 30) return 60;     // Fair
  if (cloudPercent >= 15) return 80;     // Good
  return 100 - cloudPercent;             // Excellent
}

/**
 * Score transparency (0-100).
 * Astrospheric returns mag/airmass extinction - LOWER IS BETTER.
 * Scale appears to be 0-30+ range where values near 0 are excellent.
 */
export function scoreTransparency(rawValue: number): number {
  // Lower values = better transparency (less extinction)
  if (rawValue <= 5) return 100;    // Excellent
  if (rawValue <= 10) return 85;    // Very good
  if (rawValue <= 15) return 65;    // Decent
  if (rawValue <= 20) return 40;    // Poor
  if (rawValue <= 25) return 20;    // Bad
  return 0;                          // Terrible
}

/**
 * Score humidity (0-100, inverted - lower humidity = higher score).
 * Less critical for urban DSO - mainly affects dew formation.
 */
export function scoreHumidity(humidity: number): number {
  if (humidity >= 98) return 0;     // Dew certain
  if (humidity >= 90) return 50;    // High risk
  if (humidity >= 80) return 70;    // Moderate
  return 100 - humidity * 0.3;      // Good (less aggressive penalty)
}

/**
 * Score seeing (0-100).
 * Astrospheric returns arc-seconds - LOWER IS BETTER.
 * 1" = excellent, 2" = good, 3" = average, 4"+ = poor
 */
export function scoreSeeing(arcsec: number): number {
  // Lower values = better seeing (tighter stars)
  if (arcsec <= 1) return 100;    // Excellent
  if (arcsec <= 1.5) return 90;   // Very good
  if (arcsec <= 2) return 75;     // Good
  if (arcsec <= 2.5) return 60;   // Decent
  if (arcsec <= 3) return 40;     // Average
  if (arcsec <= 4) return 20;     // Poor
  return 0;                        // Terrible
}

/**
 * Score an hour using weighted multi-factor formula.
 * Weights optimized for urban DSO imaging:
 * - Clouds 50% (primary factor - blocks all photons)
 * - Seeing 30% (important for star shapes and overall quality)
 * - Transparency 15% (affects light pollution scatter)
 * - Humidity 5% (mostly just dew risk)
 */
export function scoreHour(hour: HourlyForecast): number {
  const cloudScore = scoreCloudCover(hour.cloudCover);
  const transparencyScore = scoreTransparency(hour.transparency);
  const humidityScore = scoreHumidity(hour.humidity);
  const seeingScore = scoreSeeing(hour.seeing);

  return cloudScore * 0.50 +
         seeingScore * 0.30 +
         transparencyScore * 0.15 +
         humidityScore * 0.05;
}

/**
 * Check if an hour meets minimum thresholds for imaging.
 * Uses 40% cloud threshold (urban DSO can tolerate thin clouds).
 * Humidity is less critical - only reject extreme saturation.
 */
export function isHourImageable(hour: HourlyForecast): boolean {
  return hour.cloudCover <= 40 && hour.humidity < 98;
}

// =============================================================================
// Rain/Deal Breaker Detection
// =============================================================================

/**
 * Get dew point depression (temperature - dew point).
 * Small values indicate near-saturation conditions.
 */
function getDewPointDepression(hour: HourlyForecast): number {
  return hour.temperatureC - hour.dewPointC;
}

/**
 * Check if rain is likely for a given hour.
 * Uses cloud cover + dew point depression + humidity.
 */
function isRainLikely(hour: HourlyForecast): boolean {
  const dewPointDepression = getDewPointDepression(hour);

  // 100% clouds = definite rain
  if (hour.cloudCover >= 100) return true;

  // High clouds + near-saturation = rain
  if (hour.cloudCover >= 80 && dewPointDepression < 3) return true;

  // Very high clouds + high humidity = rain/drizzle
  if (hour.cloudCover >= 70 && hour.humidity > 95) return true;

  return false;
}

/**
 * Check for absolute deal breakers that prevent imaging.
 * Trust cloud cover for fog detection (low clouds = fog in SF).
 */
function hasAbsoluteDealBreaker(hours: HourlyForecast[]): { failed: boolean; reason: string } {
  // Check for rain - multiple hours with high clouds + near-saturation
  const rainHours = hours.filter(h => isRainLikely(h));
  if (rainHours.length >= 3) {
    return {
      failed: true,
      reason: `Rain likely (${rainHours.length} hours with rain indicators)`,
    };
  }

  // Note: Fog is detected via cloud cover (low clouds), not humidity.
  // The consecutive window algorithm will handle cloudy hours.

  return { failed: false, reason: "" };
}

// =============================================================================
// Consecutive Window Finding
// =============================================================================

interface InternalWindow {
  startIndex: number;
  hours: HourlyForecast[];
  length: number;
  avgQuality: number;
}

/**
 * Find the best consecutive window of imageable hours.
 */
function findBestWindow(hours: HourlyForecast[]): ImagingWindow | null {
  const windows: InternalWindow[] = [];
  let currentStart: number | null = null;

  for (let i = 0; i <= hours.length; i++) {
    const isImageable = i < hours.length && hours[i].isImageable;

    if (isImageable && currentStart === null) {
      currentStart = i;
    } else if (!isImageable && currentStart !== null) {
      const windowHours = hours.slice(currentStart, i);
      if (windowHours.length >= 3) {  // Minimum 3 hours
        const avgQuality = windowHours.reduce((sum, h) => sum + h.hourScore, 0) / windowHours.length;
        windows.push({
          startIndex: currentStart,
          hours: windowHours,
          length: windowHours.length,
          avgQuality,
        });
      }
      currentStart = null;
    }
  }

  if (windows.length === 0) return null;

  // Sort by length (primary), then quality (secondary)
  windows.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return b.avgQuality - a.avgQuality;
  });

  const best = windows[0];
  return {
    startHour: best.hours[0].localTime,
    endHour: best.hours[best.hours.length - 1].localTime,
    length: best.length,
    avgQuality: Math.round(best.avgQuality),
  };
}

// =============================================================================
// Final Score Calculation
// =============================================================================

/**
 * Calculate final score and notification decision.
 * Requires 6+ consecutive hours AND score >= 60 to notify.
 */
function calculateFinalScore(
  bestWindow: ImagingWindow | null,
  totalNightHours: number
): { score: number; shouldNotify: boolean; reason: string } {
  if (!bestWindow) {
    return { score: 0, shouldNotify: false, reason: "No consecutive clear hours found" };
  }

  const { length, avgQuality } = bestWindow;

  // Length score (non-linear, reward 6+ hours heavily)
  let lengthScore: number;
  if (length >= 8) lengthScore = 100;
  else if (length >= 6) lengthScore = 80 + (length - 6) * 10;  // 80-100
  else if (length >= 4) lengthScore = 50 + (length - 4) * 15;  // 50-80
  else lengthScore = length * 15;                               // 0-45

  // Final score: 60% length, 40% quality
  const finalScore = Math.round(lengthScore * 0.60 + avgQuality * 0.40);

  // Decision: need 6+ hours AND score >= 60
  const shouldNotify = length >= 6 && finalScore >= 60;

  let reason: string;
  if (shouldNotify) {
    reason = `${length} consecutive clear hours with ${avgQuality}% quality`;
  } else if (length < 6) {
    reason = `Only ${length} consecutive hours (need 6+)`;
  } else {
    reason = `Quality too low: ${finalScore}/100`;
  }

  return { score: finalScore, shouldNotify, reason };
}

// =============================================================================
// Helper Functions
// =============================================================================

function kelvinToCelsius(k: number): number {
  return k - 273.15;
}

function calculateRelativeHumidity(tempC: number, dewPointC: number): number {
  const a = 17.27;
  const b = 237.7;
  const alphaT = (a * tempC) / (b + tempC);
  const alphaTd = (a * dewPointC) / (b + dewPointC);
  const rh = 100 * Math.exp(alphaTd - alphaT);
  return Math.min(100, Math.max(0, rh));
}

function getValue(dataPoints: DataPoint[] | null, index: number, defaultValue: number): number {
  if (!dataPoints || !dataPoints[index]) return defaultValue;
  return dataPoints[index].Value.ActualValue;
}

// =============================================================================
// Main Parsing and Analysis
// =============================================================================

/**
 * Parse the API response into hourly forecast data with scoring.
 */
export function parseHourlyForecasts(response: AstrosphericForecastResponse): HourlyForecast[] {
  const startTime = new Date(response.LocalStartTime);

  // Use RDPS cloud cover, fall back to NAM, then GFS
  const cloudData = response.RDPS_CloudCover ?? response.NAM_CloudCover ?? response.GFS_CloudCover;

  if (!cloudData) {
    throw new Error("No cloud cover data available");
  }

  const hours: HourlyForecast[] = [];

  for (let i = 0; i < cloudData.length; i++) {
    const localTime = new Date(startTime);
    localTime.setHours(localTime.getHours() + i);

    const tempK = getValue(response.RDPS_Temperature, i, 283);
    const dewPointK = getValue(response.RDPS_DewPoint, i, 278);
    const tempC = kelvinToCelsius(tempK);
    const dewPointC = kelvinToCelsius(dewPointK);

    const hour: HourlyForecast = {
      hourOffset: i,
      localTime,
      cloudCover: getValue(cloudData, i, 50),
      seeing: getValue(response.Astrospheric_Seeing, i, 3),
      transparency: getValue(response.Astrospheric_Transparency, i, 10),
      temperatureC: tempC,
      dewPointC,
      humidity: calculateRelativeHumidity(tempC, dewPointC),
      hourScore: 0,
      isImageable: false,
    };

    // Calculate derived fields
    hour.hourScore = scoreHour(hour);
    hour.isImageable = isHourImageable(hour);

    hours.push(hour);
  }

  return hours;
}

/**
 * Get astronomical twilight times for tonight.
 */
export function getAstronomicalNight(lat: number, lon: number): { start: Date; end: Date } {
  const now = new Date();

  let times = SunCalc.getTimes(now, lat, lon);

  // If before astronomical dawn, we're still in last night
  if (now < times.nightEnd) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    times = SunCalc.getTimes(yesterday, lat, lon);
  }

  const start = times.night;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = SunCalc.getTimes(tomorrow, lat, lon);
  const end = tomorrowTimes.nightEnd;

  return { start, end };
}

/**
 * Extract tonight's imaging hours based on astronomical twilight.
 */
export function getTonightHours(hours: HourlyForecast[], lat: number, lon: number): HourlyForecast[] {
  const { start, end } = getAstronomicalNight(lat, lon);
  return hours.filter((h) => h.localTime >= start && h.localTime < end);
}

/**
 * Analyze a night and return full forecast with scoring.
 */
export function analyzeNight(hours: HourlyForecast[]): NightForecast | null {
  if (hours.length === 0) return null;

  // Check for deal breakers first
  const dealBreaker = hasAbsoluteDealBreaker(hours);

  // Find best imaging window
  const bestWindow = findBestWindow(hours);

  // Calculate final score
  const { score, shouldNotify, reason } = dealBreaker.failed
    ? { score: 0, shouldNotify: false, reason: dealBreaker.reason }
    : calculateFinalScore(bestWindow, hours.length);

  // Summary stats
  const avgCloudCover = hours.reduce((sum, h) => sum + h.cloudCover, 0) / hours.length;
  const avgTransparency = hours.reduce((sum, h) => sum + h.transparency, 0) / hours.length;
  const minTemp = Math.min(...hours.map((h) => h.temperatureC));
  const maxHumidity = Math.max(...hours.map((h) => h.humidity));

  return {
    hours,
    avgCloudCover,
    avgTransparency,
    minTemp,
    maxHumidity,
    bestWindow,
    score,
    shouldNotify,
    reason,
    hasDealBreaker: dealBreaker.failed,
    dealBreakerReason: dealBreaker.reason,
  };
}

// =============================================================================
// Display Helpers
// =============================================================================

export function getRating(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

export function getRatingEmoji(score: number): string {
  if (score >= 80) return "🟢";
  if (score >= 60) return "🟡";
  if (score >= 40) return "🟠";
  return "🔴";
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatNightSummary(night: NightForecast): string {
  const lines: string[] = [];

  if (night.bestWindow) {
    const w = night.bestWindow;
    lines.push(
      `*Clear ${escapeMarkdownV2(formatTime(w.startHour))} \\- ${escapeMarkdownV2(formatTime(w.endHour))}* \\(${w.length} hours\\)`
    );
  }

  // Conditions line
  const cloudDesc = night.avgCloudCover < 15 ? "Clear" :
                    night.avgCloudCover < 30 ? "Mostly clear" :
                    night.avgCloudCover < 50 ? "Partly cloudy" : "Cloudy";
  lines.push(`☁️ ${cloudDesc} \\(~${Math.round(night.avgCloudCover)}%\\) \\| 🌡️ Low ${Math.round(night.minTemp)}°C`);

  if (night.hasDealBreaker) {
    lines.push(`⚠️ ${escapeMarkdownV2(night.dealBreakerReason)}`);
  }

  return lines.join("\n");
}
