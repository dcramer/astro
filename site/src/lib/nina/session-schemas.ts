import { z } from "zod";

function normalizeOptionalNumber(value: unknown): unknown {
  if (value === null) {
    return undefined;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "nan") {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : value;
}

const ninaOptionalNumberSchema = z.preprocess(normalizeOptionalNumber, z.number().optional());
const ninaOptionalIntegerSchema = z.preprocess(normalizeOptionalNumber, z.number().int().optional());

export const ninaSessionSummarySchema = z.object({
  key: z.string(),
  display: z.string(),
});

export const ninaSessionListResponseSchema = z.object({
  sessions: z.array(ninaSessionSummarySchema),
});

export const ninaLogEventSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  time: z.string().optional(),
  extra: z.unknown().nullable().optional(),
}).passthrough();

export const ninaStretchOptionsSchema = z.object({
  autoStretchFactor: z.number(),
  blackClipping: z.number(),
  unlinkedStretch: z.boolean(),
}).passthrough();

export const ninaImageRecordSchema = z.object({
  id: z.string(),
  index: z.number().int(),
  fileName: z.string(),
  fullPath: z.string(),
  started: z.string(),
  epochMilliseconds: ninaOptionalIntegerSchema,
  duration: z.number(),
  filterName: z.string().optional(),
  detectedStars: ninaOptionalIntegerSchema,
  HFR: ninaOptionalNumberSchema,
  GuidingRMS: ninaOptionalNumberSchema,
  GuidingRMSArcSec: ninaOptionalNumberSchema,
  GuidingRMSRA: ninaOptionalNumberSchema,
  GuidingRMSRAArcSec: ninaOptionalNumberSchema,
  GuidingRMSDEC: ninaOptionalNumberSchema,
  GuidingRMSDECArcSec: ninaOptionalNumberSchema,
  FocuserTemperature: ninaOptionalNumberSchema,
  WeatherTemperature: ninaOptionalNumberSchema,
}).passthrough();

export const ninaTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  startTime: z.string(),
  imageRecords: z.array(ninaImageRecordSchema).optional(),
}).passthrough();

export const ninaSessionHistorySchema = z.object({
  id: z.string(),
  pluginVersion: z.string(),
  sessionVersion: z.number().int(),
  startTime: z.string(),
  profileName: z.string(),
  activeSession: z.boolean(),
  activeTargetId: z.string().nullable().optional(),
  stretchOptions: ninaStretchOptionsSchema.nullable().optional(),
  targets: z.array(ninaTargetSchema).optional(),
  events: z.array(ninaLogEventSchema).optional(),
}).passthrough();
