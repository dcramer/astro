// Main exports for the Telescopius package

export { TelescopiusClient, calculateAngularDistance } from "./client";
export type { TelescopiusTarget, TelescopiusSearchResult } from "./client";

export {
  TelescopiusDSOSchema,
  TonightTimesSchema,
  TransitObservationSchema,
  TelescopiusObjectSchema,
  TelescopiusSearchResponseSchema,
} from "./schema";

export type {
  TelescopiusDSO,
  TonightTimes,
  TransitObservation,
  TelescopiusObject,
  TelescopiusSearchResponse,
} from "./schema";