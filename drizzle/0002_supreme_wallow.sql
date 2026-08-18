CREATE TABLE `cashAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cashTransactionId` int NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`contentType` varchar(128) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`fileSize` int NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cashAttachments` ADD CONSTRAINT `cashAttachments_cashTransactionId_cashTransactions_id_fk` FOREIGN KEY (`cashTransactionId`) REFERENCES `cashTransactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cashAttachments` ADD CONSTRAINT `cashAttachments_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;