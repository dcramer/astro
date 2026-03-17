import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import type { SessionCurrentState } from "../lib/site-types";

export const sessions = sqliteTable(
  "sessions",
  {
    sessionKey: text("session_key").primaryKey(),
    displayName: text("display_name").notNull(),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at"),
    profileName: text("profile_name"),
    activeSession: integer("active_session", { mode: "boolean" }).notNull().default(false),
    sessionStatus: text("session_status"),
    lastSeenAt: text("last_seen_at").notNull(),
    currentStatePayload: text("current_state_payload", { mode: "json" }).$type<SessionCurrentState | null>(),
    latestExposureId: text("latest_exposure_id"),
    heroExposureId: text("hero_exposure_id"),
    exposureCount: integer("exposure_count").notNull().default(0),
    totalExposureSeconds: real("total_exposure_seconds").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("sessions_started_at_idx").on(table.startedAt),
    index("sessions_last_seen_at_idx").on(table.lastSeenAt),
  ],
);

export const exposures = sqliteTable(
  "exposures",
  {
    exposureId: text("exposure_id").primaryKey(),
    sessionKey: text("session_key")
      .notNull()
      .references(() => sessions.sessionKey, { onDelete: "cascade" }),
    exposureIndex: integer("exposure_index"),
    targetName: text("target_name"),
    fileName: text("file_name"),
    fullPath: text("full_path"),
    startedAt: text("started_at").notNull(),
    epochMilliseconds: integer("epoch_milliseconds"),
    durationSeconds: real("duration_seconds").notNull().default(0),
    filterName: text("filter_name"),
    detectedStars: integer("detected_stars"),
    hfr: real("hfr"),
    guidingRms: real("guiding_rms"),
    guidingRmsArcSec: real("guiding_rms_arcsec"),
    guidingRmsRa: real("guiding_rms_ra"),
    guidingRmsRaArcSec: real("guiding_rms_ra_arcsec"),
    guidingRmsDec: real("guiding_rms_dec"),
    guidingRmsDecArcSec: real("guiding_rms_dec_arcsec"),
    focuserTemperature: real("focuser_temperature"),
    weatherTemperature: real("weather_temperature"),
    thumbnailKey: text("thumbnail_key"),
    thumbnailContentType: text("thumbnail_content_type"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("exposures_session_started_idx").on(table.sessionKey, table.startedAt),
    index("exposures_target_idx").on(table.targetName, table.startedAt),
  ],
);

export const sessionRelations = relations(sessions, ({ many }) => ({
  exposures: many(exposures),
}));

export const exposureRelations = relations(exposures, ({ one }) => ({
  session: one(sessions, {
    fields: [exposures.sessionKey],
    references: [sessions.sessionKey],
  }),
}));
