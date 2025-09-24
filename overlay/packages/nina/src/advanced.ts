export type {
  NinaAdvancedStatus,
  NinaCameraSnapshot,
  NinaMountInfo,
  NinaWeatherInfo,
  NinaSequenceExecutionStatus,
  NinaSequenceItem,
  NinaSequenceSnapshot,
  NinaImageHistoryEntry,
} from "./api/types";

export { getImageThumbnailUrl, loadImageHistory } from "./api/imageHistory";
export { loadAdvancedStatus } from "./api/status";
export { loadMountInfo } from "./api/mount";
export { loadWeatherInfo } from "./api/weather";

// Backwards-compatible aliases
export type AdvancedStatus = import("./api/types").NinaAdvancedStatus;
export type AdvancedCameraSnapshot = import("./api/types").NinaCameraSnapshot;
export type AdvancedMountInfo = import("./api/types").NinaMountInfo;
export type AdvancedWeatherInfo = import("./api/types").NinaWeatherInfo;
export type AdvancedSequenceSnapshot = import("./api/types").NinaSequenceSnapshot;
export type AdvancedApiSequenceItem = import("./api/types").NinaSequenceItem;
export type AdvancedSequenceExecutionStatus = import("./api/types").NinaSequenceExecutionStatus;
