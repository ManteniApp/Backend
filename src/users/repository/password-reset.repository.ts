/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/users/repositories/password-reset.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

export type PasswordResetRow = {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: number, token: string, expiresAt: Date) {
    const res = await this.db.client<PasswordResetRow[]>`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
      RETURNING *;
    `;
    return res[0];
  }

  async findValidByToken(token: string) {
    const res = await this.db.client<PasswordResetRow[]>`
      SELECT * FROM password_resets
      WHERE token = ${token} AND used = false AND expires_at > NOW()
      LIMIT 1;
    `;
    return res.length ? res[0] : null;
  }

  async markUsed(id: number) {
    await this.db.client`
      UPDATE password_resets SET used = true WHERE id = ${id};
    `;
    return true;
  }
}
