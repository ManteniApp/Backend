/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Aquí puedes agregar lógica adicional si lo necesitas
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Si hay un error o el usuario no existe, lanza excepción automáticamente
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user; // 👈 esto permite acceder a req.user en el controller
  }
}
