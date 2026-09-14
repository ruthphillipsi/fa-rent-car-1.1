import { createZodDto } from 'nestjs-zod';
import {
  authResponseSchema,
  csrfResponseSchema,
  emptyRequestSchema,
  loginRequestSchema,
  logoutResponseSchema,
} from '@fa/shared';

export class LoginRequestDto extends createZodDto(loginRequestSchema) {}
export class EmptyRequestDto extends createZodDto(emptyRequestSchema) {}
export class AuthResponseDto extends createZodDto(authResponseSchema) {}
export class CsrfResponseDto extends createZodDto(csrfResponseSchema) {}
export class LogoutResponseDto extends createZodDto(logoutResponseSchema) {}
