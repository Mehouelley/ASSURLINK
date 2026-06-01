import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { FedaPayService } from './services/fedapay.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(private readonly prisma: PrismaService, private readonly fedaPayService: FedaPayService) {}

  private resolveCompanyId(user: { companyId?: string | null }) {
    if (!user.companyId) {
      throw new UnauthorizedException('Company context manquant');
    }
    return user.companyId;
  }

  findAll(user: { companyId?: string | null }) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.payment.findMany({
      where: { company_id: companyId },
      include: { client: true, policy: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async hasCompletedPolicyPayment(user: { companyId?: string | null }, policyId: string) {
    const companyId = this.resolveCompanyId(user);
    const payment = await this.prisma.payment.findFirst({
      where: {
        company_id: companyId,
        policy_id: policyId,
        status: 'completed',
      },
      orderBy: { created_at: 'desc' },
    });

    return payment;
  }

  create(user: { companyId?: string | null; sub: string }, body: CreatePaymentDto) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.payment.create({
      data: {
        company_id: companyId,
        created_by: user.sub,
        client_id: body.client_id,
        policy_id: body.policy_id,
        claim_id: body.claim_id,
        payment_type: body.payment_type,
        payment_method: body.payment_method,
        amount: body.amount,
        status: body.status ?? 'completed',
        reference: body.reference,
        notes: body.notes,
        payment_date: new Date(body.payment_date),
        fedapay_link: body.fedapay_link,
        fedapay_transaction_id: body.fedapay_transaction_id,
      },
    });
  }

  async update(user: { companyId?: string | null }, id: string, body: UpdatePaymentDto) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.payment.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Paiement introuvable');
    return this.prisma.payment.update({
      where: { id },
      data: {
        ...body,
        payment_date: body.payment_date ? new Date(body.payment_date) : undefined,
        updated_at: new Date(),
      },
    });
  }

  async remove(user: { companyId?: string | null }, id: string) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.payment.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Paiement introuvable');
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'cancelled', updated_at: new Date() },
    });
  }

  /**
   * Refund a payment: try FedaPay refund if transaction exists, otherwise create a payout.
   */
  async refundPayment(user: { companyId?: string | null }, paymentId: string) {
    const companyId = this.resolveCompanyId(user);
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, company_id: companyId }, include: { client: true } });
    if (!payment) throw new NotFoundException('Paiement introuvable');

    // If there's an associated FedaPay transaction, attempt refund via FedaPay first
    if (payment.fedapay_transaction_id) {
      try {
        const tx = await this.fedaPayService.getTransactionStatus(payment.fedapay_transaction_id);
        // Check status to decide if refundable - permissive approach: try refund
        const refundResp = await this.fedaPayService.refundTransaction(payment.fedapay_transaction_id, payment.amount);

        // Update payment record
        const updated = await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'cancelled',
            refunded_at: new Date(),
            refund_method: 'fedapay_refund',
            refund_metadata: { refund: refundResp },
            updated_at: new Date(),
            notes: `${payment.notes ?? ''}\nRefund via FedaPay: ${JSON.stringify(refundResp)}`,
          },
        });

        return { success: true, method: 'fedapay_refund', refund: refundResp, payment: updated };
      } catch (err) {
        this.logger.debug(`FedaPay refund failed for ${payment.fedapay_transaction_id}: ${err instanceof Error ? err.message : String(err)}`);
        // fallthrough to create payout
      }
    }

    // Fallback: create a payout (mobile money) to the client via FedaPay payouts
    const client = payment.client as any;
    if (!client) throw new BadRequestException('Client introuvable pour payout');
    const phone = client.phone ?? null;
    const names = `${client.first_name ?? ''}`.trim();

    try {
      const payout = await this.fedaPayService.createPayout({
        amount: payment.amount,
        currencyIso: 'XOF',
        customer: {
          firstname: client.first_name ?? 'Client',
          lastname: client.last_name ?? '',
          email: client.email ?? undefined,
          phone: phone ? { number: phone.replace(/[^0-9+]/g, ''), country: 'BJ' } : undefined,
        },
        mode: phone ? 'mobile_money' : 'bank_transfer',
        reference: payment.reference ?? `payout-${payment.id}`,
      });

      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'pending',
          refunded_at: new Date(),
          refund_method: 'payout',
          refund_metadata: { payout },
          updated_at: new Date(),
          notes: `${payment.notes ?? ''}\nPayout created: ${JSON.stringify(payout)}`,
          payment_method: 'transfer',
        },
      });

      return { success: true, method: 'payout', payout, payment: updated };
    } catch (err) {
      this.logger.error(`Payout creation failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('Impossible d’effectuer le remboursement automatiquement. Voir logs.');
    }
  }
}
