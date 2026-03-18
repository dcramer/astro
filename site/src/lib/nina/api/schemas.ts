import { z } from "zod";
import type {
  RawCameraInfo,
  RawImageHistoryEntry,
  RawImageHistoryResponse,
  RawMountCoordinates,
  RawMountDateTime,
  RawMountInfo,
  RawSequenceItem,
  RawWeatherInfo,
} from "./types";

const numericLikeSchema = z.union([z.number(), z.string()]);

export function apiEnvelopeSchema<T extends z.ZodTypeAny>(responseSchema: T) {
  return z.object({
    Response: responseSchema,
    Error: z.string().nullable().optional(),
    StatusCode: z.number().nullable().optional(),
    Success: z.boolean().nullable().optional(),
    Type: z.string().nullable().optional(),
  }).passthrough();
}

export const rawSequenceItemSchema: z.ZodType<RawSequenceItem> = z.lazy(() =>
  z.object({
    Name: z.string().optional(),
    Description: z.string().nullable().optional(),
    Status: z.string().nullable().optional(),
    Items: z.array(rawSequenceItemSchema).nullable().optional(),
    Type: z.string().nullable().optional(),
    Iterations: numericLikeSchema.optional(),
    IterationCount: numericLikeSchema.optional(),
    CurrentIteration: numericLikeSchema.optional(),
    Iteration: numericLikeSchema.optional(),
    ExposureCount: numericLikeSchema.optional(),
    TargetExposureCount: numericLikeSchema.optional(),
    RepeatFor: numericLikeSchema.optional(),
    CurrentExposure: numericLikeSchema.optional(),
    ExposureIteration: numericLikeSchema.optional(),
    ExposureIndex: numericLikeSchema.optional(),
  }).passthrough(),
);

export const rawCameraInfoSchema: z.ZodType<RawCameraInfo> = z.object({
  IsExposing: z.boolean().optional(),
  CameraState: z.union([z.number(), z.string()]).nullable().optional(),
  ExposureEndTime: z.string().nullable().optional(),
  ExposureStartTime: z.string().nullable().optional(),
  ExposureDuration: z.number().nullable().optional(),
  ExposureTime: z.number().nullable().optional(),
  ExposureElapsed: z.number().nullable().optional(),
  LastExposureDuration: z.number().nullable().optional(),
  LastDownloadTime: z.number().nullable().optional(),
}).passthrough();

export const rawMountDateTimeSchema: z.ZodType<RawMountDateTime> = z.object({
  Now: z.string().nullable().optional(),
  UtcNow: z.string().nullable().optional(),
}).passthrough();

export const rawMountCoordinatesSchema: z.ZodType<RawMountCoordinates> = z.object({
  RA: numericLikeSchema.optional(),
  RAString: z.string().nullable().optional(),
  RADegrees: numericLikeSchema.optional(),
  Dec: numericLikeSchema.optional(),
  DecString: z.string().nullable().optional(),
  Epoch: z.string().nullable().optional(),
  DateTime: rawMountDateTimeSchema.nullable().optional(),
}).passthrough();

export const rawMountInfoSchema: z.ZodType<RawMountInfo> = z.object({
  SiderealTime: numericLikeSchema.optional(),
  RightAscension: numericLikeSchema.optional(),
  RightAscensionString: z.string().nullable().optional(),
  Declination: numericLikeSchema.optional(),
  DeclinationString: z.string().nullable().optional(),
  SiteLatitude: numericLikeSchema.optional(),
  SiteLongitude: numericLikeSchema.optional(),
  SiteElevation: numericLikeSchema.optional(),
  Coordinates: rawMountCoordinatesSchema.nullable().optional(),
  TimeToMeridianFlip: numericLikeSchema.optional(),
  TimeToMeridianFlipString: z.string().nullable().optional(),
  SideOfPier: z.string().nullable().optional(),
  Altitude: numericLikeSchema.optional(),
  AltitudeString: z.string().nullable().optional(),
  Azimuth: numericLikeSchema.optional(),
  AzimuthString: z.string().nullable().optional(),
  SiderealTimeString: z.string().nullable().optional(),
  HoursToMeridianString: z.string().nullable().optional(),
  AtPark: z.boolean().optional(),
  TrackingRate: z.unknown().optional(),
  TrackingEnabled: z.boolean().optional(),
  TrackingModes: z.array(z.string()).nullable().optional(),
  AtHome: z.boolean().optional(),
  CanFindHome: z.boolean().optional(),
  CanPark: z.boolean().optional(),
  CanSetPark: z.boolean().optional(),
  CanSetTrackingEnabled: z.boolean().optional(),
  CanSetDeclinationRate: z.boolean().optional(),
  CanSetRightAscensionRate: z.boolean().optional(),
  EquatorialSystem: z.string().nullable().optional(),
  HasUnknownEpoch: z.boolean().optional(),
  Slewing: z.boolean().optional(),
  GuideRateRightAscensionArcsecPerSec: numericLikeSchema.optional(),
  GuideRateDeclinationArcsecPerSec: numericLikeSchema.optional(),
  CanMovePrimaryAxis: z.boolean().optional(),
  CanMoveSecondaryAxis: z.boolean().optional(),
  PrimaryAxisRates: z.array(z.unknown()).nullable().optional(),
  SecondaryAxisRates: z.array(z.unknown()).nullable().optional(),
  SupportedActions: z.array(z.string()).nullable().optional(),
  AlignmentMode: z.string().nullable().optional(),
  CanPulseGuide: z.boolean().optional(),
  IsPulseGuiding: z.boolean().optional(),
  CanSetPierSide: z.boolean().optional(),
  CanSlew: z.boolean().optional(),
  UTCDate: z.string().nullable().optional(),
  Connected: z.boolean().optional(),
  Name: z.string().nullable().optional(),
  DisplayName: z.string().nullable().optional(),
  DeviceId: z.string().nullable().optional(),
}).passthrough();

export const rawWeatherInfoSchema: z.ZodType<RawWeatherInfo> = z.object({
  AveragePeriod: numericLikeSchema.optional(),
  CloudCover: numericLikeSchema.optional(),
  DewPoint: numericLikeSchema.optional(),
  Humidity: numericLikeSchema.optional(),
  Pressure: numericLikeSchema.optional(),
  RainRate: z.union([z.string(), numericLikeSchema]).nullable().optional(),
  SkyBrightness: z.string().nullable().optional(),
  SkyQuality: z.union([z.string(), numericLikeSchema]).nullable().optional(),
  SkyTemperature: z.union([z.string(), numericLikeSchema]).nullable().optional(),
  StarFWHM: z.string().nullable().optional(),
  Temperature: numericLikeSchema.optional(),
  WindDirection: numericLikeSchema.optional(),
  WindGust: z.union([z.string(), numericLikeSchema]).nullable().optional(),
  WindSpeed: numericLikeSchema.optional(),
  SupportedActions: z.array(z.string()).nullable().optional(),
  Connected: z.boolean().optional(),
  Name: z.string().nullable().optional(),
  DisplayName: z.string().nullable().optional(),
  Description: z.string().nullable().optional(),
  DriverInfo: z.string().nullable().optional(),
  DriverVersion: z.string().nullable().optional(),
  DeviceId: z.string().nullable().optional(),
}).passthrough();

export const rawImageHistoryEntrySchema: z.ZodType<RawImageHistoryEntry> = z.object({
  ExposureTime: numericLikeSchema,
  ImageType: z.string(),
  Filter: z.string(),
  RmsText: z.string(),
  Temperature: numericLikeSchema,
  CameraName: z.string(),
  Gain: numericLikeSchema,
  Offset: numericLikeSchema,
  Date: z.string(),
  TelescopeName: z.string(),
  FocalLength: numericLikeSchema,
  StDev: numericLikeSchema,
  Mean: numericLikeSchema,
  Median: numericLikeSchema,
  Min: numericLikeSchema.optional(),
  Max: numericLikeSchema.optional(),
  Stars: numericLikeSchema,
  HFR: numericLikeSchema,
  HFRStDev: numericLikeSchema.optional(),
  IsBayered: z.boolean(),
  TargetName: z.string().optional(),
  Filename: z.string().optional(),
}).passthrough();

export const rawImageHistoryResponseSchema: z.ZodType<RawImageHistoryResponse> = z.object({
  Images: z.array(rawImageHistoryEntrySchema).nullable().optional(),
  History: z.array(rawImageHistoryEntrySchema).nullable().optional(),
  Items: z.array(rawImageHistoryEntrySchema).nullable().optional(),
  Entries: z.array(rawImageHistoryEntrySchema).nullable().optional(),
}).passthrough();
