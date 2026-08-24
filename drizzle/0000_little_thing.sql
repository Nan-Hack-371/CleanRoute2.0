CREATE TABLE `facilities` (
	`id` varchar(96) NOT NULL,
	`name` varchar(255) NOT NULL,
	`area` varchar(96) NOT NULL,
	`district` varchar(96) NOT NULL,
	`context` varchar(64) NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`locationPrecision` varchar(64) NOT NULL,
	`address` text,
	`hours` varchar(128) NOT NULL,
	`publicListingRating` double,
	`reviewCount` int NOT NULL DEFAULT 0,
	`verificationStatus` varchar(128) NOT NULL,
	`hygieneRating` int,
	`waterStatus` varchar(64) NOT NULL,
	`safetyStatus` varchar(64) NOT NULL,
	`lightingStatus` varchar(64) NOT NULL,
	`womenFriendly` varchar(64) NOT NULL,
	`wheelchairAccess` varchar(64) NOT NULL,
	`operatingStatus` varchar(128) NOT NULL,
	`sourceKey` varchar(32) NOT NULL,
	`sourceUrl` text,
	`lastChecked` varchar(128) NOT NULL,
	`finding` text NOT NULL,
	`tagsJson` text NOT NULL,
	`evidencePhotoKey` varchar(512),
	`evidencePhotoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_checks` (
	`id` varchar(96) NOT NULL,
	`facilityId` varchar(96) NOT NULL,
	`submittedById` int NOT NULL,
	`researcherName` varchar(160) NOT NULL,
	`hygieneRating` int NOT NULL,
	`waterStatus` varchar(64) NOT NULL,
	`safetyStatus` varchar(64) NOT NULL,
	`lightingStatus` varchar(64) NOT NULL,
	`accessibilityStatus` varchar(64) NOT NULL,
	`womenFriendly` varchar(64) NOT NULL,
	`operatingStatus` varchar(64) NOT NULL,
	`notes` text,
	`evidencePhotoKey` varchar(512),
	`evidencePhotoUrl` text,
	`verificationStatus` enum('submitted','verified') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `field_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issue_reports` (
	`id` varchar(96) NOT NULL,
	`facilityId` varchar(96) NOT NULL,
	`submittedById` int NOT NULL,
	`reportType` varchar(96) NOT NULL,
	`description` text,
	`evidencePhotoKey` varchar(512),
	`evidencePhotoUrl` text,
	`status` enum('pending','reviewing','resolved','rejected') NOT NULL DEFAULT 'pending',
	`resolutionNotes` text,
	`reviewedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issue_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `field_checks` ADD CONSTRAINT `field_checks_facilityId_facilities_id_fk` FOREIGN KEY (`facilityId`) REFERENCES `facilities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `field_checks` ADD CONSTRAINT `field_checks_submittedById_users_id_fk` FOREIGN KEY (`submittedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_reports` ADD CONSTRAINT `issue_reports_facilityId_facilities_id_fk` FOREIGN KEY (`facilityId`) REFERENCES `facilities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_reports` ADD CONSTRAINT `issue_reports_submittedById_users_id_fk` FOREIGN KEY (`submittedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issue_reports` ADD CONSTRAINT `issue_reports_reviewedById_users_id_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `facilities_area_idx` ON `facilities` (`area`);--> statement-breakpoint
CREATE INDEX `field_checks_facility_idx` ON `field_checks` (`facilityId`);--> statement-breakpoint
CREATE INDEX `field_checks_submitter_idx` ON `field_checks` (`submittedById`);--> statement-breakpoint
CREATE INDEX `issue_reports_facility_idx` ON `issue_reports` (`facilityId`);--> statement-breakpoint
CREATE INDEX `issue_reports_status_idx` ON `issue_reports` (`status`);