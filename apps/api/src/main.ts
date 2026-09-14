import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from './config/environment';
import { createApp } from './create-app';

async function main() {
  const app = await createApp();
  const config = app.get(ConfigService<Environment, true>);
  await app.listen(config.get('API_PORT', { infer: true }), '0.0.0.0');
}

main().catch(() => {
  new Logger('Bootstrap').error(
    'API startup failed. Check configuration and local service readiness.',
  );
  process.exitCode = 1;
});
