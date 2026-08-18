CREATE TABLE `reportApprovalActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`action` enum('request','approve_level_1','approve_level_2','reject') NOT NULL,
	`actorId` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportApprovalActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportApprovalRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodId` int NOT NULL,
	`reportHash` varchar(64) NOT NULL,
	`snapshotJson` text NOT NULL,
	`status` enum('pending_level_1','pending_level_2','rejected','internally_attested') NOT NULL DEFAULT 'pending_level_1',
	`requestedBy` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`levelOneBy` int,
	`levelOneAt` timestamp,
	`levelTwoBy` int,
	`levelTwoAt` timestamp,
	`rejectedBy` int,
	`rejectedAt` timestamp,
	`rejectionReason` text,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportApprovalRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reportApprovalActions` ADD CONSTRAINT `reportApprovalActions_requestId_reportApprovalRequests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `reportApprovalRequests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportApprovalActions` ADD CONSTRAINT `reportApprovalActions_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportApprovalRequests` ADD CONSTRAINT `reportApprovalRequests_periodId_accountingPeriods_id_fk` FOREIGN KEY (`periodId`) REFERENCES `accountingPeriods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportApprovalRequests` ADD CONSTRAINT `reportApprovalRequests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportApprovalRequests` ADD CONSTRAINT `reportApprovalRequests_levelOneBy_users_id_fk` FOREIGN KEY (`levelOneBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportApprovalRequests` ADD CONSTRAINT `reportApprovalRequests_levelTwoBy_users_id_fk` FOREIGN KEY (`levelTwoBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportApprovalRequests` ADD CONSTRAINT `reportApprovalRequests_rejectedBy_users_id_fk` FOREIGN KEY (`rejectedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;