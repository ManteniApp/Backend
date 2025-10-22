/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository} from '../repository/users.repository';
import { PasswordResetRepository } from '../repository/password-reset.repository';
import { AuthService } from '../../auth/auth.service';
import { MailService } from '../../common/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditService } from '../../common/audit/audit.service';
import { UserRow } from '../../domain/entities/user.entity';

@Injectable()
export class UsersService {
  private googleClient: OAuth2Client | null = null;
  logger: any;

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly resetRepo: PasswordResetRepository,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {
    const gid = this.config.get<string>('GOOGLE_CLIENT_ID');
  }

  private userToSafe(user: UserRow) {
    const { password_hash, ...rest } = user as any;
    return rest;
  }

  async registerWithEmail(nombre: string, email: string, password: string, telefono?: string) {
    const existing = await this.usersRepo.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
    const hashed = await bcrypt.hash(password, 10);
    const created = await this.usersRepo.create({
      nombre,
      email,
      telefono,
      password_hash: hashed
    });
    await this.notificationsService.sendConfirmationEmail(created.email, created.nombre);
    const token = this.authService.signPayload({ sub: created.id, email: created.email });
    return { user: this.userToSafe(created), token };
  }

  async loginWithEmail(email: string, password: string) {
    const user = await this.usersRepo.findByEmail(email);
    if (!user || !user.password_hash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = this.authService.signPayload({ sub: user.id, email: user.email });
    return { user: this.userToSafe(user), token };
  }

  async registerOrLoginWithGoogle(idToken: string) {
    if (!this.googleClient) {
      throw new Error('GOOGLE_CLIENT_ID not configured');
    }
    if (!idToken || idToken.trim() === '') {
      throw new UnauthorizedException('Google token vacío');
    }
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException('Google token inválido');
      }
      const email = payload.email;
      const name = payload.name || 'Usuario Google';
      const googleId = payload.sub;
      const picture = payload.picture || null;
      let user = await this.usersRepo.findByGoogleId(googleId);
      if (!user) {
        const byEmail = await this.usersRepo.findByEmail(email);
        if (byEmail) {
          user = await this.usersRepo.updateGoogleId(byEmail.id, googleId);
          if (user) {
            await this.safeAuditLog({
              userId: user.id,
              eventType: 'GOOGLE_ACCOUNT_LINKED',
              metadata: { googleId, email },
            });
          }
        } else {
          user = await this.usersRepo.create({
            nombre: name,
            email,
            google_id: googleId,
            telefono: undefined,
            password_hash: undefined
          });
          if (user) {
            await this.safeAuditLog({
              userId: user.id,
              eventType: 'GOOGLE_USER_REGISTERED',
              metadata: { googleId, email, name },
            });
            try {
              await this.notificationsService.sendConfirmationEmail(user.email, user.nombre);
            } catch (emailError) {
              console.warn('⚠️ Error enviando email de bienvenida:', emailError.message);
            }
          }
        }
      } else {
        if (user) {
          await this.safeAuditLog({
            userId: user.id,
            eventType: 'GOOGLE_LOGIN_SUCCESS',
            metadata: { googleId, email },
          });
        }
      }
      if (!user) {
        throw new Error('No se pudo crear o encontrar el usuario después del proceso completo');
      }
      const token = this.authService.signPayload({
        sub: user.id,
        email: user.email,
        nombre: user.nombre
      });
      return {
        user: this.userToSafe(user),
        token
      };
    } catch (error) {
      await this.safeAuditLog({
        eventType: 'GOOGLE_LOGIN_FAILED',
        metadata: { error: error.message },
      });
      throw new UnauthorizedException('Error en autenticación con Google');
    }
  }
  private async safeAuditLog(logData: any) {
    try {
      if (this.auditService && typeof this.auditService.log === 'function') {
        await this.auditService.log(logData);
      } else {
        console.warn('⚠️ AuditService no disponible, omitiendo auditoría:', logData.eventType);
      }
    } catch (auditError) {
      console.warn('⚠️ Error en auditoría (no crítico):', auditError.message);
    }
  }

  async requestPasswordReset(email: string, frontendUrl: string, clientIp?: string) {
    const user = await this.usersRepo.findByEmail(email);
    await this.safeAuditLog({
      userId: user?.id,
      email,
      eventType: 'PASSWORD_RESET_REQUEST',
      metadata: { ip: clientIp },
    });
    if (!user) {
      return { ok: true };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (Number(this.config.get('PASSWORD_RESET_TOKEN_EXP_H') || 1) * 3600 * 1000));
    console.log("Guardando expiresAt UTC:", expiresAt.toISOString());

    await this.resetRepo.create(user.id, token, expiresAt);

    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const html = `<p>Hola ${user.nombre},</p>
      <p>Haz solicitado resetear tu contraseña. Ingresa al siguiente enlace para cambiarla:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Si no solicitaste esto, ignora este correo.</p>`;

    await this.mailService.sendMail(user.email, 'Reset de contraseña', html);
    return { ok: true };
  }

  async loginWithGoogle(idToken: string) {
    if (!this.googleClient) {
      throw new Error('GOOGLE_CLIENT_ID not configured');
    }
    if (!idToken || idToken.trim() === '') {
      throw new UnauthorizedException('Google token vacío');
    }
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException('Google token inválido');
      }
      const email = payload.email;
      const googleId = payload.sub;
      let user = await this.usersRepo.findByGoogleId(googleId);
      if (!user) {
        user = await this.usersRepo.findByEmail(email);
        if (!user) {
          throw new UnauthorizedException('Usuario no registrado. Por favor regístrate primero.');
        }
        if (!user.google_id) {
          user = await this.usersRepo.updateGoogleId(user.id, googleId);
        }
      }
      await this.safeAuditLog({
        userId: user.id,
        eventType: 'GOOGLE_LOGIN_SUCCESS',
        metadata: { googleId, email, loginType: 'existing_user' },
      });
      const token = this.authService.signPayload({
        sub: user.id,
        email: user.email,
        nombre: user.nombre
      });
      return {
        user: this.userToSafe(user),
        token
      };
    } catch (error) {
      await this.safeAuditLog({
        eventType: 'GOOGLE_LOGIN_FAILED',
        metadata: { error: error.message },
      });
      throw new UnauthorizedException('Error en inicio de sesión con Google');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    console.log('🔑 Token recibido:', JSON.stringify(token));
    const reset = await this.resetRepo.findValidByToken(token);
    if (!reset) throw new NotFoundException('Token inválido o expirado');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.updatePasswordHash(reset.user_id, hashed);
    await this.resetRepo.markUsed(reset.id);
    await this.safeAuditLog({
      userId: reset.user_id,
      eventType: 'PASSWORD_RESET_COMPLETED',
      metadata: { token: reset.token },
    });
    return { ok: true };
  }

  async findById(id: number) {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findAllUsers() {
    try {
      const users = await this.usersRepo.findAll();
      return users.map(user => this.userToSafe(user));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async deleteUser(id: number) {
    await this.usersRepo.delete(id);
    return { message: 'User deleted successfully' };
  }

  //Nuevos metodos para perfil
  // NUEVOS MÉTODOS SIMPLES
  async getMyProfile(userId: number) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userToSafe(user);
  }

  async getAllUsers() {
    const users = await this.usersRepo.findAll();
    return users.map(user => this.userToSafe(user));
  }

  async updateProfile(userId: number, updateData: {
    nombre?: string;
    email?: string;
    telefono?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Verificar email único
    if (updateData.email && updateData.email !== user.email) {
      const existing = await this.usersRepo.findByEmail(updateData.email);
      if (existing) throw new ConflictException('Email ya está en uso');
    }

    // Preparar datos para actualizar
    const updatePayload: any = {};
    if (updateData.nombre) updatePayload.nombre = updateData.nombre;
    if (updateData.email) updatePayload.email = updateData.email;
    if (updateData.telefono) updatePayload.telefono = updateData.telefono;

    // Cambiar contraseña si se proporciona
    if (updateData.newPassword) {
      if (!updateData.currentPassword) {
        throw new UnauthorizedException('Contraseña actual requerida');
      }
      
      const isValid = await bcrypt.compare(updateData.currentPassword, user.password_hash);
      if (!isValid) throw new UnauthorizedException('Contraseña actual incorrecta');
      
      updatePayload.password_hash = await bcrypt.hash(updateData.newPassword, 10);
    }

    const updatedUser = await this.usersRepo.updateUser(userId, updatePayload);
    return this.userToSafe(updatedUser);
  }

  async updateBasicProfile(userId: number, nombre?: string, telefono?: string) {
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (telefono) updateData.telefono = telefono;

    const updatedUser = await this.usersRepo.updateUser(userId, updateData);
    return this.userToSafe(updatedUser);
  }

}
