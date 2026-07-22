PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_pacientes` (
	`id` text PRIMARY KEY NOT NULL,
	`cpf` text NOT NULL,
	`nome` text NOT NULL,
	`data_nascimento` text NOT NULL,
	`sexo` text NOT NULL,
	`tabagismo` text NOT NULL,
	`atividade_fisica` text NOT NULL,
	`estatina` integer NOT NULL,
	`historico_cv` text NOT NULL,
	`data_evento_cv` text,
	`visita_mais_recente` text,
	`agente_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`synced_at` text,
	`deleted_at` text,
	FOREIGN KEY (`agente_id`) REFERENCES `agentes_saude`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_pacientes`("id", "cpf", "nome", "data_nascimento", "sexo", "tabagismo", "atividade_fisica", "estatina", "historico_cv", "data_evento_cv", "visita_mais_recente", "agente_id", "created_at", "updated_at", "synced_at", "deleted_at") SELECT "id", "cpf", "nome", "data_nascimento", "sexo", "tabagismo", "atividade_fisica", "estatina", "historico_cv", "data_evento_cv", "visita_mais_recente", "agente_id", "created_at", "updated_at", "synced_at", "deleted_at" FROM `pacientes`;--> statement-breakpoint
DROP TABLE `pacientes`;--> statement-breakpoint
ALTER TABLE `__new_pacientes` RENAME TO `pacientes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `pacientes_cpf_unique` ON `pacientes` (`cpf`);--> statement-breakpoint
ALTER TABLE `visitas` ADD `glicemia_capilar` real;--> statement-breakpoint
ALTER TABLE `visitas` ADD `ureia` real;--> statement-breakpoint
ALTER TABLE `visitas` ADD `tsh` real;--> statement-breakpoint
ALTER TABLE `visitas` ADD `tgo` real;--> statement-breakpoint
ALTER TABLE `visitas` ADD `tgp` real;--> statement-breakpoint
ALTER TABLE `visitas` ADD `cpk` real;--> statement-breakpoint
ALTER TABLE `visitas` ADD `relacao_albumina_creatinina` real;