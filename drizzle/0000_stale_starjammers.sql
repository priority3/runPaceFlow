CREATE TABLE IF NOT EXISTS `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`duration` integer NOT NULL,
	`distance` real NOT NULL,
	`average_pace` real,
	`best_pace` real,
	`elevation_gain` real,
	`average_heart_rate` integer,
	`max_heart_rate` integer,
	`calories` integer,
	`gpx_data` text,
	`is_indoor` integer DEFAULT false,
	`race_name` text,
	`weather_data` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `activity_insights` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`content` text NOT NULL,
	`generated_at` integer NOT NULL,
	`model` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `splits` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`kilometer` integer NOT NULL,
	`duration` integer NOT NULL,
	`pace` real NOT NULL,
	`distance` real NOT NULL,
	`elevation_gain` real,
	`average_heart_rate` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`activities_count` integer,
	`error_message` text,
	`started_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`avatar` text,
	`sync_source` text,
	`nike_access_token` text,
	`strava_access_token` text,
	`garmin_secret_string` text,
	`last_sync_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
