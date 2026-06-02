import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProspectSource, ProspectStatus, ProspectType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
@Injectable()
export class ProspectsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createdBy: string | undefined, data: CreateProspectDto) {
    const prospectType = String(data.prospect_type ?? 'individual') as ProspectType;
    const status = String(data.status ?? 'new') as ProspectStatus;
    const source = String(data.source ?? 'other') as ProspectSource;

    return this.prisma.prospect.create({
      data: {
        company_id: companyId,
        created_by: createdBy,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company_name: data.company_name || null,
        prospect_type: prospectType,
        status,
        source,
        assigned_to_id: data.assigned_to_id || null,
        needs: data.needs || null,
        budget_estimate: data.budget_estimate || null,
        priority: data.priority || null,
        next_followup_date: data.next_followup_date ? new Date(data.next_followup_date) : null,
        notes: data.notes || null,
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

  async update(id: string, data: UpdateProspectDto) { 
    await this.findOne(id);

      const updateData: Prisma.ProspectUpdateInput = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company_name: data.company_name || null,  
        prospect_type: data.prospect_type ? String(data.prospect_type) as ProspectType : undefined,
        status: data.status ? String(data.status) as ProspectStatus : undefined,
        source: data.source ? String(data.source) as ProspectSource : undefined,
        assigned_to_id: data.assigned_to_id || null,
        needs: data.needs || null,
        budget_estimate: data.budget_estimate || null,
        priority: data.priority || null,
        next_followup_date: data.next_followup_date ? new Date(data.next_followup_date) : null,
        notes: data.notes || null,
      };
    return this.prisma.prospect.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.prospect.delete({ where: { id } });
  }
}
