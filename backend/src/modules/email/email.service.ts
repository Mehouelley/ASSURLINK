import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ParsedFrom {
  email: string;
  name?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly sendGridApiKey: string | null = null;
  private readonly fromAddress: string;

  constructor() {
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    this.fromAddress = process.env.EMAIL_FROM ?? 'no-reply@assurlink.local';

    if (sendGridApiKey) {
      this.sendGridApiKey = sendGridApiKey;
      this.logger.log('SendGrid API configurée, prêt à envoyer des emails.');
    } else if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log('SMTP configuré, prêt à envoyer des emails.');
    } else {
      this.logger.warn('Aucun service email configuré. Les emails seront journalisés uniquement.');
    }
  }

  private parseFromAddress(): ParsedFrom {
    const match = this.fromAddress.match(/^(.*?)<([^>]+)>$/);
    if (match) {
      return { email: match[2].trim(), name: match[1].trim().replace(/^"|"$/g, '') };
    }
    return { email: this.fromAddress.trim() };
  }

  async sendMail({ to, subject, html, text }: SendMailOptions): Promise<boolean> {
    const resolvedText = text ?? html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    if (this.sendGridApiKey) {
      try {
        const from = this.parseFromAddress();
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.sendGridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: to }],
            }],
            from,
            subject,
            content: [
              { type: 'text/plain', value: resolvedText },
              { type: 'text/html', value: html },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Erreur SendGrid (${response.status}) pour ${to}: ${errorText}`);
          return false;
        }

        const messageId = response.headers.get('x-message-id') ?? 'unknown';
        this.logger.log(`SendGrid email envoyé à ${to} (messageId=${messageId})`);
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Erreur SendGrid d'envoi d'email à ${to}: ${errorMessage}`);
        return false;
      }
    }

    if (!this.transporter) {
      this.logger.log('[EMAIL] Envoi simulé');
      this.logger.log(`[EMAIL] À : ${to}`);
      this.logger.log(`[EMAIL] Sujet : ${subject}`);
      this.logger.log(`[EMAIL] Texte : ${resolvedText}`);
      this.logger.log(`[EMAIL] HTML : ${html}`);
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text: resolvedText,
        html,
      });
      this.logger.log(`Email envoyé à ${to} (messageId=${info.messageId})`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur d'envoi d'email à ${to}: ${errorMessage}`);
      return false;
    }
  }
}
