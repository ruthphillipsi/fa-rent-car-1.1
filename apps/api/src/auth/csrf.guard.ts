import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Environment } from '../config/environment';
import { cookieNames, readCookie, validCsrfToken } from './auth-cookies';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const names = cookieNames(this.config.get('NODE_ENV', { infer: true }) === 'production');
    if (
      request.headers['sec-fetch-site'] === 'cross-site' ||
      !request.is('application/json') ||
      !validCsrfToken(request.headers['x-csrf-token'], readCookie(request, names.csrf))
    ) {
      throw new ForbiddenException({
        code: 'CSRF_INVALID',
        message: 'Sesi formulir tidak valid. Muat ulang halaman dan coba kembali.',
      });
    }
    return true;
  }
}
