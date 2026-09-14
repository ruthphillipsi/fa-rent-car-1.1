import { createHash } from 'node:crypto';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function composeProjectName(canonicalWorkspacePath) {
  if (typeof canonicalWorkspacePath !== 'string' || !isAbsolute(canonicalWorkspacePath)) {
    throw new TypeError('A canonical absolute workspace path is required.');
  }

  const workspaceHash = createHash('sha256')
    .update(canonicalWorkspacePath, 'utf8')
    .digest('hex')
    .slice(0, 12);

  return `fa-rent-car-${workspaceHash}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${composeProjectName(process.argv[2] ?? '')}\n`);
  } catch {
    process.stderr.write('Could not derive an isolated Docker Compose project name.\n');
    process.exitCode = 1;
  }
}
