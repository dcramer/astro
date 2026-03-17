import type {
  AdvancedStatus,
  NinaImageHistoryEntry,
  NinaMountInfo,
  NinaWeatherInfo,
} from "@nina/advanced";

export interface CurrentTargetSnapshot {
  name: string;
  ra?: number;
  dec?: number;
  source: "sequence" | "mount" | "manual";
}

export interface SessionLivePreview {
  assetKey: string;
  contentType: string;
  capturedAt: string | null;
  imageType: string | null;
  targetName: string | null;
  filterName: string | null;
  durationSeconds: number | null;
  hfr: number | null;
}

export interface SessionCurrentState {
  syncedAt: string;
  advanced: AdvancedStatus | null;
  mount: NinaMountInfo | null;
  weather: NinaWeatherInfo | null;
  currentTarget: CurrentTargetSnapshot | null;
  latestPreview: SessionLivePreview | null;
}

export interface StoredSession {
  sessionKey: string;
  displayName: string;
  startedAt: string;
  endedAt: string | null;
  profileName: string | null;
  primaryTargetName: string | null;
  targetNames: ReadonlyArray<string>;
  filterNames: ReadonlyArray<string>;
  activeSession: boolean;
  sessionStatus: string | null;
  lastSeenAt: string;
  exposureCount: number;
  totalExposureSeconds: number;
  latestExposureId: string | null;
  heroExposureId: string | null;
  heroThumbnailUrl: string | null;
  stale: boolean;
  currentState: SessionCurrentState | null;
}

export interface StoredExposure {
  exposureId: string;
  sessionKey: string;
  exposureIndex: number | null;
  targetName: string | null;
  fileName: string | null;
  fullPath: string | null;
  startedAt: string;
  epochMilliseconds: number | null;
  durationSeconds: number;
  filterName: string | null;
  detectedStars: number | null;
  hfr: number | null;
  guidingRms: number | null;
  guidingRmsArcSec: number | null;
  guidingRmsRa: number | null;
  guidingRmsRaArcSec: number | null;
  guidingRmsDec: number | null;
  guidingRmsDecArcSec: number | null;
  focuserTemperature: number | null;
  weatherTemperature: number | null;
  thumbnailKey: string | null;
  thumbnailContentType: string | null;
}

export interface OverlayImage extends NinaImageHistoryEntry {
  exposureId: string;
  targetName: string | null;
  thumbnailUrl: string | null;
}

export interface LiveApiResponse {
  session: StoredSession | null;
  images: ReadonlyArray<OverlayImage>;
  advanced: AdvancedStatus | null;
  mount: NinaMountInfo | null;
  weather: NinaWeatherInfo | null;
  stale: boolean;
  hasConnected: boolean;
}

export interface IngestExposurePayload {
  exposureId: string;
  exposureIndex: number | null;
  targetName: string | null;
  fileName: string | null;
  fullPath: string | null;
  startedAt: string;
  epochMilliseconds: number | null;
  durationSeconds: number;
  filterName: string | null;
  detectedStars: number | null;
  hfr: number | null;
  guidingRms: number | null;
  guidingRmsArcSec: number | null;
  guidingRmsRa: number | null;
  guidingRmsRaArcSec: number | null;
  guidingRmsDec: number | null;
  guidingRmsDecArcSec: number | null;
  focuserTemperature: number | null;
  weatherTemperature: number | null;
  thumbnailKey: string | null;
  thumbnailContentType: string | null;
}

export interface IngestSessionPayload {
  sessionKey: string;
  displayName: string;
  startedAt: string;
  endedAt: string | null;
  profileName: string | null;
  activeSession: boolean;
  sessionStatus: string | null;
  lastSeenAt: string;
  currentState: SessionCurrentState | null;
  exposures: ReadonlyArray<IngestExposurePayload>;
}

export interface IngestStatePayload {
  syncedAt: string;
  sessions: ReadonlyArray<IngestSessionPayload>;
}
