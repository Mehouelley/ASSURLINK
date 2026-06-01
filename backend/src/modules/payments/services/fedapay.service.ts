import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

/**
 * Service FedaPay pour les paiements
 * Supporte: Transactions, Webhooks, Sandbox mode
 *
 * FedaPay API Docs: https://docs.fedapay.com
 * Sandbox API Base: https://api.sandbox.fedapay.com
 * Production API Base: https://api.fedapay.com
 */
@Injectable()
export class FedaPayService {
  private readonly logger = new Logger(FedaPayService.name);
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly balanceId?: string;
  private readonly accountId?: string;

  constructor(private readonly configService: ConfigService) {
    const env = (this.configService.get<string>('FEDAPAY_ENV') || 'sandbox').toLowerCase();
    this.apiBase = this.configService.get<string>('FEDAPAY_API_BASE')
      || (env === 'production' || env === 'live'
        ? 'https://api.fedapay.com'
        : 'https://sandbox-api.fedapay.com');
    this.apiKey = (
      this.configService.get<string>('FEDAPAY_SECRET_KEY')
      || this.configService.get<string>('FEDAPAY_API_KEY')
      || 'sk_sandbox_test'
    ).trim();
    this.balanceId = this.configService.get<string>('FEDAPAY_BALANCE_ID') || undefined;
    this.accountId = this.configService.get<string>('FEDAPAY_ACCOUNT_ID') || undefined;
    if (!this.apiKey) {
      this.logger.warn('FedaPay API key not configured, using sandbox demo');
    }
  }

  /**
   * Crée une transaction de paiement pour une prime (policy payment)
   * Exemple d'utilisation:
   * POST /payments/fedapay/create-policy-payment
   * body: { policyId, amount, phoneNumber, description }
   */
  async createPolicyPayment(data: {
    policyId: string;
    clientId: string;
    amount: number; // montant en XOF
    phoneNumber: string;
    reference?: string;
  }): Promise<any> {
    const reference = data.reference || `POL-${data.policyId}-${Date.now()}`;
    this.assertValidAmount(data.amount);

    try {
      const transaction = await this.createTransaction({
        amount: data.amount,
        description: `Prime d'assurance - Contrat ${data.policyId}`,
        customer_phone_number: data.phoneNumber,
        reference,
        metadata: {
          policy_id: data.policyId,
          client_id: data.clientId,
          payment_type: 'policy_premium',
          callback_url: `${process.env.API_URL || 'http://localhost:3001'}/webhooks/payments/fedapay`,
        },
      });

      const transactionId = this.extractTransactionId(transaction);
      if (!transactionId) {
        this.logger.error(`FedaPay create response without id: ${JSON.stringify(transaction)}`);
        throw new BadRequestException('Transaction FedaPay créée sans identifiant');
      }
      const paymentLink = await this.getPaymentLink(transactionId);

      return {
        ...transaction,
        id: transactionId,
        url: paymentLink.url ?? transaction?.url,
        payment_token: paymentLink.token,
      };
    } catch (error) {
      this.logger.error(
        `CreatePolicyPayment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Crée une transaction de remboursement pour un sinistre (claim reimbursement)
   */
  async createClaimReimbursement(data: {
    claimId: string;
    clientId: string;
    amount: number;
    phoneNumber: string;
    reference?: string;
  }): Promise<any> {
    const reference = data.reference || `CLAIM-${data.claimId}-${Date.now()}`;
    this.assertValidAmount(data.amount);

    try {
      const transaction = await this.createTransaction({
        amount: data.amount,
        description: `Remboursement sinistre - Dossier ${data.claimId}`,
        customer_phone_number: data.phoneNumber,
        reference,
        metadata: {
          claim_id: data.claimId,
          client_id: data.clientId,
          payment_type: 'claim_reimbursement',
          callback_url: `${process.env.API_URL || 'http://localhost:3001'}/webhooks/payments/fedapay`,
        },
      });

      const transactionId = this.extractTransactionId(transaction);
      if (!transactionId) {
        this.logger.error(`FedaPay create response without id: ${JSON.stringify(transaction)}`);
        throw new BadRequestException('Transaction FedaPay créée sans identifiant');
      }
      const paymentLink = await this.getPaymentLink(transactionId);

      return {
        ...transaction,
        id: transactionId,
        url: paymentLink.url ?? transaction?.url,
        payment_token: paymentLink.token,
      };
    } catch (error) {
      this.logger.error(
        `CreateClaimReimbursement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Crée une transaction FedaPay via API REST
   */
  private async createTransaction(payload: {
    amount: number;
    description: string;
    customer_phone_number: string;
    reference: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    this.assertValidAmount(payload.amount);

    return new Promise((resolve, reject) => {
      const requestBody = JSON.stringify({
        description: payload.description,
        amount: payload.amount,
        currency: { iso: 'XOF' },
        callback_url: payload.metadata?.callback_url,
        custom_metadata: payload.metadata,
        customer: {
          phone_number: {
            number: payload.customer_phone_number,
            country: 'BJ', // Bénin
          },
        },
        reference: payload.reference,
      });

      const options = {
        hostname: new URL(this.apiBase).hostname,
        port: 443,
        path: '/v1/transactions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      };

      this.logger.log(
        `Creating FedaPay transaction: ${payload.reference}`,
      );

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 201 || res.statusCode === 200) {
            try {
              const parsed = JSON.parse(responseData);
              const transactionId = this.extractTransactionId(parsed);
              this.logger.log(
                `Transaction créée: ${transactionId ?? 'unknown'}`,
              );
              // Keep raw parsed payload so ID extraction is resilient to response shape changes.
              resolve(parsed);
            } catch (e) {
              reject(
                new BadRequestException(
                  'Réponse FedaPay incorrecte',
                ),
              );
            }
          } else {
            this.logger.error(
              `FedaPay API error: ${res.statusCode} - ${responseData}`,
            );
            reject(
              new BadRequestException(
                `Erreur FedaPay: ${res.statusCode}`,
              ),
            );
          }
        });
      });

      req.on('error', (error) => {
        this.logger.error(`FedaPay request error: ${error.message}`);
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Récupère le statut d'une transaction FedaPay
   */
  async getTransactionStatus(transactionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: new URL(this.apiBase).hostname,
        port: 443,
        path: `/v1/transactions/${transactionId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(responseData));
            } catch (e) {
              reject(new BadRequestException('Parse error'));
            }
          } else {
            reject(
              new BadRequestException(
                `Failed to fetch transaction: ${res.statusCode}`,
              ),
            );
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Essaie de rembourser une transaction FedaPay.
   * Tente plusieurs chemins d'API connus et renvoie la réponse brute si réussi.
   */
  async refundTransaction(transactionId: string, amount?: number): Promise<any> {
    // Tentative 1: POST /v1/transactions/{id}/refund
    const tryPaths = [`/v1/transactions/${transactionId}/refund`, '/v1/refunds'];

    for (const path of tryPaths) {
      try {
        const body = path.endsWith('/refund')
          ? JSON.stringify({ amount: amount ?? undefined })
          : JSON.stringify({ transaction_id: transactionId, amount: amount ?? undefined });

        const options = {
          hostname: new URL(this.apiBase).hostname,
          port: 443,
          path,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        };

        const resp = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
          const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (c) => (responseData += c));
            res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body: responseData }));
          });
          req.on('error', reject);
          req.write(body);
          req.end();
        });

        if (resp.statusCode === 200 || resp.statusCode === 201) {
          try {
            return JSON.parse(resp.body);
          } catch {
            return { raw: resp.body };
          }
        }
      } catch (e) {
        // essaye le prochain endpoint
        this.logger.debug(`refundTransaction attempt ${path} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    throw new BadRequestException('Refund not supported by FedaPay for this transaction');
  }

  /**
   * Crée un payout via l'API FedaPay (envoi d'argent au bénéficiaire)
   */
  async createPayout(params: { amount: number; currencyIso?: string; customer: { firstname: string; lastname: string; email?: string; phone?: { number: string; country: string } }; mode: string; reference?: string }): Promise<any> {
    const payload: any = {
      amount: params.amount,
      currency: { iso: params.currencyIso ?? 'XOF' },
      customer: {
        firstname: params.customer.firstname,
        lastname: params.customer.lastname,
        email: params.customer.email,
        phone_number: params.customer.phone,
      },
      mode: params.mode,
      reference: params.reference,
    };

    // Include balance/account identifiers when provided (required for some accounts)
    if (this.balanceId) payload.balance_id = this.balanceId;
    if (this.accountId) payload.account_id = this.accountId;

    const body = JSON.stringify(payload);

    const options = {
      hostname: new URL(this.apiBase).hostname,
      port: 443,
      path: '/v1/payouts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              resolve(JSON.parse(responseData));
            } catch {
              resolve({ raw: responseData });
            }
          } else {
            this.logger.error(`FedaPay payout error: ${res.statusCode} - ${responseData}`);
            // surface the body to help debugging sandbox configuration
            reject(new BadRequestException(`FedaPay payout failed: ${res.statusCode} - ${responseData}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(body);
      req.end();
    });
  }

  /**
   * Récupère le lien de paiement d'une transaction FedaPay
   */
  private async getPaymentLink(transactionId: string): Promise<{ token?: string; url?: string }> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: new URL(this.apiBase).hostname,
        port: 443,
        path: `/v1/transactions/${transactionId}/token`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(responseData));
            } catch {
              reject(new BadRequestException('Parse error'));
            }
          } else {
            this.logger.error(`FedaPay token API error: ${res.statusCode} - ${responseData}`);
            reject(new BadRequestException(`Failed to get payment link: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        this.logger.error(`FedaPay token request error: ${error.message}`);
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Valide la signature d'un webhook FedaPay
   * FedaPay utilise HMAC-SHA256 avec la clé API
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
  ): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.apiKey)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  private extractTransactionId(transaction: any): string | undefined {
    const directId = transaction?.id;
    if (directId !== undefined && directId !== null && directId !== '') {
      return directId.toString();
    }

    if (Array.isArray(transaction)) {
      for (const item of transaction) {
        const found = this.extractTransactionId(item);
        if (found) {
          return found;
        }
      }
    }

    if (transaction && typeof transaction === 'object') {
      for (const value of Object.values(transaction)) {
        const found = this.extractTransactionId(value);
        if (found) {
          return found;
        }
      }
    }

    return undefined;
  }

  private assertValidAmount(amount: number): void {
    if (!Number.isFinite(amount)) {
      throw new BadRequestException('Montant FedaPay invalide');
    }

    const normalizedAmount = Math.round(amount);

    if (normalizedAmount < 100) {
      throw new BadRequestException('Montant minimum FedaPay: 100 XOF');
    }

    if (normalizedAmount >= 999999999) {
      throw new BadRequestException('Montant maximum FedaPay: 999999998 XOF');
    }
  }

}
