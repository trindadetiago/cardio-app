import { useEffect, useState } from 'react';
import { useMigrations } from 'drizzle-orm/op-sqlite/migrator';

import { db } from './client';
import migrations from './migrations/migrations';
import { seedDevAgent } from './seed';

export function useDbMigrations() {
  const migrationsState = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!migrationsState.success || seeded) return;
    seedDevAgent()
      .then(() => setSeeded(true))
      .catch((err) => setSeedError(err instanceof Error ? err : new Error(String(err))));
  }, [migrationsState.success, seeded]);

  return {
    success: migrationsState.success && seeded,
    error: migrationsState.error ?? seedError,
  };
}
