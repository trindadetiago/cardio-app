import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const agentesSaude = sqliteTable('agentes_saude', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const pacientes = sqliteTable('pacientes', {
  id: text('id').primaryKey(),
  cpf: text('cpf').notNull().unique(),
  nome: text('nome').notNull(),
  dataNascimento: text('data_nascimento').notNull(),
  sexo: text('sexo', { enum: ['M', 'F'] }).notNull(),
  tabagismo: integer('tabagismo', { mode: 'boolean' }).notNull(),
  atividadeFisica: integer('atividade_fisica', { mode: 'boolean' }).notNull(),
  estatina: integer('estatina', { mode: 'boolean' }).notNull(),
  historicoCv: integer('historico_cv', { mode: 'boolean' }).notNull(),
  dataEventoCv: text('data_evento_cv'),
  visitaMaisRecente: text('visita_mais_recente'),
  agenteId: text('agente_id')
    .notNull()
    .references(() => agentesSaude.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  syncedAt: text('synced_at'),
  deletedAt: text('deleted_at'),
});

export const visitas = sqliteTable('visitas', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id')
    .notNull()
    .references(() => pacientes.id),
  agenteId: text('agente_id')
    .notNull()
    .references(() => agentesSaude.id),
  dataVisita: text('data_visita').notNull(),
  peso: real('peso'),
  altura: real('altura'),
  imc: real('imc'),
  circunferenciaAbdominal: real('circunferencia_abdominal'),
  paSistolica: integer('pa_sistolica'),
  paDiastolica: integer('pa_diastolica'),
  frequenciaCardiaca: integer('frequencia_cardiaca'),
  glicemiaJejum: real('glicemia_jejum'),
  hba1c: real('hba1c'),
  colesterolTotal: real('colesterol_total'),
  ldl: real('ldl'),
  hdl: real('hdl'),
  triglicerides: real('triglicerides'),
  creatinina: real('creatinina'),
  observacoes: text('observacoes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  syncedAt: text('synced_at'),
  deletedAt: text('deleted_at'),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recordType: text('record_type', { enum: ['paciente', 'visita'] }).notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation', { enum: ['insert', 'update', 'delete'] }).notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  timestamp: text('timestamp')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  status: text('status', { enum: ['pending', 'syncing', 'synced', 'error'] })
    .notNull()
    .default('pending'),
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'),
});

export type AgenteSaude = typeof agentesSaude.$inferSelect;
export type NovoAgenteSaude = typeof agentesSaude.$inferInsert;
export type Paciente = typeof pacientes.$inferSelect;
export type NovoPaciente = typeof pacientes.$inferInsert;
export type Visita = typeof visitas.$inferSelect;
export type NovaVisita = typeof visitas.$inferInsert;
export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NovoSyncQueueItem = typeof syncQueue.$inferInsert;
