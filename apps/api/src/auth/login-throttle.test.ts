import { describe, expect, it } from 'vitest';
import { loginTracker } from './login-throttle';

describe('login account throttling', () => {
  it('normalizes accounts without storing their email in the limiter key', () => {
    const key = loginTracker({ body: { email: ' OWNER@EXAMPLE.TEST ' } });
    expect(key).toBe(loginTracker({ body: { email: 'owner@example.test' } }));
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain('owner');
    expect(key).not.toBe(loginTracker({ body: { email: 'staff@example.test' } }));
  });

  it('puts malformed input in a bounded bucket before DTO validation', () => {
    const missing = loginTracker({});
    for (const body of [
      null,
      [],
      'invalid',
      { email: ['owner@example.test'] },
      { email: 'invalid' },
    ]) {
      expect(loginTracker({ body })).toBe(missing);
    }
  });
});
