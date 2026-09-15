CREATE TABLE `whatsapp_connection_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int,
	`action` enum('qr_requested','status_check','connected','disconnected','test_message','error') NOT NULL,
	`status` enum('success','failure') NOT NULL,
	`details` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_connection_logs_id` PRIMARY KEY(`id`)
);
