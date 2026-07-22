#!/usr/bin/env bash
#
# Grava vídeos (mp4) das principais histórias de uso do CardioRemoto, dirigindo o
# app com Maestro enquanto o simulador é gravado via `xcrun simctl io recordVideo`.
# Requer: build Debug instalado + Metro rodando (npm run start) + Maestro + OpenJDK.
#
# Uso: bash e2e/record-stories.sh
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UDID="${UDID:-B11A6A7A-01F0-4041-B843-9A6DB98C9CF4}"
PORT="${PORT:-3333}"
OUT="$ROOT/docs/videos"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export PATH="$HOME/.maestro/bin:$JAVA_HOME/bin:$PATH"
mkdir -p "$OUT"

echo "[rec] starting sync backend :$PORT (in-memory)"
CARDIO_DB=:memory: PORT="$PORT" node --disable-warning=ExperimentalWarning "$ROOT/apps/backend/src/index.ts" &
BACKEND_PID=$!
cleanup() { kill "$BACKEND_PID" 2>/dev/null || true; }
trap cleanup EXIT
for _ in $(seq 1 20); do curl -sf "http://localhost:$PORT/health" >/dev/null && break; sleep 0.5; done

record() {
  local name="$1"; local flow="$2"
  echo "[rec] === $name ($flow) ==="
  xcrun simctl io "$UDID" recordVideo --codec=h264 --force "$OUT/$name.mp4" &
  local rec=$!
  sleep 2
  maestro test "$flow" || echo "[rec][warn] $flow had failures (kept video)"
  sleep 1.5
  kill -INT "$rec" 2>/dev/null || true
  wait "$rec" 2>/dev/null || true
  echo "[rec] saved $OUT/$name.mp4"
}

# Histórias self-contained (cada fluxo cria seus próprios dados; todos passam no e2e).
record "01-jornada-completa"     "$ROOT/e2e/flows/journey.yaml"
record "02-cadastro-categorico"  "$ROOT/e2e/tests/10-cadastro-categorico.yaml"
record "03-visita-alertas"       "$ROOT/e2e/tests/05-visita-alertas.yaml"
record "04-evolucao"             "$ROOT/e2e/tests/07-evolucao.yaml"
record "05-filtro-risco"         "$ROOT/e2e/tests/06-filtro-risco.yaml"
record "06-login-bloqueio"       "$ROOT/e2e/tests/01-login-invalido.yaml"
record "07-sync-pull-refresh"    "$ROOT/e2e/tests/09-pull-refresh.yaml"

echo "[rec] ALL_RECORDINGS_DONE"
ls -la "$OUT"
