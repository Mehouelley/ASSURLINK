import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveCompanyId(user: { companyId?: string | null }) {
    if (!user.companyId) {
      throw new UnauthorizedException('Company context manquant');
    }
    return user.companyId;
  }

  findAll(user: { companyId?: string | null }) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.client.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  }

  create(user: { companyId?: string | null; sub: string }, body: CreateClientDto) {
    const companyId = this.resolveCompanyId(user);
    return this.prisma.client.create({
      data: {
        company_id: companyId,
        created_by: user.sub,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        profession: body.profession,
        gender: body.gender,
        date_of_birth: body.date_of_birth,
        client_type: body.client_type ?? 'individual',
        id_number: body.id_number,
        notes: body.notes,
      },
    });
  }

  async update(user: { companyId?: string | null }, id: string, body: UpdateClientDto) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.client.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Client introuvable');
    return this.prisma.client.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    });
  }

  async remove(user: { companyId?: string | null }, id: string) {
    const companyId = this.resolveCompanyId(user);
    const existing = await this.prisma.client.findFirst({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException('Client introuvable');
    return this.prisma.client.update({
      where: { id },
      data: { is_active: false, updated_at: new Date() },
    });
  }
}
