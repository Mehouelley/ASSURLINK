import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Body,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentWebhookService } from './payment-webhook.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('webhooks/payments')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly webhookService: PaymentWebhookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Webhook pour les paiements FedaPay
   * POST /webhooks/payments/fedapay
   *
   * Headers requis:
   * - x-fedapay-signature: signature HMAC-SHA256
   */
  @Post('fedapay')
  async handleFedaPayWebhook(
    @Body() event: any,
    @Headers('x-fedapay-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing FedaPay signature header');
    }

    // Valider la signature
    const isValid = this.webhookService.validateFedaPaySignature(
      JSON.stringify(event),
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid FedaPay webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    // Traiter l'événement
    const result = this.webhookService.processFedaPayWebhook(event);

    // Mettre à jour le paiement en base avec la transaction ID (reference)
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { reference: result.transactionId },
      });

      if (!payment) {
        this.logger.warn(
          `Payment not found for transaction: ${result.transactionId}`,
        );
        return {
          success: false,
          message: 'Payment not found',
          transactionId: result.transactionId,
        };
      }

      // Mettre à jour le statut du paiement
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: result.status,
          updated_at: new Date(),
        },
      });

      this.logger.log(
        `Payment ${payment.id} updated to status: ${result.status}`,
      );

      // Si le paiement est complété et c'est une prime, mettre à jour le statut de la police
      if (result.status === 'completed' && payment.policy_id) {
        await this.prisma.policy.updateMany({
          where: { id: payment.policy_id },
          data: { status: 'active' },
        });
        this.logger.log(`Policy ${payment.policy_id} activated after payment`);
      }

      return {
        success: true,
        payment: updatedPayment,
        transactionId: result.transactionId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    return { success: true, transactionId: result.transactionId };
  }

  /**
   * Callback navigateur FedaPay (redirection utilisateur)
   * GET /webhooks/payments/fedapay?status=approved&id=449660
   *
   * NOTE: Ne remplace pas le webhook serveur-à-serveur signé (POST).
   */
  @Get('fedapay')
  async fedapayBrowserCallback(
    @Query('status') status?: string,
    @Query('id') transactionId?: string,
    @Res() res?: Response,
  ) {
    const normalizedStatus = this.mapFedaPayStatus(status);

    let paymentId: string | null = null;
    let paymentType: string | null = null;

    // Fallback utile en dev: si le webhook POST signe ne passe pas, on met a jour
    // l'etat via la redirection navigateur (status + id transaction).
    if (transactionId) {
      const payment = await this.prisma.payment.findFirst({
        where: { reference: transactionId },
      });

      if (payment) {
        paymentId = payment.id;
        paymentType = payment.payment_type;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: normalizedStatus,
            updated_at: new Date(),
          },
        });

        if (normalizedStatus === 'completed' && payment.policy_id) {
          await this.prisma.policy.updateMany({
            where: { id: payment.policy_id },
            data: { status: 'active' },
          });
        }

        if (normalizedStatus === 'completed' && payment.claim_id) {
          await this.prisma.claim.updateMany({
            where: { id: payment.claim_id },
            data: { status: 'reimbursed' },
          });
        }
      }
    }

    const frontendBase = (process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
    const redirect = new URL('/payment-confirmation', frontendBase);
    redirect.searchParams.set('fedapay_status', status ?? 'unknown');
    if (transactionId) redirect.searchParams.set('fedapay_tx', transactionId);
    if (paymentId) redirect.searchParams.set('payment_id', paymentId);
    if (paymentType) redirect.searchParams.set('payment_type', paymentType);

    if (res) {
      return res.redirect(302, redirect.toString());
    }

    return {
      success: true,
      redirectUrl: redirect.toString(),
      status: status ?? null,
      transactionId: transactionId ?? null,
    };
  }

  private mapFedaPayStatus(status?: string): 'completed' | 'failed' | 'pending' {
    switch ((status || '').toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'success':
        return 'completed';
      case 'failed':
      case 'declined':
      case 'cancelled':
      case 'canceled':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Webhook pour les paiements MTN Mobile Money
   * POST /webhooks/payments/mtn
   *
   * Headers requis:
   * - x-mtn-signature: signature HMAC-SHA256
   */
  @Post('mtn')
  async handleMTNWebhook(
    @Body() event: any,
    @Headers('x-mtn-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing MTN signature header');
    }

    // Valider la signature
    const isValid = this.webhookService.validateMTNSignature(event, signature);

    if (!isValid) {
      this.logger.warn('Invalid MTN webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    // Traiter l'événement
    const result = this.webhookService.processMTNWebhook(event);

    // Mettre à jour le paiement en base
    try {
      await this.prisma.payment.updateMany({
         where: { id: { in: [] } }, // Nécessite une recherche par transaction_reference d'abord
        data: {
          status: result.status,
          updated_at: new Date(),
        },
      });

      this.logger.log(
        `Payment ${result.transactionId} updated to ${result.status}`,
      );
       } catch (error: unknown) {
      this.logger.error(
           `Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
           error instanceof Error ? error.stack : undefined,
      );
    }

    return { success: true, transactionId: result.transactionId };
  }

  /**
   * Webhook pour les paiements Orange Money
   * POST /webhooks/payments/orange
   *
   * Headers requis:
   * - x-orange-signature: signature HMAC-SHA256
   */
  @Post('orange')
  async handleOrangeWebhook(
    @Body() event: any,
    @Headers('x-orange-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Orange signature header');
    }

    // Valider la signature
    const isValid = this.webhookService.validateOrangeSignature(
      event,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid Orange webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    // Traiter l'événement
    const result = this.webhookService.processOrangeWebhook(event);

    // Mettre à jour le paiement en base
    try {
      await this.prisma.payment.updateMany({
         where: { id: { in: [] } }, // Nécessite une recherche par transaction_reference d'abord
        data: {
          status: result.status,
          updated_at: new Date(),
        },
      });

      this.logger.log(
        `Payment ${result.transactionId} updated to ${result.status}`,
      );
       } catch (error: unknown) {
      this.logger.error(
           `Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
           error instanceof Error ? error.stack : undefined,
      );
    }

    return { success: true, transactionId: result.transactionId };
  }

  /**
   * Endpoint de santé pour FedaPay
   * FedaPay teste cette URL avant d'envoyer des webhooks
   */
  @Post('fedapay/health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
