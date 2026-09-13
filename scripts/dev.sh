#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  printf 'Environment missing. Run pnpm run setup first.\n' >&2
  exit 1
fi
node --env-file=.env scripts/local-db-mutation-guard.mjs
bash scripts/services.sh up
pnpm --filter @fa/shared build
pnpm --filter @fa/db build
exec pnpm exec dotenv -e .env -- pnpm exec concurrently --kill-others --names api,admin,customer \
  'pnpm --filter @fa/api dev' \
  'pnpm --filter @fa/web-admin dev' \
  'pnpm --filter @fa/web-customer dev'
