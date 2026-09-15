CREATE TABLE `affiliate_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`offerId` int,
	`marketplace` varchar(60) NOT NULL,
	`eventType` enum('click','conversion') NOT NULL,
	`orderValueCents` int NOT NULL DEFAULT 0,
	`commissionCents` int NOT NULL DEFAULT 0,
	`source` varchar(80),
	`externalEventId` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_events_id` PRIMARY KEY(`id`)
);
