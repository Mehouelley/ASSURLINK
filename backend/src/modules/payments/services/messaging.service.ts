import { Injectable, Logger } from '@nestjs/common';

export interface SendMessageParams {
  to: string; // email ou numéro de téléphone
  subject?: string;
  title?: string;
  message: string;
  paymentLink?: string;
  type: 'email' | 'whatsapp' | 'sms'; // type de message
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  /**
   * Envoyer un message (email ou WhatsApp)
   */
  async sendMessage(params: SendMessageParams): Promise<boolean> {
    try {
      // Pour le MVP, on simule l'envoi
      // En production, intégrer Twilio, Sendgrid, Nodemailer, etc.
      
      if (params.type === 'email') {
        return this.sendEmail(params);
      } else if (params.type === 'whatsapp' || params.type === 'sms') {
        return this.sendWhatsApp(params);
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur lors de l'envoi du message: ${errorMessage}`);
      return false;
    }
  }

  private async sendEmail(params: SendMessageParams): Promise<boolean> {
    try {
      // TODO: Intégrer Sendgrid, Resend ou Nodemailer
      this.logger.log(`[EMAIL] À: ${params.to}`);
      this.logger.log(`[EMAIL] Sujet: ${params.subject || 'Pas de sujet'}`);
      this.logger.log(`[EMAIL] Message: ${params.message}`);
      if (params.paymentLink) {
        this.logger.log(`[EMAIL] Lien de paiement: ${params.paymentLink}`);
      }
      
      // Simulation - en production, vérifier la réponse réelle
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur email: ${errorMessage}`);
      return false;
    }
  }

  private async sendWhatsApp(params: SendMessageParams): Promise<boolean> {
    try {
      // TODO: Intégrer Twilio, Meta WhatsApp API, Infobip, etc.
      this.logger.log(`[WHATSAPP] À: ${params.to}`);
      this.logger.log(`[WHATSAPP] Message: ${params.message}`);
      if (params.paymentLink) {
        this.logger.log(`[WHATSAPP] Lien de paiement: ${params.paymentLink}`);
      }
      
      // Simulation - en production, vérifier la réponse réelle
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erreur WhatsApp: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Envoyer le lien de paiement au client par email ET WhatsApp
   */
  async sendPaymentLinkToClient(
    clientEmail: string,
    clientPhone: string,
    clientName: string,
    paymentLink: string,
    policyNumber: string,
    amount: number,
    currency: string = 'XOF'
  ): Promise<{ email: boolean; whatsapp: boolean }> {
    const subject = `Lien de paiement - Contrat ${policyNumber}`;
    const messageTitle = `Paiement de votre prime d'assurance`;
    const message = `Bonjour ${clientName},\n\nVeuillez cliquer sur le lien ci-dessous pour payer votre prime d'assurance de ${amount} ${currency} pour le contrat ${policyNumber}.\n\nLe paiement doit être effectué avant la date limite.`;

    const emailSent = await this.sendMessage({
      to: clientEmail,
      subject,
      title: messageTitle,
      message,
      paymentLink,
      type: 'email',
    });

    const whatsappSent = await this.sendMessage({
      to: clientPhone,
      title: messageTitle,
      message,
      paymentLink,
      type: 'whatsapp',
    });

    return { email: emailSent, whatsapp: whatsappSent };
  }
}
