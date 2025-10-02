/* eslint-disable prettier/prettier */
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  signPayload(payload: Record<string, any>) {
    return this.jwtService.sign(payload);
  }

    verify<T extends object = any>(token: string) {
    return this.jwtService.verify<T>(token);
    }
}
