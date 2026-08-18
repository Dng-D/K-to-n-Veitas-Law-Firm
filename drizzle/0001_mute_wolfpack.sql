CREATE TABLE `cashTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`type` enum('receipt','payment') NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`paymentMethod` enum('bank','cash','transfer','other') NOT NULL DEFAULT 'bank',
	`referenceType` enum('revenue','expense','other') NOT NULL DEFAULT 'other',
	`referenceId` int,
	`matterId` int,
	`documentNumber` varchar(128),
	`description` text NOT NULL,
	`reconciled` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`taxCode` varchar(64),
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int,
	`supplierName` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`expenseDate` timestamp NOT NULL,
	`invoiceNumber` varchar(128),
	`invoiceDate` timestamp,
	`amountBeforeTax` decimal(18,2) NOT NULL,
	`vatRate` decimal(7,4) NOT NULL DEFAULT '0',
	`vatInput` decimal(18,2) NOT NULL DEFAULT '0',
	`totalAmount` decimal(18,2) NOT NULL,
	`paidAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`dueDate` timestamp,
	`paymentStatus` enum('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
	`deductibility` enum('deductible','non_deductible','pending') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legalMatters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`title` varchar(500) NOT NULL,
	`clientId` int NOT NULL,
	`serviceType` varchar(128) NOT NULL,
	`lawyerName` varchar(255) NOT NULL,
	`contractNumber` varchar(128),
	`contractDate` timestamp,
	`contractValue` decimal(18,2) NOT NULL DEFAULT '0',
	`status` enum('draft','active','on_hold','completed','closed') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legalMatters_id` PRIMARY KEY(`id`),
	CONSTRAINT `legalMatters_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `revenues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int,
	`invoiceNumber` varchar(128),
	`invoiceDate` timestamp,
	`serviceDate` timestamp NOT NULL,
	`amountBeforeTax` decimal(18,2) NOT NULL,
	`vatRate` decimal(7,4) NOT NULL DEFAULT '0.1',
	`vatOutput` decimal(18,2) NOT NULL DEFAULT '0',
	`totalAmount` decimal(18,2) NOT NULL,
	`collectedAmount` decimal(18,2) NOT NULL DEFAULT '0',
	`dueDate` timestamp,
	`status` enum('issued','partial','collected','overdue','void') NOT NULL DEFAULT 'issued',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `cashTransactions` ADD CONSTRAINT `cashTransactions_matterId_legalMatters_id_fk` FOREIGN KEY (`matterId`) REFERENCES `legalMatters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cashTransactions` ADD CONSTRAINT `cashTransactions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_matterId_legalMatters_id_fk` FOREIGN KEY (`matterId`) REFERENCES `legalMatters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `legalMatters` ADD CONSTRAINT `legalMatters_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `legalMatters` ADD CONSTRAINT `legalMatters_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenues` ADD CONSTRAINT `revenues_matterId_legalMatters_id_fk` FOREIGN KEY (`matterId`) REFERENCES `legalMatters`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenues` ADD CONSTRAINT `revenues_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;