ALTER TABLE `cashTransactions` ADD `accountCode` varchar(16) DEFAULT '1121' NOT NULL;--> statement-breakpoint
ALTER TABLE `cashTransactions` ADD `category` varchar(128) DEFAULT 'other' NOT NULL;