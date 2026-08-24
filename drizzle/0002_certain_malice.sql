ALTER TABLE `users` ADD `authProvider` enum('oauth','local') DEFAULT 'oauth' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('oauth','local') NOT NULL DEFAULT 'oauth';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
