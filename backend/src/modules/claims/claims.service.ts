import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { SubmitPublicClaimDto } from './dto/submit-public-claim.dto';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveCompanyId(user: { companyId?: string | null }) {
    if (!user.companyId) {
      throw new UnauthorizedException('Company context manquant');
    }
    return user.companyId;
  }

  findAll(user: { companyId?: string | null }) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.claim.findMany({
      where: { company_id: companyId },
      include: { client: true, policy: true },
      orderBy: { created_at: 'desc' },
    });
  }

  create(user: { companyId?: string | null; sub: string }, body: CreateClaimDto) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.claim.create({
      data: {
        company_id: companyId,
        created_by: user.sub,
        claim_number: `SIN-${Date.now().toString().slice(-8)}`,
        client_id: body.client_id,
        policy_id: body.policy_id,
        status: body.status ?? 'new',
        incident_date: body.incident_date ? new Date(body.incident_date) : new Date(),
        incident_description: body.incident_description ?? 'Déclaration en attente du client',
        incident_location: body.incident_location,
        estimated_amount: body.estimated_amount ?? 0,
        approved_amount: body.approved_amount ?? 0,
        expert_report: body.expert_report,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });
  }

  async update(user: { companyId?: string | null }, id: string, body: UpdateClaimDto) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.claim.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Sinistre introuvable');
    return this.prisma.claim.update({
      where: { id },
      data: {
        ...body,
        incident_date: body.incident_date ? new Date(body.incident_date) : undefined,
        updated_at: new Date(),
      },
    });
  }

  async remove(user: { companyId?: string | null }, id: string) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.claim.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Sinistre introuvable');
    return this.prisma.claim.update({
      where: { id },
      data: { status: 'closed', updated_at: new Date() },
    });
  }

  async generatePublicLink(user: { companyId?: string | null }, id: string) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.claim.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Sinistre introuvable');

    const publicToken = existing.public_token ?? randomBytes(24).toString('hex');
    const updated = await this.prisma.claim.update({
      where: { id },
      data: {
        public_token: publicToken,
        public_token_expires_at: existing.public_token_expires_at ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    const frontendBase = (process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
    return {
      token: publicToken,
      url: `${frontendBase}/claim/${publicToken}`,
      claim: updated,
    };
  }

  async findPublicClaim(token: string) {
    const claim = await this.prisma.claim.findFirst({
      where: { public_token: token },
      include: { client: true, policy: true, company: true },
    });

    if (!claim) throw new NotFoundException('Lien de déclaration invalide');
    if (claim.public_token_expires_at && claim.public_token_expires_at < new Date()) {
      throw new NotFoundException('Lien de déclaration expiré');
    }

    return claim;
  }

  async submitPublicClaim(token: string, body: SubmitPublicClaimDto) {
    const claim = await this.findPublicClaim(token);

    return this.prisma.claim.update({
      where: { id: claim.id },
      data: {
        incident_date: body.incident_date ? new Date(body.incident_date) : claim.incident_date,
        incident_description: body.incident_description ?? claim.incident_description,
        incident_location: body.incident_location ?? claim.incident_location,
        estimated_amount: body.estimated_amount ?? claim.estimated_amount,
        expert_report: body.expert_report ?? claim.expert_report,
        public_submitted_at: new Date(),
        status: 'new',
        updated_at: new Date(),
      },
    });
  }
}
