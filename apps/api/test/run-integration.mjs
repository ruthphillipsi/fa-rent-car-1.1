import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@fa/db';
import { CreateBucketCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { Queue } from 'bullmq';
import { createStorageClient } from '../dist/storage/storage-client.js';
import { redisConnection } from '../dist/jobs/jobs.service.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const localHosts = ['localhost', '127.0.0.1', '[::1]'];
for (const name of ['DATABASE_URL', 'REDIS_URL', 'S3_ENDPOINT']) {
  if (!process.env[name] || !localHosts.includes(new URL(process.env[name]).hostname)) {
    throw new Error(`Integration tests require an isolated local ${name}.`);
  }
}
const namespace = randomBytes(8).toString('hex');
const schema = `fa_test_${namespace}`;
const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set('schema', schema);
const environment = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: databaseUrl.toString(),
  S3_BUCKET: `fa-test-${namespace}`,
  JOB_QUEUE_NAME: `fa-test-${namespace}`,
};
const database = new PrismaClient();
const storage = createStorageClient(environment);
const queue = new Queue(environment.JOB_QUEUE_NAME, {
  connection: redisConnection(environment.REDIS_URL),
});
try {
  await database.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  await storage.send(new CreateBucketCommand({ Bucket: environment.S3_BUCKET }));
  execFileSync('pnpm', ['--filter', '@fa/db', 'migrate:deploy'], {
    cwd: root,
    env: environment,
    stdio: 'inherit',
  });
  execFileSync(
    'pnpm',
    ['exec', 'vitest', 'run', '--config', 'vitest.integration.config.ts', ...process.argv.slice(2)],
    {
      env: environment,
      stdio: 'inherit',
    },
  );
} catch (error) {
  process.exitCode = typeof error.status === 'number' ? error.status : 1;
  process.stderr.write('Isolated integration verification failed.\n');
} finally {
  try {
    await queue.obliterate({ force: true });
    await storage.send(new DeleteBucketCommand({ Bucket: environment.S3_BUCKET }));
    await database.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await queue.close();
    storage.destroy();
    await database.$disconnect();
  }
}
