// src/users/repository/users.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

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
      const result = await this.db.client<UserRow[]>`
        SELECT * FROM usuarios WHERE email = ${email} LIMIT 1
      `;
      console.log("✅ Resultado SQL:", result);
      return result[0] ?? null;
    } catch (err) {
      console.error("❌ Error en findByEmail:", err);
      throw err;
    }
  }

  async findById(id: number) {
    try {
      const result = await this.db.client<UserRow[]>`
        SELECT * FROM usuarios WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error("❌ Error en findById:", error);
      throw error;
    }
  }

  async findAll() {
    try {
      const result = await this.db.client<UserRow[]>`
        SELECT * FROM usuarios ORDER BY fecha_registro DESC
      `;
      return result;
    } catch (error) {
      console.error("❌ Error en findAll:", error);
      throw error;
    }
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
      // ✅ ELIMINADO identificacion - usa solo las columnas que existen
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
    await this.db.client`
      DELETE FROM usuarios WHERE id = ${id}
    `;
  }

  async findByGoogleId(googleId: string): Promise<UserRow | null> {
    const rows = await this.db.client<UserRow[]>`
      SELECT * FROM usuarios WHERE google_id = ${googleId} LIMIT 1
    `;
    return rows.length ? rows[0] : null;
  }

  async updateGoogleId(userId: number, googleId: string): Promise<UserRow> {
    const rows = await this.db.client<UserRow[]>`
      UPDATE usuarios SET google_id = ${googleId} WHERE id = ${userId} RETURNING *
    `;
    return rows[0];
  }

  async updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
    await this.db.client`
      UPDATE usuarios SET password_hash = ${passwordHash} WHERE id = ${userId}
    `;
  }
}