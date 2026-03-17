CREATE TABLE `exposures` (
	`exposure_id` text PRIMARY KEY NOT NULL,
	`session_key` text NOT NULL,
	`exposure_index` integer,
	`target_name` text,
	`file_name` text,
	`full_path` text,
	`started_at` text NOT NULL,
	`epoch_milliseconds` integer,
	`duration_seconds` real DEFAULT 0 NOT NULL,
	`filter_name` text,
	`detected_stars` integer,
	`hfr` real,
	`guiding_rms` real,
	`guiding_rms_arcsec` real,
	`guiding_rms_ra` real,
	`guiding_rms_ra_arcsec` real,
	`guiding_rms_dec` real,
	`guiding_rms_dec_arcsec` real,
	`focuser_temperature` real,
	`weather_temperature` real,
	`thumbnail_key` text,
	`thumbnail_content_type` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_key`) REFERENCES `sessions`(`session_key`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exposures_session_started_idx` ON `exposures` (`session_key`,`started_at`);--> statement-breakpoint
CREATE INDEX `exposures_target_idx` ON `exposures` (`target_name`,`started_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_key` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`profile_name` text,
	`active_session` integer DEFAULT false NOT NULL,
	`session_status` text,
	`last_seen_at` text NOT NULL,
	`current_state_payload` text,
	`latest_exposure_id` text,
	`hero_exposure_id` text,
	`exposure_count` integer DEFAULT 0 NOT NULL,
	`total_exposure_seconds` real DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_started_at_idx` ON `sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `sessions_last_seen_at_idx` ON `sessions` (`last_seen_at`);