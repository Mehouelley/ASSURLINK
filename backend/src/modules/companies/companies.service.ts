import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({ orderBy: { created_at: 'desc' } });
  }

  async update(id: string, body: UpdateCompanyDto) {
    const existing = await this.prisma.company.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Compagnie introuvable');
    return this.prisma.company.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });
  }

  async activateTrial(id: string) {
    const existing = await this.prisma.company.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Compagnie introuvable');

    const startedAt = new Date();
    const endsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    return this.prisma.company.update({
      where: { id },
      data: {
        is_active: true,
        subscription_plan: existing.subscription_plan ?? 'trial',
        trial_started_at: startedAt,
        trial_ends_at: endsAt,
        subscription_expires_at: endsAt,
        updated_at: new Date(),
      },
    });
  }
}
