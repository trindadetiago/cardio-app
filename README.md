# CardioRemoto

App mobile para monitoramento de pacientes cardiovasculares pelo Hospital Universitario,
parte do ecossistema **mare.IA**. Baseado no Documento de Requisitos V2 (UCE II).

Projeto criado com [Expo](https://expo.dev) (template default + TypeScript).

## Stack escolhida

- **Expo + React Native + TypeScript** — base
- **Expo Router** — navegacao por arquivo (vem no template)
- **op-sqlite + Drizzle ORM** — banco local offline-first
- **react-hook-form + zod** — formularios e validacao
- **TanStack Query + Zustand** — estado servidor/local
- **expo-secure-store** — token de autenticacao

> Dependencias ja instaladas via `npm install`. Ver `package.json`.

## Comandos

```bash
npm start           # inicia Metro
npm run ios         # roda no iOS Simulator
npm run android     # roda no emulador Android
npm run web         # roda no browser
```

## Documentos

- [`PLANO.md`](./PLANO.md) — plano de acao, sprints e premissas
