#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$ROOT_DIR"

ACTION="${1:-up}"
MODE="${FA_SERVICES_MODE:-native}"

case "$MODE" in
  native)
    exec bash scripts/native-services.sh "$ACTION"
    ;;
  compose)
    if [[ ! -f .env ]]; then
      printf 'Environment missing. Run pnpm run setup first.\n' >&2
      exit 1
    fi
    if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
      printf 'Docker is required when FA_SERVICES_MODE=compose. Use the default native mode in this environment.\n' >&2
      exit 1
    fi
    COMPOSE_PROJECT_NAME="$(node scripts/compose-project-name.mjs "$ROOT_DIR")"
    case "$ACTION" in
      up)
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file .env up -d --wait
        ;;
      stop)
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file .env stop
        ;;
      status)
        exec docker compose -p "$COMPOSE_PROJECT_NAME" --env-file .env ps
        ;;
      *)
        printf 'Usage: %s {up|stop|status}\n' "$0" >&2
        exit 2
        ;;
    esac
    ;;
  *)
    printf 'Unknown FA_SERVICES_MODE. Use native or compose.\n' >&2
    exit 2
    ;;
esac
