/* eslint-disable prettier/prettier */
// src/common/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: Number(config.get<string>('SMTP_PORT') || 587),
      secure: config.get<string>('SMTP_SECURE') === 'true', // true for 465, false for other ports
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = this.config.get<string>('MAIL_FROM') || this.config.get<string>('SMTP_USER');
    await this.transporter.sendMail({ from, to, subject, html });
    return true;
  }
}
