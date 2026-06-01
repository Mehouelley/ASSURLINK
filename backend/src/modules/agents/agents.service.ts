import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveCompanyId(user: { companyId?: string | null }) {
    if (!user.companyId) throw new UnauthorizedException('Company context manquant');
    return user.companyId;
  }

  findAll(user: { companyId?: string | null }) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.agent.findMany({
      where: { company_id: companyId },
      include: { profile: true },
      orderBy: { created_at: 'desc' },
    });
  }
}
