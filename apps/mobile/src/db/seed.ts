import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { hashSenha } from '@/src/lib/hash';
import { db } from './client';
import { agentesSaude } from './schema';

const DEV_AGENT = {
  nome: 'Agente Dev',
  email: 'admin@cardio.local',
  senha: 'admin123',
};

export async function seedDevAgent(): Promise<void> {
  const existing = await db
    .select({ id: agentesSaude.id })
    .from(agentesSaude)
    .where(eq(agentesSaude.email, DEV_AGENT.email))
    .limit(1);

  if (existing.length > 0) return;

  const senhaHash = await hashSenha(DEV_AGENT.senha);
  await db.insert(agentesSaude).values({
    id: Crypto.randomUUID(),
    nome: DEV_AGENT.nome,
    email: DEV_AGENT.email,
    senhaHash,
  });
}
