import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveCompanyId(user: { companyId?: string | null }) {
    if (!user.companyId) throw new UnauthorizedException('Company context manquant');
    return user.companyId;
  }

  findAll(user: { companyId?: string | null; sub: string }) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.notification.findMany({
      where: {
        OR: [{ company_id: companyId }, { user_id: user.sub }],
      },
      orderBy: { created_at: 'desc' },
    });
  }

  markRead(user: { companyId?: string | null; sub: string }, id: string) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.notification.updateMany({
      where: { id, company_id: companyId },
      data: { is_read: true, updated_at: new Date() },
    });
  }
}
