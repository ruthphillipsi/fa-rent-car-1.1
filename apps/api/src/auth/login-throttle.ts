import { createHash } from 'node:crypto';
import { loginRequestSchema } from '@fa/shared';

export function loginTracker(request: { body?: unknown }): string {
  const body = request.body;
  const email = loginRequestSchema.shape.email.safeParse(
    body && typeof body === 'object' && 'email' in body ? body.email : undefined,
  );
  return createHash('sha256')
    .update(email.success ? email.data : 'invalid-email')
    .digest('hex');
}
