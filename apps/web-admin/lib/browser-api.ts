'use client';

import {
  ApiError,
  authResponseSchema,
  createApiClient,
  csrfResponseSchema,
  loginRequestSchema,
  logoutResponseSchema,
  type AuthResponse,
  type LoginRequest,
  type LogoutResponse,
} from '@fa/shared';

const client = createApiClient({ baseUrl: '/api/v1' });

let csrfTokenPromise: Promise<string> | undefined;
let refreshPromise: Promise<AuthResponse> | undefined;

function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = client.get('/admin/auth/csrf', csrfResponseSchema).then(
      ({ csrfToken }) => csrfToken,
      (error: unknown) => {
        csrfTokenPromise = undefined;
        throw error;
      },
    );
  }

  return csrfTokenPromise;
}

async function postWithCsrf<T>(request: (csrfToken: string) => Promise<T>): Promise<T> {
  const csrfToken = await getCsrfToken();

  try {
    return await request(csrfToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403 && error.code === 'CSRF_INVALID') {
      csrfTokenPromise = undefined;
      return request(await getCsrfToken());
    }

    throw error;
  }
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const body = loginRequestSchema.parse(credentials);

  return postWithCsrf((csrfToken) =>
    client.post('/admin/auth/login', body, authResponseSchema, {
      headers: { 'X-CSRF-Token': csrfToken },
    }),
  );
}

export async function logout(): Promise<LogoutResponse> {
  const response = await postWithCsrf((csrfToken) =>
    client.post('/admin/auth/logout', {}, logoutResponseSchema, {
      headers: { 'X-CSRF-Token': csrfToken },
    }),
  );

  csrfTokenPromise = undefined;
  return response;
}

async function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    const recover = async () => {
      try {
        return await client.get('/admin/auth/me', authResponseSchema);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
      return postWithCsrf((csrfToken) =>
        client.post('/admin/auth/refresh', {}, authResponseSchema, {
          headers: { 'X-CSRF-Token': csrfToken },
        }),
      );
    };

    // Cookie rotation must be serialized across tabs, not only within this bundle.
    const recovery = navigator.locks
      ? navigator.locks.request('fa-admin-session-refresh', recover)
      : recover();
    refreshPromise = Promise.resolve(recovery).finally(() => {
      refreshPromise = undefined;
    });
  }

  return refreshPromise;
}

export async function getBrowserSession(): Promise<AuthResponse> {
  try {
    return await client.get('/admin/auth/me', authResponseSchema);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    return refreshSession();
  }
}

export function isAuthFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}
