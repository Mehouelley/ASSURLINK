import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveCompanyId(user: { companyId?: string | null }) {
    if (!user.companyId) {
      throw new UnauthorizedException('Company context manquant');
    }
    return user.companyId;
  }

  findAll(user: { companyId?: string | null }) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.policy.findMany({
      where: { company_id: companyId },
      include: { client: true },
      orderBy: { created_at: 'desc' },
    });
  }

  create(user: { companyId?: string | null; sub: string }, body: CreatePolicyDto) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.policy.create({
      data: {
        company_id: companyId,
        client_id: body.client_id,
        agent_id: user.sub,
        policy_number: `POL-${Date.now().toString().slice(-8)}`,
        insurance_type: body.insurance_type,
        status: body.status,
        premium_amount: body.premium_amount,
        coverage_amount: body.coverage_amount ?? 0,
        deductible: body.deductible ?? 0,
        start_date: new Date(body.start_date),
        end_date: new Date(body.end_date),
        description: body.description,
      },
    });
  }

  async update(user: { companyId?: string | null }, id: string, body: UpdatePolicyDto) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.policy.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Contrat introuvable');
    return this.prisma.policy.update({
      where: { id },
      data: {
        ...body,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : undefined,
        updated_at: new Date(),
      },
    });
  }

  async remove(user: { companyId?: string | null }, id: string) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.policy.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Contrat introuvable');
    return this.prisma.policy.update({
      where: { id },
      data: { status: 'cancelled', updated_at: new Date() },
    });
  }
}
