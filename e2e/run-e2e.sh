#!/usr/bin/env bash
#
# Executa a suíte e2e (Maestro) do CardioRemoto no iOS Simulator.
#
# Passos:
#   1. Sobe o iOS Simulator.
#   2. Inicia o backend de sincronização (banco em memória, porta 3333).
#   3. Compila e instala o app (configuração Release — JS embutido, sem Metro).
#   4. Roda os fluxos Maestro.
#
# Requisitos: Xcode + Simulator, CocoaPods, OpenJDK e Maestro instalados.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIM="${SIM:-iPhone 16}"
PORT="${PORT:-3333}"
FLOW="${1:-$ROOT/e2e/flows/journey.yaml}"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export PATH="$HOME/.maestro/bin:$JAVA_HOME/bin:$PATH"

echo "[e2e] booting simulator: $SIM"
xcrun simctl boot "$SIM" 2>/dev/null || true
open -a Simulator >/dev/null 2>&1 || true

echo "[e2e] starting sync backend on :$PORT (in-memory)"
CARDIO_DB=:memory: PORT="$PORT" node --disable-warning=ExperimentalWarning \
  "$ROOT/apps/backend/src/index.ts" &
BACKEND_PID=$!
cleanup() { kill "$BACKEND_PID" 2>/dev/null || true; }
trap cleanup EXIT

# Espera o backend responder.
for _ in $(seq 1 20); do
  if curl -sf "http://localhost:$PORT/health" >/dev/null; then break; fi
  sleep 0.5
done

echo "[e2e] building & installing app (Release)"
( cd "$ROOT/apps/mobile" && npx expo run:ios --configuration Release --no-bundler --device "$SIM" )

echo "[e2e] running Maestro flow: $FLOW"
maestro test "$FLOW"
echo "[e2e] done"
