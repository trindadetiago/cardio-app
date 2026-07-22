# Como contribuir

Fluxo simples baseado em branches e pull requests, com verificação automática por CI.

## Fluxo de trabalho

1. **Crie uma branch** a partir de `main`:
   - `feat/<assunto>` para novas funcionalidades
   - `fix/<assunto>` para correções
   - `chore/<assunto>` / `docs/<assunto>` para manutenção e documentação
2. **Faça commits pequenos e descritivos** (imperativo, em português).
3. **Abra um Pull Request** para `main`.
4. **A CI roda automaticamente** (ver abaixo). O merge só deve acontecer com a CI **verde**.
5. Prefira **squash merge** para manter o histórico da `main` limpo.

## Verificação automática (CI)

Toda push na `main` e todo PR dispara o workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml),
que executa, em Node 24:

| Etapa | Comando | O que garante |
|-------|---------|---------------|
| Typecheck | `npm run typecheck` | Tipos corretos em `shared` e `mobile` |
| Testes unitários | `npm test` | Regras de domínio (risco, prioridade, alertas), backend de sync e lógica de auth |
| Lint | `npm run lint` | Padrão de código (ESLint / Expo) |

Os **testes e2e (Maestro)** não rodam na CI porque exigem um simulador iOS.
Rode-os localmente antes de PRs que mexam em fluxos de tela:

```bash
npm run test:e2e            # jornada completa
npm run test:e2e:granular   # testes por ação (login, cadastro, visita, filtro, sync…)
```

## Antes de abrir o PR

```bash
npm run typecheck
npm test
npm run lint
```

Se os três passarem localmente, a CI deve ficar verde.

## Estrutura

Este é um **monorepo** (npm workspaces): `apps/mobile`, `apps/backend`, `packages/shared`.
Regras de negócio e o contrato de sincronização vivem em `packages/shared` — mudanças ali
afetam app **e** backend, então rode os testes de ambos.
