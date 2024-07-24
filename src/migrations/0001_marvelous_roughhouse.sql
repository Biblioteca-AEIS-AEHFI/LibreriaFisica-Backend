CREATE TABLE `authors` (
	`author_id` int AUTO_INCREMENT NOT NULL,
	`first_name` text,
	`last_name` text,
	CONSTRAINT `authors_author_id` PRIMARY KEY(`author_id`)
);
--> statement-breakpoint
CREATE TABLE `authors_per_book` (
	`author_id` int NOT NULL,
	`book_id` int NOT NULL,
	CONSTRAINT `authors_per_book_book_id_author_id_pk` PRIMARY KEY(`book_id`,`author_id`)
);
--> statement-breakpoint
CREATE TABLE `books` (
	`book_id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(40),
	`description` text,
	`edition` int,
	`year` int,
	`publisher` varchar(30),
	`language` varchar(15),
	`isbn` varchar(13) NOT NULL,
	`amount` int,
	CONSTRAINT `books_book_id` PRIMARY KEY(`book_id`),
	CONSTRAINT `books_isbn_unique` UNIQUE(`isbn`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`category_id` int AUTO_INCREMENT NOT NULL,
	`parent_category_id` int,
	`name` varchar(30),
	CONSTRAINT `categories_category_id` PRIMARY KEY(`category_id`)
);
--> statement-breakpoint
CREATE TABLE `categories_per_book` (
	`book_id` int NOT NULL,
	`category_id` int NOT NULL,
	CONSTRAINT `categories_per_book_book_id_category_id_pk` PRIMARY KEY(`book_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`loan_id` int AUTO_INCREMENT NOT NULL,
	`book_id` int,
	`user_id` int,
	`admin_id` int,
	`loaned_at` date,
	`expires_on` date,
	`notes` text,
	CONSTRAINT `loans_loan_id` PRIMARY KEY(`loan_id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`reserve_id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`admin_id` int,
	`amount` float,
	`reason` text,
	CONSTRAINT `payments_reserve_id` PRIMARY KEY(`reserve_id`)
);
--> statement-breakpoint
CREATE TABLE `reputation` (
	`reputation_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(25),
	CONSTRAINT `reputation_reputation_id` PRIMARY KEY(`reputation_id`)
);
--> statement-breakpoint
CREATE TABLE `reserves` (
	`reserve_id` int AUTO_INCREMENT NOT NULL,
	`book_id` int,
	`user_id` int,
	`created_at` date,
	`returned_on` date,
	`status` varchar(20),
	`notes` text,
	CONSTRAINT `reserves_reserve_id` PRIMARY KEY(`reserve_id`)
);
--> statement-breakpoint
CREATE TABLE `user_types` (
	`user_type_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(15),
	CONSTRAINT `user_types_user_type_id` PRIMARY KEY(`user_type_id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_numero_cuenta_unique` UNIQUE(`numero_cuenta`);--> statement-breakpoint
ALTER TABLE `users` ADD `user_type_id` int;--> statement-breakpoint
ALTER TABLE `users` ADD `reputation` int;--> statement-breakpoint
ALTER TABLE `authors_per_book` ADD CONSTRAINT `authors_per_book_author_id_authors_author_id_fk` FOREIGN KEY (`author_id`) REFERENCES `authors`(`author_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authors_per_book` ADD CONSTRAINT `authors_per_book_book_id_books_book_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `parent_category_id_fkey` FOREIGN KEY (`parent_category_id`) REFERENCES `categories`(`category_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories_per_book` ADD CONSTRAINT `categories_per_book_book_id_books_book_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories_per_book` ADD CONSTRAINT `categories_per_book_category_id_categories_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loans` ADD CONSTRAINT `loans_book_id_books_book_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loans` ADD CONSTRAINT `loans_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loans` ADD CONSTRAINT `loans_admin_id_users_user_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_admin_id_users_user_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reserves` ADD CONSTRAINT `reserves_book_id_books_book_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`book_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reserves` ADD CONSTRAINT `reserves_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_user_type_id_user_types_user_type_id_fk` FOREIGN KEY (`user_type_id`) REFERENCES `user_types`(`user_type_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_reputation_reputation_reputation_id_fk` FOREIGN KEY (`reputation`) REFERENCES `reputation`(`reputation_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `user_type`;