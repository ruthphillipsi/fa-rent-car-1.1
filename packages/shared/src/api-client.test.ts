import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiError, createApiClient } from './index';

const responseSchema = z.object({ value: z.string() });

async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }

  throw new Error('Expected the request to reject with ApiError');
}

describe('createApiClient', () => {
  it('gets parsed data with credentialed no-store request defaults', async () => {
    const fetchStub = vi.fn(async () => new Response(JSON.stringify({ value: 'ready' })));
    const client = createApiClient({ baseUrl: 'https://api.example.test/', fetch: fetchStub });

    await expect(
      client.get('api/v1/admin/foundation', responseSchema, { headers: { 'x-trace': 'abc' } }),
    ).resolves.toEqual({
      value: 'ready',
    });

    const [url, init] = fetchStub.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.test/api/v1/admin/foundation');
    expect(init).toMatchObject({ method: 'GET', credentials: 'include', cache: 'no-store' });
    expect(new Headers(init?.headers).get('accept')).toBe('application/json');
    expect(new Headers(init?.headers).get('x-trace')).toBe('abc');
  });

  it('posts a JSON body and validates the successful response schema', async () => {
    const fetchStub = vi.fn(async () => new Response(JSON.stringify({ value: 'logged-in' })));
    const client = createApiClient({ baseUrl: 'https://api.example.test', fetch: fetchStub });

    await expect(
      client.post('/api/v1/admin/auth/login', { email: 'owner@example.test' }, responseSchema),
    ).resolves.toEqual({
      value: 'logged-in',
    });

    const [, init] = fetchStub.mock.calls[0] ?? [];
    expect(init).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ email: 'owner@example.test' }),
      credentials: 'include',
      cache: 'no-store',
    });
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
  });

  it('returns structured API errors without exposing a raw payload', async () => {
    const fetchStub = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Email atau kata sandi tidak sesuai.',
              details: [{ path: 'email', message: 'Invalid credentials' }],
            },
          }),
          { status: 401 },
        ),
    );
    const client = createApiClient({ baseUrl: 'https://api.example.test', fetch: fetchStub });

    const error = await expectApiError(client.get('/api/v1/admin/auth/me', responseSchema));

    expect(error.toJSON()).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Email atau kata sandi tidak sesuai.',
      details: [{ path: 'email', message: 'Invalid credentials' }],
      kind: 'http',
      status: 401,
    });
  });

  it('uses a generic error for malformed successful or failed response bodies', async () => {
    const secret = 'do-not-leak-this-body';
    const malformedFailure = vi.fn(
      async () => new Response(JSON.stringify({ secret }), { status: 500 }),
    );
    const malformedSuccess = vi.fn(async () => new Response(JSON.stringify({ secret })));

    const failureError = await expectApiError(
      createApiClient({ baseUrl: 'https://api.example.test', fetch: malformedFailure }).get(
        '/api/v1/admin/system',
        responseSchema,
      ),
    );
    const successError = await expectApiError(
      createApiClient({ baseUrl: 'https://api.example.test', fetch: malformedSuccess }).get(
        '/api/v1/admin/system',
        responseSchema,
      ),
    );

    for (const error of [failureError, successError]) {
      expect(error.toJSON()).toMatchObject({
        code: 'MALFORMED_RESPONSE',
        message: 'The server returned an invalid response.',
        details: [],
        kind: 'malformed-response',
      });
      expect(JSON.stringify(error)).not.toContain(secret);
    }
  });

  it('does not expose a non-JSON response body', async () => {
    const secret = 'upstream-html-with-sensitive-context';
    const fetchStub = vi.fn(async () => new Response(secret, { status: 502 }));
    const client = createApiClient({ baseUrl: 'https://api.example.test', fetch: fetchStub });

    const error = await expectApiError(client.get('/api/v1/admin/system', responseSchema));

    expect(error.toJSON()).toEqual({
      code: 'MALFORMED_RESPONSE',
      message: 'The server returned an invalid response.',
      details: [],
      kind: 'malformed-response',
      status: 502,
    });
    expect(error.message).not.toContain(secret);
    expect(JSON.stringify(error)).not.toContain(secret);
  });

  it('does not leak fetch or serialization failures', async () => {
    const secret = 'internal-network-detail';
    const rejectedFetch = vi.fn(async () => {
      throw new Error(secret);
    });
    const networkError = await expectApiError(
      createApiClient({ baseUrl: 'https://api.example.test', fetch: rejectedFetch }).get(
        '/health',
        responseSchema,
      ),
    );
    expect(networkError.toJSON()).toEqual({
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the server.',
      details: [],
      kind: 'network',
    });
    expect(JSON.stringify(networkError)).not.toContain(secret);

    const circular: { self?: unknown } = {};
    circular.self = circular;
    const requestError = await expectApiError(
      createApiClient({ baseUrl: 'https://api.example.test', fetch: vi.fn() }).post(
        '/api/v1/admin/auth/login',
        circular,
        responseSchema,
      ),
    );
    expect(requestError.toJSON()).toEqual({
      code: 'REQUEST_ERROR',
      message: 'The request could not be prepared.',
      details: [],
      kind: 'request',
    });
  });
});
