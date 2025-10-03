/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
// src/users/service/users.service.ts
import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository, UserRow } from '../repository/users.repository';
import { PasswordResetRepository } from '../repository/password-reset.repository';
import { AuthService } from '../../auth/auth.service';
import { MailService } from '../../common/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { NotificationsService } from '../../notifications/notifications.service';


@Injectable()
export class UsersService {
  private googleClient: OAuth2Client | null = null;
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly resetRepo: PasswordResetRepository,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly usersRepository: UsersRepository,
  ) {
    const gid = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (gid) this.googleClient = new OAuth2Client(gid);
  }

  private userToSafe(user: UserRow) {
    const { password_hash, ...rest } = user as any;
    return rest;
  }

  async registerWithEmail(nombre: string, email: string, password: string, telefono?: string) {
  console.log("📩 Register attempt:", { nombre, email, telefono });
  console.log("🗂 Repo:", this.usersRepo);
  const existing = await this.usersRepo.findByEmail(email);
  console.log("🔍 Existing user:", existing);

  if (existing) throw new ConflictException('Email already registered');

  const hashed = await bcrypt.hash(password, 10);
  console.log("🔑 Hashed password created");

  const created = await this.usersRepo.create({ nombre, email, telefono, password_hash: hashed });
  console.log("✅ User created:", created);

  await this.notificationsService.sendConfirmationEmail(created.email, created.nombre);

  const token = this.authService.signPayload({ sub: created.id, email: created.email });
  console.log("🎟 Token generated");

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
    if (!this.googleClient) throw new Error('GOOGLE_CLIENT_ID not configured');
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) throw new UnauthorizedException('Google token invalid');

    const email = payload.email;
    const name = payload.name || 'Usuario';
    const googleId = payload.sub;

    let user = await this.usersRepo.findByGoogleId(googleId);
    if (!user) {
      // If a user exists with that email but no google_id, you may want to link them:
      const byEmail = await this.usersRepo.findByEmail(email);
      if (byEmail) {
        // link
        user = await this.usersRepo.updateGoogleId(byEmail.id, googleId);
      } else {
        // create new
        user = await this.usersRepo.create({ 
          nombre: name, 
          email, 
          google_id: googleId 
        });
      }
    }

    if (!user) {
    throw new Error('User not found');
  }

    const token = this.authService.signPayload({ sub: user.id, email: user.email });
    return { user: this.userToSafe(user), token };

  }

  async requestPasswordReset(email: string, frontendUrl: string) {
    const user = await this.usersRepo.findByEmail(email);
    if (!user) {
      // for security, don't reveal existence; but you can return success
      return { ok: true };
    }

    // create token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (Number(this.config.get('PASSWORD_RESET_TOKEN_EXP_H') || 1) * 3600 * 1000)); // default 1h
    await this.resetRepo.create(user.id, token, expiresAt);

    // send mail with link (frontend handles reset form)
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const html = `<p>Hola ${user.nombre},</p>
      <p>Haz solicitado resetear tu contraseña. Ingresa al siguiente enlace para cambiarla:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Si no solicitaste esto, ignora este correo.</p>`;

    await this.mailService.sendMail(user.email, 'Reset de contraseña', html);
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const reset = await this.resetRepo.findValidByToken(token);
    if (!reset) throw new NotFoundException('Token inválido o expirado');

    // change password
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.updatePasswordHash(reset.user_id, hashed);
    await this.resetRepo.markUsed(reset.id);
    return { ok: true };
  }

  async findById(id: number) {
    console.log('🔍 Buscando usuario con id:', id);

    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }


  async deleteUser(id: number) {
    await this.usersRepository.delete(id);
    return { message: 'User deleted successfully' };
  }
}
