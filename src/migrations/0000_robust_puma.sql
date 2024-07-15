CREATE TABLE `users` (
	`user_id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(25),
	`last_name` varchar(25),
	`email` varchar(40) NOT NULL,
	`account` varchar(11) NOT NULL,
	`numero_cuenta` varchar(11) NOT NULL,
	`contrasena` varchar(20) NOT NULL,
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_numero_cuenta_unique` UNIQUE(`numero_cuenta`)
);
