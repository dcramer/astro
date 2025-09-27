import { z } from "zod";

// Schema for individual DSO object within the response
export const TelescopiusDSOSchema = z.object({
  main_id: z.string(),
  main_name: z.string().nullable().optional(),
  ids: z.array(z.string()).default([]),
  names: z.array(z.string()).default([]),
  family: z.string().optional(),
  types: z.array(z.string()).default([]),
  url: z.string().optional(),
  main_image_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  alt_ids: z.array(z.string()).default([]),
  ra: z.number(),
  dec: z.number(),
  con: z.string().nullable().optional(),
  con_name: z.string().nullable().optional(),
  visual_mag: z.number().nullable().optional(),
  photo_mag: z.number().nullable().optional(),
  major_axis: z.number().nullable().optional(), // in arcseconds
  minor_axis: z.number().nullable().optional(), // in arcseconds
  subr: z.number().nullable().optional(),
});

// Schema for tonight times
export const TonightTimesSchema = z.object({
  rise: z.string().nullable().optional(),
  transit: z.string().nullable().optional(),
  set: z.string().nullable().optional(),
});

// Schema for transit observation data
export const TransitObservationSchema = z.object({
  ra: z.number(),
  dec: z.number(),
  dist_au: z.number().optional(),
  alt: z.number(),
  az: z.number(),
  mag: z.number().nullable().optional(),
  con: z.string().nullable().optional(),
});

// Schema for search result item
export const TelescopiusObjectSchema = z.object({
  object: TelescopiusDSOSchema,
  tonight_times: TonightTimesSchema.optional(),
  transit_observation: TransitObservationSchema.optional(),
});

// Schema for the full search response
export const TelescopiusSearchResponseSchema = z.object({
  matched: z.number(),
  page_results: z.array(TelescopiusObjectSchema),
});

// Type exports
export type TelescopiusDSO = z.infer<typeof TelescopiusDSOSchema>;
export type TonightTimes = z.infer<typeof TonightTimesSchema>;
export type TransitObservation = z.infer<typeof TransitObservationSchema>;
export type TelescopiusObject = z.infer<typeof TelescopiusObjectSchema>;
export type TelescopiusSearchResponse = z.infer<typeof TelescopiusSearchResponseSchema>;