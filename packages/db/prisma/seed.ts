import { formatSeedError, runSeed } from '../src/seed';

void runSeed().then(
  () => {
    process.stdout.write('Database seed complete.\n');
  },
  (error: unknown) => {
    process.stderr.write(`${formatSeedError(error)}\n`);
    process.exitCode = 1;
  },
);
