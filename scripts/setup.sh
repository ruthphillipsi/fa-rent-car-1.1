#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/init-env.mjs
bash scripts/services.sh up
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm --filter @fa/shared build
pnpm --filter @fa/db build
pnpm exec dotenv -e .env -- pnpm --filter @fa/api storage:init
