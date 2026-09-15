CREATE TABLE IF NOT EXISTS `affiliate_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marketplace` enum('amazon','shopee','magalu','mercadolivre','aliexpress','kabum') NOT NULL,
	`affiliateTag` varchar(120) NOT NULL,
	`apiKey` text,
	`apiSecret` text,
	`appId` varchar(120),
	`isConnected` boolean NOT NULL DEFAULT true,
	`autoConvertLinks` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_integrations_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marketplace` varchar(60) NOT NULL,
	`code` varchar(80) NOT NULL,
	`description` text,
	`discountLabel` varchar(80),
	`minSpendCents` int DEFAULT 0,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `dispatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`offerId` int,
	`groupId` int,
	`channelType` enum('whatsapp','telegram') NOT NULL DEFAULT 'whatsapp',
	`formattedMessage` text NOT NULL,
	`scheduledFor` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`status` enum('scheduled','sending','sent','failed') NOT NULL DEFAULT 'scheduled',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dispatches_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeInvoiceId` varchar(160),
	`stripePaymentIntentId` varchar(160),
	`amountCents` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'BRL',
	`status` enum('paid','open','void','uncollectible') NOT NULL DEFAULT 'paid',
	`planName` varchar(120) NOT NULL,
	`pdfUrl` text,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `message_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`content` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_templates_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`originalUrl` text NOT NULL,
	`affiliateUrl` text NOT NULL,
	`marketplace` varchar(60) NOT NULL,
	`originalPriceCents` int NOT NULL,
	`discountPriceCents` int NOT NULL,
	`discountPercent` int NOT NULL,
	`couponCode` varchar(80),
	`imageUrl` text,
	`qualityScore` int NOT NULL DEFAULT 75,
	`isOfficialStore` boolean NOT NULL DEFAULT false,
	`isFreeShipping` boolean NOT NULL DEFAULT false,
	`segmentId` int,
	`status` enum('detected','queued','published','rejected') NOT NULL DEFAULT 'detected',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `plans` (
	`id` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`interval` enum('month','year') NOT NULL DEFAULT 'year',
	`priceCents` int NOT NULL,
	`dailyLimitOffers` int NOT NULL DEFAULT 150,
	`maxWhatsappGroups` int NOT NULL DEFAULT 5,
	`maxTelegramChannels` int NOT NULL DEFAULT 5,
	`qualityScoreMax` int NOT NULL DEFAULT 80,
	`stripePriceId` varchar(128),
	`stripeProductId` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`keywords` text NOT NULL,
	`excludedKeywords` text,
	`minDiscountPercent` int NOT NULL DEFAULT 10,
	`minQualityScore` int NOT NULL DEFAULT 50,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `segments_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` varchar(64) NOT NULL,
	`stripeSessionId` varchar(160),
	`stripeSubscriptionId` varchar(160),
	`stripePaymentIntentId` varchar(160),
	`status` enum('pending','active','canceled','failed') NOT NULL DEFAULT 'pending',
	`amountCents` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'BRL',
	`customerEmail` varchar(320) NOT NULL,
	`customerName` text,
	`tempPasswordGenerated` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `whatsapp_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`jid` varchar(160) NOT NULL,
	`segmentId` int,
	`participantsCount` int NOT NULL DEFAULT 0,
	`autoPostingEnabled` boolean NOT NULL DEFAULT true,
	`delaySeconds` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_groups_id` PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `whatsapp_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`instanceName` varchar(100) NOT NULL,
	`status` enum('disconnected','connecting','connected') NOT NULL DEFAULT 'disconnected',
	`qrCodeData` text,
	`connectedPhone` varchar(40),
	`batteryLevel` int DEFAULT 100,
	`lastPingAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_sessions_id` PRIMARY KEY(`id`)
);
