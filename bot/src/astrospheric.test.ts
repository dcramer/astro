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
  it("returns 0 for unusable conditions (>= 50%)", () => {
    expect(scoreCloudCover(50)).toBe(0);
    expect(scoreCloudCover(70)).toBe(0);
    expect(scoreCloudCover(100)).toBe(0);
  });

  it("returns 10 for terrible conditions (30-49%)", () => {
    expect(scoreCloudCover(30)).toBe(10);
    expect(scoreCloudCover(40)).toBe(10);
    expect(scoreCloudCover(49)).toBe(10);
  });

  it("returns 25 for very poor conditions (20-29%)", () => {
    expect(scoreCloudCover(20)).toBe(25);
    expect(scoreCloudCover(25)).toBe(25);
    expect(scoreCloudCover(29)).toBe(25);
  });

  it("returns 40 for poor conditions (15-19%)", () => {
    expect(scoreCloudCover(15)).toBe(40);
    expect(scoreCloudCover(17)).toBe(40);
    expect(scoreCloudCover(19)).toBe(40);
  });

  it("returns 70 for marginal conditions (10-14%)", () => {
    expect(scoreCloudCover(10)).toBe(70);
    expect(scoreCloudCover(12)).toBe(70);
    expect(scoreCloudCover(14)).toBe(70);
  });

  it("returns 90 for good conditions (5-9%)", () => {
    expect(scoreCloudCover(5)).toBe(90);
    expect(scoreCloudCover(7)).toBe(90);
    expect(scoreCloudCover(9)).toBe(90);
  });

  it("returns excellent scores for clear skies (< 5%)", () => {
    expect(scoreCloudCover(0)).toBe(100);
    expect(scoreCloudCover(1)).toBe(99);
    expect(scoreCloudCover(3)).toBe(97);
    expect(scoreCloudCover(4)).toBe(96);
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

  it("returns 75 for good transparency (5-8)", () => {
    expect(scoreTransparency(7)).toBe(75);
    expect(scoreTransparency(8)).toBe(75);
  });

  it("returns 35 for poor transparency (8-12)", () => {
    expect(scoreTransparency(10)).toBe(35);
    expect(scoreTransparency(12)).toBe(35);
  });

  it("returns 15 for bad transparency (12-18)", () => {
    expect(scoreTransparency(15)).toBe(15);
    expect(scoreTransparency(18)).toBe(15);
  });

  it("returns 5 for very bad transparency (18-25)", () => {
    expect(scoreTransparency(22)).toBe(5);
    expect(scoreTransparency(25)).toBe(5);
  });

  it("returns 0 for terrible transparency (> 25)", () => {
    expect(scoreTransparency(27)).toBe(0);
    expect(scoreTransparency(30)).toBe(0);
  });
});

describe("scoreHumidity", () => {
  it("returns 0 for certain dew (>= 95%)", () => {
    expect(scoreHumidity(95)).toBe(0);
    expect(scoreHumidity(98)).toBe(0);
    expect(scoreHumidity(100)).toBe(0);
  });

  it("returns 20 for very high dew risk (90-94%)", () => {
    expect(scoreHumidity(90)).toBe(20);
    expect(scoreHumidity(92)).toBe(20);
    expect(scoreHumidity(94)).toBe(20);
  });

  it("returns 40 for high dew risk (85-89%)", () => {
    expect(scoreHumidity(85)).toBe(40);
    expect(scoreHumidity(87)).toBe(40);
    expect(scoreHumidity(89)).toBe(40);
  });

  it("returns 60 for moderate humidity (80-84%)", () => {
    expect(scoreHumidity(80)).toBe(60);
    expect(scoreHumidity(82)).toBe(60);
    expect(scoreHumidity(84)).toBe(60);
  });

  it("returns 75 for low-moderate humidity (75-79%)", () => {
    expect(scoreHumidity(75)).toBe(75);
    expect(scoreHumidity(77)).toBe(75);
    expect(scoreHumidity(79)).toBe(75);
  });

  it("returns 85 for low humidity (70-74%)", () => {
    expect(scoreHumidity(70)).toBe(85);
    expect(scoreHumidity(72)).toBe(85);
    expect(scoreHumidity(74)).toBe(85);
  });

  it("returns good scores for very low humidity (< 70%)", () => {
    expect(scoreHumidity(60)).toBe(88); // 100 - 60*0.2 = 88
    expect(scoreHumidity(50)).toBe(90); // 100 - 50*0.2 = 90
    expect(scoreHumidity(0)).toBe(100); // 100 - 0*0.2 = 100
  });
});

// =============================================================================
// Composite Score Tests
// =============================================================================

describe("scoreHour", () => {
  it("calculates weighted score correctly", () => {
    const hour = createHour({
      cloudCover: 0,    // 100 score * 0.65 = 65
      seeing: 1,        // 100 score * 0.05 = 5
      transparency: 0,  // 100 score * 0.20 = 20
      humidity: 0,      // 100 score * 0.10 = 10
    });
    expect(scoreHour(hour)).toBe(100);
  });

  it("penalizes high cloud cover heavily", () => {
    const clearHour = createHour({ cloudCover: 10 });
    const cloudyHour = createHour({ cloudCover: 70 });

    expect(scoreHour(clearHour)).toBeGreaterThan(scoreHour(cloudyHour));
    expect(scoreHour(cloudyHour)).toBeLessThan(50); // Cloud score = 0
  });

  it("penalizes poor seeing minimally for narrowband", () => {
    const goodSeeing = createHour({ seeing: 1.5 });
    const poorSeeing = createHour({ seeing: 4 });

    const diff = scoreHour(goodSeeing) - scoreHour(poorSeeing);
    expect(diff).toBeLessThan(10); // Only 5% weight on seeing for narrowband
  });
});

describe("isHourImageable", () => {
  it("returns true for excellent conditions", () => {
    const hour = createHour({ cloudCover: 5, humidity: 70 });
    expect(isHourImageable(hour)).toBe(true);
  });

  it("returns true at cloud cover threshold (10%)", () => {
    const hour = createHour({ cloudCover: 10, humidity: 70 });
    expect(isHourImageable(hour)).toBe(true);
  });

  it("returns false when cloud cover exceeds 10%", () => {
    const hour = createHour({ cloudCover: 15, humidity: 70 });
    expect(isHourImageable(hour)).toBe(false);
  });

  it("returns false when humidity is 90% or higher", () => {
    const hour = createHour({ cloudCover: 5, humidity: 90 });
    expect(isHourImageable(hour)).toBe(false);
  });

  it("returns true just below humidity threshold (89%)", () => {
    const hour = createHour({ cloudCover: 10, humidity: 89 });
    expect(isHourImageable(hour)).toBe(true);
  });
});

// =============================================================================
// Night Analysis Tests
// =============================================================================

describe("analyzeNight", () => {
  const testTimeZone = "America/Los_Angeles";

  it("returns null for empty hours", () => {
    expect(analyzeNight([], testTimeZone)).toBeNull();
  });

  it("finds consecutive imageable windows", () => {
    const hours = [
      createHour({ hourOffset: 0, cloudCover: 5 }),   // imageable
      createHour({ hourOffset: 1, cloudCover: 8 }),   // imageable
      createHour({ hourOffset: 2, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 3, cloudCover: 80 }),  // NOT imageable
      createHour({ hourOffset: 4, cloudCover: 7 }),   // imageable
      createHour({ hourOffset: 5, cloudCover: 9 }),   // imageable
      createHour({ hourOffset: 6, cloudCover: 6 }),   // imageable
    ];

    const result = analyzeNight(hours, testTimeZone);
    expect(result).not.toBeNull();
    expect(result!.bestWindow).not.toBeNull();
    expect(result!.bestWindow!.length).toBe(3); // First window of 3 consecutive (0-2)
  });

  it("requires minimum 3 consecutive hours for a window", () => {
    const hours = [
      createHour({ hourOffset: 0, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 1, cloudCover: 15 }),  // imageable
      createHour({ hourOffset: 2, cloudCover: 80 }),  // NOT
      createHour({ hourOffset: 3, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 4, cloudCover: 80 }),  // NOT
    ];

    const result = analyzeNight(hours, testTimeZone);
    expect(result!.bestWindow).toBeNull();
    expect(result!.shouldNotify).toBe(false);
  });

  it("triggers notification for 6+ good hours with score >= 70", () => {
    const hours = Array.from({ length: 8 }, (_, i) =>
      createHour({
        hourOffset: i,
        cloudCover: 5,   // Excellent clouds for high score
        seeing: 2,
        transparency: 5,
        humidity: 60,    // Low humidity for high score
      })
    );

    const result = analyzeNight(hours, testTimeZone);
    expect(result!.bestWindow!.length).toBe(8);
    expect(result!.shouldNotify).toBe(true);
    expect(result!.score).toBeGreaterThanOrEqual(70);
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

    const result = analyzeNight(hours, testTimeZone);
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

    const result = analyzeNight(hours, testTimeZone);
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
    expect(hours[0].isImageable).toBe(true);  // 10% clouds - at threshold
    expect(hours[1].isImageable).toBe(false); // 20% clouds - exceeds 10% threshold
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
  const testTimeZone = "America/Los_Angeles";

  it("handles a typical good night in SF", () => {
    // Excellent clear skies for narrowband imaging
    const hours = Array.from({ length: 8 }, (_, i) =>
      createHour({
        hourOffset: i,
        localTime: new Date(`2024-01-15T${22 + i}:00:00`),
        cloudCover: 3 + i * 0.5,  // 3-6.5% - very clear
        seeing: 2.2,              // Decent seeing
        transparency: 8,          // Good transparency
        humidity: 65,             // Low humidity
      })
    );

    const result = analyzeNight(hours, testTimeZone);
    expect(result!.shouldNotify).toBe(true);
    expect(result!.score).toBeGreaterThanOrEqual(70);
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

    const result = analyzeNight(hours, testTimeZone);
    expect(result!.shouldNotify).toBe(false);
    expect(result!.bestWindow).toBeNull(); // No imageable hours
  });

  it("handles partial clearing", () => {
    // Clouds early, clearing later (strict 10% threshold)
    const hours = [
      createHour({ hourOffset: 0, cloudCover: 80 }),
      createHour({ hourOffset: 1, cloudCover: 70 }),
      createHour({ hourOffset: 2, cloudCover: 50 }),
      createHour({ hourOffset: 3, cloudCover: 30 }),  // NOT imageable (>10%)
      createHour({ hourOffset: 4, cloudCover: 15 }),  // NOT imageable (>10%)
      createHour({ hourOffset: 5, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 6, cloudCover: 10 }),  // imageable
      createHour({ hourOffset: 7, cloudCover: 10 }),  // imageable
    ];

    const result = analyzeNight(hours, testTimeZone);
    expect(result!.bestWindow!.length).toBe(3);  // Hours 5-7 only (10% each)
    expect(result!.shouldNotify).toBe(false);   // Only 3 hours, need 6
  });
});
