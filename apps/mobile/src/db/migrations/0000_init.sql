CREATE TABLE `agentes_saude` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agentes_saude_email_unique` ON `agentes_saude` (`email`);--> statement-breakpoint
CREATE TABLE `pacientes` (
	`id` text PRIMARY KEY NOT NULL,
	`cpf` text NOT NULL,
	`nome` text NOT NULL,
	`data_nascimento` text NOT NULL,
	`sexo` text NOT NULL,
	`tabagismo` integer NOT NULL,
	`atividade_fisica` integer NOT NULL,
	`estatina` integer NOT NULL,
	`historico_cv` integer NOT NULL,
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
CREATE UNIQUE INDEX `pacientes_cpf_unique` ON `pacientes` (`cpf`);--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`record_type` text NOT NULL,
	`record_id` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `visitas` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text NOT NULL,
	`agente_id` text NOT NULL,
	`data_visita` text NOT NULL,
	`peso` real,
	`altura` real,
	`imc` real,
	`circunferencia_abdominal` real,
	`pa_sistolica` integer,
	`pa_diastolica` integer,
	`frequencia_cardiaca` integer,
	`glicemia_jejum` real,
	`hba1c` real,
	`colesterol_total` real,
	`ldl` real,
	`hdl` real,
	`triglicerides` real,
	`creatinina` real,
	`observacoes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`synced_at` text,
	`deleted_at` text,
	FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agente_id`) REFERENCES `agentes_saude`(`id`) ON UPDATE no action ON DELETE no action
);
