import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class ProspectInteractionsService {
  constructor(private prisma: PrismaService) {}

  private async ensureProspectCompany(prospectId: string, companyId: string) {
    const prospect = await this.prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) throw new NotFoundException('Prospect introuvable');
    if (prospect.company_id !== companyId) throw new ForbiddenException('Accès refusé');
    return prospect;
  }

  async listByProspect(prospectId: string, companyId: string) {
    await this.ensureProspectCompany(prospectId, companyId);
    return this.prisma.prospectInteraction.findMany({ where: { prospect_id: prospectId },orderBy: { created_at: 'desc' } });
  }

  async create(prospectId: string, companyId: string, doneById: string | undefined, data: Record<string, unknown>) {
    await this.ensureProspectCompany(prospectId, companyId);

    const created = await this.prisma.prospectInteraction.create({
      data: {
        prospect_id: prospectId,
        type: String(data.type ?? 'call'),
        status_before: data.status_before ? String(data.status_before) : null,
        status_after: data.status_after ? String(data.status_after) : null,
        summary: String(data.summary ?? ''),
        notes: data.notes ? String(data.notes) : null,
        done_by_id: doneById ?? null,
      },
    });

    // increment interactions_count
    const current = await this.prisma.prospect.findUnique({ where: { id: prospectId }, select: { interactions_count: true } });
    await this.prisma.prospect.update({
      where: { id: prospectId },
      data: { interactions_count: (current?.interactions_count ?? 0) + 1 },
    });

    return created;
  }
}
