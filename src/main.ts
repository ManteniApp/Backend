/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('ManteniApp API')
    .setDescription('API para la gestión de mantenimientos de vehículos')
    .setVersion('1.0')
    .addTag('Mantenimientos')
    .addTag('Usuarios')
    .addTag('Clientes')
    .addTag('Motocicletas')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory());

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
