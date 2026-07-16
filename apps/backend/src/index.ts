import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { CentralStore } from './store.ts';
import { createApp } from './server.ts';

const PORT = Number(process.env.PORT ?? 3333);
const DB_PATH = process.env.CARDIO_DB ?? 'data/cardio-central.db';

if (DB_PATH !== ':memory:') {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}

const store = new CentralStore(DB_PATH);
const app = createApp(store);

app.listen(PORT, () => {
  console.log(`[cardio-backend] ouvindo em http://localhost:${PORT} (db: ${DB_PATH})`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    console.log(`\n[cardio-backend] encerrando (${sig})`);
    store.close();
    process.exit(0);
  });
}
