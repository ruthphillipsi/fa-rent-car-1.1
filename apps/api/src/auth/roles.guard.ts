import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminUser } from '@fa/shared';
import type { AdminRequest } from './admin-auth.guard';

const ROLE_KEY = 'admin-roles';
export const Roles = (...roles: AdminUser['role'][]) => SetMetadata(ROLE_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<AdminUser['role'][]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (!request.admin || !roles.includes(request.admin.user.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki akses untuk tindakan ini.',
      });
    }
    return true;
  }
}
