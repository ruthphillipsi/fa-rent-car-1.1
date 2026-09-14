import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { authResponseSchema, csrfResponseSchema, logoutResponseSchema } from '@fa/shared';
import type { Request, Response } from 'express';
import type { Environment } from '../config/environment';
import { AdminAuthGuard, CurrentAdmin } from './admin-auth.guard';
import {
  clearSessionCookies,
  cookieNames,
  cookieOptions,
  createCsrfToken,
  readCookie,
  setSessionCookies,
} from './auth-cookies';
import {
  AuthResponseDto,
  CsrfResponseDto,
  EmptyRequestDto,
  LoginRequestDto,
  LogoutResponseDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import type { AuthenticatedAdmin } from './auth.types';
import { CsrfGuard } from './csrf.guard';

@ApiTags('Admin session')
@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  private get production() {
    return this.config.get('NODE_ENV', { infer: true }) === 'production';
  }

  @Get('csrf')
  @ApiOkResponse({ type: CsrfResponseDto })
  csrf(@Res({ passthrough: true }) response: Response) {
    const csrfToken = createCsrfToken();
    response.cookie(cookieNames(this.production).csrf, csrfToken, {
      ...cookieOptions(this.production),
      maxAge: 60 * 60 * 1000,
    });
    return csrfResponseSchema.parse({ csrfToken });
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() body: LoginRequestDto, @Res({ passthrough: true }) response: Response) {
    const credentials = await this.auth.login(body.email, body.password);
    setSessionCookies(response, this.production, credentials);
    return authResponseSchema.parse(credentials.response);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  @ApiCookieAuth()
  @ApiOkResponse({ type: AuthResponseDto })
  me(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return authResponseSchema.parse({ user: admin.user, expiresAt: admin.expiresAt });
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  @ApiBody({ type: EmptyRequestDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Body() _body: EmptyRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const credentials = await this.auth.refresh(
        readCookie(request, cookieNames(this.production).refresh),
      );
      setSessionCookies(response, this.production, credentials);
      return authResponseSchema.parse(credentials.response);
    } catch (error) {
      if (error instanceof UnauthorizedException) clearSessionCookies(response, this.production);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  @ApiBody({ type: EmptyRequestDto })
  @ApiOkResponse({ type: LogoutResponseDto })
  async logout(
    @Body() _body: EmptyRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const names = cookieNames(this.production);
    await this.auth.logout(readCookie(request, names.access), readCookie(request, names.refresh));
    clearSessionCookies(response, this.production);
    return logoutResponseSchema.parse({ success: true });
  }
}
