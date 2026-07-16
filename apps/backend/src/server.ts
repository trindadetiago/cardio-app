import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { PullResponse, PushRequest, PushResponse, SyncMutation } from '@cardio/shared';
import { CentralStore } from './store.ts';

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > 25 * 1024 * 1024) {
        reject(new Error('Payload muito grande'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isValidMutation(m: unknown): m is SyncMutation {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  return (
    (x.recordType === 'paciente' || x.recordType === 'visita') &&
    typeof x.recordId === 'string' &&
    (x.operation === 'insert' || x.operation === 'update' || x.operation === 'delete') &&
    !!x.payload &&
    typeof x.payload === 'object'
  );
}

export function createApp(store: CentralStore) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');

      if (req.method === 'OPTIONS') return send(res, 204, {});

      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { ok: true, cursor: store.cursor(), counts: store.counts() });
      }

      if (req.method === 'POST' && url.pathname === '/sync/push') {
        const raw = await readBody(req);
        let parsed: PushRequest;
        try {
          parsed = JSON.parse(raw || '{}') as PushRequest;
        } catch {
          return send(res, 400, { error: 'JSON inválido' });
        }
        const mutations = Array.isArray(parsed.mutations) ? parsed.mutations : [];
        if (!mutations.every(isValidMutation)) {
          return send(res, 400, { error: 'Mutação inválida no lote' });
        }
        const result: PushResponse = store.push(mutations);
        return send(res, 200, result);
      }

      if (req.method === 'GET' && url.pathname === '/sync/pull') {
        const since = Number(url.searchParams.get('since') ?? '0') || 0;
        const result: PullResponse = store.pull(since);
        return send(res, 200, result);
      }

      return send(res, 404, { error: 'Rota não encontrada' });
    } catch (err) {
      return send(res, 500, { error: err instanceof Error ? err.message : 'Erro interno' });
    }
  });
}
