import type { NumericLike } from "./utils";

export interface ApiEnvelope<T> {
  Response: T;
  Error?: string | null;
  StatusCode?: number;
  Success?: boolean;
  Type?: string | null;
}

export type NinaSequenceExecutionStatus =
  | "Ready"
  | "Running"
  | "Paused"
  | "Completed"
  | "Stopped"
  | "Failed"
  | string;

export interface RawSequenceItem {
  Name: string;
  Description?: string | null;
  Status?: string | null;
  Items?: RawSequenceItem[] | null;
  Type?: string | null;
  Iterations?: NumericLike;
  IterationCount?: NumericLike;
  CurrentIteration?: NumericLike;
  Iteration?: NumericLike;
  ExposureCount?: NumericLike;
  TargetExposureCount?: NumericLike;
  RepeatFor?: NumericLike;
  CurrentExposure?: NumericLike;
  ExposureIteration?: NumericLike;
  ExposureIndex?: NumericLike;
  [key: string]: unknown;
}

export interface RawCameraInfo {
  IsExposing?: boolean;
  CameraState?: number | null;
  ExposureEndTime?: string | null;
  ExposureDuration?: number | null;
  ExposureTime?: number | null;
  LastExposureDuration?: number | null;
  LastDownloadTime?: number | null;
}

export interface RawMountDateTime {
  Now?: string | null;
  UtcNow?: string | null;
}

export interface RawMountCoordinates {
  RA?: NumericLike;
  RAString?: string | null;
  RADegrees?: NumericLike;
  Dec?: NumericLike;
  DecString?: string | null;
  Epoch?: string | null;
  DateTime?: RawMountDateTime | null;
}

export interface RawMountInfo {
  SiderealTime?: NumericLike;
  RightAscension?: NumericLike;
  RightAscensionString?: string | null;
  Declination?: NumericLike;
  DeclinationString?: string | null;
  SiteLatitude?: NumericLike;
  SiteLongitude?: NumericLike;
  SiteElevation?: NumericLike;
  Coordinates?: RawMountCoordinates | null;
  TimeToMeridianFlip?: NumericLike;
  TimeToMeridianFlipString?: string | null;
  SideOfPier?: string | null;
  Altitude?: NumericLike;
  AltitudeString?: string | null;
  Azimuth?: NumericLike;
  AzimuthString?: string | null;
  SiderealTimeString?: string | null;
  HoursToMeridianString?: string | null;
  AtPark?: boolean;
  TrackingRate?: unknown;
  TrackingEnabled?: boolean;
  TrackingModes?: string[] | null;
  AtHome?: boolean;
  CanFindHome?: boolean;
  CanPark?: boolean;
  CanSetPark?: boolean;
  CanSetTrackingEnabled?: boolean;
  CanSetDeclinationRate?: boolean;
  CanSetRightAscensionRate?: boolean;
  EquatorialSystem?: string | null;
  HasUnknownEpoch?: boolean;
  Slewing?: boolean;
  GuideRateRightAscensionArcsecPerSec?: NumericLike;
  GuideRateDeclinationArcsecPerSec?: NumericLike;
  CanMovePrimaryAxis?: boolean;
  CanMoveSecondaryAxis?: boolean;
  PrimaryAxisRates?: unknown[] | null;
  SecondaryAxisRates?: unknown[] | null;
  SupportedActions?: string[] | null;
  AlignmentMode?: string | null;
  CanPulseGuide?: boolean;
  IsPulseGuiding?: boolean;
  CanSetPierSide?: boolean;
  CanSlew?: boolean;
  UTCDate?: string | null;
  Connected?: boolean;
  Name?: string | null;
  DisplayName?: string | null;
  DeviceId?: string | null;
}

export interface RawWeatherInfo {
  AveragePeriod?: NumericLike;
  CloudCover?: NumericLike;
  DewPoint?: NumericLike;
  Humidity?: NumericLike;
  Pressure?: NumericLike;
  RainRate?: string | NumericLike | null;
  SkyBrightness?: string | null;
  SkyQuality?: string | null;
  SkyTemperature?: string | NumericLike | null;
  StarFWHM?: string | null;
  Temperature?: NumericLike;
  WindDirection?: NumericLike;
  WindGust?: string | NumericLike | null;
  WindSpeed?: NumericLike;
  SupportedActions?: ReadonlyArray<string> | null;
  Connected?: boolean;
  Name?: string | null;
  DisplayName?: string | null;
  Description?: string | null;
  DriverInfo?: string | null;
  DriverVersion?: string | null;
  DeviceId?: string | null;
}

export interface RawImageHistoryEntry {
  ExposureTime: number;
  ImageType: string;
  Filter: string;
  RmsText: string;
  Temperature: string;
  CameraName: string;
  Gain: number;
  Offset: number;
  Date: string;
  TelescopeName: string;
  FocalLength: number;
  StDev: number;
  Mean: number;
  Median: number;
  Stars: number;
  HFR: number;
  IsBayered: boolean;
}

export interface RawImageHistoryResponse {
  Images?: RawImageHistoryEntry[] | null;
  History?: RawImageHistoryEntry[] | null;
  Items?: RawImageHistoryEntry[] | null;
  Entries?: RawImageHistoryEntry[] | null;
}

export interface NinaSequenceItem {
  readonly name: string;
  readonly description?: string | null;
  readonly status?: NinaSequenceExecutionStatus;
  readonly items?: ReadonlyArray<NinaSequenceItem>;
  readonly type?: string | null;
  readonly iterations?: number | null;
  readonly currentIteration?: number | null;
  readonly exposureCount?: number | null;
  readonly currentExposure?: number | null;
  readonly metadata?: Record<string, unknown>;
}

export interface NinaSequenceSnapshot {
  readonly items: ReadonlyArray<NinaSequenceItem>;
  readonly isRunning: boolean;
  readonly runningItemName?: string | null;
  readonly runningPath?: ReadonlyArray<string>;
  readonly breadcrumb?: ReadonlyArray<string> | null;
}

export interface NinaCameraSnapshot {
  readonly isExposing: boolean;
  readonly cameraState?: number | null;
  readonly exposureEndTime?: string | null;
  readonly exposureDurationSeconds?: number | null;
  readonly elapsedExposureSeconds?: number | null;
  readonly lastExposureDurationSeconds?: number | null;
  readonly lastDownloadTimeSeconds?: number | null;
}

export interface NinaMountInfo {
  readonly rightAscensionHours?: number | null;
  readonly rightAscensionString?: string | null;
  readonly rightAscensionDegrees?: number | null;
  readonly declinationDegrees?: number | null;
  readonly declinationString?: string | null;
  readonly altitudeDegrees?: number | null;
  readonly altitudeString?: string | null;
  readonly azimuthDegrees?: number | null;
  readonly azimuthString?: string | null;
  readonly siderealTimeHours?: number | null;
  readonly siderealTimeString?: string | null;
  readonly timeToMeridianFlipSeconds?: number | null;
  readonly timeToMeridianFlipString?: string | null;
  readonly hoursToMeridianString?: string | null;
  readonly trackingEnabled?: boolean | null;
  readonly trackingModes?: ReadonlyArray<string> | null;
  readonly slewing?: boolean | null;
  readonly atPark?: boolean | null;
  readonly atHome?: boolean | null;
  readonly sideOfPier?: string | null;
  readonly siteLatitudeDegrees?: number | null;
  readonly siteLongitudeDegrees?: number | null;
  readonly siteElevationMeters?: number | null;
  readonly alignmentMode?: string | null;
  readonly equatorialSystem?: string | null;
  readonly guideRateRightAscensionArcsecPerSec?: number | null;
  readonly guideRateDeclinationArcsecPerSec?: number | null;
  readonly isPulseGuiding?: boolean | null;
  readonly utcDate?: string | null;
  readonly name?: string | null;
  readonly displayName?: string | null;
  readonly connected?: boolean | null;
}

export interface NinaWeatherInfo {
  readonly averagePeriodSeconds?: number | null;
  readonly cloudCoverPercent?: number | null;
  readonly dewPointCelsius?: number | null;
  readonly humidityPercent?: number | null;
  readonly pressureHPa?: number | null;
  readonly rainRate?: string | null;
  readonly skyBrightness?: string | null;
  readonly skyQuality?: string | null;
  readonly skyTemperature?: string | null;
  readonly starFwhm?: string | null;
  readonly temperatureCelsius?: number | null;
  readonly windDirectionDegrees?: number | null;
  readonly windGust?: string | null;
  readonly windSpeedMps?: number | null;
  readonly connected?: boolean | null;
  readonly name?: string | null;
  readonly displayName?: string | null;
  readonly description?: string | null;
}

export interface NinaAdvancedStatus {
  readonly available: boolean;
  readonly version?: string | null;
  readonly sequence?: NinaSequenceSnapshot | null;
  readonly camera?: NinaCameraSnapshot | null;
  readonly errors?: ReadonlyArray<string>;
}

export interface NinaImageHistoryEntry {
  readonly exposureDurationSeconds: number;
  readonly imageType: string;
  readonly filterName: string;
  readonly rmsText: string;
  readonly temperatureText: string;
  readonly cameraName: string;
  readonly gain: number;
  readonly offset: number;
  readonly startTime: string;
  readonly telescopeName: string;
  readonly focalLength: number;
  readonly stDev: number;
  readonly mean: number;
  readonly median: number;
  readonly detectedStars: number | null;
  readonly hfr: number | null;
  readonly isBayered: boolean;
  readonly cameraTemperature?: number | null;
}
