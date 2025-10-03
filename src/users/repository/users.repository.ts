/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
// src/users/repositories/users.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { NeonQueryFunction } from '@neondatabase/serverless';

export interface UserRow {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  password_hash?: string;
  google_id?: string;
  fecha_registro: Date;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

    async findByEmail(email: string) {
    console.log("🔍 Ejecutando SQL findByEmail con:", email);
    try {
        const result = await this.db.client`
        SELECT * FROM usuarios WHERE email = ${email} LIMIT 1
        `;
        console.log("✅ Resultado SQL:", result);
        return result[0] ?? null;
    } catch (err) {
        console.error("❌ Error en findByEmail:", err);
        throw err;
    }
    }


  async findById(id: number): Promise<UserRow | null> {
    const rows = await this.db.query<UserRow>(
      `SELECT * FROM clientes WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows.length ? rows[0] : null;
  }

    async create(user: { 
  nombre: string; 
  email: string; 
  telefono?: string;
  password_hash?: string; 
  google_id?: string; 
}) {
  console.log("📥 Datos antes del INSERT:", user);

  try {
    const result = await this.db.client<UserRow[]>`
      INSERT INTO usuarios (nombre, email, telefono, password_hash, google_id)
      VALUES (${user.nombre}, ${user.email}, ${user.telefono ?? null}, ${user.password_hash ?? null}, ${user.google_id ?? null})
      RETURNING *
    `;

    console.log("✅ Insert result:", result);
    return result[0];
  } catch (err) {
    console.error("❌ Error en create:", err);
    throw err;
  }
}



  async delete(id: number): Promise<void> {
    await this.db.query(`DELETE FROM clientes WHERE id = $1`, [id]);
  }

  // 👇 Los que faltaban:
  async findByGoogleId(googleId: string): Promise<UserRow | null> {
    const rows = await this.db.query<UserRow>(
      `SELECT * FROM clientes WHERE google_id = $1 LIMIT 1`,
      [googleId],
    );
    return rows.length ? rows[0] : null;
  }

  async updateGoogleId(userId: number, googleId: string): Promise<UserRow> {
    const rows = await this.db.query<UserRow>(
      `UPDATE clientes SET google_id = $1 WHERE id = $2 RETURNING *`,
      [googleId, userId],
    );
    return rows[0];
  }

  async updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
    await this.db.query(
      `UPDATE clientes SET password_hash = $1 WHERE id = $2`,
      [passwordHash, userId],
    );
  }
}