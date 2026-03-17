import { z } from "zod";

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
  epochMilliseconds: z.number().int().optional(),
  duration: z.number(),
  filterName: z.string().optional(),
  detectedStars: z.number().optional(),
  HFR: z.number().optional(),
  GuidingRMS: z.number().optional(),
  GuidingRMSArcSec: z.number().optional(),
  GuidingRMSRA: z.number().optional(),
  GuidingRMSRAArcSec: z.number().optional(),
  GuidingRMSDEC: z.number().optional(),
  GuidingRMSDECArcSec: z.number().optional(),
  FocuserTemperature: z.number().optional(),
  WeatherTemperature: z.number().optional(),
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
