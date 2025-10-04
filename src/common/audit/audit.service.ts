/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

export type AuditEvent = 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_COMPLETED';

@Injectable()
export class AuditService {
   logAction(action: string) {
    console.log(`[AUDIT] ${action}`);
  }
  constructor(private readonly db: DatabaseService) {}

  async log(event: {
    userId?: number;
    email?: string;
    eventType: AuditEvent;
    metadata?: Record<string, any>;
  }) {
    const { userId, email, eventType, metadata } = event;
    await this.db.client`
      INSERT INTO audit_logs (user_id, email, event_type, metadata, created_at)
      VALUES (${userId}, ${email}, ${eventType}, ${JSON.stringify(metadata)}, NOW());
    `;
  }
}
