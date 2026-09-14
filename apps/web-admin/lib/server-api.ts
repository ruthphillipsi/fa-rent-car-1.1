import 'server-only';

import {
  ApiError,
  authResponseSchema,
  createApiClient,
  foundationResponseSchema,
  paginationSchema,
  systemResponseSchema,
  type AuthResponse,
  type FoundationResponse,
  type Pagination,
  type SystemResponse,
} from '@fa/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const apiBaseUrl = `${(process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000').replace(/\/+$/, '')}/api/v1`;

async function createServerAdminClient() {
  const cookieHeader = (await cookies()).toString();
  const fetchWithSession: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers);

    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }

    return fetch(input, { ...init, cache: 'no-store', headers });
  };

  return createApiClient({ baseUrl: apiBaseUrl, fetch: fetchWithSession });
}

function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}

async function getProtectedResource<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isUnauthorized(error)) {
      redirect('/login');
    }

    throw error;
  }
}

export async function getOptionalAdminSession(): Promise<AuthResponse | null> {
  try {
    const client = await createServerAdminClient();

    return await client.get('/admin/auth/me', authResponseSchema);
  } catch (error) {
    if (isUnauthorized(error)) {
      return null;
    }

    throw error;
  }
}

export async function requireAdminSession(): Promise<AuthResponse> {
  const session = await getOptionalAdminSession();

  if (session === null) {
    redirect('/login');
  }

  return session;
}

export async function requireSuperadminSession(): Promise<AuthResponse> {
  const session = await requireAdminSession();

  if (session.user.role !== 'SUPERADMIN') {
    redirect('/');
  }

  return session;
}

export async function getFoundation(query: Partial<Pagination> = {}): Promise<FoundationResponse> {
  const { page, limit } = paginationSchema.parse(query);
  const searchParams = new URLSearchParams({ page: String(page), limit: String(limit) });
  return getProtectedResource(async () => {
    const client = await createServerAdminClient();

    return client.get(`/admin/foundation?${searchParams}`, foundationResponseSchema);
  });
}

export async function getSystem(): Promise<SystemResponse> {
  return getProtectedResource(async () => {
    const client = await createServerAdminClient();

    return client.get('/admin/system', systemResponseSchema);
  });
}
