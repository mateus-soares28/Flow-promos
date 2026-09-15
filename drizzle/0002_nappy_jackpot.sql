CREATE TABLE `automation_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`cronExpression` varchar(80) NOT NULL DEFAULT '0 */15 * * * *',
	`isEnabled` boolean NOT NULL DEFAULT false,
	`lastRunAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `whatsapp_sessions` ADD `provider` enum('evolution','zapi') DEFAULT 'evolution' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_sessions` ADD `apiBaseUrl` varchar(255);--> statement-breakpoint
ALTER TABLE `whatsapp_sessions` ADD `apiToken` text;--> statement-breakpoint
ALTER TABLE `whatsapp_sessions` ADD `externalInstanceId` varchar(120);--> statement-breakpoint
ALTER TABLE `whatsapp_sessions` ADD `webhookSecret` varchar(180);