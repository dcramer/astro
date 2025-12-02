import { describe, it, expect } from "vitest";
import {
  scoreCloudCover,
  scoreTransparency,
  scoreHumidity,
  scoreSeeing,
  scoreHour,
  isHourImageable,
  parseHourlyForecasts,
  analyzeNight,
  type HourlyForecast,
  type AstrosphericForecastResponse,
} from "./astrospheric";

// =============================================================================
// Test Helpers
// =============================================================================

function createHour(overrides: Partial<HourlyForecast> = {}): HourlyForecast {
  const base: HourlyForecast = {
    hourOffset: 0,
    localTime: new Date("2024-01-15T22:00:00"),
    cloudCover: 10,
    seeing: 2,
    transparency: 5,
    temperatureC: 10,
    dewPointC: 5,
    humidity: 70,
    hourScore: 0,
    isImageable: true,
  };
  const hour = { ...base, ...overrides };
  // Recalculate derived fields if not explicitly overridden
  if (!("hourScore" in overrides)) {
    hour.hourScore = scoreHour(hour);
  }
  if (!("isImageable" in overrides)) {
    hour.isImageable = isHourImageable(hour);
  }
  return hour;
}

// =============================================================================
// Scoring Function Tests
// =============================================================================

describe("scoreCloudCover", () => {
  it("returns 0 for unusable conditions (>= 70%)", () => {
    expect(scoreCloudCover(70)).toBe(0);
    expect(scoreCloudCover(80)).toBe(0);
    expect(scoreCloudCover(100)).toBe(0);
  });

  it("returns 30 for poor conditions (50-69%)", () => {
    expect(scoreCloudCover(50)).toBe(30);
    expect(scoreCloudCover(60)).toBe(30);
    expect(scoreCloudCover(69)).toBe(30);
  });

  it("returns 60 for fair conditions (30-49%)", () => {
    expect(scoreCloudCover(30)).toBe(60);
    expect(scoreCloudCover(40)).toBe(60);
    expect(scoreCloudCover(49)).toBe(60);
  });

  it("returns 80 for good conditions (15-29%)", () => {
    expect(scoreCloudCover(15)).toBe(80);
    expect(scoreCloudCover(20)).toBe(80);
    expect(scoreCloudCover(29)).toBe(80);
  });

  it("returns excellent scores for clear skies (< 15%)", () => {
    expect(scoreCloudCover(0)).toBe(100);
    expect(scoreCloudCover(5)).toBe(95);
    expect(scoreCloudCover(10)).toBe(90);
    expect(scoreCloudCover(14)).toBe(86);
  });
});

describe("scoreSeeing - arc-seconds (lower is better)", () => {
  it("returns 100 for excellent seeing (<= 1 arcsec)", () => {
    expect(scoreSeeing(0.5)).toBe(100);
    expect(scoreSeeing(1)).toBe(100);
  });

  it("returns 90 for very good seeing (1-1.5 arcsec)", () => {
    expect(scoreSeeing(1.3)).toBe(90);
    expect(scoreSeeing(1.5)).toBe(90);
  });

  it("returns 75 for good seeing (1.5-2 arcsec)", () => {
    expect(scoreSeeing(1.8)).toBe(75);
    expect(scoreSeeing(2)).toBe(75);
  });

  it("returns 60 for decent seeing (2-2.5 arcsec)", () => {
    expect(scoreSeeing(2.2)).toBe(60);
    expect(scoreSeeing(2.5)).toBe(60);
  });

  it("returns 40 for average seeing (2.5-3 arcsec)", () => {
    expect(scoreSeeing(2.8)).toBe(40);
    expect(scoreSeeing(3)).toBe(40);
  });

  it("returns 20 for poor seeing (3-4 arcsec)", () => {
    expect(scoreSeeing(3.5)).toBe(20);
    expect(scoreSeeing(4)).toBe(20);
  });

  it("returns 0 for terrible seeing (> 4 arcsec)", () => {
    expect(scoreSeeing(4.5)).toBe(0);
    expect(scoreSeeing(5)).toBe(0);
  });
});

describe("scoreTransparency - extinction index (lower is better)", () => {
  it("returns 100 for excellent transparency (<= 5)", () => {
    expect(scoreTransparency(0)).toBe(100);
    expect(scoreTransparency(3)).toBe(100);
    expect(scoreTransparency(5)).toBe(100);
  });

  it("returns 85 for very good transparency (5-10)", () => {
    expect(scoreTransparency(7)).toBe(85);
    expect(scoreTransparency(10)).toBe(85);
  });

  it("returns 65 for decent transparency (10-15)", () => {
    expect(scoreTransparency(12)).toBe(65);
    expect(scoreTransparency(15)).toBe(65);
  });

  it("returns 40 for poor transparency (15-20)", () => {
    expect(scoreTransparency(17)).toBe(40);
    expect(scoreTransparency(20)).toBe(40);
  });

  it("returns 20 for bad transparency (20-25)", () => {
    expect(scoreTransparency(22)).toBe(20);
    expect(scoreTransparency(25)).toBe(20);
  });

  it("returns 0 for terrible transparency (> 25)", () => {
    expect(scoreTransparency(27)).toBe(0);
    expect(scoreTransparency(30)).toBe(0);
  });
});

describe("scoreHumidity", () => {
  it("returns 0 for certain dew (>= 98%)", () => {
    expect(scoreHumidity(98)).toBe(0);
    expect(scoreHumidity(100)).toBe(0);
  });

  it("returns 50 for high dew risk (90-97%)", () => {
    expect(scoreHumidity(90)).toBe(50);
    expect(scoreHumidity(95)).toBe(50);
  });

  it("returns 70 for moderate humidity (80-89%)", () => {
    expect(scoreHumidity(80)).toBe(70);
    expect(scoreHumidity(85)).toBe(70);
  });

  it("returns good scores for low humidity (< 80%)", () => {
    expect(scoreHumidity(70)).toBe(79); // 100 - 70*0.3 = 79
    expect(scoreHumidity(50)).toBe(85); // 100 - 50*0.3 = 85
    expect(scoreHumidity(0)).toBe(100); // 100 - 0*0.3 = 100
  });
});

// =============================================================================
// Composite Score Tests
// =============================================================================

describe("scoreHour", () => {
  it("calculates weighted score correctly", () => {
    const hour = createHour({
      cloudCover: 0,    // 100 score * 0.50 = 50
      seeing: 1,        // 100 score * 0.30 = 30
      transparency: 0,  // 100 score * 0.15 = 15
      humidity: 0,      // 100 score * 0.05 = 5
    });
    expect(scoreHour(hour)).toBe(100);
  });

  it("penalizes high cloud cover heavily", () => {
    const clearHour = createHour({ cloudCover: 10 });
    const cloudyHour = createHour({ cloudCover: 70 });

    expect(scoreHour(clearHour)).toBeGreaterThan(scoreHour(cloudyHour));
    expect(scoreHour(cloudyHour)).toBeLessThan(50); // Cloud score = 0
  });

  it("penalizes poor seeing significantly", () => {
    const goodSeeing = createHour({ seeing: 1.5 });
    const poorSeeing = createHour({ seeing: 4 });

    const diff = scoreHour(goodSeeing) - scoreHour(poorSeeing);
    expect(diff).toBeGreaterThan(20); // 30% weight on seeing
  });
});

describe("isHourImageable", () => {
  it("returns true for good conditions", () => {
    const hour = createHour({ cloudCover: 20, humidity: 70 });
    expect(isHourImageable(hour)).toBe(true);
  });

  it("returns false when cloud cover exceeds 40%", () => {
    const hour = createHour({ cloudCover: 50, humidity: 70 });
    expect(isHourImageable(hour)).toBe(false);
  });

  it("returns false when humidity is 98% or higher", () => {
    const hour = createHour({ cloudCover: 20, humidity: 98 });
    expect(isHourImageable(hour)).toBe(false);
  });

  it("returns true at cloud cover threshold (40%)", () => {
    const hour = createHour({ cloudCover: 40, humidity: 70 });
    expect(isHourImageable(hour)).toBe(true);
  });
});

// =============================================================================
// Night Analysis Tests
// =============================================================================

describe("analyzeNight", () => {
  it("returns null for empty hours", () => {
    expect(analyzeNight([])).toBeNull();
  });

  it("finds consecutive imageable windows", () => {
    const hours = [
      createHour({ hourOffset: 0, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 1, cloudCover: 15 }),  // imageable
      createHour({ hourOffset: 2, cloudCover: 20 }),  // imageable
      createHour({ hourOffset: 3, cloudCover: 80 }),  // NOT imageable
      createHour({ hourOffset: 4, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 5, cloudCover: 10 }),  // imageable
    ];

    const result = analyzeNight(hours);
    expect(result).not.toBeNull();
    expect(result!.bestWindow).not.toBeNull();
    expect(result!.bestWindow!.length).toBe(3); // First window of 3 consecutive
  });

  it("requires minimum 3 consecutive hours for a window", () => {
    const hours = [
      createHour({ hourOffset: 0, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 1, cloudCover: 15 }),  // imageable
      createHour({ hourOffset: 2, cloudCover: 80 }),  // NOT
      createHour({ hourOffset: 3, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 4, cloudCover: 80 }),  // NOT
    ];

    const result = analyzeNight(hours);
    expect(result!.bestWindow).toBeNull();
    expect(result!.shouldNotify).toBe(false);
  });

  it("triggers notification for 6+ good hours", () => {
    const hours = Array.from({ length: 8 }, (_, i) =>
      createHour({
        hourOffset: i,
        cloudCover: 10,
        seeing: 2,
        transparency: 5,
      })
    );

    const result = analyzeNight(hours);
    expect(result!.bestWindow!.length).toBe(8);
    expect(result!.shouldNotify).toBe(true);
    expect(result!.score).toBeGreaterThanOrEqual(60);
  });

  it("does not notify for only 5 consecutive hours", () => {
    const hours = Array.from({ length: 5 }, (_, i) =>
      createHour({
        hourOffset: i,
        cloudCover: 10,
        seeing: 2,
        transparency: 5,
      })
    );

    const result = analyzeNight(hours);
    expect(result!.bestWindow!.length).toBe(5);
    expect(result!.shouldNotify).toBe(false);
    expect(result!.reason).toContain("Only 5 consecutive hours");
  });

  it("detects rain deal breakers", () => {
    const hours = Array.from({ length: 8 }, (_, i) =>
      createHour({
        hourOffset: i,
        cloudCover: 100,
        humidity: 98,
        temperatureC: 10,
        dewPointC: 9, // Near saturation
      })
    );

    const result = analyzeNight(hours);
    expect(result!.hasDealBreaker).toBe(true);
    expect(result!.dealBreakerReason).toContain("Rain likely");
    expect(result!.shouldNotify).toBe(false);
  });
});

// =============================================================================
// API Response Parsing Tests
// =============================================================================

describe("parseHourlyForecasts", () => {
  const minimalResponse: AstrosphericForecastResponse = {
    LocalStartTime: "2024-01-15T12:00:00",
    UTCStartTime: "2024-01-15T20:00:00",
    TimeZone: "America/Los_Angeles",
    Latitude: 37.77,
    Longitude: -122.42,
    APICreditUsedToday: 1,
    RDPS_CloudCover: [
      { Value: { ValueColor: "#00FF00", ActualValue: 10 }, HourOffset: 0 },
      { Value: { ValueColor: "#00FF00", ActualValue: 20 }, HourOffset: 1 },
    ],
    NAM_CloudCover: null,
    GFS_CloudCover: null,
    Astrospheric_Seeing: [
      { Value: { ValueColor: "#00FF00", ActualValue: 2 }, HourOffset: 0 },
      { Value: { ValueColor: "#00FF00", ActualValue: 2.5 }, HourOffset: 1 },
    ],
    Astrospheric_Transparency: [
      { Value: { ValueColor: "#00FF00", ActualValue: 5 }, HourOffset: 0 },
      { Value: { ValueColor: "#FFFF00", ActualValue: 15 }, HourOffset: 1 },
    ],
    RDPS_Temperature: [
      { Value: { ValueColor: "#FFF", ActualValue: 283 }, HourOffset: 0 }, // 10°C
      { Value: { ValueColor: "#FFF", ActualValue: 281 }, HourOffset: 1 }, // 8°C
    ],
    RDPS_DewPoint: [
      { Value: { ValueColor: "#FFF", ActualValue: 278 }, HourOffset: 0 }, // 5°C
      { Value: { ValueColor: "#FFF", ActualValue: 276 }, HourOffset: 1 }, // 3°C
    ],
    RDPS_WindVelocity: null,
    RAP_ColumnAerosolMass: null,
  };

  it("parses cloud cover correctly", () => {
    const hours = parseHourlyForecasts(minimalResponse);
    expect(hours[0].cloudCover).toBe(10);
    expect(hours[1].cloudCover).toBe(20);
  });

  it("parses seeing values correctly (arc-seconds)", () => {
    const hours = parseHourlyForecasts(minimalResponse);
    expect(hours[0].seeing).toBe(2);
    expect(hours[1].seeing).toBe(2.5);
  });

  it("parses transparency values correctly (extinction)", () => {
    const hours = parseHourlyForecasts(minimalResponse);
    expect(hours[0].transparency).toBe(5);
    expect(hours[1].transparency).toBe(15);
  });

  it("converts temperature from Kelvin to Celsius", () => {
    const hours = parseHourlyForecasts(minimalResponse);
    expect(hours[0].temperatureC).toBeCloseTo(9.85, 1);
    expect(hours[1].temperatureC).toBeCloseTo(7.85, 1);
  });

  it("calculates humidity from temp and dew point", () => {
    const hours = parseHourlyForecasts(minimalResponse);
    // With temp ~10°C and dew point ~5°C, humidity should be around 70%
    expect(hours[0].humidity).toBeGreaterThan(60);
    expect(hours[0].humidity).toBeLessThan(85);
  });

  it("calculates hourScore for each hour", () => {
    const hours = parseHourlyForecasts(minimalResponse);
    expect(hours[0].hourScore).toBeGreaterThan(0);
    expect(hours[1].hourScore).toBeGreaterThan(0);
  });

  it("calculates isImageable for each hour", () => {
    const hours = parseHourlyForecasts(minimalResponse);
    expect(hours[0].isImageable).toBe(true); // 10% clouds
    expect(hours[1].isImageable).toBe(true); // 20% clouds
  });

  it("throws when no cloud cover data available", () => {
    const noCloudData = {
      ...minimalResponse,
      RDPS_CloudCover: null,
      NAM_CloudCover: null,
      GFS_CloudCover: null,
    };
    expect(() => parseHourlyForecasts(noCloudData)).toThrow("No cloud cover data");
  });
});

// =============================================================================
// Real-World Scenario Tests
// =============================================================================

describe("real-world scenarios", () => {
  it("handles a typical good night in SF", () => {
    // Clear skies, decent seeing, good transparency
    const hours = Array.from({ length: 8 }, (_, i) =>
      createHour({
        hourOffset: i,
        localTime: new Date(`2024-01-15T${22 + i}:00:00`),
        cloudCover: 8 + i * 2,  // 8-22%
        seeing: 2.2,            // Decent seeing
        transparency: 8,        // Good transparency
        humidity: 70,
      })
    );

    const result = analyzeNight(hours);
    expect(result!.shouldNotify).toBe(true);
    expect(result!.score).toBeGreaterThanOrEqual(60);
  });

  it("handles a typical bad night with marine layer", () => {
    // High clouds, poor transparency (fog)
    const hours = Array.from({ length: 8 }, (_, i) =>
      createHour({
        hourOffset: i,
        cloudCover: 60 + i * 5,  // 60-95%
        seeing: 3,
        transparency: 25,        // Poor (fog)
        humidity: 95,
      })
    );

    const result = analyzeNight(hours);
    expect(result!.shouldNotify).toBe(false);
    expect(result!.bestWindow).toBeNull(); // No imageable hours
  });

  it("handles partial clearing", () => {
    // Clouds early, clearing later
    const hours = [
      createHour({ hourOffset: 0, cloudCover: 80 }),
      createHour({ hourOffset: 1, cloudCover: 70 }),
      createHour({ hourOffset: 2, cloudCover: 50 }),
      createHour({ hourOffset: 3, cloudCover: 30 }),
      createHour({ hourOffset: 4, cloudCover: 15 }),
      createHour({ hourOffset: 5, cloudCover: 10 }),
      createHour({ hourOffset: 6, cloudCover: 10 }),
      createHour({ hourOffset: 7, cloudCover: 10 }),
    ];

    const result = analyzeNight(hours);
    expect(result!.bestWindow!.length).toBe(5); // Hours 3-7 (30%, 15%, 10%, 10%, 10%)
    expect(result!.shouldNotify).toBe(false);   // Only 5 hours, need 6
  });
});
