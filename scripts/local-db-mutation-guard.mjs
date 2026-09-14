import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const LOOPBACK_DATABASE_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export class LocalDatabaseMutationError extends Error {}

export function assertLocalDatabaseMutationEnvironment(environment) {
  if (environment.NODE_ENV?.trim().toLowerCase() === 'production') {
    throw new LocalDatabaseMutationError('NODE_ENV must not be production.');
  }

  const databaseUrl = environment.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    throw new LocalDatabaseMutationError('DATABASE_URL is required.');
  }

  let parsedDatabaseUrl;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new LocalDatabaseMutationError('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (
    parsedDatabaseUrl.protocol !== 'postgresql:' ||
    !LOOPBACK_DATABASE_HOSTS.has(parsedDatabaseUrl.hostname)
  ) {
    throw new LocalDatabaseMutationError(
      'DATABASE_URL must target a loopback PostgreSQL database.',
    );
  }
}

function main() {
  try {
    assertLocalDatabaseMutationEnvironment(process.env);
    process.stdout.write('Local database mutation guard passed.\n');
  } catch {
    process.stderr.write(
      'Local database mutation refused. DATABASE_URL must target loopback and NODE_ENV must not be production.\n',
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
