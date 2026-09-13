#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  printf 'Environment missing. Run pnpm setup first.\n' >&2
  exit 1
fi
bash scripts/services.sh up
pnpm --filter @fa/shared build
pnpm --filter @fa/db build
exec pnpm exec dotenv -e .env -- pnpm exec turbo run dev --env-mode=loose
