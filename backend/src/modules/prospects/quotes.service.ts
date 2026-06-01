import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  private async ensureProspectCompany(prospectId: string, companyId: string) {
    const prospect = await this.prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) throw new NotFoundException('Prospect introuvable');
    if (prospect.company_id !== companyId) throw new ForbiddenException('Accès refusé');
    return prospect;
  }

  async listByProspect(prospectId: string, companyId: string) {
    await this.ensureProspectCompany(prospectId, companyId);
    return this.prisma.quote.findMany({ where: { prospect_id: prospectId }, orderBy: { created_at: 'desc' } });
  }

  async create(prospectId: string, companyId: string, createdBy: string | undefined, data: Record<string, unknown>) {
    await this.ensureProspectCompany(prospectId, companyId);

    const quoteNumber = String(data.quote_number ?? `QTE-${Date.now()}`);

    const existing = await this.prisma.quote.findUnique({ where: { quote_number: quoteNumber } }).catch(() => null);
    if (existing) throw new BadRequestException('Numéro de devis déjà utilisé');

    const created = await this.prisma.quote.create({
      data: {
        company_id: companyId,
        prospect_id: prospectId,
        quote_number: quoteNumber,
        insurance_type: String(data.insurance_type ?? 'auto'),
        premium_amount: Number(data.premium_amount ?? 0),
        coverage_description: data.coverage_description ? String(data.coverage_description) : null,
        valid_until: data.valid_until ? new Date(String(data.valid_until)) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        status: data.status ? String(data.status) : 'draft',
        created_by: createdBy ?? null,
      },
    });

    return created;
  }
}
