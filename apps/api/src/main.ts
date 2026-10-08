import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from './config/environment';
import { createApp } from './create-app';

async function main() {
  const app = await createApp();
  const config = app.get(ConfigService<Environment, true>);
  const port = process.env.PORT ? Number(process.env.PORT) : config.get('API_PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
}

main().catch((err: unknown) => {
  new Logger('Bootstrap').error(
    `API startup failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`,
  );
  process.exitCode = 1;
});
