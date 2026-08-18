CREATE TABLE `accountingPeriodActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodId` int NOT NULL,
	`action` enum('request','approve','reject','lock','reopen') NOT NULL,
	`reason` text,
	`actorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountingPeriodActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accountingPeriods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodKey` varchar(7) NOT NULL,
	`status` enum('open','pending_approval','rejected','approved','locked') NOT NULL DEFAULT 'open',
	`requestedBy` int,
	`requestedAt` timestamp,
	`approvedBy` int,
	`approvedAt` timestamp,
	`lockedBy` int,
	`lockedAt` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountingPeriods_id` PRIMARY KEY(`id`),
	CONSTRAINT `accountingPeriods_periodKey_unique` UNIQUE(`periodKey`)
);
--> statement-breakpoint
ALTER TABLE `accountingPeriodActions` ADD CONSTRAINT `accountingPeriodActions_periodId_accountingPeriods_id_fk` FOREIGN KEY (`periodId`) REFERENCES `accountingPeriods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingPeriodActions` ADD CONSTRAINT `accountingPeriodActions_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingPeriods` ADD CONSTRAINT `accountingPeriods_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingPeriods` ADD CONSTRAINT `accountingPeriods_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountingPeriods` ADD CONSTRAINT `accountingPeriods_lockedBy_users_id_fk` FOREIGN KEY (`lockedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;