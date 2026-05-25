import { open, type DB } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';

import * as schema from './schema';

const DB_NAME = 'cardio-remoto.db';

const opsqlite = open({ name: DB_NAME }) as unknown as Parameters<typeof drizzle>[0];

export const db = drizzle(opsqlite, { schema });

export type Database = typeof db;
export { schema };
export type RawConnection = DB;
