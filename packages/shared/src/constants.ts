export const TIMEZONE = 'Asia/Jakarta' as const;

export const HOLD_MINUTES = 120;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const SIGNED_URL_TTL_SECONDS = 300;
export const ACCESS_TOKEN_TTL_SECONDS = 900;

export const adminApiRoutes = {
  auth: {
    csrf: '/api/v1/admin/auth/csrf',
    login: '/api/v1/admin/auth/login',
    refresh: '/api/v1/admin/auth/refresh',
    logout: '/api/v1/admin/auth/logout',
    me: '/api/v1/admin/auth/me',
  },
  foundation: '/api/v1/admin/foundation',
  system: '/api/v1/admin/system',
} as const;
