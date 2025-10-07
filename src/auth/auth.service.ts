/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  signPayload(payload: Record<string, any>) {
    return this.jwtService.sign(payload);
  }

  verify<T extends object = any>(token: string) {
    try {
      return this.jwtService.verify<T>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}