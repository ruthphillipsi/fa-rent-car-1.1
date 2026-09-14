import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Environment } from '../config/environment';
import { cookieNames, readCookie } from './auth-cookies';
import { AuthService } from './auth.service';
import type { AuthenticatedAdmin } from './auth.types';

export interface AdminRequest extends Request {
  admin: AuthenticatedAdmin;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const names = cookieNames(this.config.get('NODE_ENV', { infer: true }) === 'production');
    request.admin = await this.auth.authenticate(readCookie(request, names.access));
    return true;
  }
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AdminRequest>().admin,
);
