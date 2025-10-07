/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters({
    catch(exception, host) {
      if (exception.getStatus && exception.getStatus() === 429) {
        const ctx = host.switchToHttp();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const response = ctx.getResponse();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return response.status(429).json({
          statusCode: 429,
          message: 'Demasiados intentos. Intenta nuevamente en unos minutos.',
        });
      }
      throw exception;
    },
  });

  await app.listen(3000);
}
bootstrap();
