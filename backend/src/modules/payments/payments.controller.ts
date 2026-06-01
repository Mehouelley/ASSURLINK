import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FedaPayService } from './services/fedapay.service';
import { MessagingService } from './services/messaging.service';
import { CreatePolicyPaymentDto, CreateClaimReimbursementDto } from './dto/fedapay-payment.dto';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'agent')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly fedaPayService: FedaPayService,
    private readonly messagingService: MessagingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: { companyId?: string | null; role: string }) {
    return this.paymentsService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: { companyId?: string | null; sub: string }, @Body() body: CreatePaymentDto) {
    return this.paymentsService.create(user, body);
  }

  /**
   * Route pour créer un paiement de prime (policy payment) via FedaPay
   * POST /payments/fedapay/policy-payment
   * body: { policyId, clientId, amount, phoneNumber }
   */
  @Post('fedapay/policy-payment')
  async createPolicyPayment(
    @CurrentUser() user: { companyId?: string | null; sub: string },
    @Body() body: CreatePolicyPaymentDto,
  ) {
    const existingPayment = await this.paymentsService.hasCompletedPolicyPayment(user, body.policyId);
    if (existingPayment) {
      return {
        success: false,
        message: 'Cette prime a déjà été payée pour ce contrat.',
        payment: existingPayment,
      };
    }

    const transaction = await this.fedaPayService.createPolicyPayment({
      policyId: body.policyId,
      clientId: body.clientId,
      amount: body.amount,
      phoneNumber: body.phoneNumber,
      reference: body.reference,
    });

    // Enregistrer le paiement en base de données avec le lien FedaPay
    const payment = await this.paymentsService.create(user, {
      client_id: body.clientId,
      policy_id: body.policyId,
      claim_id: undefined,
      payment_type: 'premium',
      payment_method: 'mobile_money',
      amount: body.amount,
      status: 'pending',
      reference: transaction.id,
      notes: `FedaPay transaction: ${transaction.id}`,
      payment_date: new Date().toISOString(),
      fedapay_link: transaction.url || transaction.redirect_url,
      fedapay_transaction_id: transaction.id,
    });

    return {
      success: true,
      payment,
      fedapay_transaction: transaction,
      redirect_url: transaction.url, // URL de redirection FedaPay
    };
  }

  /**
   * Route pour créer un remboursement de sinistre (claim reimbursement) via FedaPay
   * POST /payments/fedapay/claim-reimbursement
   * body: { claimId, clientId, amount, phoneNumber }
   */
  @Post('fedapay/claim-reimbursement')
  async createClaimReimbursement(
    @CurrentUser() user: { companyId?: string | null; sub: string },
    @Body() body: CreateClaimReimbursementDto,
  ) {
    // Un remboursement sinistre est une sortie d'argent de l'entreprise.
    // On l'enregistre comme un décaissement interne, sans passer par FedaPay.
    const payment = await this.paymentsService.create(user, {
      client_id: body.clientId,
      policy_id: undefined,
      claim_id: body.claimId,
      payment_type: 'reimbursement',
      payment_method: 'transfer',
      amount: body.amount,
      status: 'pending',
      reference: body.reference || `RMB-${body.claimId}-${Date.now()}`,
      notes: 'Remboursement sinistre à décaisser par l’entreprise',
      payment_date: new Date().toISOString(),
    });

    return {
      success: true,
      payment,
      message: 'Remboursement enregistré. Il s’agit d’une sortie d’argent à exécuter manuellement.',
    };
  }

  /**
   * Route pour obtenir le statut d'une transaction FedaPay
   * GET /payments/fedapay/:transactionId/status
   */
  @Get('fedapay/:transactionId/status')
  async getTransactionStatus(@Param('transactionId') transactionId: string) {
    return this.fedaPayService.getTransactionStatus(transactionId);
  }

  /**
   * Route pour envoyer le lien de paiement au client par email et WhatsApp
   * POST /payments/:paymentId/send-link
   */
  @Post(':paymentId/send-link')
  async sendPaymentLink(
    @CurrentUser() user: { companyId?: string | null; sub: string },
    @Param('paymentId') paymentId: string,
  ) {
    const companyId = user.companyId;
    if (!companyId) {
      return {  success: false, message: 'Contexte d\'entreprise manquant' };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, company_id: companyId },
      include: { client: true, policy: true },
    });

    if (!payment) {
      return {
        success: false,
        message: 'Paiement introuvable',
      };
    }

    if (!payment.fedapay_link) {
      return {
        success: false,
        message: 'Ce paiement n\'a pas de lien FedaPay disponible',
      };
    }

    const client = payment.client as any;
    if (!client?.email || !client?.phone) {
      return {
        success: false,
        message: 'Informations de contact du client incomplètes',
      };
    }

    const policy = payment.policy as any;
    const result = await this.messagingService.sendPaymentLinkToClient(
      client.email,
      client.phone,
      `${client.first_name} ${client.last_name}`,
      payment.fedapay_link,
      policy?.policy_number || payment.reference || 'N/A',
      payment.amount,
      'XOF',
    );

    return {
      success: result.email || result.whatsapp,
      message: `Lien envoyé par ${result.email ? 'email' : ''}${result.whatsapp ? ' et WhatsApp' : ''}`,
      email_sent: result.email,
      whatsapp_sent: result.whatsapp,
    };
  }

  @Patch(':id')
  update(@CurrentUser() user: { companyId?: string | null; sub: string }, @Param('id') id: string, @Body() body: UpdatePaymentDto) {
    return this.paymentsService.update(user, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { companyId?: string | null; sub: string }, @Param('id') id: string) {
    return this.paymentsService.remove(user, id);
  }

  /**
   * Endpoint pour initier un remboursement ou un payout vers le client
   * POST /payments/:id/refund
   */
  @Post(':id/refund')
  async refundPayment(
    @CurrentUser() user: { companyId?: string | null; sub: string },
    @Param('id') id: string,
  ) {
    const result = await this.paymentsService.refundPayment(user, id);
    return result;
  }
}
