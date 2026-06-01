import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Service pour les webhooks de paiement
 * Supporte les fournisseurs: FedaPay, MTN Mobile Money, Orange Money
 */
@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Valide la signature d'un webhook FedaPay
   * FedaPay utilise HMAC-SHA256 avec la clé API
   */
  validateFedaPaySignature(
    payload: string,
    signature: string,
    apiKey?: string,
  ): boolean {
    const key = apiKey || this.configService.get('FEDAPAY_API_KEY');
    if (!key) {
      this.logger.warn('FedaPay API key not configured');
      return false;
    }

    const hash = crypto.createHmac('sha256', key).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }

  /**
   * Valide la signature d'un webhook MTN Mobile Money
   * MTN utilise un format de validation personnalisé
   */
  validateMTNSignature(
    payload: Record<string, any>,
    signature: string,
  ): boolean {
    const mtnKey = this.configService.get('MTN_API_KEY');
    if (!mtnKey) {
      this.logger.warn('MTN API key not configured');
      return false;
    }

    // MTN signature = HMAC-SHA256(payload + timestamp + mtn_key)
    const combined = JSON.stringify(payload) + mtnKey;
    const expectedSignature = crypto
      .createHash('sha256')
      .update(combined)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Valide la signature d'un webhook Orange Money
   */
  validateOrangeSignature(
    payload: Record<string, any>,
    signature: string,
  ): boolean {
    const orangeKey = this.configService.get('ORANGE_API_KEY');
    if (!orangeKey) {
      this.logger.warn('Orange API key not configured');
      return false;
    }

    // Orange Money signature = HMAC-SHA256
    const hash = crypto
      .createHmac('sha256', orangeKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Traite un webhook de paiement FedaPay
   * Les évènements possibles: charge.completed, charge.failed, charge.pending
   */
  processFedaPayWebhook(event: {
    type: string;
    data: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      customer: { id: string; email: string };
      metadata?: Record<string, any>;
    };
  }): {
    transactionId: string;
    status: 'completed' | 'failed' | 'pending';
    amount: number;
    metadata?: Record<string, any>;
  } {
    const { type, data } = event;

    const status = (() => {
      switch (data.status) {
        case 'completed':
        case 'approved':
          return 'completed';
        case 'failed':
        case 'declined':
          return 'failed';
        case 'pending':
        case 'processing':
          return 'pending';
        default:
          return 'pending';
      }
    })();

    return {
      transactionId: data.id,
      status,
      amount: data.amount,
      metadata: data.metadata,
    };
  }

  /**
   * Traite un webhook de paiement MTN Mobile Money
   */
  processMTNWebhook(event: {
    type: string;
    transactionId: string;
    amount: number;
    status: string;
    timestamp: string;
  }): {
    transactionId: string;
    status: 'completed' | 'failed' | 'pending';
    amount: number;
  } {
    const status = (() => {
      switch (event.status) {
        case 'SUCCESSFUL':
          return 'completed';
        case 'FAILED':
          return 'failed';
        case 'PENDING':
          return 'pending';
        default:
          return 'pending';
      }
    })();

    return {
      transactionId: event.transactionId,
      status,
      amount: event.amount,
    };
  }

  /**
   * Traite un webhook de paiement Orange Money
   */
  processOrangeWebhook(event: {
    transactionId: string;
    amount: number;
    status: string;
  }): {
    transactionId: string;
    status: 'completed' | 'failed' | 'pending';
    amount: number;
  } {
    const status = (() => {
      switch (event.status) {
        case 'SUCCESS':
          return 'completed';
        case 'FAILED':
          return 'failed';
        case 'PENDING':
          return 'pending';
        default:
          return 'pending';
      }
    })();

    return {
      transactionId: event.transactionId,
      status,
      amount: event.amount,
    };
  }
}
