/**
 * URL base do banco central (backend de sincronização).
 * Configurável via `EXPO_PUBLIC_API_URL`. No iOS Simulator, `localhost` alcança
 * a máquina host diretamente.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333';
