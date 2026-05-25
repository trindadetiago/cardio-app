# Plano de Acao — CardioRemoto

Plano de implementacao do app CardioRemoto, baseado no Documento de Requisitos V2.
Stack: Expo + React Native + TypeScript + Drizzle/op-sqlite.

---

## 1. Objetivo do projeto

Construir o **modulo de coleta** do CardioRemoto: app mobile usado por agentes de
saude para cadastrar pacientes cardiovasculares, registrar visitas (dados
antropometricos, vitais e exames) e visualizar evolucao ao longo do tempo,
funcionando **offline-first** e sincronizando com um banco central quando
houver conexao.

O lado clinico (medico, IA, integracao com prontuario) **nao faz parte deste
escopo** — esta noutro componente do ecossistema mare.IA.

---

## 2. Decisoes ja tomadas (sessao 2026-05-19)

| # | Topico | Decisao |
|---|--------|---------|
| 1 | Evento CV | `historico_cv` booleano obrigatorio + `data_evento_cv` opcional no cadastro do paciente |
| 2 | Sync direcao | Bidirecional. Mesmo agente em multiplos celulares precisa ver tudo |
| 3 | Sync conflito | Last-write-wins por `updated_at` (timestamp) |
| 4 | Sync payload | Registro completo por mutacao + fila de operacoes (`sync_queue`) |
| 5 | Criptografia DB | Sem cripto extra agora. TODO revisar com LGPD antes de producao |
| 6 | Back-end | Supabase (Postgres + Auth + Realtime) |
| 7 | Schema visita | 1 tabela `visitas` flat com colunas nullable. Sem subtabelas |
| 8 | Cadastro agente | Admin cria no painel Supabase. Futuro: signup aberto no app |

## 2.1 Pontos ainda em aberto (nao bloqueiam Sprint 0)

1. **Classificacao de risco (UC03 / Sprint 4)**
   - Doc so define meta para PA, HbA1c e LDL. E os outros exames?
   - PA conta como 1 parametro composto ou 2 (sistolica + diastolica)?
2. **Auth (Sprint 1)**
   - Login exige conexao na primeira vez? Bloqueio de 5 tentativas e server-side ou client-side?
3. **LGPD (Sprint 8)**
   - Tela de termos, fluxo de consentimento, exclusao de dados.

---

## 3. Sprints (vertical slices)

### Sprint 0 — Fundacao
- [x] Inicializar projeto Expo com TypeScript
- [x] Instalar dependencias base (drizzle, op-sqlite, react-hook-form, zod,
      tanstack/react-query, zustand, expo-secure-store)
- [ ] Modelar schema do banco local (pacientes, visitas, antropometricos,
      vitais, exames, agentes_saude, sync_queue)
- [ ] Gerar migration inicial com drizzle-kit
- [ ] Configurar cliente op-sqlite + Drizzle
- [ ] Estruturar pastas (`src/db`, `src/features`, `src/lib`, `src/components`)
- [ ] Setup de ESLint, Prettier, alias `@/*`

### Sprint 1 — Login e shell do app (RF001 / UC01)
- [x] Tela de login (formulario email + senha, react-hook-form + zod)
- [x] Persistencia de sessao em expo-secure-store
- [x] Logica de bloqueio apos 5 tentativas (15 min)
- [x] Tela inicial (placeholder de lista) + tabs Pacientes/Sync/Perfil
- [x] Logout
- [x] Decidir: autentica online, offline, ou ambos? → **offline local** contra `agentes_saude`; Sprint 6 popula a tabela via Supabase. Agente dev seedado: `admin@cardio.local` / `admin123`

### Sprint 2 — Cadastro de paciente (RF002 / UC02)
- [x] Form de cadastro com validacao zod (CPF com check digits, nome, nascimento,
      sexo, tabagismo, atividade, estatina, historico CV + data evento condicional)
- [x] Calculo automatico de idade exibido em tempo real
- [x] Tratamento de "paciente ja cadastrado" (pre-check por CPF + Alert)
- [x] Salvar local + enfileirar em `sync_queue` em transacao
- [x] Lista de pacientes (sem filtro) com pull-to-refresh + FAB

### Sprint 3 — Inserir visita (RF005 / UC05)
- [x] Form de visita com 3 secoes (antropometricos / vitais / exames + observacoes)
- [x] Calculo automatico de IMC + classificacao (baixo/normal/sobrepeso/obesidade I-III)
- [x] Validacao "pelo menos um campo preenchido" + sistolica > diastolica
- [x] Alertas visuais para PA, glicemia em jejum, LDL (alerta/critico) com borda colorida e mensagem inline
- [x] Atualizacao do campo `visita_mais_recente` no paciente em transacao (so atualiza se data mais recente)
- [x] Tela de detalhe do paciente (nome, fatores de risco, ultima visita, total) com botao "Nova visita"

### Sprint 4 — Filtro e ordenacao (RF003 / RF004 / UC03 / UC04)
- [ ] Implementar funcao de classificacao de risco
- [ ] Implementar funcao de prioridade de visita (3 meses verde, 1 mes amarelo/vermelho)
- [ ] Filtro por status de risco (todos / verde / amarelo / vermelho)
- [ ] Ordenacao por prioridade de visita (atrasados primeiro)
- [ ] Indicador visual de risco no card do paciente

### Sprint 5 — Evolucao temporal (RF006 / UC06)
- [ ] Tabela com historico por data
- [ ] Grafico small multiples (escolher lib: Victory Native XL ou gifted-charts)
- [ ] Selecao de quais variaveis exibir

### Sprint 6 — Sincronizacao (RF007 / RFN001 / UC07)
- [ ] Definir contrato com back-end (apos decisao de stack)
- [ ] Implementar sync manual com confirmacao
- [ ] Implementar sync passiva (ao detectar conexao)
- [ ] Tratamento de conflito *(depende de decisao)*
- [ ] Tela de status de sincronizacao

### Sprint 7 — Responsividade e polish (RFN002)
- [ ] Breakpoints 320-480 / 481-767 / 768-1024
- [ ] Areas de toque >= 44x44
- [ ] Tipografia minima 14px
- [ ] Validar em device fisico Android e iOS

### Sprint 8 — Seguranca (implicito da arquitetura)
- [ ] Hash de senha com argon2/bcrypt no back
- [ ] SQLCipher no banco local *(depende de decisao)*
- [ ] Token JWT com expiracao
- [ ] LGPD: termos, consentimento, exclusao de dados *(ponto aberto)*

---

## 4. Estrutura de pastas planejada

A criar quando o Sprint 0 for executado:

```
src/
  db/
    schema.ts          # tabelas Drizzle
    client.ts          # cliente op-sqlite
    migrations/        # geradas pelo drizzle-kit
  features/
    auth/              # login (RF001)
    pacientes/         # cadastro + lista (RF002/003/004)
    visitas/           # nova visita + evolucao (RF005/006)
    sync/              # sincronizacao (RF007)
  lib/
    risco.ts           # classificacao de risco (UC03)
    visita-prioridade.ts  # ordenacao por visita (UC04)
    formatters.ts      # CPF, datas, valores
  components/          # UI compartilhada
  types/               # tipos compartilhados
app/                   # rotas Expo Router (gerado pelo template)
```

---

## 5. Mapeamento requisito -> entrega

| Req      | Prioridade | Sprint | Onde sera implementado            |
|----------|------------|--------|-----------------------------------|
| RF001    | essencial  | 1      | `src/features/auth/`              |
| RF002    | essencial  | 2      | `src/features/pacientes/cadastro` |
| RF003    | importante | 4      | `src/features/pacientes/lista`    |
| RF004    | essencial  | 4      | `src/features/pacientes/lista`    |
| RF005    | essencial  | 3      | `src/features/visitas/nova`       |
| RF006    | essencial  | 5      | `src/features/visitas/evolucao`   |
| RF007    | importante | 6      | `src/features/sync/`              |
| RFN001   | importante | 0+6    | base do `src/db` + sync           |
| RFN002   | desejavel  | 7      | `src/components/` + layouts       |

---

## 6. Riscos

- **Sincronizacao**: maior fonte de complexidade e bugs. Adiar resolucao de
  conflito ate ter mais clareza de uso real.
- **SQLCipher**: build paga ou alternativa. Decidir cedo.
- **Classificacao de risco mal especificada**: pode gerar retrabalho. Fechar
  com stakeholder antes do Sprint 4.
- **Suporte a dispositivos antigos**: definir versao minima Android/iOS no
  comeco para nao quebrar libs depois.

---

## 7. Definicao de pronto (por sprint)

Uma sprint so e dada como concluida quando:
- Codigo compila sem warning de TS
- Funcionalidade testada manualmente no iOS Simulator e em device Android
- Dados persistem corretamente no banco local
- Nao quebra funcionalidades de sprints anteriores
