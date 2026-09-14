import { Injectable } from '@nestjs/common';
import { Prisma, type AuditLog } from '@fa/db';

export interface AuditEvent {
  actorId: string;
  action: 'AUTH_LOGIN' | 'AUTH_REFRESH' | 'AUTH_REFRESH_REUSE' | 'AUTH_LOGOUT';
  objectId: string;
  before?: Prisma.InputJsonObject;
  after?: Prisma.InputJsonObject;
}

@Injectable()
export class AuditService {
  record(transaction: Prisma.TransactionClient, event: AuditEvent): Promise<AuditLog> {
    return transaction.auditLog.create({
      data: { ...event, objectType: 'AUTH_SESSION' },
    });
  }
}
