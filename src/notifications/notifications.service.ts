  /* eslint-disable prettier/prettier */
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  import { Injectable, Logger } from '@nestjs/common';
  import * as nodemailer from 'nodemailer';

  @Injectable()
  export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false, // true si usas 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    async sendConfirmationEmail(to: string, name: string) {
      const mailOptions = {
        from: `"ManteniApp" <${process.env.SMTP_USER}>`,
        to,
        subject: '✔ Bienvenido a ManteniApp',
        html: `
          <h2>Hola, ${name}</h2>
          <p>Tu cuenta se ha registrado exitosamente 🎉</p>
          <p>Ahora puedes ingresar y comenzar a gestionar tus mantenimientos.</p>
        `,
      };

      try {
        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`📧 Email enviado a ${to}: ${info.messageId}`);
      } catch (error) {
        this.logger.error(`❌ Error enviando correo: ${error.message}`);
      }
    }
  }
