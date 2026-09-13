import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { composeProjectName } from './compose-project-name.mjs';
import {
  LocalDatabaseMutationError,
  assertLocalDatabaseMutationEnvironment,
} from './local-db-mutation-guard.mjs';

test('local database mutation guard accepts only non-production loopback PostgreSQL URLs', () => {
  assert.doesNotThrow(() =>
    assertLocalDatabaseMutationEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://fa:local-password@127.0.0.1:5432/fa_rent_car',
    }),
  );
  assert.doesNotThrow(() =>
    assertLocalDatabaseMutationEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://fa:local-password@[::1]:5432/fa_rent_car',
    }),
  );
  assert.throws(
    () =>
      assertLocalDatabaseMutationEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://fa:do-not-print@db.example.test:5432/fa_rent_car',
      }),
    LocalDatabaseMutationError,
  );
  assert.throws(
    () =>
      assertLocalDatabaseMutationEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://fa:local-password@127.0.0.1:5432/fa_rent_car',
      }),
    LocalDatabaseMutationError,
  );
});

test('local database mutation guard CLI does not expose rejected URLs', () => {
  const guardPath = fileURLToPath(new URL('./local-db-mutation-guard.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [guardPath], {
    encoding: 'utf8',
    env: {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://fa:do-not-print@db.example.test:5432/fa_rent_car',
    },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Local database mutation refused/u);
  assert.doesNotMatch(result.stderr, /do-not-print|db\.example\.test/u);
});

test('an inherited remote database URL cannot be masked by a local env file', () => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'fa-local-db-guard-'));
  const envFile = join(temporaryDirectory, '.env');
  const guardPath = fileURLToPath(new URL('./local-db-mutation-guard.mjs', import.meta.url));
  writeFileSync(
    envFile,
    'NODE_ENV=development\nDATABASE_URL=postgresql://fa:local-password@127.0.0.1:5432/fa_rent_car\n',
  );

  try {
    const result = spawnSync(process.execPath, ['--env-file', envFile, guardPath], {
      encoding: 'utf8',
      env: {
        DATABASE_URL: 'postgresql://fa:do-not-print@db.example.test:5432/fa_rent_car',
      },
    });

    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stderr, /do-not-print|db\.example\.test/u);
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
});

test('Compose project names are stable per canonical workspace and differ across workspaces', () => {
  const firstWorkspace = '/tmp/workspaces/fa-rent-car-a';
  const secondWorkspace = '/tmp/workspaces/fa-rent-car-b';
  const firstName = composeProjectName(firstWorkspace);

  assert.equal(composeProjectName(firstWorkspace), firstName);
  assert.notEqual(composeProjectName(secondWorkspace), firstName);
  assert.match(firstName, /^fa-rent-car-[a-f0-9]{12}$/u);
});

for (const script of ['setup.sh', 'dev.sh']) {
  test(`${script} rejects a remote database before any service or application starts`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'fa-bootstrap-guard-'));
    const scripts = join(directory, 'scripts');
    const marker = join(directory, 'service-started');
    mkdirSync(scripts);
    for (const file of [script, 'init-env.mjs', 'local-db-mutation-guard.mjs']) {
      copyFileSync(fileURLToPath(new URL(file, import.meta.url)), join(scripts, file));
    }
    writeFileSync(join(directory, '.env'), 'NODE_ENV=development\n');
    writeFileSync(join(scripts, 'services.sh'), 'touch "$MUTATION_MARKER"\nexit 97\n');

    try {
      const result = spawnSync('bash', [join(scripts, script)], {
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: 'development',
          DATABASE_URL: 'postgresql://fa:do-not-print@db.example.test:5432/fa_rent_car',
          MUTATION_MARKER: marker,
        },
      });

      assert.equal(result.status, 1);
      assert.equal(existsSync(marker), false);
      assert.match(result.stderr, /Local database mutation refused/u);
      assert.doesNotMatch(result.stderr, /do-not-print|db\.example\.test/u);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
}
