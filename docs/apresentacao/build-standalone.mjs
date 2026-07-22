// Gera um HTML único e autocontido: inlina screenshots, vídeos, posters e logos
// como data URIs (base64). Uso: node docs/apresentacao/build-standalone.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url)); // docs/apresentacao
const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webp': 'image/webp',
};

let html = readFileSync(resolve(dir, 'index.html'), 'utf8');
let inlined = 0, bytes = 0;

function dataUri(rel) {
  const p = resolve(dir, rel);
  const buf = readFileSync(p);
  const mime = MIME[extname(p).toLowerCase()] || 'application/octet-stream';
  bytes += buf.length; inlined++;
  return `data:${mime};base64,${buf.toString('base64')}`;
}

html = html.replace(
  /(src|poster)="((?:\.\.\/)?(?:screenshots|videos|logos)\/[^"]+)"/g,
  (match, attr, rel) => {
    try { return `${attr}="${dataUri(rel)}"`; }
    catch (e) { console.error('  skip', rel, '-', e.message); return match; }
  }
);

const out = resolve(dir, 'CardioRemoto-apresentacao.html');
writeFileSync(out, html);
console.log(`Inlined ${inlined} assets (${(bytes / 1e6).toFixed(1)} MB de mídia).`);
console.log(`-> ${out} (${(Buffer.byteLength(html) / 1e6).toFixed(1)} MB)`);
