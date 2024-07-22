CREATE TABLE `users` (
	`user_id` int AUTO_INCREMENT NOT NULL,
	`numero_cuenta` varchar(15),
	`first_name` varchar(35),
	`last_name` varchar(35),
	`email` varchar(40) NOT NULL,
	`phone_number` varchar(8),
	`account` varchar(11) NOT NULL,
	`user_type` enum('normal','admin') NOT NULL,
	`password` varchar(60) NOT NULL,
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_account_unique` UNIQUE(`account`),
	CONSTRAINT `users_password_unique` UNIQUE(`password`)
);
