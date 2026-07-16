import { DatabaseSync } from 'node:sqlite';
import { shouldApply, type SyncMutation, type SyncRecordType } from '@cardio/shared';

/**
 * Banco central como um document-store: cada registro (paciente/visita) é guardado
 * como um JSON, chaveado por (type, id). Atualizações mesclam o payload recebido
 * (que pode ser parcial) no documento existente, com resolução last-write-wins por
 * `updatedAt`. Um cursor monotônico (`seq`) permite pulls incrementais confiáveis
 * mesmo com relógios de dispositivos diferentes.
 */
export class CentralStore {
  private db: DatabaseSync;

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        type       TEXT NOT NULL,
        id         TEXT NOT NULL,
        seq        INTEGER NOT NULL,
        updated_at TEXT,
        deleted_at TEXT,
        payload    TEXT NOT NULL,
        PRIMARY KEY (type, id)
      );
      CREATE INDEX IF NOT EXISTS idx_records_seq ON records (seq);
    `);
  }

  private nextSeq(): number {
    const row = this.db.prepare('SELECT COALESCE(MAX(seq), 0) AS m FROM records').get() as {
      m: number;
    };
    return row.m + 1;
  }

  private getRaw(type: string, id: string) {
    return this.db
      .prepare('SELECT type, id, updated_at, deleted_at, payload FROM records WHERE type = ? AND id = ?')
      .get(type, id) as
      | { type: string; id: string; updated_at: string | null; deleted_at: string | null; payload: string }
      | undefined;
  }

  /** Aplica uma mutação. Retorna true se aplicada, false se ignorada por LWW. */
  applyMutation(m: SyncMutation): boolean {
    const existing = this.getRaw(m.recordType, m.recordId);
    const incomingUpdatedAt = (m.payload.updatedAt as string | undefined) ?? null;
    if (!shouldApply(incomingUpdatedAt, existing?.updated_at ?? null)) {
      return false;
    }

    const base: Record<string, unknown> = existing
      ? (JSON.parse(existing.payload) as Record<string, unknown>)
      : {};
    const merged: Record<string, unknown> = { ...base, ...m.payload, id: m.recordId };

    let deletedAt: string | null = (merged.deletedAt as string | null) ?? null;
    if (m.operation === 'delete') {
      deletedAt = (m.payload.deletedAt as string | undefined) ?? incomingUpdatedAt ?? new Date().toISOString();
      merged.deletedAt = deletedAt;
    }

    const seq = this.nextSeq();
    this.db
      .prepare(
        `INSERT INTO records (type, id, seq, updated_at, deleted_at, payload)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(type, id) DO UPDATE SET
           seq = excluded.seq,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at,
           payload = excluded.payload`
      )
      .run(m.recordType, m.recordId, seq, incomingUpdatedAt, deletedAt, JSON.stringify(merged));
    return true;
  }

  /** Aplica um lote de mutações em uma transação. */
  push(mutations: SyncMutation[]): { applied: number; skipped: number; cursor: number } {
    let applied = 0;
    let skipped = 0;
    const tx = this.db.prepare('BEGIN');
    tx.run();
    try {
      for (const m of mutations) {
        if (this.applyMutation(m)) applied++;
        else skipped++;
      }
      this.db.prepare('COMMIT').run();
    } catch (err) {
      this.db.prepare('ROLLBACK').run();
      throw err;
    }
    return { applied, skipped, cursor: this.cursor() };
  }

  /** Registros de um tipo alterados após o cursor `since`. */
  private changesSince(type: SyncRecordType, since: number): Record<string, unknown>[] {
    const rows = this.db
      .prepare('SELECT payload FROM records WHERE type = ? AND seq > ? ORDER BY seq')
      .all(type, since) as { payload: string }[];
    return rows.map((r) => JSON.parse(r.payload) as Record<string, unknown>);
  }

  pull(since: number): {
    pacientes: Record<string, unknown>[];
    visitas: Record<string, unknown>[];
    cursor: number;
  } {
    return {
      pacientes: this.changesSince('paciente', since),
      visitas: this.changesSince('visita', since),
      cursor: this.cursor(),
    };
  }

  cursor(): number {
    const row = this.db.prepare('SELECT COALESCE(MAX(seq), 0) AS m FROM records').get() as {
      m: number;
    };
    return row.m;
  }

  counts(): { pacientes: number; visitas: number } {
    const p = this.db.prepare("SELECT COUNT(*) AS n FROM records WHERE type = 'paciente'").get() as {
      n: number;
    };
    const v = this.db.prepare("SELECT COUNT(*) AS n FROM records WHERE type = 'visita'").get() as {
      n: number;
    };
    return { pacientes: p.n, visitas: v.n };
  }

  close() {
    this.db.close();
  }
}
