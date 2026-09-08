import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env',
      );
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const secure =
      this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  isConfigured() {
    return !!this.transporter;
  }

  async sendMail(options: {
    to: string[];
    cc?: string[];
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
  }) {
    if (!this.transporter) {
      throw new ServiceUnavailableException(
        'Email is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to backend/.env',
      );
    }

    const from =
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('SMTP_USER') ||
      'noreply@avirag-tasks.local';

    const info = await this.transporter.sendMail({
      from,
      to: options.to.join(', '),
      cc: options.cc?.length ? options.cc.join(', ') : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    });

    this.logger.log(`Email sent: ${info.messageId}`);
    return { messageId: info.messageId };
  }
}
