import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProspectSource, ProspectStatus, ProspectType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProspectsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createdBy: string | undefined, data: Record<string, unknown>) {
    const prospectType = String(data.prospect_type ?? 'individual') as ProspectType;
    const status = String(data.status ?? 'new') as ProspectStatus;
    const source = String(data.source ?? 'other') as ProspectSource;

    return this.prisma.prospect.create({
      data: {
        first_name: String(data.first_name ?? ''),
        last_name: String(data.last_name ?? ''),
        email: String(data.email ?? ''),
        phone: String(data.phone ?? ''),
        company_name: data.company_name ? String(data.company_name) : null,
        prospect_type: prospectType,
        status,
        source,
        assigned_to_id: data.assigned_to_id ? String(data.assigned_to_id) : null,
        needs: data.needs ? String(data.needs) : null,
        budget_estimate: data.budget_estimate !== undefined && data.budget_estimate !== null ? Number(data.budget_estimate) : null,
        priority: data.priority ? String(data.priority) : null,
        next_followup_date: data.next_followup_date ? new Date(String(data.next_followup_date)) : null,
        notes: data.notes ? String(data.notes) : null,
        company_id: companyId,
        created_by: createdBy ?? null,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.prospect.findMany({ where: { company_id: companyId }, orderBy: { created_at: 'desc' } });
  }

  async findOne(id: string) {
    const p = await this.prisma.prospect.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Prospect introuvable');
    return p;
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.findOne(id);

    const updateData: Prisma.ProspectUpdateInput = {
      ...(data.first_name !== undefined ? { first_name: String(data.first_name) } : {}),
      ...(data.last_name !== undefined ? { last_name: String(data.last_name) } : {}),
      ...(data.email !== undefined ? { email: String(data.email) } : {}),
      ...(data.phone !== undefined ? { phone: String(data.phone) } : {}),
      ...(data.company_name !== undefined ? { company_name: data.company_name ? String(data.company_name) : null } : {}),
      ...(data.prospect_type !== undefined ? { prospect_type: String(data.prospect_type) as ProspectType } : {}),
      ...(data.status !== undefined ? { status: String(data.status) as ProspectStatus } : {}),
      ...(data.source !== undefined ? { source: String(data.source) as ProspectSource } : {}),
      ...(data.assigned_to_id !== undefined ? { assigned_to_id: data.assigned_to_id ? String(data.assigned_to_id) : null } : {}),
      ...(data.needs !== undefined ? { needs: data.needs ? String(data.needs) : null } : {}),
      ...(data.budget_estimate !== undefined ? { budget_estimate: data.budget_estimate !== null ? Number(data.budget_estimate) : null } : {}),
      ...(data.priority !== undefined ? { priority: data.priority ? String(data.priority) : null } : {}),
      ...(data.next_followup_date !== undefined ? { next_followup_date: data.next_followup_date ? new Date(String(data.next_followup_date)) : null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes ? String(data.notes) : null } : {}),
    };

    return this.prisma.prospect.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.prospect.delete({ where: { id } });
  }
}
