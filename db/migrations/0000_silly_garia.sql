CREATE TABLE `income_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`is_recurring` integer DEFAULT true,
	`recurring_frequency` text,
	`recurring_day` integer,
	`currency_code` text DEFAULT 'USD',
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mandatory_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`is_recurring` integer DEFAULT true,
	`recurring_frequency` text,
	`recurring_day` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`note` text,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`is_mandatory` integer DEFAULT false,
	`is_leisure` integer DEFAULT false,
	`is_recurring` integer DEFAULT false,
	`recurring_frequency` text,
	`recurring_day` integer,
	`currency_code` text DEFAULT 'USD',
	`created_at` text NOT NULL
);
