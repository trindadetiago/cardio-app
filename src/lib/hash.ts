import * as Crypto from 'expo-crypto';

const SALT_BYTES = 16;

async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function hashSenha(senha: string): Promise<string> {
  const saltBytes = await Crypto.getRandomBytesAsync(SALT_BYTES);
  const salt = toHex(saltBytes);
  const digest = await sha256(salt + senha);
  return `${salt}:${digest}`;
}

export async function verifySenha(senha: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const digest = await sha256(salt + senha);
  return digest === expected;
}
