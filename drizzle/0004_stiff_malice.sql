ALTER TABLE `expenses` ADD `accountCode` varchar(16) DEFAULT '642' NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `categoryCode` varchar(128) DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE `revenues` ADD `accountCode` varchar(16) DEFAULT '5113' NOT NULL;--> statement-breakpoint
ALTER TABLE `revenues` ADD `category` varchar(128) DEFAULT 'legal_service' NOT NULL;