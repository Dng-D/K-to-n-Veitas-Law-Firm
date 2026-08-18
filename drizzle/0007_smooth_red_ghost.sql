CREATE TABLE `accessDelegationActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('invite','role_change','grant','revoke','activate_invitation') NOT NULL,
	`targetUserId` int,
	`targetEmail` varchar(320),
	`permission` varchar(64),
	`previousValue` text,
	`nextValue` text,
	`actorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accessDelegationActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accessInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('admin','staff') NOT NULL DEFAULT 'staff',
	`permissionsJson` text NOT NULL,
	`status` enum('pending','activated','revoked') NOT NULL DEFAULT 'pending',
	`invitedBy` int NOT NULL,
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`activatedUserId` int,
	`activatedAt` timestamp,
	CONSTRAINT `accessInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_invitation_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `userPermissionGrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permission` enum('approve_month_close','lock_month_close','reopen_month_close','approve_report_level_1','approve_report_level_2','reject_report','delete_financial_data') NOT NULL,
	`grantedBy` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedBy` int,
	`revokedAt` timestamp,
	CONSTRAINT `userPermissionGrants_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_permission_grant_unique` UNIQUE(`userId`,`permission`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('owner','admin','staff','user') NOT NULL DEFAULT 'staff';--> statement-breakpoint
UPDATE `users` SET `role` = 'staff' WHERE `role` = 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('owner','admin','staff') NOT NULL DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `accessDelegationActions` ADD CONSTRAINT `accessDelegationActions_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accessDelegationActions` ADD CONSTRAINT `accessDelegationActions_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accessInvitations` ADD CONSTRAINT `accessInvitations_invitedBy_users_id_fk` FOREIGN KEY (`invitedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accessInvitations` ADD CONSTRAINT `accessInvitations_activatedUserId_users_id_fk` FOREIGN KEY (`activatedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPermissionGrants` ADD CONSTRAINT `userPermissionGrants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPermissionGrants` ADD CONSTRAINT `userPermissionGrants_grantedBy_users_id_fk` FOREIGN KEY (`grantedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPermissionGrants` ADD CONSTRAINT `userPermissionGrants_revokedBy_users_id_fk` FOREIGN KEY (`revokedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
