/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Delete, Get, Param, Post, Query, Req, BadRequestException, UnauthorizedException, Put } from '@nestjs/common';
import { UsersService } from '../service/users.service';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';


@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) { }

  @Get('auth/options')
  getAuthOptions() {
    const baseUrl = 'http://localhost:3000/users';
    return {
      register: {
        email: `${baseUrl}/register`,
        google: `${baseUrl}/google/url`
      },
      login: {
        email: `${baseUrl}/login`,
        google: `${baseUrl}/google/login/url`
      },
      descriptions: {
        register_email: 'Registrarse con email y contraseña',
        register_google: 'Registrarse con Google (crea cuenta nueva)',
        login_email: 'Iniciar sesión con email y contraseña',
        login_google: 'Iniciar sesión con Google (usuario debe estar registrado)'
      }
    };
  }

  // Registro
  @Post('register')
  async register(@Body() body: { nombre: string; email: string; password: string; telefono?: string }) {
    return this.usersService.registerWithEmail(body.nombre, body.email, body.password, body.telefono);
  }

  //Login con Google
  @Get('google/login/url')
  getGoogleLoginUrl() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = 'http://localhost:3000/users/google/login/callback';
    if (!clientId) {
      throw new Error('Google OAuth configuration is missing');
    }
    const scope = ['openid', 'email', 'profile'].join(' ');
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=online&` +
      `prompt=select_account`;
    return {
      url,
      type: 'LOGIN',
      note: 'Usa esta URL para INICIAR SESIÓN con Google'
    };
  }

  // Callback para LOGIN con Google
  @Get('google/login/callback')
  async googleLoginCallback(@Query('code') code: string, @Query('error') error: string) {
    if (error) {
      return {
        success: false,
        error: `Google OAuth error: ${error}`,
      };
    }
    if (!code) {
      return {
        success: false,
        error: 'No se recibió el código de autorización',
      };
    }
    try {
      const result = await this.exchangeGoogleCodeForLogin(code);
      return result;
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      throw new UnauthorizedException('Error en login con Google');
    }
  }

  // Método para intercambiar código por token (LOGIN)
  private async exchangeGoogleCodeForLogin(code: string) {
    if (!code) {
      throw new BadRequestException('No code provided');
    }
    try {
      const decodedCode = decodeURIComponent(code);
      const clientId = this.config.get('GOOGLE_CLIENT_ID');
      const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
      if (!clientSecret) {
        throw new Error('GOOGLE_CLIENT_SECRET no está configurado');
      }
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('code', decodedCode);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', 'http://localhost:3000/users/google/login/callback');
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const responseText = await response.text();
      let tokens;
      try {
        tokens = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Google response not JSON: ${responseText}`);
      }
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${tokens.error}`);
      }
      if (!tokens.id_token) {
        throw new Error('Google no devolvió id_token');
      }
      const loginResult = await this.usersService.loginWithGoogle(tokens.id_token);
      return {
        success: true,
        message: '🎉 ¡Inicio de sesión exitoso con Google!',
        user: loginResult.user,
        accessToken: loginResult.token,
        loginType: 'google'
      };
    } catch (error) {
      console.error('❌ Error en login con Google:', error.message);
      throw new UnauthorizedException(`Login failed: ${error.message}`);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.usersService.loginWithEmail(body.email, body.password);
  }

  @Post('google')
  async loginGoogle(@Body() body: { idToken: string }) {
    return this.usersService.registerOrLoginWithGoogle(body.idToken);
  }


  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('password/forgot')
  async forgot(@Body() body: { email: string }, @Req() req, @Query('frontendUrl') frontendUrl?: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    const front = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
    return this.usersService.requestPasswordReset(body.email, front, ip);
  }

  @Post('password/reset')
  async reset(@Body() body: { token: string; newPassword: string }) {
    return this.usersService.resetPassword(body.token, body.newPassword);
  }

  /**
   * Obtener perfil del usuario por ID
   */
  @Get('profile/:userId')
  async getMyProfile(@Param('userId') userId: string) {
    return this.usersService.getMyProfile(Number(userId));
  }

  /**
   * Actualizar perfil completo por ID
   */
  @Put('profile/:userId')
  async updateProfile(@Param('userId') userId: string, @Body() body: any) {
    return this.usersService.updateProfile(Number(userId), body);
  }

  /**
   * Actualizar perfil básico por ID
   */
  @Put('profile/:userId/basic')
  async updateBasicProfile(
    @Param('userId') userId: string,
    @Body() body: { nombre?: string; telefono?: string }
  ) {
    return this.usersService.updateBasicProfile(Number(userId), body.nombre, body.telefono);
  }


  /**
   * Obtener todos los usuarios
   */
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }


  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(Number(id));
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(Number(id));
  }

  // ✅ NUEVOS ENDPOINTS PARA GOOGLE OAUTH
  @Get('google/url')
  getGoogleAuthUrl() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = 'http://localhost:3000/users/google/callback';

    if (!clientId) {
      throw new Error('Google OAuth configuration is missing');
    }

    const scope = ['openid', 'email', 'profile'].join(' ');

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=online&` +
      `prompt=consent`;

    return { url };
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Query('error') error: string) {
    console.log('🔄 Callback de Google recibido');
    console.log('Code:', code);
    console.log('Error:', error);

    if (error) {
      return {
        success: false,
        error: `Google OAuth error: ${error}`,
      };
    }

    if (!code) {
      return {
        success: false,
        error: 'No se recibió el código de autorización',
      };
    }

    try {
      const result = await this.exchangeGoogleCode(code);
      return result;
    } catch (error) {
      console.error('❌ Error en callback:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  @Get('google/exchange')
  async exchangeGoogleCode(@Query('code') code: string) {
    if (!code) {
      throw new BadRequestException('No code provided');
    }

    try {
      const decodedCode = decodeURIComponent(code);
      const clientId = this.config.get('GOOGLE_CLIENT_ID');
      const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

      console.log('🔐 Intercambiando código por token...');
      console.log('Client ID:', clientId);
      console.log('Client Secret:', clientSecret ? '✅ Presente' : '❌ FALTANTE');

      if (!clientSecret) {
        throw new Error('GOOGLE_CLIENT_SECRET no está configurado');
      }

      const tokenUrl = 'https://oauth2.googleapis.com/token';

      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('code', decodedCode);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', 'http://localhost:3000/users/google/callback');

      console.log('📤 Enviando solicitud a Google...');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const responseText = await response.text();
      console.log('📥 Respuesta de Google:', response.status);

      let tokens;
      try {
        tokens = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Google response not JSON: ${responseText}`);
      }

      if (!response.ok) {
        console.error('❌ Error de Google:', tokens);
        throw new Error(`Token exchange failed: ${tokens.error} - ${tokens.error_description}`);
      }

      console.log('✅ Tokens recibidos exitosamente');
      console.log('🔑 ID Token recibido:', tokens.id_token ? '✅ Presente' : '❌ Faltante');

      if (!tokens.id_token) {
        throw new Error('Google no devolvió id_token');
      }

      console.log('🔄 Llamando a registerOrLoginWithGoogle...');
      const loginResult = await this.usersService.registerOrLoginWithGoogle(tokens.id_token);
      console.log('✅ registerOrLoginWithGoogle completado exitosamente');

      return {
        success: true,
        user: loginResult.user,
        accessToken: loginResult.token,
        googleTokens: {
          access_token: tokens.access_token,
          id_token: tokens.id_token,
          expires_in: tokens.expires_in
        }
      };

    } catch (error) {
      console.error('❌ Error completo en exchange:', error.message);
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }
  }

  @Get('google/debug/users')
  async debugUsers() {
    try {
      const users = await this.usersService.findAllUsers();
      return {
        total: users.length,
        users: users
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}