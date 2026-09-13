import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { adminUserSchema } from '@fa/shared';
import type { AdminUser as DatabaseAdminUser, Prisma } from '@fa/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { REFRESH_TTL_MS } from './auth-cookies';
import type { AuthenticatedAdmin, SessionCredentials } from './auth.types';

const payloadSchema = z.object({ sub: z.uuid(), sid: z.uuid(), exp: z.number().int() });
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const invalidSession = () =>
  new UnauthorizedException({
    code: 'SESSION_EXPIRED',
    message: 'Sesi Anda berakhir. Silakan masuk kembali.',
  });
const publicUser = (user: DatabaseAdminUser) =>
  adminUserSchema.parse({ id: user.id, name: user.name, email: user.email, role: user.role });

async function lockSessionFamily(transaction: Prisma.TransactionClient, familyId: string) {
  await transaction.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${familyId}, 0))`;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash = '';

  constructor(
    private readonly database: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  }

  private async credentials(
    user: DatabaseAdminUser,
    sessionId: string,
    refreshExpiresAt: Date,
  ): Promise<SessionCredentials> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, sid: sessionId });
    const payload = payloadSchema.parse(this.jwt.decode(accessToken));
    return {
      accessToken,
      refreshToken: randomBytes(48).toString('hex'),
      refreshExpiresAt,
      response: { user: publicUser(user), expiresAt: new Date(payload.exp * 1000).toISOString() },
    };
  }

  async login(email: string, password: string): Promise<SessionCredentials> {
    const user = await this.database.adminUser.findUnique({ where: { email } });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? this.dummyHash);
    if (!user || !valid || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }
    const id = randomUUID();
    const credentials = await this.credentials(user, id, new Date(Date.now() + REFRESH_TTL_MS));
    await this.database.$transaction(async (transaction) => {
      await transaction.authSession.create({
        data: {
          id,
          adminUserId: user.id,
          familyId: randomUUID(),
          refreshTokenHash: hashToken(credentials.refreshToken),
          expiresAt: credentials.refreshExpiresAt,
        },
      });
      await this.audit.record(transaction, {
        actorId: user.id,
        action: 'AUTH_LOGIN',
        objectId: id,
        after: { role: user.role },
      });
    });
    return credentials;
  }

  async authenticate(accessToken?: string): Promise<AuthenticatedAdmin> {
    if (!accessToken) throw invalidSession();
    let payload: z.infer<typeof payloadSchema>;
    try {
      const verified: unknown = await this.jwt.verifyAsync(accessToken);
      payload = payloadSchema.parse(verified);
    } catch {
      throw invalidSession();
    }
    const session = await this.database.authSession.findUnique({
      where: { id: payload.sid },
      include: { adminUser: true },
    });
    if (
      !session ||
      session.adminUserId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.adminUser.isActive ||
      session.adminUser.deletedAt
    ) {
      throw invalidSession();
    }
    return {
      user: publicUser(session.adminUser),
      sessionId: session.id,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    };
  }

  async refresh(refreshToken?: string): Promise<SessionCredentials> {
    if (!refreshToken || !/^[a-f0-9]{96}$/.test(refreshToken)) throw invalidSession();
    const tokenHash = hashToken(refreshToken);
    const result = await this.database.$transaction(async (transaction) => {
      const original = await transaction.authSession.findUnique({
        where: { refreshTokenHash: tokenHash },
      });
      if (!original) return null;
      // Serialize every generation, including logout racing a refresh.
      await lockSessionFamily(transaction, original.familyId);
      const session = await transaction.authSession.findUnique({
        where: { refreshTokenHash: tokenHash },
        include: { adminUser: true },
      });
      if (!session) return null;
      if (session.revokedAt) {
        await transaction.authSession.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await this.audit.record(transaction, {
          actorId: session.adminUserId,
          action: 'AUTH_REFRESH_REUSE',
          objectId: session.id,
        });
        return null;
      }
      if (
        session.expiresAt.getTime() <= Date.now() ||
        !session.adminUser.isActive ||
        session.adminUser.deletedAt
      )
        return null;
      const nextId = randomUUID();
      const credentials = await this.credentials(session.adminUser, nextId, session.expiresAt);
      await transaction.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      await transaction.authSession.create({
        data: {
          id: nextId,
          adminUserId: session.adminUserId,
          familyId: session.familyId,
          refreshTokenHash: hashToken(credentials.refreshToken),
          expiresAt: session.expiresAt,
        },
      });
      await this.audit.record(transaction, {
        actorId: session.adminUserId,
        action: 'AUTH_REFRESH',
        objectId: nextId,
        before: { sessionId: session.id },
        after: { sessionId: nextId },
      });
      return credentials;
    });
    if (!result) throw invalidSession();
    return result;
  }

  async logout(accessToken?: string, refreshToken?: string) {
    let sessionId: string | undefined;
    if (refreshToken && /^[a-f0-9]{96}$/.test(refreshToken)) {
      const session = await this.database.authSession.findUnique({
        where: { refreshTokenHash: hashToken(refreshToken) },
      });
      sessionId = session?.id;
    }
    if (!sessionId && accessToken) {
      try {
        sessionId = (await this.authenticate(accessToken)).sessionId;
      } catch (error) {
        if (!(error instanceof UnauthorizedException)) throw error;
      }
    }
    if (!sessionId) return;
    await this.database.$transaction(async (transaction) => {
      const session = await transaction.authSession.findUnique({ where: { id: sessionId } });
      if (!session) return;
      await lockSessionFamily(transaction, session.familyId);
      const result = await transaction.authSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count > 0)
        await this.audit.record(transaction, {
          actorId: session.adminUserId,
          action: 'AUTH_LOGOUT',
          objectId: session.id,
        });
    });
  }
}
