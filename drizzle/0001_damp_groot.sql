CREATE TABLE `reviews` (
	`id` varchar(96) NOT NULL,
	`facilityId` varchar(96) NOT NULL,
	`submittedById` int NOT NULL,
	`rating` int NOT NULL,
	`body` text,
	`status` enum('pending','published','rejected') NOT NULL DEFAULT 'pending',
	`moderationNotes` text,
	`reviewedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `facilities` ADD `publicationStatus` enum('published','unpublished') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_facilityId_facilities_id_fk` FOREIGN KEY (`facilityId`) REFERENCES `facilities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_submittedById_users_id_fk` FOREIGN KEY (`submittedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewedById_users_id_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reviews_facility_idx` ON `reviews` (`facilityId`);--> statement-breakpoint
CREATE INDEX `reviews_submitter_idx` ON `reviews` (`submittedById`);--> statement-breakpoint
CREATE INDEX `reviews_status_idx` ON `reviews` (`status`);