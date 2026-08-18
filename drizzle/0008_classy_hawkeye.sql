ALTER TABLE `accessDelegationActions` MODIFY COLUMN `action` enum('invite','role_change','grant','revoke','expire','activate_invitation') NOT NULL;--> statement-breakpoint
ALTER TABLE `accessInvitations` ADD `grantExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `accessInvitations` ADD `emailDeliveryStatus` enum('pending','sent','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `accessInvitations` ADD `emailSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `accessInvitations` ADD `emailError` text;--> statement-breakpoint
ALTER TABLE `userPermissionGrants` ADD `expiresAt` timestamp;